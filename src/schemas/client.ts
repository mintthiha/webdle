import { z } from 'zod';

const CommonFields = {
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, hyphens only'),
  name: z.string().min(2),
  domain: z.url(),
  tagline: z.string().min(10).max(140),
  location: z.string().optional(),
  /** Verified external profiles only. No placeholders, no guesses. */
  sameAs: z.array(z.url()).default([]),
};

const CredentialSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  degree: z.string().min(2),
  institution: z.string().min(2),
  location: z.string().optional(),
});

const TeachingRoleSchema = z.object({
  startYear: z.number().int().min(1900),
  /** null = ongoing */
  endYear: z.number().int().min(1900).nullable(),
  role: z.string().min(2),
  institution: z.string().min(2),
  department: z.string().optional(),
  courses: z.array(z.string()).default([]),
});

const PublicationSchema = z.object({
  title: z.string().min(1),
  venue: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  url: z.url().optional(),
  type: z.enum(['book', 'article', 'essay', 'story', 'chapter']),
});

export const TeacherSchema = z.object({
  ...CommonFields,
  archetype: z.literal('teacher'),
  bio: z.string().min(100),
  credentials: z.array(CredentialSchema).min(1, 'teacher requires at least one credential'),
  teaching: z.array(TeachingRoleSchema).min(1, 'teacher requires at least one teaching role'),
  publications: z.array(PublicationSchema).default([]),
});

export const WriterSchema = z.object({
  ...CommonFields,
  archetype: z.literal('writer'),
  bio: z.string().min(100),
  credentials: z.array(CredentialSchema).default([]),
  publications: z.array(PublicationSchema).min(1, 'writer requires at least one publication'),
  teaching: z.array(TeachingRoleSchema).default([]),
});

export const ClientSchema = z.discriminatedUnion('archetype', [
  TeacherSchema,
  WriterSchema,
]);

export type Client = z.infer<typeof ClientSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type Writer = z.infer<typeof WriterSchema>;
export type Credential = z.infer<typeof CredentialSchema>;
export type TeachingRole = z.infer<typeof TeachingRoleSchema>;
export type Publication = z.infer<typeof PublicationSchema>;
