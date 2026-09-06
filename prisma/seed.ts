import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Styletex Kitchens sample data…");

  const northshore = await prisma.supplier.create({
    data: {
      name: "Northshore Millwork",
      contact: "Dana Reyes",
      email: "dana@northshoremillwork.com",
      phone: "(206) 555-0142",
    },
  });

  const graniteWorks = await prisma.supplier.create({
    data: {
      name: "Granite Works Co.",
      contact: "Miguel Santos",
      email: "miguel@graniteworksco.com",
      phone: "(206) 555-0198",
    },
  });

  const [whiteOak, walnut, quartz, brassPulls] = await Promise.all([
    prisma.material.create({
      data: {
        name: "White Oak Veneer",
        type: "WOOD",
        unitCost: 14.5,
        unit: "sq ft",
        stockQty: 320,
        reorderLevel: 100,
        supplierId: northshore.id,
      },
    }),
    prisma.material.create({
      data: {
        name: "American Walnut Solid",
        type: "WOOD",
        unitCost: 22.0,
        unit: "board ft",
        stockQty: 60,
        reorderLevel: 80,
        supplierId: northshore.id,
      },
    }),
    prisma.material.create({
      data: {
        name: "Calacatta Quartz",
        type: "COUNTERTOP",
        unitCost: 85.0,
        unit: "sq ft",
        stockQty: 45,
        reorderLevel: 20,
        supplierId: graniteWorks.id,
      },
    }),
    prisma.material.create({
      data: {
        name: "Brushed Brass Pulls",
        type: "HARDWARE",
        unitCost: 12.0,
        unit: "each",
        stockQty: 240,
        reorderLevel: 50,
      },
    }),
  ]);

  const jordan = await prisma.client.create({
    data: {
      name: "Jordan Miles",
      email: "jordan.miles@email.com",
      phone: "(206) 555-0110",
      address: "412 Birchwood Ln, Seattle, WA",
      notes: "Referred by Whitmore Architecture. Prefers warm minimal palette.",
    },
  });

  const priya = await prisma.client.create({
    data: {
      name: "Priya & Alan Chen",
      email: "priya.chen@email.com",
      phone: "(206) 555-0173",
      address: "88 Fremont Ave, Seattle, WA",
      notes: "Full home renovation — kitchen is phase one of three.",
    },
  });

  const wentworth = await prisma.client.create({
    data: {
      name: "The Wentworth Estate",
      email: "estate@wentworth.com",
      phone: "(206) 555-0199",
      address: "1 Wentworth Way, Mercer Island, WA",
      notes: "High-end build, budget is flexible. Project manager: Claire Wentworth.",
    },
  });

  const milesProject = await prisma.project.create({
    data: {
      clientId: jordan.id,
      name: "Miles Residence — Kitchen",
      status: "PRODUCTION",
      budget: 68000,
      startDate: new Date("2026-06-01"),
      targetDate: new Date("2026-11-15"),
    },
  });

  const chenProject = await prisma.project.create({
    data: {
      clientId: priya.id,
      name: "Chen Residence — Kitchen & Pantry",
      status: "QUOTED",
      budget: 92000,
      startDate: new Date("2026-08-01"),
      targetDate: new Date("2027-01-20"),
    },
  });

  const wentworthProject = await prisma.project.create({
    data: {
      clientId: wentworth.id,
      name: "Wentworth Estate — Full Kitchen Suite",
      status: "DESIGN",
      budget: 210000,
      startDate: new Date("2026-09-01"),
      targetDate: new Date("2027-04-01"),
    },
  });

  const leadProject = await prisma.project.create({
    data: {
      clientId: jordan.id,
      name: "Miles Residence — Butler's Pantry",
      status: "LEAD",
      budget: 18000,
    },
  });

  const milesKitchen = await prisma.room.create({
    data: { projectId: milesProject.id, name: "Kitchen" },
  });

  await prisma.cabinetSpec.create({
    data: {
      roomId: milesKitchen.id,
      doorStyle: "Shaker",
      finish: "Matte white",
      width: 24,
      height: 34.5,
      depth: 24,
      hardware: "Brushed brass pulls",
      materialId: whiteOak.id,
      notes: "Soft-close hinges throughout, custom inset panels.",
    },
  });

  await prisma.cabinetSpec.create({
    data: {
      roomId: milesKitchen.id,
      doorStyle: "Slab",
      finish: "Walnut natural",
      width: 96,
      height: 36,
      depth: 26,
      hardware: "Integrated pull",
      materialId: walnut.id,
      notes: "Waterfall island edge, Calacatta quartz top.",
    },
  });

  const chenKitchen = await prisma.room.create({
    data: { projectId: chenProject.id, name: "Kitchen" },
  });
  await prisma.room.create({
    data: { projectId: chenProject.id, name: "Pantry" },
  });

  await prisma.cabinetSpec.create({
    data: {
      roomId: chenKitchen.id,
      doorStyle: "Shaker",
      finish: "Sage green",
      width: 30,
      height: 34.5,
      depth: 24,
      materialId: whiteOak.id,
    },
  });

  await prisma.quote.create({
    data: {
      projectId: milesProject.id,
      version: 1,
      status: "APPROVED",
      subtotal: 62000,
      tax: 4960,
      total: 66960,
      lineItems: {
        create: [
          { description: "Custom cabinetry — kitchen perimeter", quantity: 1, unitPrice: 38000, total: 38000 },
          { description: "Island with waterfall quartz", quantity: 1, unitPrice: 18000, total: 18000 },
          { description: "Hardware & accessories", quantity: 1, unitPrice: 6000, total: 6000 },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      projectId: chenProject.id,
      version: 1,
      status: "SENT",
      subtotal: 84000,
      tax: 6720,
      total: 90720,
      lineItems: {
        create: [
          { description: "Kitchen cabinetry package", quantity: 1, unitPrice: 58000, total: 58000 },
          { description: "Pantry built-ins", quantity: 1, unitPrice: 20000, total: 20000 },
          { description: "Countertops — Calacatta quartz", quantity: 60, unitPrice: 100, total: 6000 },
        ],
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      projectId: milesProject.id,
      stage: "ASSEMBLY",
      assignedTo: "Shop Team A",
      dueDate: new Date("2026-10-10"),
      notes: "Perimeter cabinets on schedule, island in cutting queue.",
    },
  });

  await prisma.workOrder.create({
    data: {
      projectId: milesProject.id,
      stage: "CUTTING",
      assignedTo: "Shop Team B",
      dueDate: new Date("2026-10-18"),
      notes: "Island waterfall panels — awaiting quartz template.",
    },
  });

  console.log("Seed complete:", {
    suppliers: 2,
    materials: [whiteOak, walnut, quartz, brassPulls].length,
    clients: 3,
    projects: [milesProject, chenProject, wentworthProject, leadProject].length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
