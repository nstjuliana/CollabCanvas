/**
 * PropertiesPanel Component
 * Displays and allows editing of properties for selected shapes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SHAPE_TYPES, SHAPE_COLORS } from '../utils/constants';
import './PropertiesPanel.css';

function PropertiesPanel({ 
  selectedShapeIds, 
  shapes, 
  updateShapes,
  isLockedByOther,
  addToHistory
}) {
  // Local state for input fields (to avoid flickering during typing)
  const [localProperties, setLocalProperties] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const isEditingRef = useRef(false); // Track if user is actively editing
  const updateTimeoutRef = useRef(null); // For debouncing updates
  const previousValuesRef = useRef({}); // Store values before editing for history

  // Get selected shapes
  const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
  const isSingleSelection = selectedShapes.length === 1;
  const isMultiSelection = selectedShapes.length > 1;
  const selectedShape = isSingleSelection ? selectedShapes[0] : null;

  // Check if any selected shapes are locked by others
  const hasLockedShapes = selectedShapes.some(s => isLockedByOther(s.id));

  // Initialize local properties when selection changes
  useEffect(() => {
    if (selectedShape) {
      setLocalProperties({
        x: Math.round(selectedShape.x) || 0,
        y: Math.round(selectedShape.y) || 0,
        width: Math.round(selectedShape.width) || 0,
        height: Math.round(selectedShape.height) || 0,
        rotation: Math.round(selectedShape.rotation || 0),
        fill: selectedShape.fill || '#FF6B6B',
        text: selectedShape.text || '',
        fontSize: selectedShape.fontSize || 24,
        strokeWidth: selectedShape.strokeWidth || 2,
        scaleX: (selectedShape.scaleX || 1).toFixed(2),
        scaleY: (selectedShape.scaleY || 1).toFixed(2),
        zIndex: selectedShape.zIndex || 0,
      });
      setHasChanges(false);
    } else {
      setLocalProperties({});
      setHasChanges(false);
    }
  }, [selectedShape?.id]);

  // Sync properties when shape is externally modified (e.g., via transform handles)
  // But only if user is not actively editing an input
  useEffect(() => {
    if (selectedShape && !isEditingRef.current && !hasChanges) {
      setLocalProperties({
        x: Math.round(selectedShape.x) || 0,
        y: Math.round(selectedShape.y) || 0,
        width: Math.round(selectedShape.width) || 0,
        height: Math.round(selectedShape.height) || 0,
        rotation: Math.round(selectedShape.rotation || 0),
        fill: selectedShape.fill || '#FF6B6B',
        text: selectedShape.text || '',
        fontSize: selectedShape.fontSize || 24,
        strokeWidth: selectedShape.strokeWidth || 2,
        scaleX: (selectedShape.scaleX || 1).toFixed(2),
        scaleY: (selectedShape.scaleY || 1).toFixed(2),
        zIndex: selectedShape.zIndex || 0,
      });
    }
  }, [
    selectedShape?.x,
    selectedShape?.y,
    selectedShape?.width,
    selectedShape?.height,
    selectedShape?.rotation,
    selectedShape?.fill,
    selectedShape?.text,
    selectedShape?.fontSize,
    selectedShape?.strokeWidth,
    selectedShape?.scaleX,
    selectedShape?.scaleY,
    selectedShape?.zIndex,
    hasChanges
  ]);

  // Debounced update function
  const debouncedUpdate = useCallback(async (property, value) => {
    if (!selectedShape) return;

    // Convert string numbers to actual numbers for numeric properties
    let finalValue = value;
    if (['x', 'y', 'width', 'height', 'rotation', 'fontSize', 'strokeWidth', 'scaleX', 'scaleY', 'zIndex'].includes(property)) {
      finalValue = parseFloat(value);
      // Skip update if not a valid number
      if (isNaN(finalValue)) return;
      // For zIndex, ensure it's an integer
      if (property === 'zIndex') {
        finalValue = Math.round(finalValue);
      }
    }

    try {
      // Update shape immediately
      await updateShapes(selectedShape.id, { [property]: finalValue });
    } catch (err) {
      console.error('Failed to update property:', err);
    }
  }, [selectedShape, updateShapes]);

  // Handle input focus
  const handleFocus = (property) => {
    isEditingRef.current = true;
    // Store the original value when starting to edit
    if (selectedShape && previousValuesRef.current[property] === undefined) {
      previousValuesRef.current[property] = selectedShape[property];
    }
  };

  // Handle input change with debounced update
  const handleInputChange = (property, value) => {
    // Update local state immediately for smooth typing
    setLocalProperties(prev => ({
      ...prev,
      [property]: value
    }));
    setHasChanges(true);

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set new timeout for debounced update (300ms delay)
    updateTimeoutRef.current = setTimeout(() => {
      debouncedUpdate(property, value);
    }, 300);
  };

  // Handle blur (finalize changes and add to history)
  const handleBlur = async (property) => {
    isEditingRef.current = false;
    
    // Clear any pending debounced update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    if (!selectedShape) return;

    const value = localProperties[property];
    const oldValue = previousValuesRef.current[property];

    // Convert to proper type
    let finalValue = value;
    if (['x', 'y', 'width', 'height', 'rotation', 'fontSize', 'strokeWidth', 'scaleX', 'scaleY', 'zIndex'].includes(property)) {
      finalValue = parseFloat(value);
      // For zIndex, ensure it's an integer
      if (property === 'zIndex') {
        finalValue = Math.round(finalValue);
      }
      if (isNaN(finalValue)) {
        // Revert to old value if invalid
        setLocalProperties(prev => ({
          ...prev,
          [property]: oldValue
        }));
        delete previousValuesRef.current[property];
        setHasChanges(false);
        return;
      }
    }

    // Don't add to history if value hasn't changed
    if (finalValue === oldValue || oldValue === undefined) {
      delete previousValuesRef.current[property];
      setHasChanges(false);
      return;
    }

    try {
      // Make sure the final update is applied
      await updateShapes(selectedShape.id, { [property]: finalValue });

      // Add to history
      if (addToHistory) {
        addToHistory({
          type: 'UPDATE',
          data: {
            shapeIds: [selectedShape.id],
            previousStates: [{ id: selectedShape.id, updates: { [property]: oldValue } }],
            newStates: [{ id: selectedShape.id, updates: { [property]: finalValue } }]
          }
        });
      }

      // Clear the stored previous value
      delete previousValuesRef.current[property];
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to finalize property update:', err);
      // Revert to original value on error
      setLocalProperties(prev => ({
        ...prev,
        [property]: oldValue
      }));
      delete previousValuesRef.current[property];
      setHasChanges(false);
    }
  };

  // Handle color change with debouncing
  const handleColorChange = (newColor) => {
    if (!selectedShape) return;

    // Update local state immediately for smooth UI
    setLocalProperties(prev => ({ ...prev, fill: newColor }));

    // Store the original color if not already stored
    if (previousValuesRef.current['fill'] === undefined) {
      previousValuesRef.current['fill'] = selectedShape.fill;
    }

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update (200ms delay)
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const oldColor = previousValuesRef.current['fill'];
        await updateShapes(selectedShape.id, { fill: newColor });

        if (addToHistory && oldColor !== newColor) {
          addToHistory({
            type: 'UPDATE',
            data: {
              shapeIds: [selectedShape.id],
              previousStates: [{ id: selectedShape.id, updates: { fill: oldColor } }],
              newStates: [{ id: selectedShape.id, updates: { fill: newColor } }]
            }
          });
        }

        // Clear the stored previous value
        delete previousValuesRef.current['fill'];
      } catch (err) {
        console.error('Failed to update color:', err);
        // Revert to old color on error
        setLocalProperties(prev => ({ ...prev, fill: previousValuesRef.current['fill'] }));
        delete previousValuesRef.current['fill'];
      }
    }, 200);
  };

  // Handle multi-selection property update
  const handleMultiUpdate = async (property, value) => {
    if (!isMultiSelection) return;

    try {
      // Filter out locked shapes
      const shapesToUpdate = selectedShapes.filter(s => !isLockedByOther(s.id));
      
      if (shapesToUpdate.length === 0) return;

      // Store previous states
      const previousStates = shapesToUpdate.map(s => ({
        id: s.id,
        updates: { [property]: s[property] }
      }));

      // Convert to number if needed
      let finalValue = value;
      if (['x', 'y', 'width', 'height', 'rotation', 'fontSize', 'strokeWidth'].includes(property)) {
        finalValue = parseFloat(value) || 0;
      }

      // Update all shapes
      await updateShapes(
        shapesToUpdate.map(s => ({ id: s.id, [property]: finalValue }))
      );

      if (addToHistory) {
        addToHistory({
          type: 'UPDATE',
          data: {
            shapeIds: shapesToUpdate.map(s => s.id),
            previousStates,
            newStates: shapesToUpdate.map(s => ({ id: s.id, updates: { [property]: finalValue } }))
          }
        });
      }
    } catch (err) {
      console.error('Failed to update multiple shapes:', err);
    }
  };

  // No selection
  if (selectedShapes.length === 0) {
    return (
      <aside className="properties-panel">
        <div className="properties-header">
          <h3>Properties</h3>
        </div>
        <div className="properties-empty">
          <div className="empty-icon">🎨</div>
          <p className="empty-title">No Selection</p>
          <p className="empty-subtitle">
            Select a shape to view and edit its properties
          </p>
        </div>
      </aside>
    );
  }

  // Multi-selection
  if (isMultiSelection) {
    return (
      <aside className="properties-panel">
        <div className="properties-header">
          <h3>Properties</h3>
          <span className="selection-badge">{selectedShapes.length} selected</span>
        </div>
        
        {hasLockedShapes && (
          <div className="properties-warning">
            ⚠️ Some shapes are locked by other users
          </div>
        )}

        <div className="properties-content">
          <div className="property-section">
            <h4 className="section-title">Multi-Selection</h4>
            
            <div className="property-group">
              <label className="property-label">Apply to All</label>
              
              {/* Color picker for multi-selection */}
              <div className="property-row">
                <label>Color</label>
                <div className="color-swatches">
                  {SHAPE_COLORS.slice(0, 5).map(color => (
                    <button
                      key={color}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      onClick={() => handleMultiUpdate('fill', color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="shapes-list">
              <label className="property-label">Selected Shapes</label>
              {selectedShapes.map(shape => (
                <div key={shape.id} className="shape-item">
                  <div 
                    className="shape-color-indicator"
                    style={{ backgroundColor: shape.fill }}
                  />
                  <span className="shape-type">{shape.type}</span>
                  <span className="shape-position">
                    ({Math.round(shape.x)}, {Math.round(shape.y)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Single selection
  return (
    <aside className="properties-panel">
      <div className="properties-header">
        <h3>Properties</h3>
        <span className="shape-type-badge">{selectedShape.type}</span>
      </div>

      {hasLockedShapes && (
        <div className="properties-warning">
          🔒 This shape is locked by another user
        </div>
      )}

      <div className="properties-content">
        {/* Position & Size */}
        <div className="property-section">
          <h4 className="section-title">Transform</h4>
          
          <div className="property-row">
            <label className="property-label">X</label>
            <input
              type="number"
              className="property-input"
              value={localProperties.x || 0}
              onChange={(e) => handleInputChange('x', e.target.value)}
              onFocus={() => handleFocus('x')}
              onBlur={() => handleBlur('x')}
              disabled={hasLockedShapes}
            />
          </div>

          <div className="property-row">
            <label className="property-label">Y</label>
            <input
              type="number"
              className="property-input"
              value={localProperties.y || 0}
              onChange={(e) => handleInputChange('y', e.target.value)}
              onFocus={() => handleFocus('y')}
              onBlur={() => handleBlur('y')}
              disabled={hasLockedShapes}
            />
          </div>

          {selectedShape.type !== SHAPE_TYPES.LINE && selectedShape.type !== SHAPE_TYPES.TEXT && (
            <>
              <div className="property-row">
                <label className="property-label">Width</label>
                <input
                  type="number"
                  className="property-input"
                  value={localProperties.width || 0}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  onFocus={() => handleFocus('width')}
                  onBlur={() => handleBlur('width')}
                  disabled={hasLockedShapes}
                  min="1"
                />
              </div>

              <div className="property-row">
                <label className="property-label">Height</label>
                <input
                  type="number"
                  className="property-input"
                  value={localProperties.height || 0}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  onFocus={() => handleFocus('height')}
                  onBlur={() => handleBlur('height')}
                  disabled={hasLockedShapes}
                  min="1"
                />
              </div>
            </>
          )}

          {/* Scale for text and images */}
          {(selectedShape.type === SHAPE_TYPES.TEXT || selectedShape.type === SHAPE_TYPES.IMAGE) && (
            <>
              <div className="property-row">
                <label className="property-label">Scale X</label>
                <input
                  type="number"
                  className="property-input"
                  value={localProperties.scaleX || 1}
                  onChange={(e) => handleInputChange('scaleX', e.target.value)}
                  onFocus={() => handleFocus('scaleX')}
                  onBlur={() => handleBlur('scaleX')}
                  disabled={hasLockedShapes}
                  step="0.1"
                  min="0.1"
                />
              </div>

              <div className="property-row">
                <label className="property-label">Scale Y</label>
                <input
                  type="number"
                  className="property-input"
                  value={localProperties.scaleY || 1}
                  onChange={(e) => handleInputChange('scaleY', e.target.value)}
                  onFocus={() => handleFocus('scaleY')}
                  onBlur={() => handleBlur('scaleY')}
                  disabled={hasLockedShapes}
                  step="0.1"
                  min="0.1"
                />
              </div>
            </>
          )}

          <div className="property-row">
            <label className="property-label">Rotation</label>
            <input
              type="number"
              className="property-input"
              value={localProperties.rotation || 0}
              onChange={(e) => handleInputChange('rotation', e.target.value)}
              onFocus={() => handleFocus('rotation')}
              onBlur={() => handleBlur('rotation')}
              disabled={hasLockedShapes}
              step="1"
            />
            <span className="property-unit">°</span>
          </div>

          <div className="property-row">
            <label className="property-label">Layer</label>
            <input
              type="number"
              className="property-input"
              value={localProperties.zIndex || 0}
              onChange={(e) => handleInputChange('zIndex', e.target.value)}
              onFocus={() => handleFocus('zIndex')}
              onBlur={() => handleBlur('zIndex')}
              disabled={hasLockedShapes}
              step="1"
              title="Higher values appear on top of lower values"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="property-section">
          <h4 className="section-title">Appearance</h4>
          
          <div className="property-row">
            <label className="property-label">Color</label>
            <div className="color-picker-container">
              <input
                type="color"
                className="color-input"
                value={localProperties.fill || '#FF6B6B'}
                onChange={(e) => handleColorChange(e.target.value)}
                disabled={hasLockedShapes}
              />
              <span className="color-value">{localProperties.fill}</span>
            </div>
          </div>

          <div className="color-swatches">
            {SHAPE_COLORS.map(color => (
              <button
                key={color}
                className={`color-swatch ${localProperties.fill === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                disabled={hasLockedShapes}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Text Properties */}
        {selectedShape.type === SHAPE_TYPES.TEXT && (
          <div className="property-section">
            <h4 className="section-title">Text</h4>
            
            <div className="property-row">
              <label className="property-label">Content</label>
              <textarea
                className="property-textarea"
                value={localProperties.text || ''}
                onChange={(e) => handleInputChange('text', e.target.value)}
                onFocus={() => handleFocus('text')}
                onBlur={() => handleBlur('text')}
                disabled={hasLockedShapes}
                rows="3"
              />
            </div>

            <div className="property-row">
              <label className="property-label">Font Size</label>
              <input
                type="number"
                className="property-input"
                value={localProperties.fontSize || 24}
                onChange={(e) => handleInputChange('fontSize', e.target.value)}
                onFocus={() => handleFocus('fontSize')}
                onBlur={() => handleBlur('fontSize')}
                disabled={hasLockedShapes}
                min="8"
                max="200"
              />
              <span className="property-unit">px</span>
            </div>
          </div>
        )}

        {/* Line Properties */}
        {selectedShape.type === SHAPE_TYPES.LINE && (
          <div className="property-section">
            <h4 className="section-title">Stroke</h4>
            
            <div className="property-row">
              <label className="property-label">Width</label>
              <input
                type="number"
                className="property-input"
                value={localProperties.strokeWidth || 2}
                onChange={(e) => handleInputChange('strokeWidth', e.target.value)}
                onFocus={() => handleFocus('strokeWidth')}
                onBlur={() => handleBlur('strokeWidth')}
                disabled={hasLockedShapes}
                min="1"
                max="50"
              />
              <span className="property-unit">px</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default PropertiesPanel;

