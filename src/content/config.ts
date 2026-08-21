import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /* Optional hero subhead. When set, this displays in the hero instead of `description`,
       freeing `description` to serve its meta-description / OG / Article-schema role
       (the citation-ready definition) while the visible hero gets a positioning hook. */
    subhead: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('RevFactor Team'),
    category: z.enum(['Strategy', 'Pricing', 'Markets', 'Tools', 'Case Study']),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    readingTime: z.number().optional(),
    /* Optional FAQ block: drives both the on-page accordion AND the FAQPage JSON-LD.
       Single source of truth so the visible content and schema can never drift. */
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    /* Property + client */
    listing: z.string(),
    bedrooms: z.number(),
    city: z.string(),
    state: z.string(),
    market: z.string().optional(),
    clientName: z.string(),
    /* When false, show first name only on the public page (privacy guard
       until owner sign-off lands). Default to false; flip per owner. */
    clientNamePublic: z.boolean().default(false),
    onboardedDate: z.coerce.date().optional(),
    tenureMonths: z.number().optional(),
    /* Pacing block: Summer 2026 OTB pacing data */
    pacing: z.object({
      period: z.string(),
      otbRev: z.number(),
      stlyRev: z.number(),
      lyRev: z.number().optional(),
      liftPct: z.number(),
      vsLyPct: z.number().optional(),
      mpi: z.number().optional(),
      otbOcc: z.number().optional(),
      stlyOcc: z.number().optional(),
      lyOcc: z.number().optional(),
      otbAdr: z.number().optional(),
      stlyAdr: z.number().optional(),
      lyAdr: z.number().optional(),
      mktOcc: z.number().optional(),
      pastLyTotal: z.boolean().optional(),
    }).optional(),
    /* Q1 actuals block */
    q1: z.object({
      rev: z.number(),
      lyRev: z.number(),
      liftPct: z.number(),
      mpi: z.number().optional(),
      tier: z.string().optional(),
    }).optional(),
    /* Optional monthly breakdown (Jun/Jul/Aug 2026 from sheet) */
    monthly: z.array(z.object({
      month: z.string(),
      otbRev: z.number(),
      stlyRev: z.number().nullable().optional(),
      otbOcc: z.number().optional(),
      otbAdr: z.number().optional(),
      mpi: z.number().optional(),
    })).optional(),
    /* Optional pull-quote from owner */
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      source: z.string().optional(),
    }).optional(),
    /* Tactics used: surfaces on the page as a "what changed" callout */
    tactics: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, caseStudies };
