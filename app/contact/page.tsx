import { PartnershipForm } from "@/components/home/partnership-form";

export default function ContactPage() {
  return (
    <section className="flex min-h-[calc(100vh-4.45rem)] items-center bg-[#07080d] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="font-goldman text-3xl font-bold text-white sm:text-4xl">
            Хамтран ажиллах
          </h1>
          <p className="mt-3 text-sm text-white/50">
            Арга хэмжээ зохион байгуулахыг хүсвэл доорх маягтыг бөглөж илгээнэ үү. Бид тантай удахгүй холбогдох болно.
          </p>
        </div>
        <PartnershipForm />
      </div>
    </section>
  );
}
