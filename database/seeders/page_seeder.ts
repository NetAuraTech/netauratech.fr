import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Page from '#models/page/page'
import PageTranslation from '#models/page/page_translation'
import type { PageContent } from '#types/page'

/**
 * CMS Page seeder.
 *
 * Creates a small set of realistic pages covering all block types so you
 * can verify the renderer end-to-end without building an editor first.
 *
 * Run with:
 *   node ace db:seed --files database/seeders/cms/page_seeder.ts
 *
 * Pages created:
 *   - Home page         (hero + rich_text + button_cta)          → /home
 *   - About page        (section > title + rich_text)            → /about
 *   - Contact page      (section > title + contact_form)         → /contact
 *   - Grid showcase     (section > grid > [image, image])        → /grid-demo
 *   - Typography demo   (section > [title × 4 + separator × 3 + rich_text]) → /typography
 */
export default class extends BaseSeeder {
  async run() {
    // ─── Home page ────────────────────────────────────────────────────────────

    const homePage = await Page.updateOrCreate(
      { defaultLocale: 'en' },
      { defaultLocale: 'en', metaImageId: null, createdBy: null }
    )

    const homeContent: PageContent = {
      blocks: [],
    }

    await PageTranslation.updateOrCreate(
      { pageId: homePage.id, locale: 'en' },
      {
        pageId: homePage.id,
        locale: 'en',
        slug: 'home',
        title: 'Home',
        metaTitle: 'Home — Foundry CMS',
        metaDescription: 'Welcome to Foundry, a composable CMS built on AdonisJS.',
        content: homeContent,
        status: 'published',
      }
    )

    await PageTranslation.updateOrCreate(
      { pageId: homePage.id, locale: 'fr' },
      {
        pageId: homePage.id,
        locale: 'fr',
        slug: 'accueil',
        title: 'Accueil',
        metaTitle: 'Accueil — Foundry CMS',
        metaDescription: 'Bienvenue sur Foundry, un CMS composable basé sur AdonisJS.',
        content: {
          blocks: [],
        },
        status: 'published',
      }
    )

    // ─── About page ───────────────────────────────────────────────────────────

    const aboutPage = await Page.create({ defaultLocale: 'en', metaImageId: null, createdBy: null })

    const aboutContent: PageContent = {
      blocks: [],
    }

    await PageTranslation.create({
      pageId: aboutPage.id,
      locale: 'en',
      slug: 'about',
      title: 'About',
      metaTitle: 'About — Foundry CMS',
      metaDescription: 'Learn more about the Foundry CMS project.',
      content: aboutContent,
      status: 'published',
    })

    // ─── Contact page ─────────────────────────────────────────────────────────

    const contactPage = await Page.create({
      defaultLocale: 'en',
      metaImageId: null,
      createdBy: null,
    })

    const contactContent: PageContent = {
      blocks: [],
    }

    await PageTranslation.create({
      pageId: contactPage.id,
      locale: 'en',
      slug: 'contact',
      title: 'Contact',
      metaTitle: 'Contact — Foundry CMS',
      metaDescription: 'Get in touch with the Foundry team.',
      content: contactContent,
      status: 'published',
    })

    // ─── Grid showcase ────────────────────────────────────────────────────────

    const gridPage = await Page.create({ defaultLocale: 'en', metaImageId: null, createdBy: null })

    const gridContent: PageContent = {
      blocks: [],
    }

    await PageTranslation.create({
      pageId: gridPage.id,
      locale: 'en',
      slug: 'grid-demo',
      title: 'Grid Demo',
      metaTitle: null,
      metaDescription: null,
      content: gridContent,
      status: 'published',
    })

    // ─── Typography demo ──────────────────────────────────────────────────────

    const typoPage = await Page.create({ defaultLocale: 'en', metaImageId: null, createdBy: null })

    const typoContent: PageContent = {
      blocks: [],
    }

    await PageTranslation.create({
      pageId: typoPage.id,
      locale: 'en',
      slug: 'typography',
      title: 'Typography Demo',
      metaTitle: null,
      metaDescription: null,
      content: typoContent,
      status: 'published',
    })

    console.log('✅ CMS pages seeded successfully')
    console.log('   Pages available at:')
    console.log('   → /home           (hero + rich_text + button_cta)')
    console.log('   → /about          (section > title + separator + rich_text)')
    console.log('   → /contact        (section > title + contact_form)')
    console.log('   → /grid-demo      (section > grid 3 cols)')
    console.log('   → /typography     (all typography blocks)')
    console.log('   → /fr/accueil     (FR translation of home)')
  }
}
