import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { Input } from '@foundry/design-system/input';
import { NavLink } from '@foundry/design-system/nav-link';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Data } from '@generated/data';
import { ReactElement, useState } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { sanitizeText } from '~/helpers/sanitization';
import { useNavLinkActive } from '~/hooks/use_nav_link_active';
import { useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import type { AdminFileFoldersTranslations } from '#transport/file/helpers/i18n_payloads/file_folders';

interface PageProps {
	roots: Data.File.FileFolder[];
	translations: AdminFileFoldersTranslations;
}

export default function FileFoldersPage(props: PageProps) {
	const { roots, translations } = props;
	const { t } = useTranslation(translations);

	return (
		<>
			<AdminMain
				title={t('title')}
				icon="Folders"
				action={
					<CanAccess permission="folders.create">
						<Button variant="secondary" href={urlFor('admin.file.file_folders.render')} fitContent>
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
	);
}
interface FolderNodeProps {
	folder: Data.File.FileFolder;
	depth: 0 | 1 | 2 | 3 | 4 | 5;
	translations: AdminFileFoldersTranslations;
}

function FolderNode(props: FolderNodeProps) {
	const { folder, depth, translations } = props;
	const { t } = useTranslation(translations);
	const [expanded, setExpanded] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [addingChild, setAddingChild] = useState(false);

	const hasChildren = folder.children?.length > 0;

	const browseHref = urlFor('admin.file.files.render', undefined, { qs: { folder_id: folder.id } });

	const indentClass = {
		0: '',
		1: 'ml-5',
		2: 'ml-10',
		3: 'ml-15',
		4: 'ml-20',
		5: 'ml-25',
	};

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
						<Icon name="ChevronRight" size={18} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
					</button>
					<Icon name="Folder" size={16} />
					{renaming ? (
						<Form
							action={actionFor('admin.file.file_folders.update', { id: folder.id })}
							className="flex items-center gap-2 flex-1 min-w-0"
							onSuccess={() => {
								setRenaming(false);
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
						<span className="text-sm font-medium text-ink flex-1 min-w-0 truncate">{folder.name}</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					{hasChildren && (
						<span className="text-xs text-ink-subtle bg-sunken border border-edge px-1.5 py-0.5 rounded-full shrink-0">
							{folder.children?.length}
						</span>
					)}
					<div className="flex items-center gap-1 shrink-0">
						<NavLink label="" href={browseHref} isActive={useNavLinkActive(browseHref)}>
							<Button variant="icon" title={t('browse')}>
								<Icon name="SquareMenu" size={18} />
							</Button>
						</NavLink>
						<CanAccess permission="folders.create">
							<Button
								variant="icon"
								title={t('actions.add')}
								onClick={() => {
									setAddingChild(!addingChild);
									setExpanded(true);
								}}
							>
								<Icon name="Plus" size={18} />
							</Button>
						</CanAccess>
						<CanAccess permission="folders.update">
							<Button variant="icon_warning" title={t('actions.rename')} onClick={() => setRenaming(true)}>
								<Icon name="Pen" size={18} />
							</Button>
						</CanAccess>
						<CanAccess permission="folders.delete">
							<Form
								action={actionFor('admin.file.file_folders.destroy', { id: folder.id })}
								onBefore={() => {
									return window.confirm(t('actions.delete.confirm'));
								}}
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
	);
}

interface CreateFolderFormProps {
	parentId: number | null;
	label: string;
	onSuccess?: () => void;
	translations: AdminFileFoldersTranslations;
}

function CreateFolderForm(props: CreateFolderFormProps) {
	const { parentId, label, onSuccess, translations } = props;
	const { t } = useTranslation(translations);
	return (
		<Card>
			<Form
				action={actionFor('admin.file.file_folders.execute')}
				className="grid gap-2"
				onSuccess={() => {
					if (onSuccess) {
						onSuccess();
					}
				}}
			>
				{({ processing }) => (
					<>
						{parentId && <input type="hidden" name="parentId" id="parentId" defaultValue={parentId} />}
						<Field type="text" label={label} name="name" placeholder="Folder name" sanitizeValue={sanitizeText} />
						<Button type="submit" variant="primary" disabled={processing} fitContent>
							{t('actions.create')}
						</Button>
						{parentId !== null && <p className="text-xs text-ink-subtle mt-1.5">{t('help')}</p>}
					</>
				)}
			</Form>
		</Card>
	);
}

FileFoldersPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
