function ShapeCount({ shapesLength, activeCursorCount }) {
  return (
    <div className="shape-count">
      <span>{shapesLength} shape{shapesLength !== 1 ? 's' : ''}</span>
      {activeCursorCount > 0 && (
        <span className="cursor-count">
          • {activeCursorCount} user{activeCursorCount !== 1 ? 's' : ''} online
        </span>
      )}
    </div>
  );
}

export default ShapeCount;
