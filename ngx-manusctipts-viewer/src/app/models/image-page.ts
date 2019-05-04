export class ImagePage {
  pageNumber: number;
  imageUrl: string;
  version: ImageLayers[];
  isChanges = false;

  public static logImagePage(imagePage: ImagePage) {
    let message = 'Image page \n';
    message += 'pageNumber ' + imagePage.pageNumber + '\n';
    // TO DO
    }
}

export class ImageLayers {
  annotationLayer: TextboxNote[];
  polygonLayer: Polygon[];
  polylineLayer: Polyline[];

  constructor() {
    this.annotationLayer = new Array<TextboxNote>();
    this.polygonLayer = new Array<Polygon>();
    this.polylineLayer = new Array<Polyline>();
  }
}
export class Pixel {
  x: number;
  y: number;

  constructor(pos: { x: number, y: number }) {
    this.x = pos.x;
    this.y = pos.y;
  }
}
export class TextboxNote {
  startPoint: Pixel;
  height: number;
  width: number;
  textNote: string;

  public static IsTextboxNoteContainThePoint(tb: TextboxNote , pos: { x: number, y: number }): boolean {
    return ((tb.startPoint.x <= pos.x) &&
            (pos.x <= (tb.startPoint.x + tb.width)) &&
            (tb.startPoint.y <= pos.y) &&
            (pos.y <= (tb.startPoint.y + tb.height))
            );
  }
}

export class Polygon {
  vertices: Pixel[];

  constructor() {
    this.vertices = new Array<Pixel>();
  }

  public static IsPolygonContainThePoint(pl: Polygon , pos: { x: number, y: number }): boolean {
    let inside = false;
    for (let i = 0, j = pl.vertices.length - 1; i < pl.vertices.length; j = i++) {
        const xi = pl.vertices[i].x;
        const yi = pl.vertices[i].y;
        const xj = pl.vertices[j].x;
        const yj = pl.vertices[j].y;

        const intersect = ((yi > pos.y) !== (yj > pos.y)) && (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);

        if (intersect) {
          inside = !inside;
        }
    }
    return inside;
  }

  public Clone(): Polygon {
    const clonePoly = new Polygon();

    this.vertices.forEach(vertex => {
      clonePoly.vertices.push(new Pixel(vertex));
    });

    return clonePoly;
  }
}

export class Polyline {
  vertices: Pixel[];

  constructor() {
    this.vertices = new Array<Pixel>();
  }

  public static IsPolylineNearThePoint(polyline: Polyline , pos: { x: number, y: number }): boolean {
    const threshold = 5;
    let minDistancePosToPolyline = 10000;

    for (let index = 0; index < polyline.vertices.length - 1; index++) {
      const lineStart = polyline.vertices[index];
      const lineEnd = polyline.vertices[index + 1];
      const dist = this.distToSegment(pos , lineStart , lineEnd);

      if (minDistancePosToPolyline > dist) {
        minDistancePosToPolyline = dist;
      }
    }
    return (minDistancePosToPolyline < threshold);
  }

  public static sqr(x: number) { return x * x ; }
  public static dist2(v: Pixel, w: Pixel) { return this.sqr(v.x - w.x) + this.sqr(v.y - w.y) ; }

  public static distToSegmentSquared(pos: Pixel, v: Pixel, w: Pixel) {
  const l2 = this.dist2(v, w);
  if (l2 === 0) {return this.dist2( pos, v); }

  let t = ((pos.x - v.x) * (w.x - v.x) + (pos.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return this.dist2(pos, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
  }

  public static distToSegment(pos, v, w) { return Math.sqrt(this.distToSegmentSquared(pos, v, w)); }

  public Clone(): Polyline {
    const clonePolyline = new Polyline();

    this.vertices.forEach(vertex => {
      clonePolyline.vertices.push(new Pixel(vertex));
    });

    return clonePolyline;
  }
}


