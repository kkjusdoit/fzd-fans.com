import type { APIRoute } from 'astro';

// 禁用预渲染，让 API 在服务器端运行
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('收到上传请求');

    const formData = await request.formData();
    const file = formData.get('file');

    console.log('文件信息:', file);

    if (!file || !(file instanceof File)) {
      console.error('无效的文件');
      return new Response(JSON.stringify({ success: false, error: 'No valid file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('文件名:', file.name, '大小:', file.size);

    // 在服务器端，直接使用 File 对象创建 FormData
    // Astro 使用 undici 的 FormData 实现，支持 File 对象
    const uploadFormData = new FormData();
    uploadFormData.append('file', file, file.name);

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
    if (src) {
      const fullUrl = `https://cloudflare-imgbed-cvs.pages.dev${src}`;
      const fileName = file.name;

      // 4. 将元数据存入 Cloudflare D1
      const runtime = locals.runtime as any;
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

          // Insert with ip and reviewed = 0 (pending)
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
