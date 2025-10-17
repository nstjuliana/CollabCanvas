import { TOOL_TYPES } from '../utils/constants';

function CanvasInstructions({ selectedTool, selectedShapeIdsLength }) {
  return (
    <div className="canvas-instructions">
      <p>
        🖱️ Drag to pan • 🖲️ Scroll to zoom • 📎 Drag & drop images • 
        {selectedTool === TOOL_TYPES.DELETE 
          ? ' Click shapes to delete' 
          : selectedTool === TOOL_TYPES.TEXT
          ? ' Click to add text • Double-click text to edit'
          : selectedShapeIdsLength > 0
          ? ` ${selectedShapeIdsLength} shape${selectedShapeIdsLength > 1 ? 's' : ''} selected • Ctrl+Click to multi-select • Shift+Drag to select area`
          : ` Double-click to create ${selectedTool} • Click to select • Ctrl+Click to multi-select • Shift+Drag to select area`}
      </p>
    </div>
  );
}

export default CanvasInstructions;
