import type { APIRoute } from 'astro';

export const prerender = false;

async function parseJsonResponse(response: Response, label: string) {
  const contentType = response.headers.get('content-type') || 'unknown';
  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      contentType,
      snippet: text.slice(0, 200).replace(/\s+/g, ' ').trim()
    };
  }

  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      contentType,
      snippet: text.slice(0, 200).replace(/\s+/g, ' ').trim(),
      error: `${label} returned non-JSON content`
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(text)
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      contentType,
      snippet: text.slice(0, 200).replace(/\s+/g, ' ').trim(),
      error: `${label} returned invalid JSON`
    };
  }
}

export const GET: APIRoute = async ({ locals }) => {
  const results = {
    envCheck: {} as any,
    apiCheck: {} as any,
    dbCheck: {} as any
  };

  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env || {};

    // 1. Check Environment Variables
    results.envCheck = {
      BASIC_USER: env.BASIC_USER ? '✅ Set (' + env.BASIC_USER + ')' : '❌ Missing',
      BASIC_PASS: env.BASIC_PASS ? '✅ Set' : '❌ Missing',
      DB: env.DB ? '✅ Connected' : '❌ Missing',
      AUTH_CODE: env.AUTH_CODE ? '✅ Set' : '❌ Missing'
    };

    // 2. Check Database
    const DB = runtime?.env?.DB;
    if (DB) {
      try {
        const count = await DB.prepare('SELECT COUNT(*) as total FROM photos').first();
        results.dbCheck = {
          status: '✅ Connected',
          photoCount: count?.total || 0
        };
      } catch (dbErr: any) {
        results.dbCheck = {
          status: '❌ Error',
          error: dbErr.message
        };
      }
    } else {
      results.dbCheck = { status: '❌ DB not available' };
    }

    // 3. Check Image Bed API
    const user = env.BASIC_USER;
    const pass = env.BASIC_PASS;
    
    if (user && pass) {
      try {
        const authString = `${user}:${pass}`;
        const authBase64 = typeof btoa === 'function' 
          ? btoa(authString) 
          : Buffer.from(authString).toString('base64');
        
        const authHeader = 'Basic ' + authBase64;
        
        const testResponse = await fetch('https://cloudflare-imgbed-cvs.pages.dev/api/manage/list?start=0&count=1', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          redirect: 'manual'
        });

        const parsed = await parseJsonResponse(testResponse, 'Image bed API');
        results.apiCheck = {
          url: 'https://cloudflare-imgbed-cvs.pages.dev/api/manage/list',
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: parsed.ok,
          contentType: testResponse.headers.get('content-type') || 'unknown',
          headers: parsed.ok ? '✅ Auth successful' : '❌ Auth failed'
        };

        if (parsed.ok) {
          const data = parsed.data;
          results.apiCheck.response = {
            filesCount: data.files?.length || 0,
            totalCount: data.totalCount || 'N/A'
          };
        } else {
          results.apiCheck.error = parsed.error || 'Unexpected upstream response';
          results.apiCheck.errorBody = parsed.snippet || '';
        }
      } catch (apiErr: any) {
        results.apiCheck = {
          status: '❌ Network Error',
          error: apiErr.message
        };
      }
    } else {
      results.apiCheck = {
        status: '⚠️ Skipped',
        reason: 'BASIC_USER or BASIC_PASS not set'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      results
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      stack: err.stack
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
};
