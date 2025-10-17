import { Layer, Rect } from 'react-konva';
import { CANVAS_CONFIG } from '../utils/constants';

function BackgroundLayer() {
  return (
    <Layer>
      {/* Canvas Background */}
      <Rect
        x={0}
        y={0}
        width={CANVAS_CONFIG.WIDTH}
        height={CANVAS_CONFIG.HEIGHT}
        fill="#ffffff"
        shadowBlur={10}
        shadowColor="rgba(0,0,0,0.2)"
        shadowOffset={{ x: 0, y: 0 }}
      />

      {/* Canvas Border */}
      <Rect
        x={0}
        y={0}
        width={CANVAS_CONFIG.WIDTH}
        height={CANVAS_CONFIG.HEIGHT}
        stroke="#ccc"
        strokeWidth={2}
      />
    </Layer>
  );
}

export default BackgroundLayer;
