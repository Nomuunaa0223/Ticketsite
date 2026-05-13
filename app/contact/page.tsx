import { ContactInquiryForm } from "@/components/forms/contact-inquiry-form";

export default function ContactPage() {
  return (
    <section className="flex min-h-[calc(100vh-4.45rem)] items-center bg-[#07080d] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <ContactInquiryForm />
      </div>
    </section>
  );
}
