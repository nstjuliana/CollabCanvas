import { useRef } from 'react';
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

  const handleButtonClick = () => {
    if (!disabled && colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleColorChange = (e) => {
    onColorChange(e.target.value);
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
          style={{ backgroundColor: selectedColor }}
        />
      </button>

      <input
        ref={colorInputRef}
        type="color"
        value={selectedColor}
        onChange={handleColorChange}
        className="color-input-hidden"
      />
    </div>
  );
}

export default ColorPicker;

