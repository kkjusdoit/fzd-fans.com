export async function syncWithImageBed(DB: any) {
  try {
    // 1. Fetch image list from upstream
    const authHeader = 'Basic ' + btoa('kkjusdoit:fzd-fans.com');
    console.log('SyncHelper: Fetching image list from upstream...');
    
    const response = await fetch('https://cloudflare-imgbed-cvs.pages.dev/api/manage/list', {
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
    const remoteFiles = data.files || [];
    const validRemoteUrls = new Set<string>();

    let added = 0;
    let skipped = 0;
    let deleted = 0;
    const details = [];

    // 2. Process Remote Files (Add missing)
    for (const file of remoteFiles) {
      const publicUrl = `https://cloudflare-imgbed-cvs.pages.dev/file/${file.name}`;
      validRemoteUrls.add(publicUrl);
      
      let displayName = file.metadata?.FileName || file.name;

      const exists = await DB.prepare('SELECT 1 FROM photos WHERE url = ?').bind(publicUrl).first();

      if (exists) {
        skipped++;
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

    console.log(`SyncHelper: Sync complete. Added: ${added}, Skipped: ${skipped}, Deleted: ${deleted}`);

    return {
      success: true,
      totalFound: remoteFiles.length,
      added,
      skipped,
      deleted,
      details
    };

  } catch (err) {
    console.error('SyncHelper Error:', err);
    throw err;
  }
}
