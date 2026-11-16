import { useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  title: string
  trigger: ReactNode
  children: ReactNode
  triggerClassName?: string
  triggerLabel?: string
  onClose?: () => void
}

export function Modal({ title, trigger, children, triggerClassName, triggerLabel, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pressedOutsideRef = useRef(false)
  function isOutside(event: { clientX: number; clientY: number }, dialog: HTMLDialogElement) {
    const rect = dialog.getBoundingClientRect()
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
  }
  return <>
    <button ref={triggerRef} type="button" className={triggerClassName} aria-label={triggerLabel} onClick={() => dialogRef.current?.showModal()}>{trigger}</button>
    <dialog ref={dialogRef} className="modal" aria-label={title} onClose={() => { triggerRef.current?.focus(); onClose?.() }} onPointerDown={(event) => { pressedOutsideRef.current = isOutside(event, event.currentTarget) }} onPointerUp={(event) => {
      if (pressedOutsideRef.current && isOutside(event, event.currentTarget)) event.currentTarget.close()
      pressedOutsideRef.current = false
    }}>
      <div className="modal-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Закрыть" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button></div>
      {children}
    </dialog>
  </>
}
