import { EditorProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { SelectOption } from '~/components/atoms/select_option'
import { usePage } from '@inertiajs/react'

export function ButtonEditor(props: EditorProps) {
  const { block, onChange, lockProps } = props
  const { availableRoutes, availablePages } = usePage<{
    availableRoutes: any[]
    availablePages: any[]
  }>().props

  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })
  const targetPageConfig = availablePages?.find((pg) => pg.id === Number(p.pageId))

  const updateNavigation = (updates: Partial<any>) => {
    const nextProps = { ...p, ...updates }

    onChange(nextProps)
  }

  return (
    <div className="space-y-4">
      <LFW
        {...lockProps}
        fieldKey="children"
        type="text"
        label="Texte du bouton"
        defaultValue={p.children ?? ''}
        onChange={(v) => u('children', v)}
      />

      <LFW
        {...lockProps}
        fieldKey="linkType"
        label="Type de destination"
        type="select"
        defaultValue={p.linkType ?? 'page'}
        onChange={(v) =>
          onChange({
            ...p,
            linkType: v,
            route: '',
            routeParams: {},
            pageId: '',
            url: '',
            locale: '',
            anchor: '',
          })
        }
      >
        <SelectOption value="page" label="Page interne (CMS)" />
        <SelectOption value="route" label="Route Système" />
        <SelectOption value="external" label="Lien externe" />
        <SelectOption value="submit" label="Submit" />
      </LFW>
      <hr className="border-edge-soft" />
      {p.linkType === 'page' && (
        <>
          <LFW
            {...lockProps}
            fieldKey="pageId"
            label="Choisir la page"
            type="select"
            defaultValue={p.pageId}
            onChange={(v) => {
              const targetPg = availablePages.find((page) => page.id === Number(v))
              if (!targetPg) return
              const defaultTrans =
                targetPg.locales.find((l: any) => l.locale === targetPg.default_locale) ||
                targetPg.locales[0]
              const isDefault = defaultTrans.locale === targetPg.default_locale

              updateNavigation({
                pageId: v,
                locale: defaultTrans.locale,
                route: isDefault ? 'page.render' : 'page.localised.render',
                routeParams: isDefault
                  ? { slug: defaultTrans.slug }
                  : { locale: defaultTrans.locale, slug: defaultTrans.slug },
              })
            }}
          >
            <option value="">-- Sélectionner une page --</option>
            {availablePages?.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.label}
              </option>
            ))}
          </LFW>
          {targetPageConfig && (
            <LFW
              {...lockProps}
              fieldKey="locale"
              label="Traduction"
              type="select"
              defaultValue={p.locale}
              onChange={(v) => {
                const trans = targetPageConfig.locales.find((l: any) => l.locale === v)
                const isDefault = v === targetPageConfig.default_locale
                updateNavigation({
                  locale: v,
                  route: isDefault ? 'page.render' : 'page.localised.render',
                  routeParams: isDefault ? { slug: trans?.slug } : { locale: v, slug: trans?.slug },
                })
              }}
            >
              {targetPageConfig.locales.map((l: any) => (
                <option key={l.locale} value={l.locale}>
                  {l.locale.toUpperCase()}
                </option>
              ))}
            </LFW>
          )}
        </>
      )}
      {p.linkType === 'route' && (
        <LFW
          {...lockProps}
          fieldKey="route"
          label="Route Adonis"
          type="select"
          defaultValue={p.route}
          onChange={(v) => updateNavigation({ route: v, routeParams: {} })}
        >
          <option value="">-- Sélectionner --</option>
          {availableRoutes?.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </LFW>
      )}
      {(p.linkType === 'page' || p.linkType === 'route') && (
        <LFW
          {...lockProps}
          fieldKey="anchor"
          label="Ancre (ID de section)"
          type="text"
          placeholder="ex: contact-form (sans le #)"
          defaultValue={p.anchor ?? ''}
          onChange={(v) => u('anchor', v)}
        />
      )}
      {p.linkType === 'external' && (
        <LFW
          {...lockProps}
          fieldKey="url"
          label="URL externe"
          type="text"
          defaultValue={p.url ?? ''}
          onChange={(v) => u('url', v)}
        />
      )}
      <hr className="border-edge-soft" />
      <div className="grid grid-cols-2 gap-2">
        <LFW
          {...lockProps}
          fieldKey="variant"
          label="Style"
          type="select"
          defaultValue={p.variant ?? 'primary'}
          onChange={(v) => u('variant', v)}
        >
          <SelectOption value="primary" label="Principal" />
          <SelectOption value="secondary" label="Secondaire" />
          <SelectOption value="outline" label="Contour" />
          <SelectOption value="link_muted" label="Lien" />
          <SelectOption value="link_secondary" label="Lien secondaire" />
        </LFW>
        <LFW
          {...lockProps}
          fieldKey="fitContent"
          label="Largeur auto"
          type="checkbox"
          defaultValue={p.fitContent ?? true}
          onChange={(v) => u('fitContent', v)}
        />
      </div>
    </div>
  )
}
