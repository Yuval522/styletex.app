import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This script wipes all business data so the app starts from a clean
 * slate — no demo clients, projects, quotes, materials, or calendar
 * events. It does NOT insert any sample/mock data.
 *
 * Deletion order respects foreign-key dependencies (children before
 * parents), so it works regardless of each relation's cascade setting.
 * Run with: npm run db:seed
 */
async function main() {
  console.log("Clearing all business data from Styletex Kitchens…");

  await prisma.cabinetSpec.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.material.deleteMany();
  await prisma.supplier.deleteMany();

  console.log("Database is clean. No demo data was inserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
