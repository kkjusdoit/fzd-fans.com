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
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Upstream API failed: ${response.status}`);
      }

      const data = await response.json();
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
      let displayName = file.metadata?.FileName || file.name;

      // Accessibility Check: Filter out blocked/inaccessible images
      // 1. Check metadata for explicit blocks
      if (file.metadata?.ListType === 'Block' || file.metadata?.Label === 'adult') {
          console.log(`SyncHelper: Skipping explicitly blocked file: ${displayName}`);
          continue;
      }

      // 2. Check metadata for explicit whitelist (always accessible) or fallback to HTTP check
      let isAccessible = true; // [OPTIMIZATION] Default to true to avoid expensive HEAD checks
      
      if (file.metadata?.ListType === 'Block' || file.metadata?.Label === 'adult') {
          // Double check explicit block (already checked above but keeping logic clear)
          isAccessible = false;
      }

      /* [OPTIMIZATION] 
         Disabled per-file HTTP HEAD check to reduce KV operations on the Image Bed side.
         We trust the list API. If the image is really gone, the frontend onerror will handle it.
         
      if (file.metadata?.ListType === 'White') {
          isAccessible = true;
      } else {
          // 3. Fallback to HTTP HEAD check (verifies if server allows access under current mode)
          try {
             // redirect: 'manual' ensures we treat 302 redirects (e.g. to block page) as inaccessible
             const headRes = await fetch(publicUrl, { method: 'HEAD', redirect: 'manual' });
             if (headRes.status === 200) {
                 isAccessible = true;
             } else {
                 console.warn(`SyncHelper: Skipping inaccessible file (Status ${headRes.status}): ${displayName}`);
             }
          } catch (e) {
             console.warn(`SyncHelper: Error checking accessibility for ${displayName}, skipping. Error: ${(e as Error).message}`);
          }
      }
      */

      if (!isAccessible) continue;

      validRemoteUrls.add(publicUrl);
      
      const existing = await DB.prepare('SELECT id, reviewed FROM photos WHERE url = ?').bind(publicUrl).first();

      if (existing) {
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
        await DB.prepare(
          'INSERT INTO photos (name, url, created_at, ip, reviewed) VALUES (?, ?, ?, ?, 1)'
        ).bind(displayName, publicUrl, Date.now(), 'auto-sync').run();
        
        added++;
        details.push({ name: displayName, status: 'added' });
      }
    }

    // 3. Process Local Files (Delete if not in remote)
    // Fetch all current URLs from DB
    const localPhotos = await DB.prepare('SELECT id, url, name FROM photos').all();
    
    if (localPhotos.results) {
      for (const photo of localPhotos.results) {
        // If local URL is NOT in the valid remote set, delete it
        if (!validRemoteUrls.has(photo.url as string)) {
          console.log(`SyncHelper: Deleting orphaned photo: ${photo.name} (${photo.url})`);
          await DB.prepare('DELETE FROM photos WHERE id = ?').bind(photo.id).run();
          deleted++;
          details.push({ name: photo.name, status: 'deleted' });
        }
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
