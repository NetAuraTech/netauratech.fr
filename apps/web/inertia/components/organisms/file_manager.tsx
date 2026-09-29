import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { Modal } from '@foundry/design-system/modal';
import { Pagination } from '@foundry/design-system/pagination';
import { Data } from '@generated/data';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { sanitizeText } from '~/helpers/sanitization';
import { useTranslation } from '~/hooks/use_translation';
import { Paginated } from '~/types/paginated';
import type { SharedProps } from '@adonisjs/inertia/types';

interface FileManagerProps {
	mime_type?: 'image' | 'video' | 'audio' | 'application/pdf';
	handleClose: () => void;
	handleClick: (file: Data.File.File) => void;
}

interface ApiFilters {
	folder_id?: number;
	mime_type?: string;
	search?: string;
}

export function FileManager(props: FileManagerProps) {
	const { mime_type, handleClose, handleClick } = props;
	const pageProps = usePage<SharedProps>().props;
	const { t: commonT } = useTranslation(pageProps.common_translations);
	const [files, setFiles] = useState<Paginated<Data.File.File>>({
		data: [],
		metadata: {
			total: 0,
			perPage: 0,
			currentPage: 0,
			lastPage: 0,
			firstPage: 0,
		},
	});
	const [folders, setFolders] = useState<Data.File.FileFolder[]>([]);
	const [filters, setFilters] = useState<ApiFilters>({ mime_type });

	useEffect(() => {
		handleFetch();
	}, [filters]);

	const handleFetch = async () => {
		const params = new URLSearchParams();

		if (filters.folder_id !== undefined) params.set('folder_id', String(filters.folder_id));
		if (filters.mime_type) params.set('mime_type', filters.mime_type);
		if (filters.search) params.set('search', filters.search);

		const [filesRes, foldersRes] = await Promise.all([
			fetch(`/api/v1/admin/files?${params.toString()}`, {
				method: 'GET',
				headers: { Accept: 'application/json' },
			}),
			fetch('/api/v1/admin/folders', {
				method: 'GET',
				headers: { Accept: 'application/json' },
			}),
		]);

		const files = await filesRes.json();
		const folders = await foldersRes.json();

		setFolders(folders.data ?? []);

		setFiles({
			data: files.data ?? [],
			metadata: files.metadata ?? {
				total: 0,
				perPage: 0,
				currentPage: 0,
				lastPage: 0,
				firstPage: 0,
			},
		});
	};

	const handleCurrentFolderChange = (id?: number | undefined) => {
		setFilters({ ...filters, folder_id: id });
	};

	const handlePaginationClick = (value: ApiFilters) => {
		setFilters(value);
	};

	return (
		<Modal handleClose={handleClose}>
			<Card
				padding="p-0"
				header={
					<div className="flex gap-2 items-center justify-between">
						<Button type="button" variant="icon" fitContent>
							<Icon name="Upload" size={18} />
						</Button>
						<Button type="button" variant="icon" onClick={handleClose} fitContent>
							<Icon name="X" size={18} />
						</Button>
					</div>
				}
				footer={
					<Pagination
						metadata={files.metadata}
						filters={filters as { [key: string]: string | number }}
						onClick={handlePaginationClick}
						summaryText={(start, end, total) => commonT('pagination.showing', { start, end, total })}
						previousTitle={commonT('pagination.previous')}
						nextTitle={commonT('pagination.next')}
					/>
				}
			>
				<div className="flex h-140">
					<div className="flex flex-col items-start gap-3 w-60 border-r border-sunken p-2">
						<Field type="text" name="search" label="Search to translate" sanitizeValue={sanitizeText} />
						<div>
							<button
								type="button"
								className="flex gap-2 items-center p-2 rounded cursor-pointer w-full hover:bg-primary hover:text-ink-inverted current:bg-primary current:text-ink-inverted"
								title="All to translate"
								aria-current={filters.folder_id === undefined ? 'page' : undefined}
								onClick={() => handleCurrentFolderChange()}
							>
								<Icon name="Folder" size={16} />
								<span className="truncate max-w-45">All to translate</span>
							</button>
							{folders
								.filter((f) => !f.parentId)
								.map((folder) => (
									<FolderEntry
										key={`folder-${folder.id}`}
										folder={folder}
										depth={0}
										filters={filters}
										onClick={handleCurrentFolderChange}
									/>
								))}
						</div>
					</div>
					<div className="w-180 p-4 overflow-y-scroll">
						<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
							{files.data.map((file) => (
								<button
									key={`file-${file.id}`}
									className={`group relative aspect-square rounded-xl border overflow-hidden transition-all border-edge hover:border-primary-soft`}
									onClick={() => handleClick(file)}
								>
									<img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
								</button>
							))}
						</div>
					</div>
				</div>
			</Card>
		</Modal>
	);
}

interface FolderEntryProps {
	folder: Data.File.FileFolder;
	depth: 0 | 1 | 2 | 3 | 4 | 5;
	filters: ApiFilters;
	onClick: (id: number) => void;
}

const FolderEntry = (props: FolderEntryProps) => {
	const { folder, depth, filters, onClick } = props;

	const indentClass = {
		0: '',
		1: 'ml-2',
		2: 'ml-4',
		3: 'ml-6',
		4: 'ml-8',
		5: 'ml-10',
	};

	return (
		<div className={`${indentClass[depth]} mt-1 w-full`}>
			<button
				type="button"
				className="flex gap-2 items-center p-2 rounded cursor-pointer w-full hover:bg-primary hover:text-ink-inverted current:bg-primary current:text-ink-inverted"
				title={folder.name}
				aria-current={filters.folder_id === folder.id ? 'page' : undefined}
				onClick={() => onClick(folder.id)}
			>
				<Icon name="Folder" size={16} />
				<span className="truncate max-w-45">{folder.name}</span>
			</button>
			{folder.children?.map((child) => (
				<FolderEntry
					key={`folder-${child.id}`}
					folder={child}
					depth={Math.min(depth + 1, 5) as FolderEntryProps['depth']}
					filters={filters}
					onClick={onClick}
				/>
			))}
		</div>
	);
};
