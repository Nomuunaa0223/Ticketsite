import bcrypt from "bcrypt";
import {
  EventStatus,
  OrganizerStatus,
  Prisma,
  PrismaClient,
  Role
} from "@prisma/client";
import { env } from "../lib/env";
import { slugify } from "../lib/slugs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
  const organizerPasswordHash = await bcrypt.hash("Organizer123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: {},
    create: {
      email: env.SEED_ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      fullName: "Tixora Admin",
      role: Role.ADMIN
    }
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: "organizer@tixora.local" },
    update: {},
    create: {
      email: "organizer@tixora.local",
      passwordHash: organizerPasswordHash,
      fullName: "Atlas Events",
      role: Role.ORGANIZER
    }
  });

  const sports = await prisma.category.upsert({
    where: { slug: "sports" },
    update: {},
    create: {
      name: "Sports",
      slug: "sports",
      description: "Leagues, matches, and fan experiences",
      displayOrder: 1
    }
  });

  await prisma.subcategory.upsert({
    where: {
      categoryId_slug: {
        categoryId: sports.id,
        slug: "basketball"
      }
    },
    update: {},
    create: {
      categoryId: sports.id,
      name: "Basketball",
      slug: "basketball"
    }
  });

  await prisma.category.upsert({
    where: { slug: "music" },
    update: {},
    create: {
      name: "Music",
      slug: "music",
      description: "Concerts, festivals, and tours",
      displayOrder: 2
    }
  });

  await prisma.category.upsert({
    where: { slug: "theater-arts" },
    update: {},
    create: {
      name: "Theater & Arts",
      slug: "theater-arts",
      description: "Stage shows, theater, and arts experiences",
      displayOrder: 3
    }
  });

  await prisma.category.upsert({
    where: { slug: "comedy" },
    update: {},
    create: {
      name: "Comedy",
      slug: "comedy",
      description: "Stand-up and special live shows",
      displayOrder: 4
    }
  });

  await prisma.category.upsert({
    where: { slug: "festival" },
    update: {},
    create: {
      name: "Festival",
      slug: "festival",
      description: "Outdoor festivals and multi-stage events",
      displayOrder: 5
    }
  });

  await prisma.category.upsert({
    where: { slug: "conference" },
    update: {},
    create: {
      name: "Conference",
      slug: "conference",
      description: "Professional and creator conferences",
      displayOrder: 6
    }
  });

  const venue = await prisma.venue.upsert({
    where: {
      id: "cm-demo-venue"
    },
    update: {},
    create: {
      id: "cm-demo-venue",
      name: "Summit Arena",
      city: "Denver",
      country: "USA",
      address: "1200 Market Street",
      timezone: "America/Denver",
      capacity: 24000
    }
  });

  const organizerProfile = await prisma.organizerProfile.upsert({
    where: { userId: organizerUser.id },
    update: {},
    create: {
      userId: organizerUser.id,
      companyName: "Atlas Events",
      slug: "atlas-events",
      status: OrganizerStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin.id,
      description: "Independent organizer for premium live experiences"
    }
  });

  const eventSlug = slugify("Summit Finals 2026");
  const existingEvent = await prisma.event.findUnique({
    where: { slug: eventSlug }
  });

  if (!existingEvent) {
    await prisma.event.create({
      data: {
        organizerId: organizerProfile.id,
        createdById: organizerUser.id,
        reviewedById: admin.id,
        categoryId: sports.id,
        venueId: venue.id,
        title: "Summit Finals 2026",
        slug: eventSlug,
        summary: "Championship night with premium transparent pricing.",
        description:
          "A flagship sports event seeded to help you validate the platform end-to-end. Tickets are ownership-based and support controlled resale.",
        startsAt: new Date("2026-06-18T19:00:00.000Z"),
        endsAt: new Date("2026-06-18T22:00:00.000Z"),
        saleStartsAt: new Date("2026-04-25T16:00:00.000Z"),
        saleEndsAt: new Date("2026-06-18T18:00:00.000Z"),
        status: EventStatus.PUBLISHED,
        publishedAt: new Date(),
        currency: "USD",
        platformFeeBps: 900,
        serviceFeeBps: 350,
        ticketTypes: {
          create: [
            {
              name: "Lower Bowl",
              price: new Prisma.Decimal(145),
              quantityTotal: 1500,
              maxPerOrder: 6,
              resaleAllowed: true,
              resalePriceCap: new Prisma.Decimal(220)
            },
            {
              name: "Club Level",
              price: new Prisma.Decimal(220),
              quantityTotal: 800,
              maxPerOrder: 4,
              resaleAllowed: true,
              resalePriceCap: new Prisma.Decimal(320)
            }
          ]
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
