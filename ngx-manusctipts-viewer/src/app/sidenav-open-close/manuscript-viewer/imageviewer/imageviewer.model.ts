import { ButtonConfig, ButtonStyle, ImageViewerConfig } from './imageviewer.config';
import { Observable ,  Subject } from 'rxjs';
import { TextboxNote, ImagePage, Polygon, Polyline } from '../../../models/image-page';
import { MatrixTransformer } from './Geo';
import { Drawer } from './Drawer';


export class Button {
  //#region Properties
  sortId = 0;

  icon: string;
  tooltip: string;

  // hover state
  hover: any = false;

  // pressed state
  pressed: any = false;

  // there is changes - for SaveChange Button
  thereIsChangesOnResource: any = false;
  // show/hide button
  display = true;

  // drawn on position
  private drawPosition = null;
  private drawRadius = 0;
  //#endregion

  //#region Lifecycle events
  constructor(
    config: ButtonConfig,
    private style: ButtonStyle
  ) {
    this.sortId = config.sortId;
    this.display = config.show;
    this.icon = config.icon;
    this.tooltip = config.tooltip;
  }
  //#endregion

  //#region Events
  // click action
  onClick(evt) { alert('no click action set!'); return true; }

  // mouse down action
  onMouseDown(evt) { return false; }
  //#endregion

  //#region Draw Button
  draw(ctx, x, y, radius) {
    this.drawPosition = { x: x, y: y };
    this.drawRadius = radius;

    // preserve context
    ctx.save();

    // drawing settings
    const isHover = (typeof this.hover === 'function') ? this.hover() : this.hover;
    ctx.globalAlpha = (isHover) ? this.style.hoverAlpha : this.style.alpha;

    const isPressed = (typeof this.pressed === 'function') ? this.pressed() : this.pressed;
    ctx.fillStyle = (isPressed) ? this.style.pressedColor : this.style.bgStyle;

    if (this.thereIsChangesOnResource) {
      ctx.fillStyle = '#24932b';
    }

    ctx.lineWidth = 0;

    // draw circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    if (this.style.borderWidth > 0) {
      ctx.lineWidth = this.style.borderWidth;
      ctx.strokeStyle = this.style.borderStyle;
      ctx.stroke();
    }

    // draw icon
    if (this.icon !== null) {
      ctx.save();
      // ctx.globalCompositeOperation = 'destination-out';
      this.drawIconFont(ctx, x, y, radius);
      ctx.restore();
    }

    // restore context
    ctx.restore();
  }

  private drawIconFont(ctx, centreX, centreY, size) {
    // font settings
    ctx.font = size + 'px ' + this.style.iconFontFamily;
    ctx.fillStyle = this.style.iconStyle;

    // calculate position
    const textSize = ctx.measureText(this.icon);
    const x = centreX - textSize.width / 2;
    const y = centreY + size / 2;

    // draw it
    ctx.fillText(this.icon, x, y);
  }
  //#endregion

  //#region Utils
  isWithinBounds(x, y) {
    if (this.drawPosition === null) { return false; }
    const dx = Math.abs(this.drawPosition.x - x), dy = Math.abs(this.drawPosition.y - y);
    return dx * dx + dy * dy <= this.drawRadius * this.drawRadius;
  }
  //#endregion
}

export class Viewport {
  constructor(
    public width: number,
    public height: number,
    public scale: number,
    public rotation: number,
    public x: number,
    public y: number
  ) {}
}

export interface Dimension { width: number; height: number; }

export abstract class ResourceLoader {
  public src: string;
  public sourceDim: { width: number, height: number };

  public viewport: Viewport = { width: 0, height: 0, scale: 1, rotation: 0, x: 0, y: 0 };
  public matrixTransformer: MatrixTransformer;
  public minScale = 0;
  public maxScale = 2;
  public currentItem = 1;
  public totalItem = 1;
  public showItemsQuantity = false;
  public loaded = false;
  public loading = false;
  public rendering = false;

  public imagePageMetadata: ImagePage;
  public currentLayerVersion: number;

  public _image;
  protected resourceChange = new Subject<string>();

  abstract setUp();
  abstract loadResource();

  // Get the canvasDim and then restart the viewPort Object return true/false if successes.
  public resetViewport(canvasDim: Dimension): boolean {
    if (!this.loaded || !canvasDim) { return; }

    // set the canvas width and height according to the rotation of the viewport(if not set it 0)
    const rotation = this.viewport ? this.viewport.rotation : 0;
    const inverted = toSquareAngle(rotation) / 90 % 2 !== 0;
    const canvas = {
      width: !inverted ? canvasDim.width : canvasDim.height,
      height: !inverted ? canvasDim.height : canvasDim.width
    };

    // reset the view scale image to fit in the canvas dimension, check the ratio of highest is small then ratio of width
    if (((canvas.height / this._image.height) * this._image.width) <= canvas.width) {
      this.viewport.scale = canvas.height / this._image.height;
    } else {
      this.viewport.scale = canvas.width / this._image.width;
    }
    this.minScale = this.viewport.scale / 4 ;
    this.maxScale = this.viewport.scale * 4 ;

    // start point to draw image
    this.viewport.width = this._image.width * this.viewport.scale;
    this.viewport.height = this._image.height * this.viewport.scale;
    this.viewport.x = canvasDim.width / 2;
    this.viewport.y = canvasDim.height / 2;

    // Set the matrixTransform
    this.matrixTransformer = new MatrixTransformer(this.viewport.x ,
      this.viewport.y,
      this.viewport.scale,
      this.viewport.rotation * Math.PI / 180);
  }

