import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID format",
  });

const mongoIdParamSchema = (paramName) =>
  z.object({
    [paramName]: objectIdSchema,
  });

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.string().optional(),
  sortType: z.enum(["asc", "desc"]).default("desc"),
});

export { objectIdSchema, 
        mongoIdParamSchema, 
        paginationSchema 
    };