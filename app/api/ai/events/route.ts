import { AiAgentType, AiArtifactType, AiDraftStatus, AiHumanReviewStatus, EventStatus, OrganizerStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { upsertEventEmbedding } from "@/lib/ai/pinecone";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";

const aiEventRequestSchema = z.object({
  prompt: z.string().min(8).max(3000)
});

type CategoryChoice = {
  id: number;
  name: string;
  slug: string;
};

type VenueChoice = {
  id: number;
  name: string;
  city: string;
  capacity: number;
};

type ParsedEventDetails = {
  title?: string;
  venue?: string;
  dateTime?: string;
  seats?: number;
  price?: number;
  priceLabel?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  experienceNotes?: string;
  latitude?: number;
  longitude?: number;
};

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      include: { organizerProfile: true }
    });

    if (!user || (user.role !== "ORGANIZER" && user.role !== "USER")) {
      return NextResponse.json(
        { error: "User access required to create AI community events." },
        { status: 403 }
      );
    }

    const isOrganizerFlow = user.role === "ORGANIZER" && !!user.organizerProfile;
    const isCommunityFlow = user.role === "USER";

    const { prompt } = aiEventRequestSchema.parse(await request.json());

    const [categories, venues, agent] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { displayOrder: "asc" }
      }),
      prisma.venue.findMany({
        select: { id: true, name: true, city: true, capacity: true },
        orderBy: { capacity: "desc" },
        take: 20
      }),
      prisma.aiAgent.upsert({
        where: { slug: "event-draft-producer" },
        update: { isActive: true },
        create: {
          slug: "event-draft-producer",
          name: "Event Draft Producer",
          type: AiAgentType.EVENT_DRAFT,
          description: "Turns organizer prompts into structured event drafts ready for human review.",
          defaultModel: "tixy-rules-v1",
          systemPrompt: "Create accurate, editable Tixora event drafts from organizer prompts.",
          toolManifest: {
            tools: ["category_match", "venue_pick", "pricing_estimate", "draft_event"]
          },
          config: {
            requiresHumanReview: true,
            outputArtifacts: ["EVENT_BRIEF", "EVENT_COPY", "PRICING_PLAN"]
          },
          createdById: user.id
        }
      })
    ]);

    if (categories.length === 0 || venues.length === 0) {
      return NextResponse.json(
        { error: "At least one category and venue are required before Tixy Ai can create events." },
        { status: 400 }
      );
    }

    const eventDetails = parseStructuredEventPrompt(prompt);
    const category = chooseCategory(eventDetails.category ?? prompt, categories);
    const venue = await getOrCreateVenueFromDetails(eventDetails, venues, isCommunityFlow);
    const draft = buildDraft(prompt, category, venue, isCommunityFlow, eventDetails);

    const result = await prisma.$transaction(async (tx) => {
      const organizerProfile = isOrganizerFlow
        ? user.organizerProfile!
        : await getOrCreateCommunityHostProfile(tx, user.id, user.fullName);

      const run = await tx.aiAgentRun.create({
        data: {
          agentId: agent.id,
          userId: user.id,
          status: "RUNNING",
          input: {
            prompt,
            flow: isCommunityFlow ? "user-community-event" : "organizer-draft",
            categoryCandidates: categories.map((item) => item.slug),
            venueCandidates: venues.map((item) => item.name)
          },
          modelUsed: "tixy-rules-v1",
          startedAt: new Date()
        }
      });

      const aiDraft = await tx.aiEventDraft.create({
        data: {
          createdById: user.id,
          organizerId: organizerProfile.id,
          agentId: agent.id,
          lastAgentRunId: run.id,
          prompt,
          promptHash: hashPrompt(prompt),
          status: AiDraftStatus.READY,
          humanReviewStatus: isCommunityFlow ? AiHumanReviewStatus.APPROVED : AiHumanReviewStatus.REQUIRED,
          generatedTitle: draft.title,
          generatedSummary: draft.summary,
          generatedDescription: draft.description,
          marketingCaption: draft.marketingCaption,
          marketingCaptions: draft.marketingCaptions,
          suggestedPrice: new Prisma.Decimal(draft.ticket.price),
          pricingEstimate: draft.pricingEstimate,
          estimatedAudience: draft.estimatedAudience,
          audienceEstimate: draft.audienceEstimate,
          suggestedCategory: category.name,
          suggestedVenueName: venue.name,
          suggestedStartDate: draft.startsAt,
          suggestions: draft.suggestions,
          safetyNotes: draft.safetyNotes,
          rawResponse: draft,
          modelUsed: "tixy-rules-v1",
          tokensUsed: estimateTokens(prompt, draft.description)
        }
      });

      const event = await tx.event.create({
        data: {
          organizerId: organizerProfile.id,
          createdById: user.id,
          categoryId: category.id,
          venueId: venue.id,
          title: draft.title,
          slug: await createUniqueEventSlug(tx, draft.title),
          imageUrl: draft.imageUrl,
          cardImageUrl: draft.imageUrl,
          summary: draft.summary,
          description: draft.description,
          startsAt: draft.startsAt,
          endsAt: draft.endsAt,
          saleStartsAt: draft.saleStartsAt,
          saleEndsAt: draft.saleEndsAt,
          status: isCommunityFlow ? EventStatus.PUBLISHED : EventStatus.DRAFT,
          visibility: isCommunityFlow ? "PUBLIC" : "PRIVATE",
          publishedAt: isCommunityFlow ? new Date() : null,
          reviewNotes: isCommunityFlow ? "AI_APPROVED_USER_COMMUNITY_EVENT" : null,
          isSmallEvent: isCommunityFlow ? true : draft.isSmallEvent,
          aiGenerated: true,
          aiDraftId: aiDraft.id,
          currency: "MNT",
          ticketTypes: {
            create: {
              name: draft.ticket.name,
              description: draft.ticket.description,
              price: new Prisma.Decimal(draft.ticket.price),
              quantityTotal: draft.ticket.quantityTotal,
              maxPerOrder: isCommunityFlow || draft.isSmallEvent ? 1 : 6,
              resaleAllowed: !(isCommunityFlow || draft.isSmallEvent),
              resalePriceCap: new Prisma.Decimal(Math.round(draft.ticket.price * 1.25))
            }
          }
        },
        include: {
          category: true,
          venue: true,
          ticketTypes: true
        }
      });

      await tx.aiAgentArtifact.createMany({
        data: [
          {
            runId: run.id,
            eventDraftId: aiDraft.id,
            eventId: event.id,
            type: AiArtifactType.EVENT_BRIEF,
            title: draft.title,
            content: {
              summary: draft.summary,
              venue: venue.name,
              category: category.name,
              startsAt: draft.startsAt
            },
            isSelected: true
          },
          {
            runId: run.id,
            eventDraftId: aiDraft.id,
            eventId: event.id,
            type: AiArtifactType.PRICING_PLAN,
            title: `${draft.ticket.name} pricing`,
            content: draft.pricingEstimate,
            isSelected: true
          },
          {
            runId: run.id,
            eventDraftId: aiDraft.id,
            eventId: event.id,
            type: AiArtifactType.MARKETING_CAPTION,
            title: "Launch caption",
            content: { captions: draft.marketingCaptions },
            isSelected: true
          }
        ]
      });

      await tx.aiAgentTask.createMany({
        data: [
          {
            runId: run.id,
            name: "Match category",
            status: "COMPLETED",
            sortOrder: 1,
            input: { prompt },
            output: { category }
          },
          {
            runId: run.id,
            name: "Pick venue",
            status: "COMPLETED",
            sortOrder: 2,
            input: { prompt },
            output: { venue }
          },
          {
            runId: run.id,
            name: "Create editable draft event",
            status: "COMPLETED",
            sortOrder: 3,
            output: { eventId: event.id, aiDraftId: aiDraft.id }
          }
        ]
      });

      const actionUrl = isCommunityFlow
        ? `/events/${event.slug}`
        : `/dashboard/organizer/events/${event.id}`;

      await tx.aiAgentRun.update({
        where: { id: run.id },
        data: {
          eventDraftId: aiDraft.id,
          eventId: event.id,
          status: "COMPLETED",
          output: {
            eventId: event.id,
            aiDraftId: aiDraft.id,
            title: event.title,
            actionUrl,
            flow: isCommunityFlow ? "user-community-event" : "organizer-draft"
          },
          completedAt: new Date()
        }
      });

      return { event, aiDraft, run, actionUrl };
    });

    await recordAuditLog({
      actorUserId: user.id,
      action: isCommunityFlow ? "AI_COMMUNITY_EVENT_PUBLISHED" : "AI_EVENT_DRAFT_CREATED",
      entityType: "Event",
      entityId: result.event.id,
      description: isCommunityFlow
        ? `Tixy Ai reviewed and published community event ${result.event.title}`
        : `Tixy Ai created draft event ${result.event.title}`,
      metadata: {
        aiDraftId: result.aiDraft.id,
        runId: result.run.id,
        prompt
      }
    });

    upsertEventEmbedding({
      id: result.event.id,
      title: result.event.title,
      slug: result.event.slug,
      summary: result.event.summary,
      description: result.event.description,
      category: result.event.category.name,
      city: result.event.venue.city
    }).catch((indexError) => console.error("[ai:index-event]", indexError));

    return NextResponse.json(
      {
        ok: true,
        message: isCommunityFlow ? "Tixy Ai community event хянаад нийтэллээ." : "Tixy Ai event draft үүсгэлээ.",
        event: {
          id: result.event.id,
          title: result.event.title,
          status: result.event.status,
          startsAt: result.event.startsAt,
          category: result.event.category.name,
          venue: result.event.venue.name,
          editUrl: result.actionUrl,
          actionUrl: result.actionUrl,
          isSmallEvent: result.event.isSmallEvent
        },
        aiDraftId: result.aiDraft.id,
        runId: result.run.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid AI event prompt." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tixy Ai event үүсгэж чадсангүй." },
      { status: 400 }
    );
  }
}

