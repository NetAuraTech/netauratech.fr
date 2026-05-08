import { Button, variants as button_variants } from '~/components/atoms/button'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { Paginated } from '~/types/paginated'
import { useMenu } from '~/hooks/use_admin'
import { CanAccess } from '~/guards/can_access'
import { ReactElement, useState } from 'react'
import Layout from '~/layouts/admin'
import { Field } from '~/components/molecules/field'
import { SelectOption } from '~/components/atoms/select_option'
import { Icon } from '~/components/atoms/icon'
import { Pagination } from '~/components/molecules/pagination'
import { Data } from '@generated/data'
import { Card } from '~/components/atoms/card'
import Table from '~/components/atoms/table/table'
import { humanSize, isImage } from '~/utils/file'
import { NavLink } from '~/components/atoms/nav_link'
import { FileAltEditor } from '~/components/organisms/files/file_alt_editor'
import { FileUploadInput } from '~/components/atoms/file_upload_input'
import { Modal } from '~/components/atoms/modal'
import { Lang, useTranslation } from '~/hooks/use_translation'
import type { CmsFilesTranslations } from '#types/translations'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { Form } from '@adonisjs/inertia/react'

interface Props {
  files: Paginated<Data.File>
  folders: Data.FileFolder[]
  filters: {
    folder_id?: number
    mime_type?: string
    search?: string
  }
  translations: CmsFilesTranslations
}

