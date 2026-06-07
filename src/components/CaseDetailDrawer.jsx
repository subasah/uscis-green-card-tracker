import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import CaseDetail from './CaseDetail';

export default function CaseDetailDrawer({ caseDetail, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !caseDetail) return null;

  const title = caseDetail.record?.blockNumber || caseDetail.record?.category || 'Case details';

  return createPortal(
    <div className="case-drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="case-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-drawer-header">
          <div>
            <span className="case-drawer-label">Case details</span>
            <strong>{title}</strong>
          </div>
          <button type="button" className="case-drawer-close" onClick={onClose} aria-label="Close case details">
            ×
          </button>
        </header>
        <div className="case-drawer-scroll">
          <CaseDetail {...caseDetail} embedded drawer onClose={onClose} />
        </div>
      </aside>
    </div>,
    document.body
  );
}