function chooseCategory(prompt: string, categories: CategoryChoice[]) {
  const normalized = prompt.toLowerCase();
  const keywordMap: Array<[string[], string]> = [
    [["concert", "music", "live", "band", "dj", "дуу", "хөгжим"], "music"],
    [["sport", "basket", "football", "match", "game", "arena"], "sports"],
    [["comedy", "stand", "laugh", "инээд"], "comedy"],
    [["festival", "fest", "outdoor"], "festival"],
    [["conference", "summit", "tech", "startup", "workshop"], "conference"],
    [["theater", "dance", "art", "exhibition"], "theater-arts"]
  ];

  for (const [keywords, slug] of keywordMap) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      const match = categories.find((category) => category.slug === slug);
      if (match) return match;
    }
  }

  return categories[0];
}

function chooseVenue(prompt: string, venues: VenueChoice[], forceSmall = false) {
  const normalized = prompt.toLowerCase();
  const exact = venues.find((venue) => normalized.includes(venue.name.toLowerCase()));
  if (exact) return exact;

  if (forceSmall || normalized.includes("small") || normalized.includes("community") || normalized.includes("workshop")) {
    return [...venues].sort((a, b) => a.capacity - b.capacity)[0];
  }

  return venues[0];
}

async function getOrCreateVenueFromDetails(details: ParsedEventDetails, venues: VenueChoice[], forceSmall = false) {
  const requestedVenue = details.venue?.trim();
  const requestedLocation = [details.latitude, details.longitude].every((value) => typeof value === "number");

  if (!requestedVenue && !requestedLocation) {
    return chooseVenue("", venues, forceSmall);
  }

  const normalizedVenue = requestedVenue?.toLowerCase();
  const exact = normalizedVenue
    ? venues.find((venue) => venue.name.toLowerCase() === normalizedVenue || normalizedVenue.includes(venue.name.toLowerCase()))
    : null;

  if (exact) {
    return exact;
  }

  const isPinnedLocation = requestedLocation && (!requestedVenue || requestedVenue === "Shared current location");
  const pinnedAddress = `Pinned location: ${details.latitude}, ${details.longitude}`;
  const name = isPinnedLocation ? `Pinned location ${details.latitude}, ${details.longitude}` : requestedVenue || "Shared Location Community Venue";
  const existing = await prisma.venue.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      address: { equals: isPinnedLocation ? pinnedAddress : requestedVenue ?? pinnedAddress, mode: "insensitive" }
    },
    select: { id: true, name: true, city: true, capacity: true }
  });

  if (existing) {
    return existing;
  }

  return prisma.venue.create({
    data: {
      name,
      city: inferCity(requestedVenue),
      country: "Mongolia",
      address: isPinnedLocation ? pinnedAddress : requestedVenue || pinnedAddress,
      capacity: Math.max(10, Math.min(80, details.seats ?? 80)),
      latitude: details.latitude,
      longitude: details.longitude
    },
    select: { id: true, name: true, city: true, capacity: true }
  });
}

