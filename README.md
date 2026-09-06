# Styletex Kitchens

Custom kitchen & cabinetry project management dashboard. Built with Next.js (App Router), Tailwind CSS v4, Prisma, and Neon Postgres.

## Features

- Client management with project history
- Project pipeline board (Lead → Design → Quoted → Approved → Production → Installation → Complete)
- Room-by-room cabinet design specs
- Quote builder with line items, tax, and versioning
- Materials & supplier catalog with stock levels
- Shop-floor production board (Cutting → Assembly → Finishing → QC → Ready)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your Neon `DATABASE_URL`:

   ```bash
   cp .env.example .env
   ```

3. Push the schema to your database and generate the Prisma client:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. (Optional) Seed sample clients, projects, materials, and quotes:

   ```bash
   npm run db:seed
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

## Deploying

Push to GitHub and import the repo in Vercel. Add `DATABASE_URL` as an environment variable in the Vercel project settings — `prisma generate` runs automatically via the `postinstall` script during the Vercel build, and `prisma migrate deploy` should be run once (locally or via a release step) to apply the schema to your production database.

## Stack

- Next.js 16 (App Router, Server Actions)
- Tailwind CSS v4
- Prisma ORM + Neon Postgres
- Radix UI primitives, lucide-react icons
