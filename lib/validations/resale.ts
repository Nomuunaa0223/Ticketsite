import { z } from "zod";

export const resaleListingSchema = z.object({
  ticketId: z.string().min(1),
  askPrice: z.coerce.number().positive(),
  expiresAt: z.coerce.date().optional()
});

export const checkInSchema = z.object({
  ticketCode: z.string().min(4)
});
