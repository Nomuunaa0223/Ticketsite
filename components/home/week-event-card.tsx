import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

export type WeekEventCardItem = {
  title: string;
  href: Route;
  imageSrc: string;
  imageAlt: string;
  objectPosition?: string;
  datePrimaryLabel?: string;
  dateSecondaryLabel?: string;
  dateLabel?: string;
  summary?: string;
  venueLabel: string;
  priceLabel: string;
  availabilityLabel?: string;
  urgencyBadge?: string;
  countdownLabel?: string;
};

type WeekEventCardProps = {
  event: WeekEventCardItem;
};

export function WeekEventCard({ event }: WeekEventCardProps) {
  return (
    <article className="week-event-card group">
      <Link href={event.href} className="week-event-card__image-shell">
        <Image
          src={event.imageSrc}
          alt={event.imageAlt}
          fill
          className="week-event-card__image object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          style={{ objectPosition: event.objectPosition ?? "50% 50%" }}
        />
        <div className="week-event-card__image-overlay" />
        <span className="week-event-card__urgency">{event.urgencyBadge ?? "This week"}</span>
      </Link>

      <div className="week-event-card__body">
        <div className="week-event-card__date">
          <span className="week-event-card__date-primary">{event.datePrimaryLabel ?? event.dateLabel ?? ""}</span>
          <span className="week-event-card__date-secondary">{event.dateSecondaryLabel ?? ""}</span>
        </div>

        <h3 className="week-event-card__title">{event.title}</h3>
        <p className="week-event-card__venue">{event.venueLabel}</p>

        <div className="week-event-card__footer">
          <div>
            <p className="week-event-card__price">{event.priceLabel}</p>
          </div>

          <Link href={event.href} className="week-event-card__cta">
            Тасалбар авах
          </Link>
        </div>
      </div>
    </article>
  );
}
