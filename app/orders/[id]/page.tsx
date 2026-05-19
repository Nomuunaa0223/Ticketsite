import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQRSvg } from "@/lib/qr";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) notFound();

  const user = await requireUser();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: { include: { venue: true, category: true } },
      tickets: {
        include: { ticketType: true, seat: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order || order.userId !== user.id) notFound();

  const qrSvg = await generateQRSvg(`ORDER-${order.id}`);

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-lg">

        {/* Back */}
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white/70"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Миний тасалбарууд
        </Link>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1017] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

          {/* Header stripe */}
          <div className="bg-[#ff7224] px-6 py-4">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-black/60">
              Захиалга #{order.id} · {order.event.venue.city}
            </p>
            <h1 className="mt-0.5 font-goldman text-xl font-bold leading-tight text-black">
              {order.event.title}
            </h1>
          </div>

          {/* QR section */}
          <div className="flex flex-col items-center px-8 py-8">
            <div
              className="h-52 w-52 rounded-2xl bg-white p-3 [&_svg]:h-full [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <span className="mt-4 rounded-full bg-emerald-400/14 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-emerald-300">
              Идэвхтэй
            </span>
            <p className="mt-3 text-center text-xs text-white/30">
              Энэ QR кодыг event-д орохдоо scanner-т уншуулна уу
            </p>
          </div>

          {/* Divider */}
          <div className="mx-6 border-t border-dashed border-white/[0.08]" />

          {/* Info grid */}
          <div className="mx-6 my-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.04] p-px">
            <div className="bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Огноо</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDateTime(order.event.startsAt)}</p>
            </div>
            <div className="bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Нийт дүн</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatCurrency(toNumber(order.total), order.currency)}
              </p>
            </div>
            <div className="col-span-2 bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Тасалбар</p>
              <p className="mt-1 text-sm font-semibold text-white">{order.tickets.length} ширхэг</p>
            </div>
          </div>

          {/* Ticket list */}
          <div className="mx-6 mb-6 space-y-2">
            {order.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="text-xs font-semibold text-white">{ticket.ticketType.name}</p>
                  {ticket.seat && (
                    <p className="mt-0.5 text-[0.65rem] text-white/40">Суудал: {ticket.seat.label}</p>
                  )}
                </div>
                <span className="font-mono text-[0.65rem] text-white/30">{ticket.code}</span>
              </div>
            ))}
          </div>

          {/* Order reference */}
          <div className="mx-6 mb-6 rounded-xl bg-black/30 px-4 py-3 text-center">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/25">Order reference</p>
            <p className="mt-1 font-mono text-base font-bold tracking-widest text-white/80">
              ORDER-{order.id}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
