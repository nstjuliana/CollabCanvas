import { useRef } from 'react';
import { SHAPE_DEFAULTS } from '../utils/constants';

function TextEditor({
  isEditingText,
  editingTextPosition,
  editingTextValue,
  setEditingTextValue,
  finishTextEditing,
  cancelTextEditing,
  selectedColor,
  editingTextTransform,
  stageRef
}) {
  const textareaRef = useRef(null);

  if (!isEditingText) return null;

  // Get current stage scale directly for accurate sizing
  const currentScale = stageRef.current ? stageRef.current.scaleX() : 1;
  
  const avgScale = (editingTextTransform.scaleX + editingTextTransform.scaleY) / 2;
  const visualFontSize = editingTextTransform.fontSize * avgScale * currentScale;
  
  // Calculate dynamic dimensions based on content
  const lines = editingTextValue.split('\n');
  const lineCount = lines.length || 1;
  
  // Measure actual text width using canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${visualFontSize}px ${SHAPE_DEFAULTS.TEXT_FONT_FAMILY}`;
  
  // Get the width of the longest line
  let maxWidth = 0;
  lines.forEach(line => {
    const metrics = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  });
  
  // Add small padding for cursor
  const padding = 4;
  const minWidth = visualFontSize;
  const dynamicWidth = Math.max(maxWidth + padding, minWidth);
  const dynamicHeight = Math.max(lineCount * visualFontSize * 1.2, visualFontSize * 1.2);
  
  return (
    <textarea
      ref={textareaRef}
      className="text-editor"
      value={editingTextValue}
      onChange={(e) => setEditingTextValue(e.target.value)}
      onBlur={finishTextEditing}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelTextEditing();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          finishTextEditing();
        }
      }}
      style={{
        position: 'absolute',
        left: `${editingTextPosition.x}px`,
        top: `${editingTextPosition.y}px`,
        fontSize: `${visualFontSize}px`,
        fontFamily: SHAPE_DEFAULTS.TEXT_FONT_FAMILY,
        color: selectedColor,
        background: 'transparent',
        border: '1px solid #0066ff',
        padding: '0',
        margin: '0',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        lineHeight: '1.2',
        transformOrigin: 'top left',
        transform: `rotate(${editingTextTransform.rotation}deg)`,
        zIndex: 1000,
        boxSizing: 'border-box',
        width: `${dynamicWidth}px`,
        height: `${dynamicHeight}px`,
        minWidth: '20px',
        minHeight: '20px',
      }}
    />
  );
}

export default TextEditor;
