import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  children: ReactNode
  handleClose?: () => void
}

export function Modal(props: ModalProps) {
  const { children, handleClose } = props

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && handleClose) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose])

  return createPortal(
    <div className="absolute flex inset-0 items-center justify-center">
      <div className="absolute inset-0 bg-black/80 z-1000" onClick={handleClose} />
      <div className="relative z-1001">{children}</div>
    </div>,
    document.body
  )
}
