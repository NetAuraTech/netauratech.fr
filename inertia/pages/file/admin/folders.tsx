import { ReactElement, useState } from 'react'
import { Button } from '~/components/atoms/button'
import { Input } from '~/components/atoms/input'
import { Field } from '~/components/molecules/field'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { Card } from '~/components/atoms/card'
import Layout from '~/layouts/admin'
import { Paragraph } from '~/components/atoms/paragraph'
import { Data } from '@generated/data'
import { NavLink } from '~/components/atoms/nav_link'
import { Icon } from '~/components/atoms/icon'
import { CanAccess } from '~/guards/can_access'
import type { AdminFileFoldersTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

interface PageProps {
  roots: Data.FileFolder[]
  translations: AdminFileFoldersTranslations
}

export default function FileFoldersPage(props: PageProps) {
  const { roots, translations } = props
  const { t } = useTranslation(translations)

  return (
    <>
      <AdminMain
        title={t('title')}
        icon="Folders"
        action={
          <CanAccess permission="folders.create">
            <Button variant="secondary" route="admin.file_folders.render" fitContent>
              <Icon name="Folder" />
              {t('action')}
            </Button>
          </CanAccess>
        }
      >
        <div className="grid gap-6">
          <CanAccess permission="folders.create">
            <CreateFolderForm parentId={null} label={t('name.root')} translations={translations} />
          </CanAccess>
          {roots.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-edge">
              <Paragraph variant="muted">{t('empty.value')}</Paragraph>
              <Paragraph variant="subtle">{t('empty.help')}</Paragraph>
            </div>
          ) : (
            <div className="grid gap-2">
              {roots.map((folder) => (
                <FolderNode key={folder.id} folder={folder} depth={0} translations={translations} />
              ))}
            </div>
          )}
        </div>
      </AdminMain>
    </>
  )
}
interface FolderNodeProps {
  folder: Data.FileFolder
  depth: 0 | 1 | 2 | 3 | 4 | 5
  translations: AdminFileFoldersTranslations
}

function FolderNode(props: FolderNodeProps) {
  const { folder, depth, translations } = props
  const { t } = useTranslation(translations)
  const [expanded, setExpanded] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [addingChild, setAddingChild] = useState(false)

  const hasChildren = folder.children?.length > 0

  const indentClass = {
    0: '',
    1: 'ml-5',
    2: 'ml-10',
    3: 'ml-15',
    4: 'ml-20',
    5: 'ml-25',
  }

  return (
    <div className={indentClass[depth]}>
      <div className="flex flex-col md:flex-row items-center gap-2 justify-between rounded-xl border border-edge bg-canvas px-4 py-3 hover:border-primary-soft transition-colors">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0 ${
              hasChildren ? 'text-ink-muted hover:text-ink' : 'text-transparent cursor-default'
            }`}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            disabled={!hasChildren}
          >
            <Icon
              name="ChevronRight"
              size={18}
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
          <Icon name="Folder" size={16} />
          {renaming ? (
            <Form
              route="admin.file_folders.update"
              routeParams={{ id: folder.id }}
              className="flex items-center gap-2 flex-1 min-w-0"
              onSuccess={() => {
                setRenaming(false)
              }}
            >
              {({ processing }) => (
                <>
                  <Input type="text" name="name" defaultValue={folder.name} />
                  <Button type="submit" variant="primary" disabled={processing}>
                    {t('actions.update')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
                    {t('actions.cancel')}
                  </Button>
                </>
              )}
            </Form>
          ) : (
            <span className="text-sm font-medium text-ink flex-1 min-w-0 truncate">
              {folder.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasChildren && (
            <span className="text-xs text-ink-subtle bg-sunken border border-edge px-1.5 py-0.5 rounded-full shrink-0">
              {folder.children?.length}
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <NavLink label="" route="admin.files.render" qs={{ folder_id: folder.id }}>
              <Button variant="icon" title={t('browse')}>
                <Icon name="SquareMenu" size={18} />
              </Button>
            </NavLink>
            <CanAccess permission="folders.create">
              <Button
                variant="icon"
                title={t('actions.add')}
                onClick={() => {
                  setAddingChild(!addingChild)
                  setExpanded(true)
                }}
              >
                <Icon name="Plus" size={18} />
              </Button>
            </CanAccess>
            <CanAccess permission="folders.update">
              <Button
                variant="icon_warning"
                title={t('actions.rename')}
                onClick={() => setRenaming(true)}
              >
                <Icon name="Pen" size={18} />
              </Button>
            </CanAccess>
            <CanAccess permission="folders.delete">
              <Form
                onBefore={() => {
                  return window.confirm(t('actions.delete.confirm'))
                }}
                route="admin.file_folders.destroy"
                routeParams={{ id: folder.id }}
              >
                {({ processing }) => (
                  <>
                    <Button
                      variant="icon_danger"
                      title={t('actions.delete.value', { folder: folder.name })}
                      type="submit"
                      disabled={processing}
                    >
                      <Icon name="Trash" size={18} />
                    </Button>
                  </>
                )}
              </Form>
            </CanAccess>
          </div>
        </div>
      </div>
      {(expanded || addingChild) && (
        <div className="mt-1 space-y-1">
          {addingChild && (
            <div className={indentClass[depth]}>
              <CreateFolderForm
                parentId={folder.id}
                label={t('name.sub')}
                onSuccess={() => setAddingChild(false)}
                translations={translations}
              />
            </div>
          )}
          {expanded &&
            folder.children?.map((child) => (
              <FolderNode
                key={child.id}
                folder={child}
                depth={Math.min(depth + 1, 5) as FolderNodeProps['depth']}
                translations={translations}
              />
            ))}
        </div>
      )}
    </div>
  )
}

interface CreateFolderFormProps {
  parentId: number | null
  label: string
  onSuccess?: () => void
  translations: AdminFileFoldersTranslations
}

function CreateFolderForm(props: CreateFolderFormProps) {
  const { parentId, label, onSuccess, translations } = props
  const { t } = useTranslation(translations)
  return (
    <Card>
      <Form
        route="admin.file_folders.execute"
        className="grid gap-2"
        onSuccess={() => {
          if (onSuccess) {
            onSuccess()
          }
        }}
      >
        {({ processing }) => (
          <>
            {parentId && (
              <input type="hidden" name="parentId" id="parentId" defaultValue={parentId} />
            )}
            <Field type="text" label={label} name="name" placeholder="Folder name" sanitize />
            <Button type="submit" variant="primary" disabled={processing} fitContent>
              {t('actions.create')}
            </Button>
            {parentId !== null && <p className="text-xs text-ink-subtle mt-1.5">{t('help')}</p>}
          </>
        )}
      </Form>
    </Card>
  )
}

FileFoldersPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