  public draw(ctx, config: ImageViewerConfig, canvasDim: Dimension, onFinish) {
    // // reset the transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // clear canvas
    ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);

    // Draw background color;
    ctx.fillStyle = config.bgStyle;
    ctx.fillRect(0, 0, canvasDim.width, canvasDim.height);

    // Set the matrixTransform
    this.matrixTransformer = new MatrixTransformer(this.viewport.x ,
      this.viewport.y,
      this.viewport.scale,
      this.viewport.rotation * Math.PI / 180);


    // draw image (transformed, rotate and scaled)
    if (!this.loading && this.loaded) {
      ctx.setTransform(this.matrixTransformer.matrix[0],
                       this.matrixTransformer.matrix[1],
                       this.matrixTransformer.matrix[2],
                       this.matrixTransformer.matrix[3],
                       this.matrixTransformer.matrix[4],
                       this.matrixTransformer.matrix[5]);

      ctx.drawImage(this._image, -this._image.width / 2, -this._image.height / 2);
      if (this.imagePageMetadata.version[this.currentLayerVersion].annotationLayer) {
        Drawer.drawImageAnnotationLayer(ctx, this.imagePageMetadata.version[this.currentLayerVersion].annotationLayer ,
                                        -this._image.width / 2, -this._image.height / 2);
      }

      if (this.imagePageMetadata.version[this.currentLayerVersion].polygonLayer) {
        Drawer.drawPolygonsLayer(ctx, this.imagePageMetadata.version[this.currentLayerVersion].polygonLayer ,
            -this._image.width / 2, -this._image.height / 2);
      }

      if (this.imagePageMetadata.version[this.currentLayerVersion].polylineLayer) {
        Drawer.drawPolylineLayer(ctx, this.imagePageMetadata.version[this.currentLayerVersion].polylineLayer ,
            -this._image.width / 2, -this._image.height / 2);
      }

    } else {
      ctx.fillStyle = '#333';
      ctx.font = '25px Verdana';
      ctx.textAlign = 'center';
      ctx.fillText(config.loadingMessage || 'Loading...', canvasDim.width / 2, canvasDim.height / 2);
    }

    onFinish(ctx, config, canvasDim);
  }

  public onResourceChange() { return this.resourceChange.asObservable(); }

  public AddNewTextboxNote(startRectanglePoint, recWidth , recHeight , recTextNote) {
    if (recWidth < 0 ) {
      startRectanglePoint.x = startRectanglePoint.x + recWidth;
      recWidth = -1 * recWidth;
    }

    if (recHeight < 0 ) {
      startRectanglePoint.y = startRectanglePoint.y + recHeight;
      recHeight = -1 * recHeight;
    }

    const newTextNote = {
      startPoint: { x: startRectanglePoint.x, y: startRectanglePoint.y},
      height: recHeight,
      width: recWidth,
      textNote: recTextNote
     };

     if (!this.imagePageMetadata.version[this.currentLayerVersion].annotationLayer) {
      this.imagePageMetadata.version[this.currentLayerVersion].annotationLayer = new Array<TextboxNote>();
     }
     this.imagePageMetadata.version[this.currentLayerVersion].annotationLayer.push(newTextNote);
  }

  public AddNewCanvasWorldPolygon(newPolygon: Polygon) {
    newPolygon.vertices.forEach(vertex => {
      vertex.x = vertex.x + this._image.width / 2 ;
      vertex.y = vertex.y + this._image.height / 2 ;
    });

    if (!(this.imagePageMetadata.version[this.currentLayerVersion].polygonLayer)) {
      this.imagePageMetadata.version[this.currentLayerVersion].polygonLayer = new Array<Polygon>();
    }
    this.imagePageMetadata.version[this.currentLayerVersion].polygonLayer.push(newPolygon);
  }

  public AddNewCanvasWorldPolyline(newPolyline: Polyline) {
    newPolyline.vertices.forEach(vertex => {
      vertex.x = vertex.x + this._image.width / 2 ;
      vertex.y = vertex.y + this._image.height / 2 ;
    });

    if (!(this.imagePageMetadata.version[this.currentLayerVersion].polylineLayer)) {
      this.imagePageMetadata.version[this.currentLayerVersion].polylineLayer = new Array<Polyline>();
     }
    this.imagePageMetadata.version[this.currentLayerVersion].polylineLayer.push(newPolyline);
  }

  public DeleteTextboxNote(indexToDelete: number) {
    this.imagePageMetadata.version[this.currentLayerVersion].annotationLayer.splice(indexToDelete, 1);
  }
  public DeletePolygon(indexToDelete: number) {
    this.imagePageMetadata.version[this.currentLayerVersion].polygonLayer.splice(indexToDelete, 1);
  }
  public DeletePolyline(indexToDelete: number) {
    this.imagePageMetadata.version[this.currentLayerVersion].polylineLayer.splice(indexToDelete, 1);
  }

}

export function toSquareAngle(angle: number) {
  return 90 * ((Math.trunc(angle / 90) + (Math.trunc(angle % 90) > 45 ? 1 : 0)) % 4);
}

