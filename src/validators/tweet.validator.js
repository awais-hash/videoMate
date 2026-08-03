import * as z from "zod";

const createTweetSchema = z.object({
  content: z
    .string()
    .min(1, "Tweet cannot be empty")
    .max(280, "Tweet cannot exceed 280 characters")
    .trim(),
});

const updateTweetSchema = z.object({
  content: z.string().min(1, "Tweet cannot be empty").max(280).trim(),
});

export { createTweetSchema, updateTweetSchema };