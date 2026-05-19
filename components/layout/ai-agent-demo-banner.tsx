"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const quickPrompts = [
  "AI event draft uusge",
  "Fee tailbarla",
  "Resale yaj ajillah ve?",
  "QR scan yamar ve?"
];

type Message = {
  role: "assistant" | "user";
  text: string;
  actionUrl?: string;
  actionLabel?: string;
};

export function AiAgentDemoBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Sain baina uu, bi Tixy Ai. Event, ticket, fee, resale, QR scan talaar asuuhad belen baina."
    }
  ]);

  const shouldHide = pathname === "/" || pathname === "/login";

  const pageHint = useMemo(() => {
    if (pathname.startsWith("/events")) {
      return "Ta events hesegt baina. Bi category, ticket, fee, resale availability tailbarlaj chadna.";
    }

    if (pathname.startsWith("/sell")) {
      return "Ta sell hesegt baina. Resale rule, ownership, cap pricing talaar asuuj bolno.";
    }

    if (pathname.startsWith("/notifications")) {
      return "Ta notifications hesegt baina. Zahialga, QR scan, 24 tsag, 30 minutyn sanuulga yaar irdegiig tailbarlaj ogno.";
    }

    if (pathname.startsWith("/dashboard")) {
      return "Ta dashboard hesegt baina. Organizer, moderator, admin workflow talaar tusalj chadna.";
    }

    return "Ta Tixora deer baina. Ticket, organizer, resale, notification talaar Tixy Ai-aas asuuj bolno.";
  }, [pathname]);

  if (shouldHide) {
    return null;
  }

  function buildReply(prompt: string) {
    const normalized = prompt.toLowerCase();

    if (normalized.includes("fee")) {
      return "Tixora deer fee nuugdmal bish. Ticket une, service fee, resale buyer fee gej yalgaj haruulna.";
    }

    if (normalized.includes("ticket") || normalized.includes("avah")) {
      return "Ticket avahdaa event songood ticket type, quantity esvel seat-aa songono. Daraa ni tulburuu batalgaajuulahad ticket profile deer orno.";
    }

    if (normalized.includes("sport")) {
      return "Sports event songohdoo Sports category ruu orood date, venue, resale availability-aar shuud haritsuulj bolno.";
    }

    if (normalized.includes("notif")) {
      return "Notification system ni zahialga amjilttai bolhod, QR scan hiigdhed, event ehlehees 1 udriin umnu, duusahas 30 minutiin umnu medegdeh zorilgotoi.";
    }

    if (normalized.includes("organizer") || normalized.includes("dashboard")) {
      return "Organizer dashboard deer event uusgeh, ticket type udirdah, resale rule tavih, audit visibility harah bolomjtoi.";
    }

    if (normalized.includes("resale") || normalized.includes("sell")) {
      return "Resale ni platform-controlled. Ticket bur neg current owner-toi, ownership history hadgalagddag, organizer rule daguu zaragddana.";
    }

    if (normalized.includes("qr") || normalized.includes("check")) {
      return "QR access ni ownership-based. Check-in hiih ued current owner shalgagdaj, scan hiigdsen bol notification ochino.";
    }

    return `${pageHint} Hervee husvel bi fee, notifications, resale, QR scan, esvel organizer tools-iig iluu todorhoi tailbarlaj ogyo.`;
  }

  function wantsEventDraft(prompt: string) {
    const normalized = prompt.toLowerCase();
    const hasEventWord = ["event", "арга хэмжээ", "concert", "festival", "workshop", "meeting"].some((word) =>
      normalized.includes(word)
    );
    const hasCreateWord = ["uusge", "үүсгэ", "create", "generate", "hiigeed", "хий", "draft"].some((word) =>
      normalized.includes(word)
    );

    return hasEventWord && hasCreateWord;
  }

  async function createAiEventDraft(prompt: string): Promise<Message> {
    const response = await fetch("/api/ai/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      event?: {
        title: string;
        status: string;
        category: string;
        venue: string;
        editUrl: string;
        actionUrl?: string;
        isSmallEvent?: boolean;
      };
    };

    if (!response.ok || !data.event) {
      return {
        role: "assistant",
        text: data.error ?? "Tixy Ai event draft үүсгэж чадсангүй. Organizer эрхээр нэвтэрсэн эсэхээ шалгаарай."
      };
    }

    return {
      role: "assistant",
      text: data.event.isSmallEvent && data.event.status === "PUBLISHED"
        ? `Community event AI review-ээр нийтлэгдлээ: ${data.event.title}. Category: ${data.event.category}. Venue: ${data.event.venue}. One ticket per user.`
        : `Event draft бэлэн боллоо: ${data.event.title}. Category: ${data.event.category}. Venue: ${data.event.venue}. Status: ${data.event.status}.`,
      actionUrl: data.event.actionUrl ?? data.event.editUrl,
      actionLabel: data.event.isSmallEvent && data.event.status === "PUBLISHED" ? "Event харах" : "Draft нээх"
    };
  }

  async function sendPrompt(prompt: string) {
    const value = prompt.trim();
    if (!value) {
      return;
    }

    setIsOpen(true);
    setInput("");

    if (wantsEventDraft(value)) {
      setIsGeneratingEvent(true);
      setMessages((current) => [
        ...current,
        { role: "user", text: value },
        { role: "assistant", text: "Tixy Ai event draft үүсгэж байна..." }
      ]);

      const reply = await createAiEventDraft(value);
      setMessages((current) => [...current.slice(0, -1), reply]);
      setIsGeneratingEvent(false);
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text: value },
      { role: "assistant", text: buildReply(value) }
    ]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendPrompt(input);
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-end justify-end sm:bottom-8 sm:right-8">
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        {isOpen ? (
          <div className="w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[1.4rem] border border-white/15 bg-[#050505]/95 shadow-[0_24px_70px_rgba(0,0,0,0.58)] backdrop-blur-xl">
            <div className="border-b border-white/10 bg-[#0b0b0b] px-5 py-4 shadow-[inset_0_-1px_0_rgba(250,232,154,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f6df8f]/30 bg-white p-1.5 shadow-[0_0_24px_rgba(246,223,143,0.18)]">
                    <img src="/ai.png" alt="" className="h-full w-full object-contain" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Tixy Ai</p>
                    <p className="mt-1 text-xs leading-6 text-white/70">{pageHint}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 transition hover:border-[#f6df8f]/45 hover:bg-[#f6df8f]/10 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[88%] rounded-[1.3rem] px-4 py-3 text-sm leading-7 ${
                      message.role === "assistant"
                        ? "border border-white/10 bg-white/[0.06] text-white"
                        : "ml-auto bg-white text-black"
                    }`}
                  >
                    {message.text}
                    {message.actionUrl ? (
                      <a
                        href={message.actionUrl}
                        className="mt-3 inline-flex rounded-full bg-[#f6df8f] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-white"
                      >
                        {message.actionLabel ?? "Open"}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendPrompt(prompt)}
                    disabled={isGeneratingEvent}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/85 transition hover:border-[#f6df8f]/40 hover:bg-[#f6df8f]/10 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 border-t border-white/10 pt-4">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Asuultaa bich..."
                  rows={3}
                  className="w-full resize-none rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#f6df8f]/45"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-white/45">Tixy Ai asuultand belen</p>
                  <button
                    type="submit"
                    disabled={isGeneratingEvent}
                    className="rounded-full bg-[#f6df8f] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingEvent ? "Creating" : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Open Tixy Ai chat"
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-black shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition hover:scale-105"
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#ffffff_0%,#f6df8f_54%,#ffffff_100%)] p-[2px]">
            <span className="block h-full w-full rounded-full bg-black" />
          </span>
          <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white p-2 shadow-[0_0_26px_rgba(246,223,143,0.22)]">
            <img src="/ai.png" alt="" className="h-full w-full object-contain" />
          </span>
        </button>
      </div>
    </div>
  );
}
