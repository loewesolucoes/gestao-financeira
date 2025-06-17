import { useEffect, useState } from 'react';
import { useEnv } from '../contexts/env';

interface CustomProps {
  children?: any
  title?: any
  onClose?: () => void
  hideFooter?: boolean
}

export function Modal({ children, title, onClose, hideFooter }: CustomProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { isMobile } = useEnv()

  function onCloseClick() {
    setIsOpen(false);
    onClose && onClose();
  }

  function onCloseClickBackdrop(event: any) {
    if (event?.target?.id === 'modal') {
      onCloseClick();
    }
  }

  function onCloseEscape(event: any) {
    if (event?.key === "Escape") {
      //Do whatever when esc is pressed
      onCloseClick();
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", onCloseEscape, false);

    return () => {
      document.removeEventListener("keydown", onCloseEscape, false);
    };
  }, []);


  return (
    <>
      <div className={`modal modal-lg fade ${isOpen && 'show'}`} id="modal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true" style={{ zIndex: 99, display: isOpen ? 'block' : 'none' }} onClick={onCloseClickBackdrop}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">{title}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={onCloseClick}></button>
            </div>
            <div className="modal-body">
              {children}
            </div>
            {!hideFooter && (
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={onCloseClick}>Close</button>
              </div>
            )}
          </div>
          {isMobile ? <div className="py-5"></div> : null}
        </div>
      </div>
      <div className={`modal-backdrop fade ${isOpen && 'show'}`} style={{ zIndex: 98 }} onClick={onCloseClickBackdrop}></div>
    </>
  );
}
