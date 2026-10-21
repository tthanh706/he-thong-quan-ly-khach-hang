import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  open?: boolean;
  isOpen?: boolean;
};

export function Modal({ title, children, onClose, open, isOpen }: Props) {
  if (open === false || isOpen === false) {
    return null;
  }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
