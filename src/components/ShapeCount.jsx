function ShapeCount({ shapesLength }) {
  return (
    <div className="shape-count">
      <span>{shapesLength} shape{shapesLength !== 1 ? 's' : ''}</span>
    </div>
  );
}

export default ShapeCount;