function parseStructuredEventPrompt(prompt: string): ParsedEventDetails {
  const lines = prompt.split(/\r?\n/);
  const valueFor = (label: string) => {
    const line = lines.find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return line?.slice(line.indexOf(":") + 1).trim();
  };

  return {
    title: cleanOptionalText(valueFor("Event name")),
    venue: cleanOptionalText(valueFor("Venue/location")),
    dateTime: cleanOptionalText(valueFor("Date and time")),
    seats: parsePositiveInteger(valueFor("Ticket capacity")),
    price: parseTicketPrice(valueFor("Ticket price MNT")),
    priceLabel: cleanOptionalText(valueFor("Ticket price MNT")),
    image: cleanOptionalText(valueFor("Image/art direction or URL")),
    imageUrl: cleanOptionalText(valueFor("Uploaded image URL")),
    category: cleanOptionalText(valueFor("Category")),
    experienceNotes: cleanExperienceNotes(valueFor("Experience notes")),
    latitude: parseCoordinate(valueFor("Location latitude")),
    longitude: parseCoordinate(valueFor("Location longitude"))
  };
}

function buildDraft(
  prompt: string,
  category: CategoryChoice,
  venue: VenueChoice,
  forceSmall = false,
  details: ParsedEventDetails = {}
) {
  const title = details.title ? titleCase(details.title).slice(0, 110) : buildTitle(prompt, category);
  const isSmallEvent = forceSmall || isSmallPrompt(prompt, venue.capacity);
  const startsAt = chooseStartDate(details.dateTime ?? prompt);
  const endsAt = new Date(startsAt.getTime() + (isSmallEvent ? 2 : 3) * 60 * 60 * 1000);
  const saleStartsAt = new Date();
  const saleEndsAt = new Date(startsAt.getTime() - 60 * 60 * 1000);
  const fallbackQuantity = Math.floor(venue.capacity * (isSmallEvent ? 0.45 : 0.85));
  const requestedQuantity = details.seats ?? fallbackQuantity;
  const quantityTotal = Math.max(10, Math.min(isSmallEvent ? 80 : 5000, requestedQuantity));
  const price = details.price ?? estimatePrice(prompt, category.slug, isSmallEvent);
  const imageUrl = resolveEventImage(details.imageUrl ?? details.image, category.slug);
  const summary = isSmallEvent
    ? `${title} is a small AI-reviewed community event at ${venue.name}.`
    : `${title} is an AI-generated ${category.name.toLowerCase()} draft at ${venue.name}, prepared for organizer review.`;
  const description = buildExperienceDescription({
    title,
    category,
    venue,
    isSmallEvent,
    startsAt,
    quantityTotal,
    price,
    notes: details.experienceNotes,
    imageDirection: details.image
  });

  return {
    title,
    summary,
    description,
    startsAt,
    endsAt,
    saleStartsAt,
    saleEndsAt,
    isSmallEvent,
    imageUrl,
    marketingCaption: `Ready for ${venue.city}: ${title}. Tickets coming soon on Tixora.`,
    marketingCaptions: [
      `Ready for ${venue.city}: ${title}. Tickets coming soon on Tixora.`,
      `${title} - ${category.name} experience at ${venue.name}.`,
      `Save the date. ${title} is being prepared on Tixora.`
    ],
    ticket: {
      name: isSmallEvent ? "Community Pass" : "General Admission",
      description: isSmallEvent ? "Single-entry small event pass." : "Standard entry ticket.",
      price,
      quantityTotal
    },
    estimatedAudience: Math.floor(quantityTotal * 0.72),
    audienceEstimate: {
      expectedAttendance: Math.floor(quantityTotal * 0.72),
      capacity: venue.capacity,
      confidence: "medium"
    },
    pricingEstimate: {
      currency: "MNT",
      suggestedBasePrice: price,
      minPrice: Math.round(price * 0.82),
      maxPrice: Math.round(price * 1.25),
      rationale: price === 0 ? "Free community event requested by the creator." : "Estimated from category, event size, and venue capacity."
    },
    suggestions: {
      reviewRequired: isSmallEvent
        ? ["venue/date accuracy", "community rules", "safety notes"]
        : ["event artwork", "final date/time", "venue availability", "ticket quantity", "legal/safety notes"],
      artworkDirection: details.image,
      nextStep: isSmallEvent
        ? "Event is AI-reviewed and published as a small community event."
        : "Open the draft from organizer dashboard and submit after review."
    },
    safetyNotes: isSmallEvent
      ? "AI-reviewed small community event. One ticket per user; resale disabled."
      : "AI draft only. Organizer must verify all claims, availability, pricing, and venue details before publishing."
  };
}

