async function parseJsonResponse(response: Response, label: string) {
  const contentType = response.headers.get('content-type') || 'unknown';
  const text = await response.text();

  if (!response.ok) {
    const snippet = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(`${label} failed (${response.status} ${response.statusText}, Content-Type: ${contentType})${snippet ? `\n响应片段: ${snippet}` : ''}`);
  }

  if (!contentType.includes('application/json')) {
    const snippet = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(`${label} returned non-JSON content (Content-Type: ${contentType})${snippet ? `\n响应片段: ${snippet}` : ''}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const snippet = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(`${label} returned invalid JSON${snippet ? `\n响应片段: ${snippet}` : ''}`);
  }
}

async function isNewPhotoAccessible(publicUrl: string, file: any) {
  if (file.metadata?.ListType === 'White') {
    return true;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const headRes = await fetch(publicUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal
    });

    return headRes.status === 200;
  } catch (error) {
    console.warn(`SyncHelper: Accessibility check failed for ${publicUrl}: ${(error as Error).message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function syncWithImageBed(DB: any, env: any) {
  try {
    // 1. Fetch image list from upstream
    const user = env.BASIC_USER;
    const pass = env.BASIC_PASS;

    if (!user || !pass) {
      throw new Error('SyncHelper: BASIC_USER or BASIC_PASS environment variables are not set.');
    }
    
    // Compatible encoding
    const authString = `${user}:${pass}`;
    const authBase64 = typeof btoa === 'function' 
      ? btoa(authString) 
      : Buffer.from(authString).toString('base64');
      
    const authHeader = 'Basic ' + authBase64;
    
    console.log(`SyncHelper: Fetching image list from upstream (User: ${user})...`);
    
    let remoteFiles: any[] = [];
    let start = 0;
    const pageSize = 500;
    let hasMore = true;

    while (hasMore) {
      console.log(`SyncHelper: Fetching page start=${start}, count=${pageSize}...`);
      const response = await fetch(`https://cloudflare-imgbed-cvs.pages.dev/api/manage/list?start=${start}&count=${pageSize}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        redirect: 'manual'
      });

      const data = await parseJsonResponse(response, 'Upstream image list API');
      const files = data.files || [];
      remoteFiles = remoteFiles.concat(files);

      if (files.length < pageSize || (data.totalCount && remoteFiles.length >= data.totalCount)) {
        hasMore = false;
      } else {
        start += files.length;
      }
    }

    console.log(`SyncHelper: Total remote files fetched: ${remoteFiles.length}`);
    const validRemoteUrls = new Set<string>();
    const localPhotosResult = await DB.prepare('SELECT id, url, name, reviewed FROM photos').all();
    const localPhotos = (localPhotosResult.results || []) as Array<{
      id: number;
      url: string;
      name: string;
      reviewed: number;
    }>;
    const localPhotosByUrl = new Map(localPhotos.map((photo) => [photo.url, photo]));

    let added = 0;
    let skipped = 0;
    let deleted = 0;
    let activated = 0;
    const details = [];

    // 2. Process Remote Files (Add missing)
    for (const file of remoteFiles) {
      // Filter out tiny files (likely error artifacts or corrupted uploads)
      // 1KB = 1024 bytes. Photos should be much larger.
      if (file.size && file.size < 1024) {
          console.warn(`SyncHelper: Skipping invalid small file: ${file.name} (${file.size} bytes)`);
          continue;
      }

      const publicUrl = `https://cloudflare-imgbed-cvs.pages.dev/file/${file.name}`;
      const displayName = file.metadata?.FileName || file.name;

      // Filter out explicitly blocked images.
      if (file.metadata?.ListType === 'Block' || file.metadata?.Label === 'adult') {
          console.log(`SyncHelper: Skipping explicitly blocked file: ${displayName}`);
          continue;
      }

      const existing = localPhotosByUrl.get(publicUrl);

      if (existing) {
        validRemoteUrls.add(publicUrl);

        // If exists but not reviewed, approve it (since it exists on the image bed which is the source of truth)
        if (existing.reviewed !== 1) {
           await DB.prepare('UPDATE photos SET reviewed = 1 WHERE id = ?').bind(existing.id).run();
           console.log(`SyncHelper: Activating pending upload (reviewed=0 -> 1): ${displayName}`);
           activated++;
           details.push({ name: displayName, status: 'activated' });
        } else {
           // Already reviewed and exists, just skip
           skipped++;
        }
      } else {
        const isAccessible = await isNewPhotoAccessible(publicUrl, file);
        if (!isAccessible) {
          console.log(`SyncHelper: Skipping non-whitelisted/inaccessible new file: ${displayName}`);
          continue;
        }

        validRemoteUrls.add(publicUrl);
        await DB.prepare(
          'INSERT INTO photos (name, url, created_at, ip, reviewed) VALUES (?, ?, ?, ?, 1)'
        ).bind(displayName, publicUrl, Date.now(), 'auto-sync').run();
        
        added++;
        details.push({ name: displayName, status: 'added' });
      }
    }

    // 3. Process Local Files (Delete if not in remote)
    for (const photo of localPhotos) {
      // If local URL is NOT in the valid remote set, delete it
      if (!validRemoteUrls.has(photo.url)) {
        console.log(`SyncHelper: Deleting orphaned photo: ${photo.name} (${photo.url})`);
        await DB.prepare('DELETE FROM photos WHERE id = ?').bind(photo.id).run();
        deleted++;
        details.push({ name: photo.name, status: 'deleted' });
      }
    }

    console.log(`SyncHelper: Sync complete. Added: ${added}, Activated: ${activated}, Skipped: ${skipped}, Deleted: ${deleted}`);

    return {
      success: true,
      totalFound: remoteFiles.length,
      added,
      activated,
      skipped,
      deleted,
      details
    };

  } catch (err) {
    console.error('SyncHelper Error:', err);
    throw err;
  }
}
