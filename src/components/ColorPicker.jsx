import { useRef, useState, useEffect } from 'react';
import './ColorPicker.css';

/**
 * ColorPicker Component
 * Opens the browser's native RGB color picker directly
 * 
 * @param {string} selectedColor - Currently selected color
 * @param {function} onColorChange - Callback when color changes
 * @param {boolean} disabled - Whether the picker is disabled
 */
function ColorPicker({ selectedColor, onColorChange, disabled = false }) {
  const colorInputRef = useRef(null);
  const [localColor, setLocalColor] = useState(selectedColor);
  const debounceTimeoutRef = useRef(null);

  // Update local color when selectedColor changes externally
  useEffect(() => {
    setLocalColor(selectedColor);
  }, [selectedColor]);

  const handleButtonClick = () => {
    if (!disabled && colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    
    // Update local state immediately for smooth UI
    setLocalColor(newColor);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the callback (200ms delay)
    debounceTimeoutRef.current = setTimeout(() => {
      onColorChange(newColor);
    }, 200);
  };

  return (
    <div className="color-picker">
      <button
        className={`color-picker-button ${disabled ? 'disabled' : ''}`}
        onClick={handleButtonClick}
        title={disabled ? "Select a shape to change its color" : "Color Picker"}
        disabled={disabled}
      >
        <div 
          className="color-preview" 
          style={{ backgroundColor: localColor }}
        />
      </button>

      <input
        ref={colorInputRef}
        type="color"
        value={localColor || '#000000'}
        onChange={handleColorChange}
        className="color-input-hidden"
      />
    </div>
  );
}

export default ColorPicker;