export default function FilesIndexPage(props: Props) {
  const { files, filters, folders, translations } = props
  const pageProps = usePage<SharedProps>().props
  const { t, format } = useTranslation(translations)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false)

  const { getEntryIcon } = useMenu()

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid')
  }

  const selectedFile = files.data.find((f) => f.id === selectedId) ?? null

  return (
    <AdminMain
      title={t('title')}
      icon={getEntryIcon('admin.files.render')}
      action={
        <div className="flex items-center gap-3">
          <CanAccess permission="users.create">
            <Button onClick={() => setShowUploadForm(true)} variant="outline" fitContent>
              <Icon name="Upload" />
              {t('action.upload')}
            </Button>
          </CanAccess>
          <CanAccess permission="users.create">
            <Button route="admin.file_folders.render" variant="secondary" fitContent>
              <Icon name="Folders" />
              {t('action.folders')}
            </Button>
          </CanAccess>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-3">
        <Card className="md:w-fit">
          <NavLink
            route="admin.files.render"
            qs={{
              ...Object.fromEntries(
                Object.entries({ ...filters, folder_id: null }).filter(
                  ([_, value]) => value !== null
                )
              ),
            }}
            label={t('folders.all')}
            variant="admin_nav"
          />
          {folders
            .filter((f) => !f.parentId)
            .map((folder) => (
              <FolderEntry
                key={`folder-${folder.id}`}
                folder={folder}
                depth={0}
                filters={filters}
              />
            ))}
        </Card>
        <Card
          header={
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Form
                route="admin.files.render"
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
              >
                {filters.folder_id && (
                  <input
                    type="hidden"
                    name="folder_id"
                    id="folder_id"
                    defaultValue={filters.folder_id}
                  />
                )}
                <Field
                  type="text"
                  name="search"
                  label={t('search.value')}
                  placeholder="..."
                  defaultValue={filters.search}
                  sanitize
                />
                <Field
                  type="select"
                  name="mime_type"
                  label={t('search.type.value')}
                  placeholder={t('search.type.options.placeholder')}
                  defaultValue={filters.mime_type}
                  sanitize
                >
                  <SelectOption label={t('search.type.options.image')} value="image" />
                  <SelectOption label={t('search.type.options.video')} value="video" />
                  <SelectOption label={t('search.type.options.audio')} value="audio" />
                  <SelectOption label={t('search.type.options.pdf')} value="application/pdf" />
                </Field>
                <Button type="submit" fitContent>
                  {t('search.filter')}
                </Button>
              </Form>
              <div className="flex border border-edge rounded-lg overflow-hidden">
                <Button type="button" onClick={toggleViewMode}>
                  {viewMode === 'grid' ? <Icon name="LayoutGrid" /> : <Icon name="List" />}
                </Button>
              </div>
            </div>
          }
          footer={
            <Pagination route="admin.files.render" filters={filters} metadata={files.metadata} />
          }
          className="md:flex-1"
          padding="p-0"
        >
          <div className="flex flex-col-reverse md:flex-row">
            <div className="flex-1 p-8">
              {files.data.length === 0 ? (
                <UploadFileForm filters={filters} translations={translations} />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {files.data.map((file) => (
                    <button
                      key={`file-${file.id}`}
                      className={`group relative aspect-square rounded-xl border overflow-hidden transition-all ${selectedId === file.id ? 'border-primary ring-2 ring-primary-light' : 'border-edge hover:border-primary-soft'}`}
                      onClick={() => setSelectedId(selectedId === file.id ? null : file.id)}
                    >
                      {isImage(file.mimeType) ? (
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-sunken gap-1 text-ink-subtle">
                          <Icon name="FileText" size={64} />
                          <span className="font-medium text-ink truncate max-w-48">
                            {file.originalName}
                          </span>
                          <span className="text-xs text-ink-subtle">{humanSize(file.size)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>{t('name')}</Table.HeaderCell>
                      <Table.HeaderCell>{t('type')}</Table.HeaderCell>
                      <Table.HeaderCell>{t('size')}</Table.HeaderCell>
                      <Table.HeaderCell>{t('uploaded_at')}</Table.HeaderCell>
                      <Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {files.data.map((file) => (
                      <Table.Row
                        key={`file-${file.id}`}
                        onClick={() => setSelectedId(selectedId === file.id ? null : file.id)}
                      >
                        <Table.Cell className="flex flex-row" data-label={t('name')}>
                          {isImage(file.mimeType) ? (
                            <img
                              src={file.url}
                              alt={file.originalName}
                              className="w-24 h-24 rounded object-cover border border-edge shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded bg-sunken border border-egde flex items-center justify-center shrink-0 text-ink-subtle">
                              <Icon name="FileText" size={32} />
                            </div>
                          )}
                          <span className="text-xs font-medium text-ink truncate max-w-48">
                            {file.originalName}
                          </span>
                        </Table.Cell>
                        <Table.Cell data-label={t('type')}>{file.mimeType}</Table.Cell>
                        <Table.Cell data-label={t('size')}>{humanSize(file.size)}</Table.Cell>
                        <Table.Cell data-label={t('uploaded_at')}>
                          {format(new Date(file.createdAt!), 'medium', pageProps.locale as Lang)}
                        </Table.Cell>
                        <Table.Cell data-label={t('actions.value')}>
                          <div className="flex items-center w-full py-4 gap-2">
                            <CanAccess permission="files.delete">
                              <Form
                                onBefore={() => {
                                  return window.confirm(t('actions.delete.confirm'))
                                }}
                                route="admin.files.destroy"
                                routeParams={{ id: file.id }}
                              >
                                {({ processing }) => (
                                  <>
                                    <Button
                                      variant="icon_danger"
                                      title={t('actions.delete.value', {
                                        filename: file.originalName,
                                      })}
                                      fitContent
                                      disabled={processing}
                                    >
                                      <Icon name="Trash" size={18} />
                                    </Button>
                                  </>
                                )}
                              </Form>
                            </CanAccess>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
            {selectedFile && (
              <div className="border-l border-l-edge bg-sunken p-4 w-90">
                <Card padding="p-0">
                  {isImage(selectedFile.mimeType) ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.originalName}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-sunken flex items-center justify-center text-ink-subtle">
                      <Icon name="FileText" size={64} />
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium text-ink truncate">
                      {selectedFile.originalName}
                    </p>
                    <p className="text-xs text-ink-muted">{humanSize(selectedFile.size)}</p>
                    <p className="text-xs font-mono text-ink-subtle break-all bg-sunken px-2 py-1 rounded">
                      ID: {selectedFile.id}
                    </p>
                    <div className="pt-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between w-full py-4 gap-2">
                        <a
                          className={`button ${button_variants['icon_info']}`}
                          href={selectedFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('actions.show')}
                        >
                          <Icon name="ExternalLink" size={18} />
                        </a>
                        <CanAccess permission="files.delete">
                          <Form
                            onBefore={() => {
                              return window.confirm(t('actions.delete.confirm'))
                            }}
                            route="admin.files.destroy"
                            routeParams={{ id: selectedFile.id }}
                          >
                            {({ processing }) => (
                              <>
                                <Button
                                  variant="icon_danger"
                                  title={t('actions.delete.value', {
                                    filename: selectedFile.originalName,
                                  })}
                                  fitContent
                                  disabled={processing}
                                >
                                  <Icon name="Trash" size={18} />
                                </Button>
                              </>
                            )}
                          </Form>
                        </CanAccess>
                      </div>
                      <div className="pt-2 border-t border-edge">
                        <FileAltEditor file={selectedFile} translations={translations} />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
      {showUploadForm && (
        <Modal handleClose={() => setShowUploadForm(false)}>
          <Card
            className="md:min-w-180 lg:min-w-240 relative z-1001"
            header={
              <div className="flex justify-end">
                <Button variant="icon" onClick={() => setShowUploadForm(false)} fitContent>
                  <Icon name="X" />
                </Button>
              </div>
            }
          >
            <UploadFileForm
              filters={filters}
              callback={setShowUploadForm}
              translations={translations}
            />
          </Card>
        </Modal>
      )}
    </AdminMain>
  )
}

interface FolderEntryProps {
  folder: Data.FileFolder
  depth: 0 | 1 | 2 | 3 | 4 | 5
  filters: Props['filters']
}

const FolderEntry = (props: FolderEntryProps) => {
  const { folder, depth, filters } = props

  const indentClass = {
    0: '',
    1: 'ml-2',
    2: 'ml-4',
    3: 'ml-6',
    4: 'ml-8',
    5: 'ml-10',
  }

  return (
    <div className={`${indentClass[depth]} mt-1`}>
      <NavLink
        key={`folder-${folder.id}`}
        route="admin.files.render"
        qs={{
          ...Object.fromEntries(
            Object.entries({ ...filters, folder_id: folder.id }).filter(
              ([_, value]) => value !== null
            )
          ),
        }}
        label=""
        variant="admin_nav"
      >
        <Icon name="Folder" size={16} />
        <span className="truncate max-w-60 md:max-w-30">{folder.name}</span>
      </NavLink>
      {folder.children?.map((child) => (
        <FolderEntry
          key={`folder-${child.id}`}
          folder={child}
          depth={Math.min(depth + 1, 5) as FolderEntryProps['depth']}
          filters={filters}
        />
      ))}
    </div>
  )
}

interface UploadFileProps {
  filters: Props['filters']
  callback?: (value: boolean) => void
  translations: CmsFilesTranslations
}

const UploadFileForm = (props: UploadFileProps) => {
  const { filters, callback, translations } = props
  const { t } = useTranslation(translations)

  return (
    <Form
      route="admin.files.upload"
      className="grid gap-3"
      onSuccess={() => {
        if (callback) {
          callback(false)
        }
      }}
    >
      {filters.folder_id && (
        <input type="hidden" name="folder_id" id="folder_id" defaultValue={filters.folder_id} />
      )}
      <FileUploadInput
        name="file"
        accept="image/*,.pdf,.mp4,.mp3,.zip"
        maxSize={10 * 1024 * 1024}
        translations={translations}
        required
      />
      <div className="flex justify-center">
        <Button type="submit" variant="primary" fitContent>
          <Icon name="Upload" /> {t('upload.value')}
        </Button>
      </div>
    </Form>
  )
}

FilesIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
