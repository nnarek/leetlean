import { ReactNode } from 'react'

// LEETLEAN: Renamed 'hidden' to 'lean4web-hidden' to avoid global CSS conflict
/** A popup which overlays the entire screen. */
export function Popup({
  open,
  handleClose,
  children,
}: {
  open: boolean
  handleClose: () => void
  children?: ReactNode
}) {
  return (
    <div className={`modal-wrapper${open ? '' : ' lean4web-hidden'}`}>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal">
        <div className="codicon codicon-close modal-close" onClick={handleClose}></div>
        {children}
      </div>
    </div>
  )
}
