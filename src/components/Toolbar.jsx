import ColorPicker from './ColorPicker';
import { TOOL_TYPES } from '../utils/constants';

function Toolbar({
  selectedTool,
  setSelectedTool,
  selectedColor,
  handleColorChange,
  shapesLength,
  loading,
  error,
  resetCanvas,
  fitToView,
  stageScale,
  handleClearCanvas
}) {
  return (
    <div className="toolbar">
      {/* Shapes */}
      <button
        onClick={() => setSelectedTool(TOOL_TYPES.RECTANGLE)}
        className={`toolbar-button ${selectedTool === TOOL_TYPES.RECTANGLE ? 'active' : ''}`}
        title="Rectangle Tool (Double-click to create)"
      >
        ■
      </button>
      <button
        onClick={() => setSelectedTool(TOOL_TYPES.CIRCLE)}
        className={`toolbar-button ${selectedTool === TOOL_TYPES.CIRCLE ? 'active' : ''}`}
        title="Circle Tool (Double-click to create)"
      >
        ⬤
      </button>
      <button
        onClick={() => setSelectedTool(TOOL_TYPES.TEXT)}
        className={`toolbar-button ${selectedTool === TOOL_TYPES.TEXT ? 'active' : ''}`}
        title="Text Tool (Click to add text)"
      >
        T
      </button>
      
      <div className="toolbar-divider"></div>
      
      {/* Color Picker */}
      <ColorPicker
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
        disabled={false}
      />
      
      <div className="toolbar-divider"></div>
      
      {/* Deletion Tools */}
      <button
        onClick={() => setSelectedTool(TOOL_TYPES.DELETE)}
        className={`toolbar-button ${selectedTool === TOOL_TYPES.DELETE ? 'active' : ''}`}
        title="Delete Tool (Click shapes to delete)"
      >
        🗑️
      </button>
      <button
        onClick={handleClearCanvas}
        className="toolbar-button"
        disabled={shapesLength === 0}
        title={shapesLength === 0 ? "No shapes to clear" : "Clear all shapes from canvas"}
      >
        💣
      </button>
      
      <div className="toolbar-divider"></div>
      
      {/* Zoom Settings */}
      <button
        onClick={resetCanvas}
        className="toolbar-button"
        title="Reset View"
      >
        🔄
      </button>
      <button
        onClick={fitToView}
        className="toolbar-button"
        title="Fit to View"
      >
        ⛶
      </button>
      
      <div className="toolbar-divider"></div>
      
      <div className="toolbar-info">
        <span className="zoom-value">{Math.round(stageScale * 100)}%</span>
      </div>

      {loading && (
        <div className="toolbar-status loading">
          <span>⏳</span>
        </div>
      )}

      {error && (
        <div className="toolbar-status error" title={error}>
          <span>⚠️</span>
        </div>
      )}
    </div>
  );
}

export default Toolbar;
