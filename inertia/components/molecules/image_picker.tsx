import { ChangeEvent, CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'
import { FileManager } from '~/components/organisms/file_manager'
import { Data } from '@generated/data'
import { Icon } from '~/components/atoms/icon'

interface ImagePickerProps {
  /** The `name` and `id` attribute of the underlying `<input>`. */
  name: string
  defaultValue?: string | number
  disabled?: boolean
  required?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event?: ChangeEvent<HTMLInputElement>) => void
  children?: ReactNode
}

export function ImagePicker(props: ImagePickerProps) {
  const { name, defaultValue, disabled, required, onChange, onBlur, ...inputProps } = props
  const [showFileManager, setShowFileManager] = useState<boolean>(false)
  const [currentFile, setCurrentFile] = useState<Data.File | null>(null)
  const ref = useRef<HTMLInputElement | null>(null)
  const handleClick = () => {
    ref.current?.focus()
    setShowFileManager(true)
  }

  const handleChoose = (file: Data.File) => {
    setCurrentFile(file)
    triggerInputChange(file.id, ref.current)
    handleClose()
  }

  const handleClose = () => {
    ref.current?.blur()

    setShowFileManager(false)
  }

  const triggerInputChange = (value: any, node?: HTMLInputElement | null) => {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')

    if (node && descriptor && descriptor.set) {
      descriptor.set.call(node, value)

      const event = new Event('input', { bubbles: true })
      node.dispatchEvent(event)
    }
  }

  const handleFetch = async () => {
    if (defaultValue) {
      const res = await fetch(`/api/v1/admin/files/${defaultValue}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
      const data = await res.json()

      setCurrentFile(data.data)
    }
  }

  useEffect(() => {
    handleFetch()
  }, [])

  return (
    <>
      <div
        className="relative input h-45 w-full cursor-pointer bg-no-repeat bg-cover bg-center"
        onClick={() => handleClick()}
        style={{ backgroundImage: currentFile ? `url(${currentFile?.url})` : '' } as CSSProperties}
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
        onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
        onBlur={onBlur}
        className="w-0 h-0 opacity-0"
        {...inputProps}
        type="number"
      />
      {showFileManager && (
        <FileManager mime_type="image" handleClick={handleChoose} handleClose={handleClose} />
      )}
    </>
  )
}
