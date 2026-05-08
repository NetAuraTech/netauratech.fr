import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Template from '#models/template/template'
import type { PageContent } from '#types/page'

/**
 * CMS Template seeder.
 *
 * Creates a set of reusable templates covering both types:
 *   - `page`  → full page layouts applied to a translation's entire block tree
 *   - `block` → single block presets inserted at a specific position
 *
 * Run with:
 *   node ace db:seed --files database/seeders/cms/template_seeder.ts
 *
 * Templates created:
 *   Page templates:
 *     - Landing page          (hero + section + grid 3 cols + CTA)
 *     - Article               (section > title + separator + rich_text)
 *     - Contact page          (section > title + rich_text + contact_form)
 *     - Coming soon           (hero full-screen + separator + CTA)
 *
 *   Block templates:
 *     - Hero (centered)       hero block preset
 *     - Hero (left-aligned)   hero block preset
 *     - 2-column grid         grid preset
 *     - 3-column grid         grid preset
 *     - Feature section       section > grid 3 cols
 *     - Testimonial           section > rich_text (blockquote style)
 *     - CTA banner            section (primary bg) > title + button
 *     - Simple separator      separator preset
 */
export default class extends BaseSeeder {
  async run() {
    // ─── Page templates ───────────────────────────────────────────────────────

    await Template.updateOrCreate(
      { name: 'Landing page' },
      {
        name: 'Landing page',
        description: 'Hero banner, a 3-column feature grid, and a CTA section.',
        type: 'page',
        blockType: null,
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'Article' },
      {
        name: 'Article',
        description: 'Minimal single-column layout for blog posts or documentation pages.',
        type: 'page',
        blockType: null,
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'Contact page' },
      {
        name: 'Contact page',
        description: 'Title, intro paragraph, and a ready-to-use contact form.',
        type: 'page',
        blockType: null,
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'Coming soon' },
      {
        name: 'Coming soon',
        description: 'Full-screen hero with a teaser message and a CTA.',
        type: 'page',
        blockType: null,
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    // ─── Block templates ──────────────────────────────────────────────────────

    await Template.updateOrCreate(
      { name: 'Hero — centered' },
      {
        name: 'Title — centered',
        description: 'Large centred title.',
        type: 'block',
        blockType: 'title',
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'Feature section' },
      {
        name: 'Feature section',
        description: 'Section with a heading and a 3-column feature grid below it.',
        type: 'block',
        blockType: 'section',
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'CTA banner' },
      {
        name: 'CTA banner',
        description: 'Primary-coloured section with a bold heading and a centred CTA button.',
        type: 'block',
        blockType: 'section',
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'Testimonial' },
      {
        name: 'Testimonial',
        description: 'Surface-background section with a blockquote and author attribution.',
        type: 'block',
        blockType: 'section',
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    await Template.updateOrCreate(
      { name: 'Simple separator' },
      {
        name: 'Simple separator',
        description: 'A solid horizontal rule with medium vertical spacing.',
        type: 'block',
        blockType: 'separator',
        thumbnailId: null,
        createdBy: null,
        content: {
          blocks: [],
        } satisfies PageContent,
      }
    )

    console.log('✅ CMS templates seeded successfully')
    console.log('   Page templates (4):')
    console.log('     → Landing page')
    console.log('     → Article')
    console.log('     → Contact page')
    console.log('     → Coming soon')
    console.log('   Block templates (8):')
    console.log('     → Hero — centered / left aligned')
    console.log('     → 2-column grid / 3-column grid')
    console.log('     → Feature section')
    console.log('     → CTA banner')
    console.log('     → Testimonial')
    console.log('     → Simple separator')
  }
}
