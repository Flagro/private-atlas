import { z } from "zod";

export const deleteAccountSchema = z
  .object({
    confirmEmail: z.string().trim().email().max(320),
  })
  .strict();
