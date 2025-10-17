import { Layer, Rect, Transformer } from 'react-konva';
import Shape from './Shape';

function ShapesLayer({
  shapes,
  selectedShapeIds,
  isLockedByOther,
  presence,
  stageScale,
  transformerRef,
  shapeRefs,
  selectionBox,
  selectionPreviewIds,
  onShapeDragStart,
  onShapeDragEnd,
  onShapeClick,
  onShapeDoubleClick,
  handleTransformStart,
  handleTransformEnd,
  isEditingText,
  editingShapeId
}) {
  return (
    <Layer>
      {/* Real-time shapes from Firestore */}
      {shapes.map((shape) => {
        // Hide the shape if it's currently being edited
        if (isEditingText && editingShapeId === shape.id) {
          return null;
        }
        
        // Get the color and name of the user who locked this shape
        const lockedByUser = shape.lockedBy ? presence[shape.lockedBy] : null;
        const lockerColor = lockedByUser?.color || null;
        const lockerName = lockedByUser?.displayName || null;
        
        return (
          <Shape
            key={shape.id}
            shapeData={shape}
            isSelected={selectedShapeIds.includes(shape.id)}
            isLocked={isLockedByOther(shape.id)}
            isInSelectionPreview={selectionPreviewIds.includes(shape.id)}
            lockerColor={lockerColor}
            lockerName={lockerName}
            stageScale={stageScale}
            onDragStart={(e) => onShapeDragStart(e, shape)}
            onDragEnd={(e) => onShapeDragEnd(e, shape)}
            onClick={(e) => onShapeClick(e, shape)}
            onDoubleClick={(e) => onShapeDoubleClick(e, shape)}
            shapeRef={(node) => {
              if (node) {
                shapeRefs.current[shape.id] = node;
              } else {
                delete shapeRefs.current[shape.id];
              }
            }}
          />
        );
      })}
      
      {/* Transformer for selected shapes */}
      <Transformer
        ref={transformerRef}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        rotateEnabled={true}
        enabledAnchors={[
          'top-left', 'top-center', 'top-right',
          'middle-left', 'middle-right',
          'bottom-left', 'bottom-center', 'bottom-right'
        ]}
      />

      {/* Selection Box */}
      {selectionBox && (
        <Rect
          x={Math.min(selectionBox.x1, selectionBox.x2)}
          y={Math.min(selectionBox.y1, selectionBox.y2)}
          width={Math.abs(selectionBox.x2 - selectionBox.x1)}
          height={Math.abs(selectionBox.y2 - selectionBox.y1)}
          fill="rgba(0, 102, 255, 0.1)"
          stroke="#0066ff"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}
    </Layer>
  );
}

export default ShapesLayer;
