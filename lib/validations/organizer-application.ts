import { z } from "zod";

const optionalUrl = z
  .string()
  .url("Enter a valid URL.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const organizerApplicationSchema = z.object({
  companyName: z.string().min(2, "Company name is required.").max(120),
  contactName: z.string().min(2, "Contact name is required.").max(100),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(6, "Phone number is required.").max(40),
  description: z.string().min(10, "Тайлбар хэт богино байна.").max(2000),
  websiteUrl: optionalUrl,
  socialUrl: optionalUrl,
});

export const passwordSetupSchema = z
  .object({
    token: z.string().min(20),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type OrganizerApplicationInput = z.infer<typeof organizerApplicationSchema>;
export type PasswordSetupInput = z.infer<typeof passwordSetupSchema>;
