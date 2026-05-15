import { PartnershipForm } from "@/components/home/partnership-form";

export default function PartnerPage() {
  return (
    <section className="min-h-screen bg-[#06070d] px-5 pb-24 pt-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
          Хамтын ажиллагаа
        </p>
        <h1 className="mt-3 font-goldman text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          Бидэнтэй хамтрах
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
          Арга хэмжээ зохион байгуулах, хамтран ажиллах сонирхолтой бол доорх маягтыг бөглөн илгээнэ үү. Бид тантай эргэж холбогдох болно.
        </p>

        <div className="mt-10 rounded-2xl bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] sm:p-8">
          <PartnershipForm />
        </div>
      </div>
    </section>
  );
}
