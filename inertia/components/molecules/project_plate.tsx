import { useRef } from 'react'
import { Link } from '@adonisjs/inertia/react'
import FileImage from '~/components/atoms/file_image'
import { useProjectPlate } from '~/hooks/animations/use_project_plate'
import { useTextSweep } from '~/hooks/animations/use_text_sweep'
import type { ResolvedFile } from '#types/file'

interface ProjectPlateProps {
  /** Position in the listing. Drives the `N° — rubrique` number and the eager/lazy image loading. */
  index: number
  /** The cover resolved against the backend file module, rendered as the plate image. */
  coverFile?: ResolvedFile
  /** Project category, e.g. `'Application web'`. */
  rubrique: string
  /** Project title rendered overlaid at the bottom of the plate. */
  title: string
  /** One-line project description shown on the right of the plate footer. */
  note: string
  /**
   * Route of the project's single page, e.g. `'front.projects.show'`. When
   * omitted the plate renders without a link (e.g. on the project's own
   * single page).
   */
  route?: 'front.projects.show'
  /** Route params for the single page route — the project slug. */
  routeParams?: { slug: string }
}

/**
 * Full-screen project plate.
 *
 * The signature work showcase of the public front: one project per viewport
 * (~62vh mobile, ~86vh desktop), a landscape image rendered from the resolved
 * cover file with a readability gradient, and an overlaid footer pairing the
 * numbered category and title with the project note. The first plate in the
 * listing loads eagerly; the others lazy-load. A `data-loupe` hook lets the
 * cursor loupe target the plate, and GSAP makes the image breathe horizontally
 * as it scrolls. Without a cover the plate keeps its frame on the dark
 * surface.
 *
 * @example
 * <ProjectPlate index={0} coverFile={hero} rubrique="Application web" title="AdonisJS Foundry" note="Boilerplate production-ready AdonisJS v7" />
 */
export function ProjectPlate(props: ProjectPlateProps) {
  const { index, coverFile, rubrique, title, note, route, routeParams } = props
  const plateRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useProjectPlate(plateRef)
  useTextSweep(titleRef)

  const plate = (
    <article
      ref={plateRef}
      data-loupe
      className="relative mx-auto h-[62vh] max-w-[1600px] md:h-[86vh]"
    >
      <div data-plate-media className="absolute inset-0">
        {coverFile ? (
          <FileImage
            file={coverFile}
            loading={index === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-[#0b0b0d]" aria-hidden="true" />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-1 items-end gap-y-6 px-6 pb-8 md:grid-cols-2 md:px-14 md:pb-14">
        <div>
          <p className="font-news text-[11px] uppercase tracking-[0.25em] text-ink-inverted/60">
            {String(index + 1).padStart(2, '0')} — {rubrique}
          </p>
          <h3
            ref={titleRef}
            className="mt-3 font-news text-[clamp(2rem,6vw,4.7rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink-inverted"
          >
            {title}
          </h3>
        </div>
        <p className="font-news text-sm font-light leading-relaxed text-ink-inverted/75 md:justify-self-end md:text-right md:pb-3">
          {note}
        </p>
      </div>
    </article>
  )

  return route && routeParams ? (
    <Link route={route} routeParams={routeParams} className="block">
      {plate}
    </Link>
  ) : (
    plate
  )
}
