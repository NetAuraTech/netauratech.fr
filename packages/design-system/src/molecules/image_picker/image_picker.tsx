import { ChangeEvent, CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { cn, tv } from 'tailwind-variants';
import { Icon } from '../../atoms/icon/icon';

/**
 * Minimal file reference the picker needs to display a preview and submit a
 * value: the form value (the file id) and the preview URL.
 */
export type PickedFile = {
	/** File identifier submitted as the form value. */
	id: number;
	/** Preview URL of the file. */
	url: string;
};

const imagePicker = tv({
	base: 'relative input h-45 w-full cursor-pointer bg-no-repeat bg-cover bg-center',
});

interface ImagePickerProps {
	/** The `name` and `id` attribute of the underlying `<input>`. */
	name: string;
	defaultValue?: string | number;
	disabled?: boolean;
	required?: boolean;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (event?: ChangeEvent<HTMLInputElement>) => void;
	/**
	 * Resolves the file referenced by `defaultValue` into a preview. Injected
	 * by the caller (e.g. a query hitting the files API) — the component
	 * never fetches on its own. Omit it when the picker starts empty.
	 */
	loadFile?: (id: number) => Promise<PickedFile | null>;
	/**
	 * Renders the file-manager surface opened when the preview is clicked.
	 * The app injects its own file manager (an organism that owns the file
	 * browsing data); it receives the callbacks the picker wires to its
	 * selection state. Omit it for a preview-only picker.
	 */
	renderFileManager?: (onChoose: (file: PickedFile) => void, onClose: () => void) => ReactNode;
	children?: ReactNode;
	/** Additional Tailwind classes merged onto the preview. */
	className?: string;
}

/**
 * Image field control: a clickable preview box backed by a hidden numeric
 * input that carries the file id.
 *
 * Clicking the preview opens the file manager rendered by the injected
 * `renderFileManager`; choosing a file sets the preview, writes the file id
 * into the hidden input, and re-emits `onChange` so controlled form state
 * stays in sync.
 *
 * The component is 100% props/children: the initial file is resolved through
 * the injected `loadFile` query function and the file manager surface is
 * injected by the caller — the package owns no app data and no API endpoint.
 *
 * @example
 * <ImagePicker
 *   name="thumbnailId"
 *   defaultValue={thumbnailId}
 *   loadFile={loadFileById}
 *   onChange={(event) => setThumbnailId(Number(event.target.value) || null)}
 *   renderFileManager={(onChoose, onClose) => (
 *     <FileManager mime_type="image" handleClick={onChoose} handleClose={onClose} />
 *   )}
 * />
 */
export function ImagePicker(props: ImagePickerProps) {
	const {
		name,
		defaultValue,
		disabled,
		required,
		onChange,
		onBlur,
		loadFile,
		renderFileManager,
		className,
		...inputProps
	} = props;
	const [showFileManager, setShowFileManager] = useState<boolean>(false);
	const [currentFile, setCurrentFile] = useState<PickedFile | null>(null);
	const ref = useRef<HTMLInputElement | null>(null);

	const handleClick = () => {
		ref.current?.focus();
		setShowFileManager(true);
	};

	const handleChoose = (file: PickedFile) => {
		setCurrentFile(file);
		triggerInputChange(file.id, ref.current);
		handleClose();
	};

	const handleClose = () => {
		ref.current?.blur();

		setShowFileManager(false);
	};

	const triggerInputChange = (value: any, node?: HTMLInputElement | null) => {
		const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');

		if (node && descriptor && descriptor.set) {
			descriptor.set.call(node, value);

			const event = new Event('input', { bubbles: true });
			node.dispatchEvent(event);
		}
	};

	useEffect(() => {
		handleFetch();
	}, []);

	const handleFetch = async () => {
		if (defaultValue && loadFile) {
			const file = await loadFile(Number(defaultValue));

			setCurrentFile(file ?? null);
		}
	};

	return (
		<>
			<div
				className={cn(imagePicker(), className)}
				onClick={() => handleClick()}
				style={{ backgroundImage: currentFile ? `url(${currentFile.url})` : '' } as CSSProperties}
			>
				{!currentFile && (
					<div className="absolute inset-0 flex justify-center items-center transition-colors hover:bg-black/20">
						<Icon name="Image" size={42} />
					</div>
				)}
			</div>
			<input
				ref={ref}
				name={name}
				id={name}
				defaultValue={defaultValue}
				disabled={disabled}
				required={required}
				onChange={onChange}
				onBlur={onBlur}
				className="w-0 h-0 opacity-0"
				{...inputProps}
				type="number"
			/>
			{showFileManager && renderFileManager?.(handleChoose, handleClose)}
		</>
	);
}
