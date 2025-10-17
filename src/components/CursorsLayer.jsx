import { Layer } from 'react-konva';
import Cursor from './Cursor';

function CursorsLayer({ cursorsList, stageScale }) {
  return (
    <Layer listening={false}>
      {cursorsList.map((cursor) => (
        <Cursor key={cursor.userId} cursor={cursor} stageScale={stageScale} />
      ))}
    </Layer>
  );
}

export default CursorsLayer;
