import { useState, useRef } from 'react';
import './KeyboardShortcuts.css';

function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const hideTimeoutRef = useRef(null);

  const shortcuts = [
    { key: 'Double-click', action: 'Create shape' },
    { key: 'Scroll', action: 'Zoom in/out' },
    { key: 'Shift + Drag', action: 'Selection box' },
    { key: 'Ctrl/Cmd + Click', action: 'Multi-select' },
    { key: 'Ctrl/Cmd + Z', action: 'Undo' },
    { key: 'Ctrl/Cmd + Y', action: 'Redo' },
    { key: 'Ctrl/Cmd + C', action: 'Copy' },
    { key: 'Ctrl/Cmd + V', action: 'Paste' },
    { key: 'Escape', action: 'Deselect' },
    { key: 'Delete', action: 'Delete shape' },
    { key: 'Arrow Keys', action: 'Nudge shape' },
  ];

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowHelp(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowHelp(false);
    }, 100);
  };

  return (
    <div 
      className="keyboard-shortcuts-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="toolbar-button"
        title="Keyboard Shortcuts (Hover for help)"
      >
        ?
      </button>
      
      {showHelp && (
        <div className="shortcuts-dropdown">
          <div className="shortcuts-header">Keyboard Shortcuts</div>
          <div className="shortcuts-list">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <span className="shortcut-key">{shortcut.key}</span>
                <span className="shortcut-action">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default KeyboardShortcuts;

