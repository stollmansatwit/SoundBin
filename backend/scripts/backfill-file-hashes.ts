/**
 * @file One-off script to populate file_hash for TrackFile rows that were
 * created before content-hashing existed. Safe to re-run; skips rows that
 * already have a hash, and skips files that no longer exist on disk.
 *
 * Usage: npx tsx scripts/backfill-file-hashes.ts
 * @author Ian MacDougall
 * @version 1.0
 */
import { prisma } from '../src/lib/database';
import { hashFile } from '../src/utils/metadata';
import { existsSync } from 'fs';

async function main() {
  const rows = await prisma.trackFile.findMany({
    where: { file_hash: null },
  });

  console.log(`Found ${rows.length} track_files row(s) without a hash.`);

  let updated = 0;
  let missing = 0;
  let collided = 0;

  for (const row of rows) {
    if (!existsSync(row.storage_path_url)) {
      console.warn(`Skipping (file missing on disk): ${row.storage_path_url}`);
      missing++;
      continue;
    }

    const hash = await hashFile(row.storage_path_url);

    // If another row already has this exact hash, this row is a genuine
    // duplicate on disk. Log it rather than silently deleting anything —
    // deciding which copy to keep is a judgment call best left to a human.
    const existing = await prisma.trackFile.findUnique({ where: { file_hash: hash } });
    if (existing && existing.file_id !== row.file_id) {
      console.warn(
        `Duplicate content detected: file_id ${row.file_id} (${row.storage_path_url}) ` +
        `has the same content as file_id ${existing.file_id} (${existing.storage_path_url}). ` +
        `Leaving both rows in place — review and remove the redundant copy manually.`
      );
      collided++;
      continue;
    }

    await prisma.trackFile.update({
      where: { file_id: row.file_id },
      data: { file_hash: hash },
    });
    updated++;
  }

  console.log(`Done. Updated: ${updated}, missing files: ${missing}, unresolved duplicates: ${collided}.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Backfill failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
