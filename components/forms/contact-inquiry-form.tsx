"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function ContactInquiryForm() {
  const [contactDetails, setContactDetails] = useState({
    phone: "",
    email: "",
    ticketType: "",
    message: ""
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = `Tixora inquiry: ${contactDetails.ticketType || "Ticket request"}`;
    const body = [
      "Hello Tixora team,",
      "",
      `Phone: ${contactDetails.phone || "-"}`,
      `Email: ${contactDetails.email || "-"}`,
      `Ticket type: ${contactDetails.ticketType || "-"}`,
      "",
      "Brief details:",
      contactDetails.message || "-",
      "",
      "Sent from the Tixora contact page."
    ].join("\n");

    window.location.href = `mailto:contact@tixora.mn?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="footer-contact-form" onSubmit={handleSubmit}>
      <label className="footer-contact-field">
        <span>Phone</span>
        <input
          type="tel"
          placeholder="9911 2233"
          value={contactDetails.phone}
          onChange={(event) =>
            setContactDetails((current) => ({ ...current, phone: event.target.value }))
          }
        />
      </label>

      <label className="footer-contact-field">
        <span>Email</span>
        <input
          type="email"
          placeholder="you@example.com"
          value={contactDetails.email}
          onChange={(event) =>
            setContactDetails((current) => ({ ...current, email: event.target.value }))
          }
        />
      </label>

      <label className="footer-contact-field">
        <span>What ticket are you selling?</span>
        <input
          type="text"
          placeholder="Concert, sports, theater..."
          value={contactDetails.ticketType}
          onChange={(event) =>
            setContactDetails((current) => ({ ...current, ticketType: event.target.value }))
          }
        />
      </label>

      <label className="footer-contact-field">
        <span>Brief details</span>
        <textarea
          rows={5}
          placeholder="Event name, date, venue, and anything we should know..."
          value={contactDetails.message}
          onChange={(event) =>
            setContactDetails((current) => ({ ...current, message: event.target.value }))
          }
        />
      </label>

      <div className="footer-contact-form__actions">
        <button type="submit" className="footer-contact-button">
          Send Inquiry
        </button>
      </div>
    </form>
  );
}