function buildTitle(prompt: string, category: CategoryChoice) {
  const cleaned = prompt
    .replace(/\b(create|generate|make|uusge|event|draft|please|ai)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s'&-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length >= 4) {
    return titleCase(cleaned).slice(0, 110);
  }

  if (category.slug === "music") return "Tixy Live Night";
  if (category.slug === "sports") return "Tixy Arena Match";
  if (category.slug === "comedy") return "Tixy Comedy Night";
  if (category.slug === "festival") return "Tixy Weekend Festival";
  if (category.slug === "conference") return "Tixy Creator Summit";
  return "Tixy Community Event";
}

function chooseStartDate(prompt: string) {
  const normalized = prompt.toLowerCase();
  const date = new Date();
  date.setMinutes(0, 0, 0);

  const monthDay = normalized.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ t,]+(\d{1,2})(?::(\d{2}))?)?\b/);
  if (monthDay) {
    const parsed = new Date(
      Number(monthDay[1]),
      Number(monthDay[2]) - 1,
      Number(monthDay[3]),
      Number(monthDay[4] ?? 19),
      Number(monthDay[5] ?? 0),
      0,
      0
    );
    if (!Number.isNaN(parsed.getTime()) && parsed > new Date()) return parsed;
  }

  if (normalized.includes("tomorrow")) date.setDate(date.getDate() + 1);
  else if (normalized.includes("weekend")) date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7 || 7));
  else date.setDate(date.getDate() + 14);

  date.setHours(normalized.includes("morning") ? 10 : normalized.includes("afternoon") ? 15 : 19);
  return date;
}

