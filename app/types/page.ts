import type { FileRef, ResolvedFile } from '#types/file'
import { type ParagraphSpacing, type ParagraphVariants } from '#types/paragraph'
import { type FontSize } from '#types/font'

export type PageStatus = 'draft' | 'published' | 'archived'

export type BlockType =
  | 'section'
  | 'grid'
  | 'flex'
  | 'title'
  | 'paragraph'
  | 'button'
  | 'separator'
  | 'icon'
  | 'form'
  | 'field'
  | 'htmltext'
  | 'image'

/**
 * A responsive value that can vary per Tailwind breakpoint.
 * Only `default` is required — omitted breakpoints inherit the previous value.
 *
 * @example
 * { default: 1, md: 2, lg: 4 }
 */
export interface ResponsiveValue<T> {
  default: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}

export interface SectionProps {
  background:
    | 'none'
    | 'canvas'
    | 'surface'
    | 'sunken'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
    | 'transparent'
  paddingY: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl'>
  paddingX: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl'>
  className?: string
  id?: string
}

export interface GridProps {
  cols: ResponsiveValue<1 | 2 | 3 | 4 | 6>
  gap: ResponsiveValue<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
}

export interface FlexProps {
  as?: 'div' | 'article'
  background:
    | 'none'
    | 'canvas'
    | 'surface'
    | 'sunken'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
    | 'transparent'
  direction: ResponsiveValue<'row' | 'col' | 'row-reverse' | 'col-reverse'>
  gap: ResponsiveValue<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>
  align: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  justify: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  className?: string
}

export interface TitleProps {
  text: string
  level: 1 | 2 | 3 | 4
  color:
    | 'default'
    | 'ink-inverted'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
  highlightColor:
    | 'default'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
}

export interface ParagraphProps {
  text: string
  fs: FontSize
  variant: ParagraphVariants
  spacing: ParagraphSpacing
  className?: string
}

export interface SeparatorProps {
  spacing: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  color:
    | 'none'
    | 'canvas'
    | 'surface'
    | 'sunken'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
    | 'transparent'
  className?: string
}

export interface IconProps {
  name?: string
  color:
    | 'default'
    | 'ink-inverted'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
  background:
    | 'none'
    | 'canvas'
    | 'surface'
    | 'sunken'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
    | 'transparent'
  size: number
  className?: string
}

export interface FormProps {
  route?: string
  routeParams?: Record<string, any>
  className?: string
}

export interface FieldProps {
  label: string
  name: string
  type: string
  placeholder?: string
  required: boolean
  helpText?: string
  options?: {
    value: string
    label: string
  }[]
}

export interface HtmlTextProps {
  content: string
}

export interface ImageProps {
  file: FileRef | null
  className?: string
}

export interface ButtonProps {
  children: string
  linkType: 'page' | 'route' | 'external'
  pageId?: number | string
  locale?: string
  route?: string
  routeParams?: Record<string, any>
  anchor?: string
  url?: string
  variant:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'success'
    | 'link_muted'
    | 'link_secondary'
  size: 'sm' | 'md' | 'lg'
  align: 'left' | 'center' | 'right'
  fitContent: boolean
  icon: string | null
}

export interface ContactFormField {
  name: string
  label: string
  type: 'text' | 'email' | 'textarea' | 'tel' | 'select'
  required: boolean
  options?: string[]
}

export interface ContactFormProps {
  title: string | null
  fields: ContactFormField[]
  recipientEmail: string
  submitLabel: string
  successMessage: string
}

/**
 * Maps each BlockType to its corresponding props interface.
 * Used to type-narrow block props in the renderer and the builder.
 */
export interface BlockPropsMap {
  section: SectionProps
  grid: GridProps
  flex: FlexProps
  title: TitleProps
  paragraph: ParagraphProps
  button: ButtonProps
  separator: SeparatorProps
  icon: IconProps
  form: FormProps
  field: FieldProps
  htmltext: HtmlTextProps
  image: ImageProps
}

/**
 * A single block node in the page content tree.
 * Children are only present on container blocks (`section`, `grid`).
 */
export interface Block<T extends BlockType = BlockType> {
  id: string
  type: T
  props: BlockPropsMap[T]
  children?: Block[]
}

/**
 * Root structure of the JSON stored in `page_translations.content`.
 */
export interface PageContent {
  blocks: Block[]
}

export interface ContactFormSubmission {
  [key: string]: string
}

// ─── Resolved types ───────────────────────────────────────────────────────────
// Append these to the bottom of app/types/page.ts
// They mirror Block/Props types but with FileRef replaced by ResolvedFile,
// built server-side by PageResolverService before being passed to Inertia.

export interface ResolvedSectionProps {
  background:
    | 'none'
    | 'canvas'
    | 'surface'
    | 'sunken'
    | 'primary-deep'
    | 'primary'
    | 'primary-soft'
    | 'primary-light'
    | 'secondary-deep'
    | 'secondary'
    | 'secondary-soft'
    | 'secondary-light'
    | 'tertiary-deep'
    | 'tertiary'
    | 'tertiary-soft'
    | 'tertiary-light'
    | 'transparent'
  paddingY: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl'>
  paddingX: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl'>
  className?: string
  id?: string
}

export interface ResolvedImageProps {
  file: ResolvedFile | null
  className?: string
}

/**
 * Maps each BlockType to its resolved props.
 * Types without FileRef are identical to their source counterparts.
 */
export interface ResolvedBlockPropsMap {
  section: ResolvedSectionProps
  grid: GridProps
  flex: FlexProps
  title: TitleProps
  paragraph: ParagraphProps
  button: ButtonProps
  separator: SeparatorProps
  icon: IconProps
  form: FormProps
  field: FieldProps
  htmltext: HtmlTextProps
  image: ResolvedImageProps
}

/**
 * A single resolved block node.
 * All FileRef values have been replaced with ResolvedFile by `PageResolverService`.
 */
export interface ResolvedBlock<T extends BlockType = BlockType> {
  id: string
  type: T
  props: ResolvedBlockPropsMap[T]
  children?: ResolvedBlock[]
}

/**
 * Root structure passed to the Inertia page after server-side resolution.
 * Safe to render directly in React — no async lookups needed in components.
 */
export interface ResolvedPageContent {
  blocks: ResolvedBlock[]
}
