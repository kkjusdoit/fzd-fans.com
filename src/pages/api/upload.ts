import type { APIRoute } from 'astro';

// 禁用预渲染，让 API 在服务器端运行
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('收到上传请求');
    console.log('Content-Type:', request.headers.get('content-type'));

    const contentType = request.headers.get('content-type') || '';
    let fileObj: File | null = null;
    let fileNameToUse: string | null = null;
    let desc = '';

    if (contentType.includes('application/json')) {
      try {
        const body = await request.json();
        desc = body.desc || '';
        if (body.file && typeof body.file === 'string') {
          console.log('Processing Base64 upload...');
          // Data URL format: "data:image/jpeg;base64,....."
          const base64Data = body.file.split(',')[1] || body.file;
          
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const finalName = body.originalName || body.name || 'upload.bin';
          fileNameToUse = finalName;
          fileObj = new File([bytes], finalName, { type: body.type || 'application/octet-stream' });
          console.log('Base64 file converted:', fileNameToUse, 'Size:', fileObj.size);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON payload for upload'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Fallback for standard multipart/form-data
      const formData = await request.formData();
      desc = formData.get('desc') as string || '';
      console.log('FormData keys:', Array.from(formData.keys()));
  
      const file = formData.get('file');
      const originalName = formData.get('originalName') as string | null;
  
      if (file && typeof file === 'object') {
          // It's likely a File object (Node.js/modern browsers)
          // But check if it's not null and has arrayBuffer
          fileObj = file as File;
          fileNameToUse = originalName || fileObj.name;
      } else if (typeof file === 'string') {
          console.error('File is a string:', file);
          return new Response(JSON.stringify({ 
              success: false, 
              error: 'Server received a string instead of a file object via FormData. Please try the Base64 upload method (automatic).',
              debug: {
                  message: "File field is a string, expected File/Blob",
                  value: file.substring(0, 100),
                  keys: Array.from(formData.keys()),
                  contentType: request.headers.get('content-type')
              }
          }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
          });
      }
    }

    if (!fileObj) {
         return new Response(JSON.stringify({ 
            success: false, 
            error: 'No valid file provided' 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('Internal filename:', fileObj.name, 'Original filename:', fileNameToUse, 'Size:', fileObj.size);

    // 在服务器端，直接使用 File 对象创建 FormData
    // Astro 使用 undici 的 FormData 实现，支持 File 对象
    const uploadFormData = new FormData();
    // Use the sanitized file.name for the upstream transfer to avoid encoding issues
    uploadFormData.append('file', fileObj, fileNameToUse || fileObj.name);

    console.log('准备发送到图床服务器...');

    // add serverCompress=false to force upload as file (original quality)
    // Add 120s timeout for upstream
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    // Get Auth Code from Environment Variables (Cloudflare Pages or .env)
    const runtime = (locals as any).runtime;
    const authCode = runtime?.env?.AUTH_CODE || import.meta.env.AUTH_CODE;

    let response;
    try {
      response = await fetch('https://cloudflare-imgbed-cvs.pages.dev/upload?serverCompress=false', {
        method: 'POST',
        headers: {
          'authCode': authCode
        },
        body: uploadFormData,
        signal: controller.signal as any // Astro types might not be fully up to date with fetch signal
      });
    } catch (err: any) {
       if (err.name === 'AbortError') {
         return new Response(JSON.stringify({
            success: false,
            error: 'Upstream upload timed out (120s)'
         }), {
            status: 504,
            headers: { 'Content-Type': 'application/json' }
         });
       }
       throw err;
    } finally {
      clearTimeout(timeoutId);
    }

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

          if (count >= 50) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Rate limit exceeded. Please try again later.'
            }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Insert with ip and reviewed = 0 (pending review)
          await DB.prepare(
            'INSERT INTO photos (name, url, created_at, ip, reviewed, desc) VALUES (?, ?, ?, ?, 0, ?)'
          ).bind(fileName, fullUrl, Date.now(), clientIP, desc).run();
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
