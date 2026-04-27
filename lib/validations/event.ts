import { z } from "zod";

export const ticketTypeInputSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional(),
  price: z.coerce.number().positive(),
  quantityTotal: z.coerce.number().int().positive().max(500000),
  maxPerOrder: z.coerce.number().int().positive().max(20).default(8),
  resaleAllowed: z.coerce.boolean().default(true),
  resalePriceCap: z.coerce.number().positive().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional()
});

export const eventInputSchema = z
  .object({
    categoryId: z.string().min(1),
    subcategoryId: z.string().optional(),
    venueId: z.string().min(1),
    title: z.string().min(4).max(120),
    summary: z.string().min(10).max(240),
    description: z.string().min(40),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    saleStartsAt: z.coerce.date(),
    saleEndsAt: z.coerce.date(),
    currency: z.string().length(3).default("USD"),
    platformFeeBps: z.coerce.number().int().min(0).max(2500).default(900),
    serviceFeeBps: z.coerce.number().int().min(0).max(2000).default(350),
    ticketTypes: z.array(ticketTypeInputSchema).min(1)
  })
  .superRefine((input, ctx) => {
    if (input.endsAt <= input.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Event end time must be after the start time."
      });
    }

    if (input.saleStartsAt >= input.saleEndsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["saleEndsAt"],
        message: "Sale end time must be after sale start time."
      });
    }

    if (input.saleEndsAt > input.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["saleEndsAt"],
        message: "Ticket sales must end before the event starts."
      });
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;