function estimatePrice(prompt: string, categorySlug: string, isSmallEvent: boolean) {
  if (isFreeText(prompt)) {
    return 0;
  }

  const priceMatch = prompt.match(/(\d{1,3}(?:,\d{3})+|\d{4,7})\s*(₮|mnt|tug| tugrug)?/i);
  if (priceMatch) {
    return Math.max(0, Number(priceMatch[1].replace(/,/g, "")));
  }

  if (isSmallEvent) return 25000;
  if (categorySlug === "conference") return 80000;
  if (categorySlug === "music") return 60000;
  if (categorySlug === "festival") return 70000;
  if (categorySlug === "sports") return 45000;
  return 35000;
}

function parsePositiveInteger(value?: string) {
  if (!value) return undefined;
  const match = value.replace(/,/g, "").match(/\d+/);
  if (!match) return undefined;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseTicketPrice(value?: string) {
  if (!value) return undefined;
  if (isFreeText(value)) return 0;
  return parsePositiveInteger(value);
}

function parseCoordinate(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanOptionalText(value?: string) {
  const cleaned = value?.trim();
  if (!cleaned || cleaned.toLowerCase() === "undefined") return undefined;
  return cleaned;
}

function cleanExperienceNotes(value?: string) {
  const cleaned = cleanOptionalText(value);
  if (!cleaned || cleaned.toLowerCase() === "auto") return undefined;
  return cleaned;
}

function isFreeText(value: string) {
  const normalized = value.toLowerCase();
  return ["free", "unegui", "unetei bish", "0", "0₮", "0 tugrug", "0 mnt", "үнэгүй"].some((word) =>
    normalized.includes(word)
  );
}

function inferCity(value?: string) {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("darkhan")) return "Darkhan";
  if (normalized.includes("erdenet")) return "Erdenet";
  if (normalized.includes("ulaanbaatar") || normalized.includes("ub")) return "Ulaanbaatar";
  return "Ulaanbaatar";
}

function isSmallPrompt(prompt: string, venueCapacity: number) {
  const normalized = prompt.toLowerCase();
  return venueCapacity <= 250 || ["small", "community", "meetup", "workshop", "private", "intimate"].some((word) => normalized.includes(word));
}

function imageForCategory(slug: string) {
  const map: Record<string, string> = {
    music: "/uploads/2.jpg",
    sports: "/uploads/1.jpg",
    comedy: "/uploads/4.jpg",
    festival: "/uploads/5.jpg",
    conference: "/uploads/3.jpg",
    "theater-arts": "/uploads/3.jpg"
  };

  return map[slug] ?? "/uploads/1.jpg";
}

function resolveEventImage(image: string | undefined, categorySlug: string) {
  if (!image) return imageForCategory(categorySlug);
  if (/^(https?:\/\/|\/)/i.test(image)) return image;
  return imageForCategory(categorySlug);
}

function buildExperienceDescription(input: {
  title: string;
  category: CategoryChoice;
  venue: VenueChoice;
  isSmallEvent: boolean;
  startsAt: Date;
  quantityTotal: number;
  price: number;
  notes?: string;
  imageDirection?: string;
}) {
  const dateLabel = input.startsAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ulaanbaatar"
  });
  const priceLabel = input.price === 0 ? "Free entry" : `${input.price.toLocaleString("en-US")} MNT`;
  const notes = input.notes
    ? `Creator notes: ${input.notes}`
    : `Expect a focused ${input.category.name.toLowerCase()} experience built for a small, local audience.`;
  const imageLine = input.imageDirection ? `Visual direction: ${input.imageDirection}` : null;

  return [
    `${input.title} is an AI-polished community event experience at ${input.venue.name}, ${input.venue.city}.`,
    notes,
    `What to expect: clear entry flow, a friendly host-led format, and a compact capacity of ${input.quantityTotal} ticket${input.quantityTotal === 1 ? "" : "s"}.`,
    `When and where: ${dateLabel} at ${input.venue.name}.`,
    `Ticketing: ${priceLabel}. ${input.isSmallEvent ? "One ticket per user and resale is disabled for this community event." : "Ticket limits and resale rules follow organizer settings."}`,
    imageLine,
    "Please arrive with your QR ticket ready for scanning."
  ]
    .filter(Boolean)
    .join("\n\n");
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function createUniqueEventSlug(tx: Prisma.TransactionClient, title: string) {
  const baseSlug = slugify(title) || "tixy-ai-event";
  let slug = baseSlug;
  let index = 1;

  while (await tx.event.findUnique({ where: { slug }, select: { id: true } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return slug;
}

async function getOrCreateCommunityHostProfile(tx: Prisma.TransactionClient, userId: number, fullName: string) {
  const existing = await tx.organizerProfile.findUnique({
    where: { userId }
  });

  if (existing) {
    return existing;
  }

  const companyName = `${fullName || "Tixora User"} Community`;
  return tx.organizerProfile.create({
    data: {
      userId,
      companyName,
      slug: await createUniqueOrganizerProfileSlug(tx, companyName),
      description: "AI-reviewed community event host profile.",
      status: OrganizerStatus.APPROVED,
      approvedAt: new Date()
    }
  });
}

async function createUniqueOrganizerProfileSlug(tx: Prisma.TransactionClient, companyName: string) {
  const baseSlug = slugify(companyName) || "community-host";
  let slug = baseSlug;
  let index = 1;

  while (await tx.organizerProfile.findUnique({ where: { slug }, select: { id: true } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return slug;
}

function hashPrompt(prompt: string) {
  let hash = 5381;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) + hash + prompt.charCodeAt(i)) | 0;
  }
  return `tixy-${(hash >>> 0).toString(16)}`;
}

function estimateTokens(prompt: string, description: string) {
  return Math.ceil((prompt.length + description.length) / 4);
}
