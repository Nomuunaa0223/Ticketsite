"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const quickPrompts = [
  "Transparent fee tailbarla",
  "Sports ticket olohod tusal",
  "Notification yaaj irne?",
  "Organizer dashboard yamar ve?"
];

type Message = {
  role: "assistant" | "user";
  text: string;
};

export function AiAgentDemoBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Sain baina uu, bi Tixora assistant. Event, fee, resale, notification talaar asuuj bolno."
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

    return "Ta Tixora deer baina. Ticket, organizer, resale, notification talaar asuuj bolno.";
  }, [pathname]);

  if (shouldHide) {
    return null;
  }

  function buildReply(prompt: string) {
    const normalized = prompt.toLowerCase();

    if (normalized.includes("fee")) {
      return "Tixora deer fee nuugdmal bish. Ticket une, service fee, resale buyer fee gej yalgaj haruulna.";
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

    return `${pageHint} Hervee husvel bi fee, notifications, resale, esvel organizer tools-iig iluu todorhoi tailbarlaj ogyo.`;
  }

  function sendPrompt(prompt: string) {
    const value = prompt.trim();
    if (!value) {
      return;
    }

    setIsOpen(true);
    setMessages((current) => [
      ...current,
      { role: "user", text: value },
      { role: "assistant", text: buildReply(value) }
    ]);
    setInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendPrompt(input);
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-end justify-end sm:bottom-8 sm:right-8">
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        {isOpen ? (
          <div className="w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/95 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,#0c75e6_0%,#66b8ff_100%)] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Tixora AI Chat</p>
                  <p className="mt-1 text-xs leading-6 text-white/80">{pageHint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
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
                        ? "bg-white/8 text-white"
                        : "ml-auto bg-[linear-gradient(135deg,#0c75e6_0%,#66b8ff_100%)] text-white"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendPrompt(prompt)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
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
                  className="w-full resize-none rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-white/45">Demo assistant preview</p>
                  <button
                    type="submit"
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Open Tixora AI chat"
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-black shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition hover:scale-105"
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#0c75e6_0%,#1d8fff_38%,#66b8ff_100%)] p-[3px]">
            <span className="block h-full w-full rounded-full bg-black" />
          </span>
          <span className="relative z-10 text-3xl font-semibold leading-none text-white transition group-hover:text-white">
            ?
          </span>
        </button>
      </div>
    </div>
  );
}
