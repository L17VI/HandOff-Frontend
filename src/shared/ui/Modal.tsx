import { useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  title: string
  trigger: ReactNode
  children: ReactNode
  triggerClassName?: string
  triggerLabel?: string
}

export function Modal({ title, trigger, children, triggerClassName, triggerLabel }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  return <>
    <button type="button" className={triggerClassName} aria-label={triggerLabel} onClick={() => dialogRef.current?.showModal()}>{trigger}</button>
    <dialog ref={dialogRef} className="modal" aria-label={title} onClick={(event) => {
      if (event.target === event.currentTarget) dialogRef.current?.close()
    }}>
      <div className="modal-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Закрыть" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button></div>
      {children}
    </dialog>
  </>
}
