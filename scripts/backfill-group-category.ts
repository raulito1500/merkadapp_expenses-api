// One-time backfill: set category="OTHER" on groups predating the category field.
// Run once with: npx ts-node -r tsconfig-paths/register scripts/backfill-group-category.ts
// Safe to delete after running.
import 'dotenv/config';
import mongoose from 'mongoose';
import { GroupCategory } from '../src/groups/group-category.enum';

async function main() {
  const uri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/merkadapp_expenses';
  await mongoose.connect(uri);

  const result = await mongoose.connection
    .collection('groups')
    .updateMany(
      { category: { $exists: false } },
      { $set: { category: GroupCategory.OTHER } },
    );

  console.log(`Backfilled category on ${result.modifiedCount} group(s).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
