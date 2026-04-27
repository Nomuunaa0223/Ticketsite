import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(10),
    role: z.enum(["USER", "ORGANIZER"]).default("USER"),
    companyName: z.string().max(120).optional(),
    websiteUrl: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined))
  })
  .superRefine((input, ctx) => {
    if (input.role === "ORGANIZER" && !input.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company name is required for organizers."
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
