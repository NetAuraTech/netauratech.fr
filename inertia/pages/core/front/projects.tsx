import { useEffect, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { Head } from '@inertiajs/react'
import { LoupeCursor } from '~/components/atoms/loupe_cursor'
import { AmbientField } from '~/components/organisms/ambient_field'
import { Kicker } from '~/components/atoms/kicker'
import { Heading } from '~/components/atoms/heading'
import { Paragraph } from '~/components/atoms/paragraph'
import { Button } from '~/components/atoms/button'
import { useTextRise } from '~/hooks/animations/use_text_rise'
import { useProjectsList } from '~/hooks/animations/use_projects_list'
import { useProjectDistortion } from '~/hooks/animations/use_project_distortion'
import { ProjectRow } from '~/components/molecules/project_row'
import type { SiteProject } from '#types/site_content'

interface ProjectsPageProps {
  translations: Record<string, string>
  projects: SiteProject[]
}

/** Breakpoint at which the two-column fixed frame (and the infinite list) kicks in. */
const DESKTOP_BREAKPOINT = '(min-width: 1024px)'

/** Sentinelle category label rendering every project of the portfolio. */
const ALL_CATEGORY = 'all'
const ALL_LABEL = 'Tout'

/**
 * Human label of a filter category.
 *
 * @param category - A project `rubrique`, or the `all` sentinel.
 * @returns The label rendered in the filter dropdown.
 */
function filterLabel(category: string): string {
  return category === ALL_CATEGORY ? ALL_LABEL : category
}

/**
 * Portfolio listing of the public front, in the 375 vocabulary.
 *
 * A sealed two-column frame on desktop: the hero is pinned on the left while
 * the project rows scroll infinitely — the track carries three identical
 * copies so the scroller keeps to the middle one and loops seamlessly,
 * both up and down — on the right. The filter is a
 * `Filtrer +` toggle that drops a vertical category list, and the loop is
 * rebuilt from the filtered set. The columns stack, rows move their titles
 * below the images and the list returns to normal document flow on smaller
 * screens.
 */
export default function ProjectsPage(props: ProjectsPageProps) {
  const { projects } = props
  const { props: sharedProps } = usePage<SharedProps>()
  const { app_name } = sharedProps
  const titleRef = useRef<HTMLHeadingElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLElement>(null)
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)
  const [filterOpen, setFilterOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_BREAKPOINT)
    setIsDesktop(query.matches)

    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const categories = [
    ALL_CATEGORY,
    ...Array.from(new Set(projects.map((project) => project.rubrique))),
  ]
  const visibleProjects =
    activeCategory === ALL_CATEGORY
      ? projects
      : projects.filter((project) => project.rubrique === activeCategory)

  const loopProjects = isDesktop
    ? [...visibleProjects, ...visibleProjects, ...visibleProjects]
    : visibleProjects

  const filterKey = `${activeCategory}:${isDesktop}`

  useTextRise(titleRef, { delay: 0.6, from: 'start' })
  useProjectsList(listRef, frameRef, isDesktop, filterKey)
  useProjectDistortion(frameRef, listRef, isDesktop, filterKey)

  return (
    <>
      <LoupeCursor />
      <Head>
        <title>{`Projets — Sites vitrines, e-commerce et applications web — ${app_name}`}</title>
        <meta
          name="description"
          content="Le portfolio NetAuraTech : sites vitrines, boutiques en ligne et applications web entièrement sur mesure, conçus pour votre métier et votre croissance."
        />
      </Head>
      <section ref={frameRef} className="projects__frame">
        <div className="projects__info">
          <Kicker>{app_name} — Projets</Kicker>
          <div className="mt-8">
            <Heading level={1} ref={titleRef}>
              Des projets pensés pour <em>tenir</em> leurs promesses.
            </Heading>
          </div>

          {isDesktop && (
            <div className="projects__info-field" aria-hidden="true">
              <AmbientField />
            </div>
          )}

          <div className="projects__bottom">
            <Paragraph className="max-w-160">
              Du site vitrine au e-commerce, en passant par les applications web : un aperçu du
              travail écrit à la main, de la conception à la mise en service.
            </Paragraph>

            <div className="projects__filter">
              <div
                className={filterOpen ? 'projects__filter-list is-open' : 'projects__filter-list'}
                role="listbox"
                aria-label="Filtrer les projets"
              >
                {categories.map((category) => {
                  const isActive = category === activeCategory

                  return (
                    <button
                      key={category}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={
                        isActive ? 'projects__filter-option is-active' : 'projects__filter-option'
                      }
                      onClick={() => {
                        setActiveCategory(category)
                        setFilterOpen(false)
                      }}
                    >
                      <span className="projects__filter-option-dot" aria-hidden="true" />
                      {filterLabel(category)}
                    </button>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="secondary"
                fitContent
                onClick={() => setFilterOpen((open) => !open)}
              >
                Filtrer
                <span
                  className={`transition-transform duration-300 ${filterOpen ? 'rotate-45' : ''}`}
                  aria-hidden="true"
                >
                  +
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div ref={listRef} className="projects__list" data-projects-list>
          <div className="projects__track" data-projects-track>
            {loopProjects.map((project, i) => (
              <ProjectRow
                key={`${project.title}-${i}`}
                index={i % projects.length}
                project={project}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
