import type { APIRoute } from 'astro';

export const prerender = false;

// 限制允许上传的文件类型与最大尺寸 (8MB)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);
const MAX_FILE_SIZE = 8 * 1024 * 1024;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const R2 = runtime?.env?.R2;

    const contentType = request.headers.get('content-type') || '';
    let fileObj: File | null = null;
    let fileName = 'upload.jpg';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.file && typeof body.file === 'string') {
        const base64Data = body.file.split(',')[1] || body.file;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileName = body.name || body.originalName || 'upload.jpg';
        const type = body.type || 'image/jpeg';
        fileObj = new File([bytes], fileName, { type });
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('file');
      if (file && typeof file === 'object') {
        fileObj = file as File;
        fileName = (formData.get('originalName') as string) || fileObj.name;
      }
    }

    if (!fileObj) {
      return new Response(JSON.stringify({ success: false, error: '未提供有效的文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (fileObj.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ success: false, error: '文件大小不能超过 8MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mimeType = fileObj.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return new Response(JSON.stringify({ success: false, error: '仅支持 JPG, PNG, WEBP, GIF, SVG 图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 优先使用 Cloudflare R2 存储
    if (R2) {
      const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const randomStr = Math.random().toString(36).substring(2, 10);
      const key = `ugc/${Date.now()}-${randomStr}.${ext}`;

      const buffer = await fileObj.arrayBuffer();
      await R2.put(key, buffer, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, immutable'
        }
      });

      const mediaUrl = `/api/media/${key}`;
      return new Response(JSON.stringify({
        success: true,
        url: mediaUrl,
        storage: 'r2',
        name: fileName
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 降级兜底：使用现有的图床服务
    const uploadFormData = new FormData();
    uploadFormData.append('file', fileObj, fileName);
    const authCode = runtime?.env?.AUTH_CODE || import.meta.env.AUTH_CODE;

    const imgBedResponse = await fetch('https://cloudflare-imgbed-cvs.pages.dev/upload?serverCompress=false', {
      method: 'POST',
      headers: { 'authCode': authCode || '' },
      body: uploadFormData
    });

    if (imgBedResponse.ok) {
      const resData = await imgBedResponse.json();
      const src = Array.isArray(resData) && resData[0]?.src ? resData[0].src : null;
      if (src) {
        return new Response(JSON.stringify({
          success: true,
          url: `https://cloudflare-imgbed-cvs.pages.dev${src}`,
          storage: 'imgbed',
          name: fileName
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: '存储服务暂时不可用，请稍后再试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Upload Media API error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
