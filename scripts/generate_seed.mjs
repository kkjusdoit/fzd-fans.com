import fs from 'node:fs/promises';
import path from 'node:path';

async function generateSeed() {
  try {
    const jsonPath = path.join(process.cwd(), 'src/data/photos.json');
    const sqlPath = path.join(process.cwd(), 'db/seed_photos.sql');

    // Read JSON
    const data = await fs.readFile(jsonPath, 'utf-8');
    const photos = JSON.parse(data);

    if (!Array.isArray(photos)) {
      console.error('photos.json is not an array');
      return;
    }

    console.log(`Found ${photos.length} photos.`);

    // Generate SQL
    // Schema: id, name, url, created_at
    const values = photos.map(photo => {
      const name = photo.name.replace(/'/g, "''"); // Escape single quotes
      const url = photo.url.replace(/'/g, "''");
      // Use photo.date if available, otherwise current time
      const date = photo.date ? new Date(photo.date).getTime() : Date.now();
      
      // If date is invalid, fallback
      const createdAt = isNaN(date) ? Date.now() : date;

      return `('${name}', '${url}', ${createdAt})`;
    }).join(',\n');

    const sql = `INSERT INTO photos (name, url, created_at) VALUES\n${values};`;

    // Write SQL
    await fs.mkdir(path.dirname(sqlPath), { recursive: true });
    await fs.writeFile(sqlPath, sql, 'utf-8');

    console.log(`Generated SQL seed at ${sqlPath}`);
  } catch (error) {
    console.error('Error generating seed:', error);
  }
}

generateSeed();
