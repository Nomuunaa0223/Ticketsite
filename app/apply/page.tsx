import { OrganizerApplicationForm } from "@/components/forms/organizer-application-form";

export default function OrganizerApplyPage() {
  return (
    <section className="min-h-screen bg-[#06070d] px-5 pb-14 pt-2 sm:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-2 text-center">

          <h1 className="font-goldman text-3xl font-bold leading-tight text-white sm:text-4xl">
            TIXORA - тай хамтарч<br className="hidden sm:block" /> арга хэмжээ зохион байгуулах
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/50 sm:text-base">
            Байгууллагынхаа мэдээллийг бөглөж хүсэлт илгээнэ үү. Админ зөвшөөрсний дараа таны имэйл хаяг болон нэвтрэх мэдээллийг имэйлээр илгээнэ.
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff7224]/15">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#ff7224]" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/70">Яагаад зөвшөөрөл шаардагддаг вэ?</p>
            <p className="mt-1 text-xs leading-5 text-white/40">
              Органайзер болохын тулд урьдчилсан зөвшөөрөл шаардагдана. Ингэснээр арга хэмжээнүүд баталгаажсан байж, тасалбар худалдан авагчдын аюулгүй байдал хангагдана.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white/[0.03] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:p-8">
          <OrganizerApplicationForm />
        </div>

      </div>
    </section>
  );
}
