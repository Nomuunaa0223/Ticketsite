"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type EventDraftDetails = {
  title?: string;
  venue?: string;
  dateTime?: string;
  seats?: string;
  price?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  experienceNotes?: string;
  latitude?: string;
  longitude?: string;
};

const eventDraftQuestions: Array<{
  key: keyof EventDraftDetails;
  question: string;
}> = [
  { key: "title", question: "Event-iin ner yu baih ve?" },
  { key: "venue", question: "Haana boloh ve? Venue ner, hot/district, esvel location button darj bolno." },
  { key: "dateTime", question: "Hezee boloh ve? Ognoo, tsagaa bichne uu. Jishee: 2026-06-20 19:00" },
  { key: "seats", question: "Heden suudal/ticket zarah ve? Small community event tul ihdee 80 bolgono." },
  { key: "price", question: "Neg ticket heden tugrug baih ve? Unegui bol 'free' gej bichij bolno." },
  { key: "category", question: "Yamar turliin event ve? music, sports, comedy, festival, conference, workshop geh met." },
  { key: "image", question: "Event-iin zurgiig Gallery tovchoor songono uu. Zurag songomogts bi event image bolgood daraagiin asuult ruu shiljine." },
  { key: "experienceNotes", question: "About the experience deer yu zaaval oroh ve? Sanaagaa bich, esvel 'auto' gevel Tixy Ai uuruu bolovsruulna." }
];

type Message = {
  role: "assistant" | "user";
  text: string;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
};

