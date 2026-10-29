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

const StoreSchema = z.object({
  name: z.string().min(2),
  /** Absent = not connected yet: shown as an inactive button with a note saying so. */
  url: z.url().optional(),
});

const PraiseSchema = z.object({
  quote: z.string().min(10),
  /** Who said it, as they are credited (person, publication, or both). */
  source: z.string().min(2),
  url: z.url().optional(),
});

/** A book's own page (/books/<slug>/ on the client's site). */
const BookPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'book slug must be lowercase letters, numbers, hyphens only'),
  /** Paragraphs, as the client approves them (jacket copy or their own words). */
  description: z.array(z.string().min(40)).min(1),
  /** Paragraphs from the book, used with the publisher's permission. */
  excerpt: z.array(z.string().min(40)).default([]),
  stores: z.array(StoreSchema).default([]),
  /** Real, checked quotes only, each with its source. Empty shows a placeholder, never an invented quote. */
  praise: z.array(PraiseSchema).default([]),
});

const PublicationSchema = z
  .object({
    title: z.string().min(1),
    venue: z.string().min(1),
    year: z.number().int().min(1900).max(2100),
    url: z.url().optional(),
    type: z.enum(['book', 'article', 'essay', 'story', 'chapter']),
    page: BookPageSchema.optional(),
  })
  .refine((p) => !p.page || p.type === 'book', { message: 'only a book can have its own page', path: ['page'] });

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
export type BookPage = z.infer<typeof BookPageSchema>;
