import { z } from "zod";

export const resaleListingSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  askPrice: z.coerce.number().positive(),
  expiresAt: z.coerce.date().optional()
});

export const checkInSchema = z.object({
  ticketCode: z.string().min(4)
});
