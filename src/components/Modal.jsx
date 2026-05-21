import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Ic from './Ic';
import styles from './Modal.module.css';

export default function Modal({ open, onClose, title, children, footer }) {
  const [vp, setVp] = useState(null);

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setVp({ top: vv.offsetTop, height: vv.height });
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setVp(null);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // bottom: 'auto' anula o bottom: 0 do inset: 0 do CSS para o height do JS funcionar
  const vpStyle = vp
    ? { top: vp.top, height: vp.height, bottom: 'auto' }
    : undefined;

  return createPortal(
    <div className={styles.overlay} style={vpStyle} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">
            <Ic name="x" size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
