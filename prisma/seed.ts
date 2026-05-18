import bcrypt from "bcryptjs";
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

  const sports = await prisma.category.upsert({ where: { slug: "sports" }, update: {}, create: { name: "Sports", slug: "sports", description: "Leagues, matches, and fan experiences", displayOrder: 1 } });
  const music = await prisma.category.upsert({ where: { slug: "music" }, update: {}, create: { name: "Music", slug: "music", description: "Concerts, festivals, and tours", displayOrder: 2 } });
  const theater = await prisma.category.upsert({ where: { slug: "theater-arts" }, update: {}, create: { name: "Theater & Arts", slug: "theater-arts", description: "Stage shows, theater, and arts experiences", displayOrder: 3 } });
  const comedy = await prisma.category.upsert({ where: { slug: "comedy" }, update: {}, create: { name: "Comedy", slug: "comedy", description: "Stand-up and special live shows", displayOrder: 4 } });
  const festival = await prisma.category.upsert({ where: { slug: "festival" }, update: {}, create: { name: "Festival", slug: "festival", description: "Outdoor festivals and multi-stage events", displayOrder: 5 } });
  const conference = await prisma.category.upsert({ where: { slug: "conference" }, update: {}, create: { name: "Conference", slug: "conference", description: "Professional and creator conferences", displayOrder: 6 } });

  await prisma.subcategory.upsert({
    where: { categoryId_slug: { categoryId: sports.id, slug: "basketball" } },
    update: {},
    create: { categoryId: sports.id, name: "Basketball", slug: "basketball" }
  });

  const venue =
    (await prisma.venue.findFirst({
      where: { name: "Summit Arena", city: "Ulaanbaatar" }
    })) ??
    (await prisma.venue.create({
      data: {
        name: "Summit Arena",
        city: "Ulaanbaatar",
        country: "Mongolia",
        address: "Chinggis Avenue 1",
        timezone: "Asia/Ulaanbaatar",
        capacity: 24000
      }
    }));

  const organizerProfile = await prisma.organizerProfile.upsert({
    where: { userId: organizerUser.id },
    update: {},
    create: { userId: organizerUser.id, companyName: "Atlas Events", slug: "atlas-events", status: OrganizerStatus.APPROVED, approvedAt: new Date(), approvedById: admin.id, description: "Independent organizer for premium live experiences" }
  });

  const eventsToSeed = [
    // Sports
    { title: "Summit Finals 2026", category: sports, summary: "Championship night with premium transparent pricing.", price1: 45000, price2: 85000, date: "2026-06-18T19:00:00.000Z", image: "/uploads/1.jpg" },
    { title: "Basketball League Night", category: sports, summary: "Top teams battle it out in the season opener.", price1: 25000, price2: 55000, date: "2026-07-05T18:00:00.000Z", image: "/uploads/2.jpg" },
    { title: "Football Cup 2026", category: sports, summary: "National cup final with full stadium experience.", price1: 20000, price2: 45000, date: "2026-08-12T17:00:00.000Z", image: "/uploads/3.jpg" },
    // Music
    { title: "Neon Nights Concert", category: music, summary: "An electrifying night of live electronic music.", price1: 35000, price2: 70000, date: "2026-06-25T20:00:00.000Z", image: "/uploads/4.jpg" },
    { title: "Acoustic Sessions Live", category: music, summary: "Intimate acoustic performances by top artists.", price1: 30000, price2: 60000, date: "2026-07-14T19:30:00.000Z", image: "/uploads/5.jpg" },
    { title: "Rock the Arena", category: music, summary: "Massive rock concert with three headline bands.", price1: 50000, price2: 95000, date: "2026-08-20T19:00:00.000Z", image: "/uploads/1.jpg" },
    // Theater & Arts
    { title: "Hamlet Reimagined", category: theater, summary: "A modern take on Shakespeare's timeless classic.", price1: 25000, price2: 55000, date: "2026-06-28T19:00:00.000Z", image: "/uploads/2.jpg" },
    { title: "Contemporary Dance Gala", category: theater, summary: "World-class dancers perform original choreography.", price1: 20000, price2: 45000, date: "2026-07-18T18:30:00.000Z", image: "/uploads/3.jpg" },
    { title: "Art Exhibition Opening", category: theater, summary: "Exclusive opening night for the annual art showcase.", price1: 15000, price2: 35000, date: "2026-08-05T17:00:00.000Z", image: "/uploads/4.jpg" },
    // Comedy
    { title: "Laugh Factory Live", category: comedy, summary: "Top comedians bring the house down.", price1: 20000, price2: 40000, date: "2026-07-02T20:00:00.000Z", image: "/uploads/5.jpg" },
    { title: "Stand-Up Showcase", category: comedy, summary: "Five rising stars in one unforgettable night.", price1: 18000, price2: 35000, date: "2026-07-22T19:30:00.000Z", image: "/uploads/1.jpg" },
    { title: "Comedy Gala 2026", category: comedy, summary: "Annual comedy gala with surprise celebrity guests.", price1: 30000, price2: 60000, date: "2026-08-15T20:00:00.000Z", image: "/uploads/2.jpg" },
    // Festival
    { title: "Summer Vibes Festival", category: festival, summary: "Three days of music, food, and culture.", price1: 55000, price2: 110000, date: "2026-07-10T12:00:00.000Z", image: "/uploads/3.jpg" },
    { title: "Urban Street Fest", category: festival, summary: "City-wide festival celebrating local artists.", price1: 15000, price2: 30000, date: "2026-07-28T11:00:00.000Z", image: "/uploads/4.jpg" },
    { title: "Horizon Music Festival", category: festival, summary: "Outdoor multi-stage festival at the riverbank.", price1: 70000, price2: 130000, date: "2026-08-22T13:00:00.000Z", image: "/uploads/5.jpg" },
    // Conference
    { title: "TechForward Summit", category: conference, summary: "Mongolia's leading technology and innovation conference.", price1: 80000, price2: 150000, date: "2026-06-30T09:00:00.000Z", image: "/uploads/1.jpg" },
    { title: "Startup Founders Day", category: conference, summary: "Connect with founders, investors, and mentors.", price1: 50000, price2: 100000, date: "2026-07-16T09:00:00.000Z", image: "/uploads/2.jpg" },
    { title: "Design & UX Conference", category: conference, summary: "Two days of talks on design, product, and UX.", price1: 45000, price2: 90000, date: "2026-08-10T09:00:00.000Z", image: "/uploads/3.jpg" },
  ];

  for (const ev of eventsToSeed) {
    const slug = slugify(ev.title);
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.event.create({
        data: {
          organizerId: organizerProfile.id,
          createdById: organizerUser.id,
          reviewedById: admin.id,
          categoryId: ev.category.id,
          venueId: venue.id,
          title: ev.title,
          slug,
          summary: ev.summary,
          description: ev.summary,
          startsAt: new Date(ev.date),
          endsAt: new Date(new Date(ev.date).getTime() + 3 * 60 * 60 * 1000),
          saleStartsAt: new Date("2026-04-01T00:00:00.000Z"),
          saleEndsAt: new Date(new Date(ev.date).getTime() - 60 * 60 * 1000),
          status: EventStatus.PUBLISHED,
          publishedAt: new Date(),
          currency: "MNT",
          platformFeeBps: 900,
          serviceFeeBps: 350,
          ticketTypes: {
            create: [
              { name: "General", price: new Prisma.Decimal(ev.price1), quantityTotal: 1000, maxPerOrder: 6, resaleAllowed: true, resalePriceCap: new Prisma.Decimal(ev.price1 * 1.5) },
              { name: "VIP", price: new Prisma.Decimal(ev.price2), quantityTotal: 300, maxPerOrder: 4, resaleAllowed: true, resalePriceCap: new Prisma.Decimal(ev.price2 * 1.5) }
            ]
          }
        }
      });
    }
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
