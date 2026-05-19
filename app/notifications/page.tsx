import Link from "next/link";
import type { Notification } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { getCurrentLang } from "@/lib/i18n-server";
import { ensureReminderNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { NotificationsAutoRead } from "@/components/notifications/notifications-auto-read";

const PAGE_SIZE = 9;
const MAX_PAGE_LINKS = 5;


type NotificationsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await requireUser();
  const lang = await getCurrentLang();
  const labels = lang === "mn"
    ? {
        title: "Мэдэгдэл",
        new: "шинэ",
        markAllRead: "Бүгдийг уншсан болгох",
        empty: "Одоогоор мэдэгдэл байхгүй байна.",
        view: "Харах",
        unread: "Шинэ"
      }
    : {
        title: "Notifications",
        new: "new",
        markAllRead: "Mark all read",
        empty: "No notifications yet.",
        view: "View",
        unread: "New"
      };
  await ensureReminderNotifications(user.id);

  const requestedPage = getPage((await searchParams).page);
  const [totalNotifications, unreadCount] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalNotifications / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });
  const notificationContext = await getNotificationContext(notifications);

  async function markAllRead() {
    "use server";
    await markAllNotificationsRead(user.id);
  }

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <NotificationsAutoRead unreadCount={unreadCount} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="mt-1 font-goldman text-2xl font-bold text-white sm:ml-16 sm:text-3xl">{labels.title}</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 ? (
              <span className="rounded-full bg-[#ff7224]/15 px-3 py-1 text-xs font-bold text-[#ff7224]">
                {unreadCount} {labels.new}
              </span>
            ) : null}
            {unreadCount > 0 ? (
              <form action={markAllRead}>
                <button type="submit" className="rounded-xl bg-white/[0.05] px-4 py-2 text-xs font-bold text-white/50 transition hover:bg-white/10 hover:text-white">
                  {labels.markAllRead}
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {totalNotifications === 0 ? (
          <EmptyState label={labels.empty} />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {notifications.map((notification, index) => {
                const eventData = notification.eventId ? notificationContext.events.get(notification.eventId) : null;
                const eventImage = eventData?.cardImageUrl ?? eventData?.imageUrl ?? null;
                return (
                  <NotificationCard
                    key={notification.id}
                    index={totalNotifications - (currentPage - 1) * PAGE_SIZE - index}
                    notification={withTranslatedCopy(notification, notificationContext, lang)}
                    viewLabel={labels.view}
                    unreadLabel={labels.unread}
                    eventImage={eventImage}
                  />
                );
              })}
            </div>
            <NotificationPagination currentPage={currentPage} totalPages={totalPages} />
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/[0.03] py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-white/20">
        <BellIcon className="h-7 w-7" />
      </div>
      <p className="text-sm text-white/30">{label}</p>
    </div>
  );
}

type NotificationCardProps = {
  index: number;
  viewLabel: string;
  unreadLabel: string;
  eventImage?: string | null;
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    actionUrl: string | null;
    eventId: number | null;
    isRead: boolean;
    createdAt: Date;
  };
};

function NotificationCard({ index, notification, viewLabel, unreadLabel, eventImage }: NotificationCardProps) {
  const cardClassName = `group relative flex min-h-72 flex-col overflow-hidden rounded-2xl border border-transparent transition-all duration-200 ${
    notification.isRead
      ? "bg-[#0d1017] hover:scale-[1.025] hover:border-transparent"
      : "bg-[#ff7224]/[0.08] hover:scale-[1.025] hover:border-transparent"
  }`;
  const cardContent = (
    <>
      <div className="relative -mb-px h-32 overflow-hidden bg-[#0d1017]">
        {eventImage ? (
          <img
            src={eventImage}
            alt="event"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-white/[0.03]">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${getIconStyle(notification.type)}`}>
              {renderIcon(notification.type)}
            </div>
          </div>
        )}
        <div className="absolute -bottom-px inset-x-0 top-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/55 to-transparent" />
        <div className="absolute -bottom-px inset-x-0 h-3 bg-[#0d1017]" />
        <span className="absolute left-3 top-3 flex h-10 min-w-10 items-center justify-center rounded-full border border-white/30 bg-[#ff7224] px-3 text-sm font-black text-white shadow-[0_8px_24px_rgba(255,114,36,0.45)]">
          {index}
        </span>
        {!notification.isRead ? (
          <span className="absolute right-3 top-3 rounded-full bg-[#ff7224] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white">
            {unreadLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className={`text-sm font-semibold leading-5 ${notification.isRead ? "text-white/72" : "text-white"}`}>
          {notification.title}
        </p>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/42">
          {notification.message}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-[0.65rem] text-white/25">{formatDateTime(notification.createdAt)}</span>
          {notification.actionUrl ? (
            <span className="rounded-full bg-[#ff7224]/15 px-3 py-1.5 text-xs font-black text-[#ff7224] transition group-hover:bg-[#ff7224] group-hover:text-white">
              {viewLabel}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl as never} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClassName}>
      {cardContent}
    </div>
  );
}

function NotificationPagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - MAX_PAGE_LINKS + 1));
  const pages = Array.from({ length: Math.min(MAX_PAGE_LINKS, totalPages) }, (_, index) => startPage + index);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Notifications pagination">
      {pages.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={`/notifications?page=${pageNumber}` as never}
          className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
            pageNumber === currentPage
              ? "bg-[#ff7224] text-white"
              : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
          }`}
        >
          {pageNumber}
        </Link>
      ))}
    </nav>
  );
}

type NotificationContext = Awaited<ReturnType<typeof getNotificationContext>>;

async function getNotificationContext(notifications: Notification[]) {
  const eventIds = uniqueIds(notifications.map((notification) => notification.eventId));
  const ticketIds = uniqueIds(notifications.map((notification) => notification.ticketId));
  const orderIds = uniqueIds(notifications.map((notification) => notification.orderId));

  const [events, tickets, orders] = await Promise.all([
    eventIds.length
      ? prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, title: true, slug: true, startsAt: true, endsAt: true, cardImageUrl: true, imageUrl: true }
        })
      : [],
    ticketIds.length
      ? prisma.ticket.findMany({
          where: { id: { in: ticketIds } },
          include: {
            event: { select: { title: true, slug: true } },
            ticketType: { select: { name: true } }
          }
        })
      : [],
    orderIds.length
      ? prisma.order.findMany({
          where: { id: { in: orderIds } },
          include: {
            event: { select: { title: true, slug: true } },
            items: { include: { ticketType: { select: { name: true } } } }
          }
        })
      : []
  ]);

  return {
    events: new Map(events.map((event) => [event.id, event])),
    tickets: new Map(tickets.map((ticket) => [ticket.id, ticket])),
    orders: new Map(orders.map((order) => [order.id, order]))
  };
}

function withTranslatedCopy(notification: Notification, context: NotificationContext, lang: "en" | "mn") {
  const ticket = notification.ticketId ? context.tickets.get(notification.ticketId) : null;
  const event = notification.eventId ? context.events.get(notification.eventId) : null;
  const order = notification.orderId ? context.orders.get(notification.orderId) : null;
  const ticketEventTitle = ticket?.event.title ?? event?.title ?? order?.event.title ?? "Event";
  const ticketTypeName = ticket?.ticketType.name ?? order?.items[0]?.ticketType.name ?? "Ticket";
  const orderSummary = order?.items.length
    ? order.items.map((item) => `${item.quantity} ${item.ticketType.name}`).join(", ")
    : ticketTypeName;
  const dedupeKey = notification.dedupeKey ?? "";

  if (dedupeKey.startsWith("resale:") && dedupeKey.endsWith(":created")) {
    return {
      ...notification,
      title: lang === "mn" ? "Resale жагсаалт үүслээ" : "Resale listing created",
      message: lang === "mn"
        ? `${ticketEventTitle} - ${ticketTypeName} тасалбар дахин худалдаанд гарлаа.`
        : `${ticketEventTitle} - ${ticketTypeName} ticket is now listed for resale.`
    };
  }

  if (dedupeKey.startsWith("resale:") && dedupeKey.endsWith(":buyer")) {
    return {
      ...notification,
      title: lang === "mn" ? "Ticket таны profile руу шилжлээ" : "Ticket moved to your profile",
      message: lang === "mn"
        ? `${ticketEventTitle} - ${ticketTypeName} ticket таны эзэмшилд орлоо.`
        : `${ticketEventTitle} - ${ticketTypeName} ticket is now yours.`
    };
  }

  if (dedupeKey.startsWith("resale:") && dedupeKey.endsWith(":seller")) {
    return {
      ...notification,
      title: lang === "mn" ? "Таны ticket зарагдлаа" : "Your ticket was sold",
      message: lang === "mn"
        ? `${ticketEventTitle} - ${ticketTypeName} ticket шинэ эзэмшигч рүү шилжлээ.`
        : `${ticketEventTitle} - ${ticketTypeName} ticket was transferred to the new owner.`
    };
  }

  if (notification.type === "ORDER_CREATED" && order) {
    return {
      ...notification,
      title: lang === "mn" ? "Тасалбар амжилттай авлаа" : "Ticket purchase complete",
      message: lang === "mn"
        ? `${order.event.title} - ${orderSummary} тасалбар таны эзэмшилд орлоо.`
        : `${order.event.title} - ${orderSummary} ticket is now in your profile.`
    };
  }

  if (notification.type === "QR_CHECKED_IN") {
    return {
      ...notification,
      title: lang === "mn" ? "Ticket check-in хийгдлээ" : "Ticket checked in",
      message: lang === "mn"
        ? `${ticketEventTitle} event-ийн ticket амжилттай уншигдлаа.`
        : `Your ticket for ${ticketEventTitle} was scanned successfully.`
    };
  }

  if (notification.type === "EVENT_REMINDER_24H") {
    const daysUntilStart = event ? Math.ceil((event.startsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isSevenDayReminder = dedupeKey.endsWith(":reminder-7d") && daysUntilStart && daysUntilStart > 1;
    return {
      ...notification,
      title: lang === "mn"
        ? isSevenDayReminder ? `Event ${daysUntilStart} хоногийн дараа` : "Event сануулга"
        : isSevenDayReminder ? `Event in ${daysUntilStart} days` : "Event reminder",
      message: lang === "mn"
        ? isSevenDayReminder
          ? `${ticketEventTitle} ${daysUntilStart} хоногийн дараа эхэлнэ. Бэлдэж эхлээрэй.`
          : `${ticketEventTitle} 24 цагийн дотор эхэлнэ.`
        : isSevenDayReminder
          ? `${ticketEventTitle} starts in ${daysUntilStart} days. Get ready.`
          : `${ticketEventTitle} starts within 24 hours.`
    };
  }

  if (notification.type === "EVENT_ENDING_30M") {
    return {
      ...notification,
      title: lang === "mn" ? "Event удахгүй дуусна" : "Event ending soon",
      message: lang === "mn"
        ? `${ticketEventTitle} ойролцоогоор 30 минутын дараа дуусна.`
        : `${ticketEventTitle} will end in about 30 minutes.`
    };
  }

  if (notification.type === "EVENT_SUBMITTED" && event) {
    return {
      ...notification,
      title: lang === "mn" ? "Шинэ event үүслээ" : "New event submitted",
      message: lang === "mn"
        ? `${event.title} event-ийг хэнаж нийтлэх шаардлагатай.`
        : `${event.title} is ready for admin review.`
    };
  }

  if (notification.type === "TICKET_SOLD") {
    return {
      ...notification,
      title: lang === "mn" ? "Тасалбар амжилттай зарагдлаа!" : "Your ticket was sold!",
      message: lang === "mn"
        ? `${ticketEventTitle} — ${ticketTypeName} тасалбар шинэ эзэмшигч рүү шилжсэн. Хуучин QR код хүчингүй болсон.`
        : `${ticketEventTitle} — ${ticketTypeName} ticket transferred to the new owner. Old QR code is now invalid.`
    };
  }

  if (notification.type === "NEW_EVENT" && event) {
    return {
      ...notification,
      title: lang === "mn" ? "Шинэ event нэмэгдлээ!" : "New event available!",
      message: lang === "mn"
        ? `${event.title} — Тасалбар авах боломжтой болоод байна.`
        : `${event.title} — Tickets are now available.`
    };
  }

  if (notification.type === "EVENT_PUBLISHED") {
    return {
      ...notification,
      title: lang === "mn" ? "Таны event нийтлэгдлээ!" : "Your event is live!",
      message: lang === "mn"
        ? `${ticketEventTitle} амжилттай нийтлэгдж, хэрэглэгчид харах боломжтой боллоо.`
        : `${ticketEventTitle} is now published and visible to users.`
    };
  }

  if (notification.type === "EVENT_REJECTED") {
    return {
      ...notification,
      title: lang === "mn" ? "Event татгалзагдлаа" : "Event rejected",
      message: lang === "mn"
        ? `${ticketEventTitle} event татгалзагдлаа.`
        : `${ticketEventTitle} was not approved.`
    };
  }

  return notification;
}

function uniqueIds(values: Array<number | null>) {
  return Array.from(new Set(values.filter((value): value is number => typeof value === "number")));
}

function getPage(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number(rawValue ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}


function getIconStyle(type: string) {
  if (type === "ORDER_CREATED") return "bg-emerald-500/10 text-emerald-400";
  if (type === "QR_CHECKED_IN") return "bg-blue-500/10 text-blue-400";
  if (type === "EVENT_REMINDER_24H") return "bg-[#ff7224]/10 text-[#ff7224]";
  if (type === "EVENT_ENDING_30M") return "bg-amber-500/10 text-amber-400";
  if (type === "EVENT_SUBMITTED") return "bg-violet-500/10 text-violet-300";
  if (type === "NEW_EVENT") return "bg-[#ff7224]/10 text-[#ff7224]";
  if (type === "EVENT_PUBLISHED") return "bg-emerald-500/10 text-emerald-400";
  if (type === "EVENT_REJECTED") return "bg-red-500/10 text-red-400";
  return "bg-purple-500/10 text-purple-400";
}

function renderIcon(type: string) {
  if (type === "ORDER_CREATED") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" strokeLinecap="round" />
        <path d="M12 6v12M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "QR_CHECKED_IN") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m15 15 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "EVENT_REMINDER_24H" || type === "EVENT_ENDING_30M") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d={type === "EVENT_REMINDER_24H" ? "M12 7v5l3 2" : "M12 7v5l-3 2"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "EVENT_SUBMITTED") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 4h14v16H5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 8h8M8 12h5M8 16h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "TICKET_SOLD") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "NEW_EVENT" || type === "EVENT_PUBLISHED") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6v12M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "EVENT_REJECTED") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return <BellIcon className="h-5 w-5" />;
}

function BellIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" />
      <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" />
    </svg>
  );
}
