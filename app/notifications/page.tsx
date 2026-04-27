import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureReminderNotifications,
  getUnreadNotificationsCount,
  getUserNotifications,
  markAllNotificationsRead
} from "@/lib/notifications";
import { formatDateTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const isPreview = !user;

  if (user) {
    await ensureReminderNotifications(user.id);
  }

  const [notifications, unreadCount] = user
    ? await Promise.all([
        getUserNotifications(user.id),
        getUnreadNotificationsCount(user.id)
      ])
    : [getPreviewNotifications(), getPreviewNotifications().filter((item) => !item.isRead).length];

  async function markReadAction() {
    "use server";
    if (!user) {
      return;
    }

    await markAllNotificationsRead(user.id);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,#050505_0%,#090909_100%)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Notifications</p>
              <h1 className="mt-3 font-serif text-5xl text-white">Your updates</h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-white/65">
                {isPreview
                  ? "Demo preview for how Tixora notifications will look when users receive ticket and event updates."
                  : "Ticket orders, QR scan confirmations, 24-hour reminders, and 30-minute event updates all show up here."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">Unread</p>
                <p className="mt-4 font-serif text-5xl text-white">{unreadCount}</p>
                <p className="mt-2 text-sm text-white/55">New updates waiting for you</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">Total</p>
                <p className="mt-4 font-serif text-5xl text-white">{notifications.length}</p>
                <p className="mt-2 text-sm text-white/55">
                  {isPreview ? "Preview notification cards" : "Stored app notifications"}
                </p>
              </div>
            </div>

            {isPreview ? (
              <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">Preview mode</p>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  This page is currently showing sample notifications for presentation/demo
                  purposes.
                </p>
              </div>
            ) : (
              <form action={markReadAction}>
                <Button type="submit" variant="secondary" className="w-full">
                  Mark all as read
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">Empty</p>
                <h2 className="mt-3 font-serif text-3xl text-white">No notifications yet</h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  When you order tickets, get checked in, or your event gets close, updates will
                  appear here.
                </p>
              </div>
            ) : null}

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="group rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="flex gap-4">
                    <div className="mt-1 flex flex-col items-center">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          notification.isRead ? "bg-white/25" : "bg-white"
                        }`}
                      />
                      <span className="mt-3 h-full min-h-16 w-px bg-white/10" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/55">
                          {notification.channel}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/75">
                          {formatType(notification.type)}
                        </span>
                        {!notification.isRead ? (
                          <span className="rounded-full bg-white px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-black">
                            New
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-white">
                          {notification.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                      {formatDateTime(notification.createdAt)}
                    </p>
                    <p className="text-sm text-white/55">
                      {notification.isRead ? "Read" : "Unread"}
                    </p>
                    {notification.actionUrl ? (
                      <a
                        href={notification.actionUrl}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatType(type: string) {
  return type.replaceAll("_", " ");
}

function getPreviewNotifications() {
  return [
    {
      id: "preview-order-created",
      channel: "APP",
      type: "ORDER_CREATED",
      title: "Ticket order confirmed",
      message: "Your order for 2 VIP tickets to Summer Lights Festival was created successfully.",
      actionUrl: "/events",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "preview-checked-in",
      channel: "APP",
      type: "QR_CHECKED_IN",
      title: "QR scanned at entry",
      message: "Your ticket for Summit Finals 2026 was scanned successfully at the venue gate.",
      actionUrl: "/tickets",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 18),
      updatedAt: new Date(Date.now() - 1000 * 60 * 18)
    },
    {
      id: "preview-reminder-24h",
      channel: "APP",
      type: "EVENT_REMINDER_24H",
      title: "Event starts tomorrow",
      message: "City Laughs Comedy Night starts in less than 24 hours. Get ready.",
      actionUrl: "/events",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
    },
    {
      id: "preview-ending-30m",
      channel: "APP",
      type: "EVENT_ENDING_30M",
      title: "Event ending in 30 minutes",
      message: "Tech Vision Conference will end in about 30 minutes.",
      actionUrl: "/events",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45)
    }
  ];
}