export function AiAgentDemoBanner() {
  const pathname = usePathname();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isAskingAgent, setIsAskingAgent] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [eventDraftDetails, setEventDraftDetails] = useState<EventDraftDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isReviewingDraft, setIsReviewingDraft] = useState(false);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Sain baina uu, bi Tixy Ai. Event, ticket, fee, resale, QR scan talaar asuuhad belen baina."
    }
  ]);

  const shouldHide = pathname === "/" || pathname === "/login";

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    messageList.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

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

  function wantsEventDraft(prompt: string) {
    const normalized = prompt.toLowerCase();
    const hasEventWord = ["event", "arga hemjee", "concert", "festival", "workshop", "meeting"].some((word) =>
      normalized.includes(word)
    );
    const hasCreateWord = ["uusge", "create", "generate", "hiigeed", "hii", "draft"].some((word) =>
      normalized.includes(word)
    );

    return hasEventWord && hasCreateWord;
  }

  function buildStructuredEventPrompt(details: EventDraftDetails) {
    return [
      "Create a USER small community event with these exact details.",
      `Event name: ${details.title}`,
      `Venue/location: ${details.venue}`,
      `Location latitude: ${details.latitude ?? ""}`,
      `Location longitude: ${details.longitude ?? ""}`,
      `Date and time: ${details.dateTime}`,
      `Ticket capacity: ${details.seats}`,
      `Ticket price MNT: ${details.price}`,
      `Uploaded image URL: ${details.imageUrl ?? ""}`,
      `Image/art direction or URL: ${details.image}`,
      `Category: ${details.category}`,
      `Experience notes: ${details.experienceNotes}`,
      "Rules: isSmallEvent=true, one ticket per user, resale disabled, AI reviewed publish."
    ].join("\n");
  }

  function buildDraftPreview(details: EventDraftDetails) {
    return [
      "Draft belen bolloo. Shalgana uu:",
      `Ner: ${details.title ?? "-"}`,
      `Location: ${details.venue ?? "-"}${details.latitude ? ` (${details.latitude}, ${details.longitude})` : ""}`,
      `Hezee: ${details.dateTime ?? "-"}`,
      `Seats: ${details.seats ?? "-"}`,
      `Une: ${details.price ?? "-"}`,
      `Category: ${details.category ?? "-"}`,
      `Image: ${details.imageUrl ? "uploaded image" : details.image ?? "-"}`,
      `About: ${details.experienceNotes && details.experienceNotes.toLowerCase() !== "auto" ? details.experienceNotes : "Tixy Ai bolovsruulna"}`,
      "Zuv bol 'uusge' gej bich. Uurchluh bol jishee ni 'une free bolgo', 'location UB Palace bolgo', 'about deer networking nem' gej bich."
    ].join("\n");
  }

  async function continueEventDraft(answer: string) {
    if (currentQuestionIndex === null || !eventDraftDetails) return;

    const currentQuestion = eventDraftQuestions[currentQuestionIndex];
    const normalizedAnswer = answer.toLowerCase().trim();
    const answerValue = currentQuestion.key === "venue" && eventDraftDetails.latitude && ["ok", "current", "location", "attached"].includes(normalizedAnswer)
      ? eventDraftDetails.venue ?? answer
      : answer;
    const nextDetails = {
      ...eventDraftDetails,
      [currentQuestion.key]: answerValue
    };

    if (currentQuestion.key === "image" && attachedImageUrl) {
      nextDetails.imageUrl = attachedImageUrl;
    }

    const nextQuestionIndex = currentQuestionIndex + 1;
    setEventDraftDetails(nextDetails);

    if (nextQuestionIndex < eventDraftQuestions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setMessages((current) => [
        ...current,
        { role: "user", text: answer },
        { role: "assistant", text: eventDraftQuestions[nextQuestionIndex].question }
      ]);
      return;
    }

    setCurrentQuestionIndex(null);
    setIsReviewingDraft(true);
    setMessages((current) => [
      ...current,
      { role: "user", text: answer },
      { role: "assistant", text: buildDraftPreview(nextDetails), imageUrl: nextDetails.imageUrl }
    ]);
  }

  function advanceImageQuestion(uploadedImageUrl: string, draftDetails = eventDraftDetails) {
    if (currentQuestionIndex === null || !draftDetails) return false;

    const currentQuestion = eventDraftQuestions[currentQuestionIndex];
    if (currentQuestion.key !== "image") return false;

    const nextDetails = {
      ...draftDetails,
      image: "Gallery image",
      imageUrl: uploadedImageUrl
    };
    const nextQuestionIndex = currentQuestionIndex + 1;
    setEventDraftDetails(nextDetails);

    if (nextQuestionIndex < eventDraftQuestions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "Zurag songogdloo. Ene zurgiig event image bolgono.", imageUrl: uploadedImageUrl },
        { role: "assistant", text: eventDraftQuestions[nextQuestionIndex].question }
      ]);
      return true;
    }

    setCurrentQuestionIndex(null);
    setIsReviewingDraft(true);
    setMessages((current) => [
      ...current,
      { role: "assistant", text: buildDraftPreview(nextDetails), imageUrl: uploadedImageUrl }
    ]);
    return true;
  }

  async function createAiEventDraft(details: EventDraftDetails): Promise<Message> {
    const response = await fetch("/api/ai/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildStructuredEventPrompt(details) })
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
        text: data.error ?? "Tixy Ai event draft uusgej chadsangui. Nevtersen eseh, event medeelelee shalgaad dahin oroldooroi."
      };
    }

    return {
      role: "assistant",
      text: data.event.isSmallEvent && data.event.status === "PUBLISHED"
        ? `Community event AI review-eer niitlegdlee: ${data.event.title}. Category: ${data.event.category}. Venue: ${data.event.venue}. One ticket per user.`
        : `Event draft belen bolloo: ${data.event.title}. Category: ${data.event.category}. Venue: ${data.event.venue}. Status: ${data.event.status}.`,
      actionUrl: data.event.actionUrl ?? data.event.editUrl,
      actionLabel: data.event.isSmallEvent && data.event.status === "PUBLISHED" ? "Event harah" : "Draft neeh",
      imageUrl: details.imageUrl
    };
  }

  async function askSupportAgent(prompt: string): Promise<Message> {
    const response = await fetch("/api/ai/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt })
    });
    const data = (await response.json().catch(() => ({}))) as {
      answer?: string;
      error?: string;
      events?: Array<{
        title: string;
        slug: string;
        startsAt?: string;
        venue?: string;
        city?: string;
        lowestPrice?: number | null;
        available?: number;
      }>;
      tickets?: Array<{
        code: string;
        event: string;
        eventSlug: string;
        startsAt?: string;
        ticketType: string;
        seat?: string | null;
      }>;
    };

    if (!response.ok) {
      return {
        role: "assistant",
        text: data.error ?? "Tixy Ai одоогоор хариулж чадсангүй. Дахин оролдоно уу."
      };
    }

    const eventLines = (data.events ?? []).slice(0, 3).map((event, index) => {
      const date = event.startsAt ? new Date(event.startsAt).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" }) : "date TBD";
      const price = typeof event.lowestPrice === "number" ? `, ${event.lowestPrice.toLocaleString("mn-MN")} MNT` : "";
      const available = typeof event.available === "number" ? `, ${event.available} үлдсэн` : "";
      return `${index + 1}. ${event.title} - ${date}${event.venue ? `, ${event.venue}` : ""}${event.city ? `, ${event.city}` : ""}${price}${available}`;
    });
    const ticketLines = (data.tickets ?? []).slice(0, 3).map((ticket, index) => {
      const date = ticket.startsAt ? new Date(ticket.startsAt).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" }) : "date TBD";
      return `${index + 1}. ${ticket.event} - ${ticket.ticketType}${ticket.seat ? `, суудал ${ticket.seat}` : ""}, ${date}, code: ${ticket.code}`;
    });
    const firstEvent = data.events?.[0];
    const firstTicket = data.tickets?.[0];

    return {
      role: "assistant",
      text: [
        data.answer ?? "Хариулт олдлоо.",
        eventLines.length ? `\nEvent санал:\n${eventLines.join("\n")}` : "",
        ticketLines.length ? `\nTicket:\n${ticketLines.join("\n")}` : ""
      ].filter(Boolean).join("\n"),
      actionUrl: firstEvent ? `/events/${firstEvent.slug}` : firstTicket ? `/tickets/${firstTicket.code}` : undefined,
      actionLabel: firstEvent ? "Event харах" : firstTicket ? "Ticket харах" : undefined
    };
  }

  async function handleDraftReview(answer: string) {
    if (!eventDraftDetails) return;

    if (isConfirmCreate(answer)) {
      setIsReviewingDraft(false);
      setEventDraftDetails(null);
      setIsGeneratingEvent(true);
      setMessages((current) => [
        ...current,
        { role: "user", text: answer },
        { role: "assistant", text: "Bayarlalaa. Tixy Ai event-iig uusgej baina..." }
      ]);

      const reply = await createAiEventDraft(eventDraftDetails);
      setMessages((current) => [...current.slice(0, -1), reply]);
      setIsGeneratingEvent(false);
      return;
    }

    const revised = reviseDraftDetails(eventDraftDetails, answer, attachedImageUrl);
    setEventDraftDetails(revised);
    setMessages((current) => [
      ...current,
      { role: "user", text: answer },
      { role: "assistant", text: buildDraftPreview(revised), imageUrl: revised.imageUrl }
    ]);
  }

  function startEventDraft(prompt: string) {
    const initialDetails: EventDraftDetails = attachedImageUrl ? { imageUrl: attachedImageUrl } : {};
    setEventDraftDetails(initialDetails);
    setCurrentQuestionIndex(0);
    setIsReviewingDraft(false);
    setMessages((current) => [
      ...current,
      { role: "user", text: prompt },
      { role: "assistant", text: "Medeelel dutuu baina. Event uusgehees umnu heregtei zuilsig neg negээр ni asuuy." },
      { role: "assistant", text: eventDraftQuestions[0].question }
    ]);
  }

  async function sendUserPrompt(prompt: string) {
    const value = prompt.trim();
    if (!value) {
      return;
    }

    setIsOpen(true);
    setInput("");

    if (currentQuestionIndex !== null) {
      await continueEventDraft(value);
      return;
    }

    if (isReviewingDraft) {
      await handleDraftReview(value);
      return;
    }

    if (wantsEventDraft(value)) {
      startEventDraft(value);
      return;
    }

    setIsAskingAgent(true);
    setMessages((current) => [
      ...current,
      { role: "user", text: value },
      { role: "assistant", text: "Tixy Ai хайж байна..." }
    ]);

    const reply = await askSupportAgent(value);
    setMessages((current) => [...current.slice(0, -1), reply]);
    setIsAskingAgent(false);
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsOpen(true);
    setIsUploadingImage(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Image upload failed.");
      }

      setAttachedImageUrl(data.url);
      const nextDetails = eventDraftDetails ? { ...eventDraftDetails, imageUrl: data.url } : null;
      setEventDraftDetails(nextDetails);
      if (advanceImageQuestion(data.url, nextDetails)) {
        return;
      }
      setMessages((current) => [
        ...current,
        { role: "user", text: `Zurag upload hiilee: ${file.name}`, imageUrl: data.url },
        { role: "assistant", text: "Zurgiig hadgallaa. Event uusgeh ued ene zurgiig event image bolgono.", imageUrl: data.url }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: error instanceof Error ? error.message : "Image upload failed." }
      ]);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function useCurrentLocation() {
    setIsOpen(true);

    if (!navigator.geolocation) {
      setMessages((current) => [...current, { role: "assistant", text: "Browser location demjihgui baina. Venue/hayagaa garaar bichne uu." }]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const venue = "Shared current location";
        const nextDetails = { ...(eventDraftDetails ?? {}), venue, latitude, longitude };
        setEventDraftDetails(nextDetails);
        setMessages((current) => [
          ...current,
          { role: "user", text: `Location shared: ${latitude}, ${longitude}` },
          { role: "assistant", text: "Location avlaa. Venue/hayag neriig nemj bichvel buur sain, esvel ene location-oor event uusgene." }
        ]);
      },
      () => {
        setMessages((current) => [...current, { role: "assistant", text: "Location avah erh olgosongui. Venue/hayagaa garaar bichne uu." }]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendUserPrompt(input);
  }

  const progressLabel = currentQuestionIndex !== null
    ? `${currentQuestionIndex + 1}/${eventDraftQuestions.length} medeelel tsugluulj baina`
    : isReviewingDraft
      ? "Draft review hiij baina"
      : attachedImageUrl
        ? "Zurag attached"
        : "Tixy Ai asuultand belen";

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex h-[min(760px,calc(100vh-2rem))] w-full max-w-[620px] flex-col overflow-hidden rounded-[1.2rem] border border-white/15 bg-[#050505]/95 shadow-[0_24px_90px_rgba(0,0,0,0.68)]">
            <div className="shrink-0 border-b border-white/10 bg-[#0b0b0b] px-4 py-4 shadow-[inset_0_-1px_0_rgba(250,232,154,0.08)] sm:px-5">
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

            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
              <div ref={messageListRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[92%] whitespace-pre-line break-words rounded-[1.1rem] px-4 py-3 text-sm leading-7 sm:max-w-[86%] ${
                      message.role === "assistant"
                        ? "border border-white/10 bg-white/[0.06] text-white"
                        : "ml-auto bg-white text-black"
                    }`}
                  >
                    {message.imageUrl ? (
                      <img src={message.imageUrl} alt="" className="mb-3 aspect-video w-full rounded-xl object-cover" />
                    ) : null}
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

              <form onSubmit={handleSubmit} className="mt-4 shrink-0 space-y-3 border-t border-white/10 pt-4">
                {attachedImageUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                    <img src={attachedImageUrl} alt="" className="h-12 w-16 rounded-xl object-cover" />
                    <p className="min-w-0 flex-1 truncate text-xs text-white/65">Attached event image</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImageUrl(null);
                        setEventDraftDetails((current) => current ? { ...current, imageUrl: undefined } : current);
                      }}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-[#f6df8f]/45 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}

                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={isReviewingDraft ? "Uurchluh zuilee bich esvel 'uusge'..." : currentQuestionIndex !== null ? "Hariultaa bich..." : "Asuultaa bich..."}
                  rows={2}
                  className="max-h-28 w-full resize-none rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#f6df8f]/45"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-[#f6df8f]/45 hover:bg-[#f6df8f]/10 hover:text-white">
                    {isUploadingImage ? "Uploading" : "Gallery"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleImageUpload(event)}
                      disabled={isUploadingImage || isGeneratingEvent}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={isGeneratingEvent}
                    className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-[#f6df8f]/45 hover:bg-[#f6df8f]/10 hover:text-white disabled:opacity-60"
                  >
                    Location
                  </button>
                  <p className="ml-auto max-w-[12rem] truncate text-xs text-white/45">{progressLabel}</p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isGeneratingEvent || isUploadingImage || isAskingAgent}
                    className="rounded-full bg-[#f6df8f] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingEvent ? "Creating" : isAskingAgent ? "Asking" : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-end justify-end sm:bottom-8 sm:right-8">
        <div className="pointer-events-auto flex flex-col items-end gap-4">
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
    </>
  );
}

function isConfirmCreate(value: string) {
  const normalized = value.toLowerCase().trim();
  return ["uusge", "create", "ok", "yes", "zuv", "bolno", "publish", "niitlii", "үүсгэ", "болно"].some((word) =>
    normalized.includes(word)
  );
}

function reviseDraftDetails(details: EventDraftDetails, instruction: string, attachedImageUrl: string | null): EventDraftDetails {
  const normalized = instruction.toLowerCase();
  const revised = { ...details };

  const title = extractAfter(instruction, ["ner", "title", "name"]);
  if (title) revised.title = title;

  const venue = extractAfter(instruction, ["location", "venue", "haana", "hayag"]);
  if (venue) revised.venue = venue;

  const date = instruction.match(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}(?:[ t,]+\d{1,2}(?::\d{2})?)?\b/i)?.[0];
  if (date) revised.dateTime = date;

  const seats = normalized.match(/(\d{1,3})\s*(suudal|seat|ticket|hun|хүн)/i)?.[1];
  if (seats) revised.seats = seats;

  const price = normalized.match(/(\d{1,3}(?:,\d{3})+|\d{1,7})\s*(mnt|tugrug|tug|₮)?/i)?.[1];
  if (normalized.includes("free") || normalized.includes("unegui") || normalized.includes("үнэгүй")) {
    revised.price = "free";
  } else if (price && (normalized.includes("une") || normalized.includes("price") || normalized.includes("төг"))) {
    revised.price = price;
  }

  const imageUrl = instruction.match(/https?:\/\/\S+|\/uploads\/\S+/i)?.[0];
  if (imageUrl) revised.imageUrl = imageUrl;
  else if (attachedImageUrl && normalized.includes("zurag")) revised.imageUrl = attachedImageUrl;

  const categories = ["music", "sports", "comedy", "festival", "conference", "workshop", "theater"];
  const category = categories.find((item) => normalized.includes(item));
  if (category) revised.category = category === "workshop" ? "conference" : category;

  if (normalized.includes("about") || normalized.includes("experience") || normalized.includes("tailbar") || normalized.includes("nem")) {
    revised.experienceNotes = [details.experienceNotes, instruction].filter(Boolean).join(" ");
  }

  return revised;
}

function extractAfter(value: string, keys: string[]) {
  for (const key of keys) {
    const match = value.match(new RegExp(`${key}\\s*(?:=|:|bolgo|bol|ni)?\\s*([^,\\.]+)`, "i"));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}
