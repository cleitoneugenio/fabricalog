import { useState, useRef, useEffect } from 'react';
import styles from './PontoCellEditor.module.css';

const QUICK_VALUES = [35, 40, 75, 80, 110];

export default function PontoCellEditor({ value, nota, onSave, onClose }) {
  const [input, setInput] = useState(value === 'F' ? '' : String(value ?? ''));
  const [noteInput, setNoteInput] = useState(nota ?? '');
  const [showNote, setShowNote] = useState(!!(nota && nota.trim()));
  const valueRef = useRef();
  const noteRef = useRef();

  useEffect(() => {
    valueRef.current?.focus();
    valueRef.current?.select();
  }, []);

  function commit(val) {
    onSave(val, noteInput.trim());
    onClose();
  }

  function handleKeyValue(e) {
    if (e.key === 'Enter') {
      if (showNote) { noteRef.current?.focus(); }
      else { commit(input === '' ? '' : input); }
    }
    if (e.key === 'Escape') onClose();
  }

  function handleKeyNote(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(input === '' ? '' : input); }
    if (e.key === 'Escape') onClose();
  }

  function toggleNote() {
    setShowNote(s => {
      if (!s) setTimeout(() => noteRef.current?.focus(), 0);
      else setNoteInput('');
      return !s;
    });
  }

  const currentNum = Number(input);

  return (
    <div className={styles.popover} data-cell>
      {/* Quick-value chips */}
      <div className={styles.chips}>
        {QUICK_VALUES.map(v => (
          <button
            key={v}
            className={`${styles.chip} ${currentNum === v && value !== 'F' ? styles.chipActive : ''}`}
            onMouseDown={e => { e.preventDefault(); commit(String(v)); }}
          >
            {v}
          </button>
        ))}
        <button
          className={`${styles.chip} ${styles.chipF} ${value === 'F' ? styles.chipFActive : ''}`}
          onMouseDown={e => { e.preventDefault(); commit('F'); }}
        >
          F
        </button>
      </div>

      {/* Free-text input + note toggle */}
      <div className={styles.top}>
        <input
          ref={valueRef}
          type="text"
          inputMode="decimal"
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyValue}
          placeholder="outro valor"
        />
        <button
          className={`${styles.noteToggle} ${showNote ? styles.noteToggleActive : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleNote(); }}
          title="Adicionar nota"
        >
          ✎
        </button>
      </div>

      {showNote && (
        <textarea
          ref={noteRef}
          className={styles.noteInput}
          value={noteInput}
          onChange={e => setNoteInput(e.target.value)}
          onKeyDown={handleKeyNote}
          placeholder="nota..."
          rows={2}
        />
      )}
    </div>
  );
}
