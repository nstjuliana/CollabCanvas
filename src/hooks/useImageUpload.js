import { useState } from 'react';
import { SHAPE_TYPES, SHAPE_DEFAULTS } from '../utils/constants';
import { uploadImage, calculateScaledDimensions } from '../services/images';
import { screenToCanvas } from '../utils/helpers';
import { ACTION_TYPES } from './useUndoRedo';

/**
 * Custom hook for handling image upload and drag & drop functionality
 */
const useImageUpload = ({
  stageRef,
  containerRef,
  createShape,
  selectShape,
  addToHistory
}) => {
  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Load image from file and get dimensions
   */
  const loadImageFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handle image drop
   */
  const handleDrop = async (e) => {
    e.preventDefault();

    // Get the dropped files
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    // Get drop position on canvas
    const stage = stageRef.current;
    if (!stage) return;

    // Get the drop position relative to the canvas
    const canvasContainer = containerRef.current;
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasPos = screenToCanvas(stage, { x, y });

    // Upload and create shapes for each image
    for (const file of imageFiles) {
      try {
        setIsUploadingImage(true);

        // Get image dimensions from file BEFORE uploading (avoids CORS issue)
        const { width: imgWidth, height: imgHeight } = await loadImageFromFile(file);

        // Calculate scaled dimensions
        const { width, height } = calculateScaledDimensions(
          imgWidth,
          imgHeight,
          SHAPE_DEFAULTS.IMAGE_MAX_WIDTH,
          SHAPE_DEFAULTS.IMAGE_MAX_HEIGHT
        );

        // Upload to Firebase Storage
        const imageUrl = await uploadImage(file);

        // Create image shape at drop position
        const newShape = {
          type: SHAPE_TYPES.IMAGE,
          x: canvasPos.x - width / 2, // Center on cursor
          y: canvasPos.y - height / 2,
          width,
          height,
          imageUrl,
          opacity: SHAPE_DEFAULTS.OPACITY,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };

        const shapeId = await createShape(newShape);

        // Add to history
        addToHistory({
          type: ACTION_TYPES.CREATE,
          data: { shapeId, shapeData: newShape }
        });

        // Automatically select the newly created image shape
        selectShape(shapeId);
      } catch (err) {
        alert(`Failed to upload ${file.name}: ${err.message}`);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  /**
   * Handle drag over (required to enable drop)
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return {
    // State
    isUploadingImage,
    uploadProgress,

    // Functions
    handleDrop,
    handleDragOver,
  };
};

export default useImageUpload;
