import { ContactInquiryForm } from "@/components/forms/contact-inquiry-form";

export default function ContactPage() {
  return (
    <section className="contact-page">
      <div className="contact-page__shell">
        <div className="contact-page__intro">
          <p className="contact-page__eyebrow">Contact Us</p>
          <h1 className="contact-page__title">Tell us about the tickets you want to sell</h1>
          <p className="contact-page__description">
            Share your phone number, email, and a short summary of the event. Our team will review the details and get back to you with the next steps.
          </p>

          <div className="footer-contact-panel__grid">
            <div className="footer-contact-card">
              <p className="footer-contact-card__label">Email</p>
              <a href="mailto:contact@tixora.mn" className="footer-contact-card__value">
                contact@tixora.mn
              </a>
            </div>

            <div className="footer-contact-card">
              <p className="footer-contact-card__label">Phone</p>
              <a href="tel:+97677112233" className="footer-contact-card__value">
                +976 7711 2233
              </a>
            </div>
          </div>
        </div>

        <div className="contact-page__panel">
          <div className="contact-page__panel-header">
            <p className="footer-contact-panel__eyebrow">Ticket Inquiry</p>
            <h2 className="footer-contact-panel__title">Send us your details</h2>
          </div>

          <ContactInquiryForm />
        </div>
      </div>
    </section>
  );
}
