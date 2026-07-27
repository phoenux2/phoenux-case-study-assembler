import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  client_name: z.string().trim().max(160).optional().or(z.literal("")),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const createTextSourceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  content_text: z.string().trim().min(1, "Content is required").max(50_000),
});

export const createFileSourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  filename: z.string().trim().min(1).max(260),
  mime_type: z.string().trim().min(1).max(120),
});

export const updateAssetMetadataSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  phase: z.enum([
    "discovery",
    "design",
    "build",
    "launch",
    "outcome",
    "unknown",
  ]),
  permission: z.enum(["public", "internal", "restricted", "blocked"]),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  caption: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
export type CreateTextSourceFormValues = z.infer<typeof createTextSourceSchema>;
export type UpdateAssetMetadataFormValues = z.infer<
  typeof updateAssetMetadataSchema
>;
