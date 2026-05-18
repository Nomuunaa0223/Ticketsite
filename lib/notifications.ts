import {
  NotificationChannel,
  NotificationType,
  Prisma,
  type Notification
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  channel?: NotificationChannel;
  eventId?: number;
  ticketId?: number;
  orderId?: number;
  dedupeKey?: string;
};

export async function createUserNotification(input: NotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: input.channel ?? NotificationChannel.APP,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        eventId: input.eventId,
        ticketId: input.ticketId,
        orderId: input.orderId,
        dedupeKey: input.dedupeKey
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }

    console.error("Failed to create notification", error);
    return null;
  }
}

export async function getUnreadNotificationsCount(userId: number) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}

export async function getUserNotifications(userId: number) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function markAllNotificationsRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

export async function notifyAllUsersOfNewEvent(input: {
  eventId: number;
  eventTitle: string;
  eventSlug: string;
  category: string;
}) {
  const users = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE" },
    select: { id: true },
  });

  const BATCH = 50;
  for (let i = 0; i < users.length; i += BATCH) {
    await Promise.all(
      users.slice(i, i + BATCH).map((user) =>
        createUserNotification({
          userId: user.id,
          type: NotificationType.NEW_EVENT,
          title: "Шинэ event нэмэгдлээ!",
          message: `${input.category} · ${input.eventTitle} — Тасалбар авах боломжтой болоод байна.`,
          actionUrl: `/events/${input.eventSlug}`,
          eventId: input.eventId,
          dedupeKey: `event:${input.eventId}:new:user:${user.id}`,
        })
      )
    );
  }
}

export async function notifyAdminsOfEventSubmitted(input: {
  eventId: number;
  eventTitle: string;
  organizerName: string;
}) {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      status: "ACTIVE"
    },
    select: { id: true }
  });

  await Promise.all(
    admins.map((admin) =>
      createUserNotification({
        userId: admin.id,
        type: NotificationType.EVENT_SUBMITTED,
        title: "New event submitted",
        message: `${input.organizerName} created ${input.eventTitle}. Review it before publishing.`,
        actionUrl: `/dashboard/admin/events/${input.eventId}`,
        eventId: input.eventId,
        dedupeKey: `event:${input.eventId}:submitted:admin:${admin.id}`
      })
    )
  );
}

export async function ensureReminderNotifications(userId: number) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      currentOwnerId: userId,
      status: {
        in: ["ACTIVE", "CHECKED_IN"]
      }
    },
    include: {
      event: true
    }
  });

  const uniqueEvents = Array.from(
    new Map(tickets.map((ticket) => [ticket.eventId, ticket.event])).values()
  );

  await Promise.all(
    uniqueEvents.flatMap((event) => {
      const jobs: Promise<Notification | null>[] = [];

      if (event.startsAt > now && event.startsAt <= in24Hours) {
        jobs.push(
          createUserNotification({
            userId,
            type: NotificationType.EVENT_REMINDER_24H,
            title: "Event reminder",
            message: `${event.title} starts within 24 hours.`,
            actionUrl: `/events/${event.slug}`,
            eventId: event.id,
            dedupeKey: `event:${event.id}:reminder-24h:user:${userId}`
          })
        );
      }

      if (event.endsAt > now && event.endsAt <= in30Minutes) {
        jobs.push(
          createUserNotification({
            userId,
            type: NotificationType.EVENT_ENDING_30M,
            title: "Event ending soon",
            message: `${event.title} will end in about 30 minutes.`,
            actionUrl: `/events/${event.slug}`,
            eventId: event.id,
            dedupeKey: `event:${event.id}:ending-30m:user:${userId}`
          })
        );
      }

      return jobs;
    })
  );
}
