# Tixora

Tixora is a Next.js fullstack ticket marketplace focused on transparent fees, ownership-based tickets, controlled resale, and role-aware operations.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Zod
- bcrypt
- JWT session cookie auth

## Roles

- `USER`
- `ORGANIZER`
- `ADMIN`

## Included foundations

- Prisma schema for the full marketplace domain
- JWT-backed secure session cookie auth
- Role-aware dashboard routing
- Organizer event creation endpoint
- Moderator/admin review endpoint
- Ownership-based ticket page protection
- Controlled resale endpoint with price-cap checks
- Check-in endpoint tied to current ownership
- Transparent fee calculation helpers and UI
- Seed script with starter admin, organizer, category, venue, and event

## Local setup

1. Copy `.env.example` to `.env`
2. Update `DATABASE_URL` and `JWT_SECRET`
3. Start PostgreSQL with Docker using `docker compose up -d`
4. Install dependencies with `npm install`
5. Generate the Prisma client with `npm run prisma:generate`
6. Run migrations with `npm run prisma:migrate`
7. Seed starter data with `npm run prisma:seed`
8. Start the app with `npm run dev`

## Docker PostgreSQL

The repo includes `docker-compose.yml` for local PostgreSQL.

```bash
docker compose up -d
docker compose ps
```

Default local database credentials:

- Host: `localhost`
- Port: `5432`
- Database: `tixora`
- User: `postgres`
- Password: `postgres`

To stop the database:

```bash
docker compose down
```

To stop it and remove the database volume too:

```bash
docker compose down -v
```

## Starter accounts

- Admin: `admin@tixora.local`
- Organizer: `organizer@tixora.local`
- Organizer password: `Organizer123!`
- Admin password: value from `SEED_ADMIN_PASSWORD`

## Key routes

- `/`
- `/events`
- `/events/[slug]`
- `/login`
- `/register`
- `/dashboard`
- `/dashboard/organizer`
- `/dashboard/admin`
- `/tickets/[code]`

## Static images

Use the `public` folder for local images and logos.

- Brand assets: `public/brand`
- General uploads/assets: `public/uploads`

Example paths inside the app:

- `/brand/logo.png`
- `/uploads/event-poster.webp`

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/logout`
- `POST /api/organizer/events`
- `PATCH /api/admin/events/[eventId]`
- `POST /api/orders`
- `POST /api/resales`
- `POST /api/check-in`

## Notes

- `POST /api/orders` creates a `PENDING_PAYMENT` order and payment record. Connect your preferred payment provider webhook before minting tickets on successful capture.
- Middleware provides route gating, while route handlers and server pages enforce the real authorization rules.
