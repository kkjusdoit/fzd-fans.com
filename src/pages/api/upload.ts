import type { APIRoute } from 'astro';

// 禁用预渲染，让 API 在服务器端运行
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('收到上传请求');
    console.log('Content-Type:', request.headers.get('content-type'));

    const formData = await request.formData();
    console.log('FormData keys:', Array.from(formData.keys()));

    const file = formData.get('file');
    const originalName = formData.get('originalName') as string | null;

    // console.log('File raw:', file); // Log too large
    if (file) {
        console.log('Type of file:', typeof file);
        // @ts-ignore
        console.log('Constructor:', file.constructor ? file.constructor.name : 'unknown');
    }

    // Cloudflare Workers/Pages specific handling:
    // When a file is uploaded, sometimes it comes as a string path or just the filename if not parsed correctly.
    // However, if it's a string, it means we failed to get the binary data.
    
    // IMPORTANT: In some Cloudflare environments or configurations, request.formData() might behave differently.
    // If 'file' is a string, it's NOT the file content.
    
    // Attempt to handle the case where 'file' is just a string (filename) and we need to handle it differently.
    // But realistically, if FormData returns a string, the upload failed to parse as a file.
    
    // Let's check if there are other entries that might contain the file, or if we need to parse differently.
    
    if (typeof file === 'string') {
        console.error('File is a string:', file);
        // This confirms the issue: Cloudflare is seeing the file field as a simple text field.
        // This can happen if the browser sends it incorrectly or if the server parses it incorrectly.
        // Since the browser is standard (Chrome/Safari), and local works, it's likely a Cloudflare specific behavior or misconfig.
        
        // Debugging: let's try to see if we can get it from the body directly if needed, but that's complex for multipart.
        // Instead, let's verify if the client is sending it as a Blob.
        
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Server received a string instead of a file object. This usually means the file payload was lost or mis-parsed.',
            debug: {
                message: "File field is a string, expected File/Blob",
                value: file.substring(0, 100), // Show start of string to see if it's content or filename
                keys: Array.from(formData.keys()),
                contentType: request.headers.get('content-type')
            }
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Duck typing check for File-like object to support various runtime implementations

    const fileObj = file as File;
    const fileNameToUse = originalName || fileObj.name;
    console.log('Internal filename:', fileObj.name, 'Original filename:', fileNameToUse, 'Size:', fileObj.size);

    // 在服务器端，直接使用 File 对象创建 FormData
    // Astro 使用 undici 的 FormData 实现，支持 File 对象
    const uploadFormData = new FormData();
    // Use the sanitized file.name for the upstream transfer to avoid encoding issues
    uploadFormData.append('file', fileObj, fileObj.name);

    console.log('准备发送到图床服务器...');

    const response = await fetch('https://cloudflare-imgbed-cvs.pages.dev/upload', {
      method: 'POST',
      headers: {
        'authCode': 'kkjusdoit'
      },
      body: uploadFormData
    });

    console.log('图床服务器响应状态:', response.status);

    const responseText = await response.text();
    console.log('图床服务器响应:', responseText);

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Upload failed: ${response.statusText}`,
        details: responseText
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = JSON.parse(responseText);
    console.log('上传成功:', result);

    // 图床返回 [{src: "/file/xxx.png"}] 格式，转换为 {url: "完整URL"}
    const src = Array.isArray(result) && result[0]?.src ? result[0].src : null;
    console.log(`Image storage src extracted: ${src}`);
    if (src) {
      const fullUrl = `https://cloudflare-imgbed-cvs.pages.dev${src}`;
      const fileName = fileNameToUse;

      // 4. 将元数据存入 Cloudflare D1
      const runtime = (locals as any).runtime;
      const DB = runtime?.env?.DB;
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

      // 5. Rate Limiting Check
      if (DB) {
        try {
          // Check uploads in last 10 minutes (600000 ms)
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
          const { count } = await DB.prepare(
            'SELECT COUNT(*) as count FROM photos WHERE ip = ? AND created_at > ?'
          ).bind(clientIP, tenMinutesAgo).first();

          console.log(`IP ${clientIP} uploaded ${count} images in last 10 mins`);

          if (count >= 10) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Rate limit exceeded. Please try again later.'
            }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Insert with ip and reviewed = 1 (auto-approved since upstream handles moderation)
          await DB.prepare(
            'INSERT INTO photos (name, url, created_at, ip, reviewed) VALUES (?, ?, ?, ?, 0)'
          ).bind(fileName, fullUrl, Date.now(), clientIP).run();
          console.log('元数据已写入 D1 数据库 (Pending Review)');

        } catch (dbError) {
          console.error('D1 操作失败:', dbError);
          // 数据库写入失败不应阻碍上传返回，但应记录错误
        }
      } else {
        console.warn('未找到 D1 数据库绑定，元数据未持久化');
      }

      const finalResult = { // Renamed to avoid conflict with `result` from image bed
        success: true,
        url: fullUrl,
        name: fileName
      };
      
      console.log('Upload success response:', JSON.stringify(finalResult));

      // --- AUTO SYNC TRIGGER ---
      // Disabled: Admin manually syncs to approve
      /*
      try {
        const { syncWithImageBed } = await import('../../lib/sync-helper');
        console.log('Triggering auto-sync after upload...');
        await syncWithImageBed(DB);
      } catch (syncErr) {
        console.error('Post-upload sync failed:', syncErr);
        // Do not fail the upload request itself
      }
      */
      // -------------------------

      return new Response(JSON.stringify(finalResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If src is not found, return the raw result from the image bed
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API 处理错误:', error);
    return new Response(JSON.stringify({ 
      error: 'API Error', 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
