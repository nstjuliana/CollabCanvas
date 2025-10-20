import { useState, useRef } from 'react';
import ColorPicker from './ColorPicker';
import KeyboardShortcuts from './KeyboardShortcuts';
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
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const hideTimeoutRef = useRef(null);

  const shapes = [
    { type: TOOL_TYPES.RECTANGLE, icon: '■', title: 'Rectangle' },
    { type: TOOL_TYPES.CIRCLE, icon: '⬤', title: 'Circle' },
    { type: TOOL_TYPES.STAR, icon: '★', title: 'Star' },
    { type: TOOL_TYPES.LINE, icon: '╱', title: 'Line' },
    { type: TOOL_TYPES.TEXT, icon: 'T', title: 'Text' },
  ];

  const selectedShape = shapes.find(s => s.type === selectedTool);
  const isShapeTool = shapes.some(s => s.type === selectedTool);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowShapesMenu(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowShapesMenu(false);
    }, 100);
  };

  return (
    <div className="toolbar">
      {/* Unified Shapes Menu */}
      <div 
        className="toolbar-shapes-menu"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`toolbar-button ${isShapeTool ? 'active' : ''}`}
          title="Shapes (Hover to expand)"
        >
          {selectedShape ? selectedShape.icon : '■'}
        </button>
        
        {showShapesMenu && (
          <div className="shapes-dropdown">
            {shapes.map(shape => (
              <button
                key={shape.type}
                onClick={() => setSelectedTool(shape.type)}
                className={`toolbar-button ${selectedTool === shape.type ? 'active' : ''}`}
                title={shape.title}
              >
                {shape.icon}
              </button>
            ))}
          </div>
        )}
      </div>
      
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

      <div className="toolbar-divider"></div>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcuts />

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
