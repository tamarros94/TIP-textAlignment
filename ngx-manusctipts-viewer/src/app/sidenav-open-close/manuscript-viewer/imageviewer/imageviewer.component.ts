import { Component, Input, ViewChild, ElementRef,
         AfterViewInit, Renderer, Inject, OnDestroy,
          Renderer2, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatrixTransformer } from './Geo';

import {
  ImageViewerConfig,
  IMAGEVIEWER_CONFIG,
  ButtonConfig,
  ButtonStyle
} from './imageviewer.config';
import { Viewport, Button, toSquareAngle, ResourceLoader} from './imageviewer.model';
import { Subscription } from 'rxjs';
import { ImageResourceLoader } from './image.loader';
import { ImagePage, TextboxNote, Pixel, Polygon, Polyline, ImageLayers } from '../../../models/image-page';
import { Drawer } from './Drawer';
import { MatDialog , MatDialogConfig } from '@angular/material';
import { TextNoteDialogComponent } from './text-note-dialog/text-note-dialog.component';
import { SystemState } from './enums';


const MIN_TOOLTIP_WIDTH_SPACE = 500;


@Component({
  selector: 'app-imageviewer',
  templateUrl: './imageviewer.component.html',
  styleUrls: ['./imageviewer.component.scss']
})
export class ImageviewerComponent implements AfterViewInit, OnDestroy {

  //#region Input properties

  private _imagePageMetadata: ImagePage;
  get imagePageMetadata() { return this._imagePageMetadata; }
  @Input('imagePageMetadata') set imagePageMetadata(value) {
    if (value === this._imagePageMetadata) { return; }

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    if (value == null) {
      this._imagePageMetadata = null;
      this._resource = null ;
    } else {
      this._imagePageMetadata = value;
      this.setUpResourceUsingImagePage();
    }
  }

  private _currentLayerVersion: number;
  get currentImageLayerVersion() { return this._currentLayerVersion; }
  @Input('currentImageLayerVersion') set currentImageLayerVersion(value) {
    if (value === this._currentLayerVersion) { return; }

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._currentLayerVersion = value;
    if (this._resource) {
      this._resource.currentLayerVersion = this.currentImageLayerVersion;
    }
    if (this._resource.imagePageMetadata === this.imagePageMetadata) {
    this._dirty = true;
    this.render(false);
    }
  }

  private _src: string | File;
  get src() { return this._src; }
  @Input('src') set src(value) {
    if (value === this._src) { return; }
    this._src = value;
    this.setUpResource();
  }

  // FIX not working properly
  private _filetype: string;
  get filetype() { return this._filetype; }
  @Input('filetype') set filetype(value: string) {
    if (value === this._filetype) { return; }
    this._filetype = value;
    this.setUpResource();
  }

  private _width: number;
  get width() { return this._width; }
  @Input('width') set width(value) {
    if (value === this._width) { return; }
    this._width = value;
    if (this._canvas) { this._canvas.width = this._width; }
    this.resetImage();
  }

  private _height: number;
  get height() { return this._height; }
  @Input('height') set height(value) {
    if (value === this._height) { return; }
    this._height = value;
    if (this._canvas) { this._canvas.height = this._height; }
    this.resetImage();
  }

  @Output()
  saveImagePage: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('imageContainer') canvasRef: ElementRef;
  //#endregion

  //#region Private properties
  // Config file
  private config: ImageViewerConfig;

  // Canvas 2D context
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;

  // dirty state
  private _dirty = true;

  // action buttons
  private _zoomOutButton: Button;
  private _zoomInButton: Button;
  private _rotateLeftButton: Button;
  private _rotateRightButton: Button;
  private _resetButton: Button;
  private _addNotationButton: Button;
  private _addPolygonButton: Button;
  private _addPolylineButton: Button;
  private _deleteButton: Button;
  private _saveChangesButton: Button;

  // call once to ActivateFrame
  private _requestAnimationFrame = true;

  // contains all active buttons
  private _buttons = Array<Button>();

  // current tool tip (used to track change of tool tip)
  private _currentTooltip = null;

  // cached data when touch events started
  private _touchStartState: any = {};

  // list of event listener destroyers
  private _listenDestroyList = [];

  // image Drawable Resource
  public _resource: ResourceLoader;
  private _resourceChangeSub: Subscription;

  // Caching resourceLoader instances to reuse
  private _imageResource: ImageResourceLoader;

   // system State
   private _systemState = SystemState.Display;

  // AddNotation mode fields
  private _drawingRectangleMode = false;
  private _prevTapCanvasWorldPos;
  private _currentTapCanvasWorldPos;

  // AddPolygon mode fields
  private _inputPolygon: Polygon;

   // AddPolyline mode fields
   private _inputPolyline: Polyline;

  //#endregion

  //#region Life cycle events
  constructor(
    private _sanitizer: DomSanitizer,
    private _renderer: Renderer2,
    private dialog: MatDialog
  ) {
    this.config = IMAGEVIEWER_CONFIG;
    this._zoomOutButton = new Button(this.config.zoomOutButton, this.config.buttonStyle);
    this._zoomInButton = new Button(this.config.zoomInButton, this.config.buttonStyle);
    this._rotateLeftButton = new Button(this.config.rotateLeftButton, this.config.buttonStyle);
    this._rotateRightButton = new Button(this.config.rotateRightButton, this.config.buttonStyle);
    this._resetButton = new Button(this.config.resetButton, this.config.buttonStyle);
    this._addNotationButton = new Button(this.config.addNotationButton, this.config.buttonStyle);
    this._addPolygonButton = new Button(this.config.addPolygonButton, this.config.buttonStyle);
    this._addPolylineButton = new Button(this.config.addPolylineButton, this.config.buttonStyle);
    this._deleteButton = new Button(this.config.deleteButton, this.config.buttonStyle);
    this._saveChangesButton = new Button(this.config.saveChangesButton, this.config.buttonStyle);
    this._buttons = [
      this._zoomOutButton,
      this._zoomInButton,
      this._rotateLeftButton,
      this._rotateRightButton,
      this._resetButton,
      this._addNotationButton,
      this._addPolygonButton,
      this._addPolylineButton,
      this._deleteButton,
      this._saveChangesButton
    ].filter(item => item.display)
      .sort((a, b) => a.sortId - b.sortId);
  }

  ngAfterViewInit() {
    this._canvas = this.canvasRef.nativeElement;
    this._context = this._canvas.getContext('2d');

    // setting canvas dimension
    this._canvas.width = this.width || this.config.width;
    this._canvas.height = this.height || this.config.height;

    // setting buttons actions
    this._zoomOutButton.onClick = (evt) => { this.zoomOut(); return false; };
    this._zoomInButton.onClick = (evt) => { this.zoomIn(); return false; };
    this._rotateLeftButton.onClick = (evt) => { this.rotateLeft(); return false; };
    this._rotateRightButton.onClick = (evt) => { this.rotateRight(); return false; };
    this._resetButton.onClick = (evt) => { this.resetImage(); return false; };
    this._addNotationButton.onClick = (evt) => { this.addNotationMode(); return false; };
    this._addPolygonButton.onClick = (evt) => { this.addPolygonMode(); return false; };
    this._addPolylineButton.onClick = (evt) => { this.addPolylineMode(); return false; };
    this._deleteButton.onClick = (evt) => { this.deleteMode(); return false; };
    this._saveChangesButton.onClick = (evt) => { this.saveChanges(); return false; };

    // register event listeners
    this.addEventListeners();

    this.updateCanvas();
  }

  ngOnDestroy() {
    // unregister event listeners
    this._listenDestroyList.forEach(listenDestroy => {
      if (typeof listenDestroy === 'function') {
        listenDestroy();
      }
    });
  }

  setUpResource() {
    if (this.isImage(this.src) && (!this._resource || !(this._resource instanceof ImageResourceLoader))) {
      if (this._resourceChangeSub) {
        this._resourceChangeSub.unsubscribe();
      }
      if (!this._imageResource) {
        this._imageResource = new ImageResourceLoader();
      }
      this._resource = this._imageResource;
    }
    if (this._resource) {
      this._resource.src = this.src instanceof File ? URL.createObjectURL(this.src) : this.src;
      this._resourceChangeSub = this._resource.onResourceChange().subscribe(() => {
        this.updateCanvas();
        if (this.src instanceof File) {
          URL.revokeObjectURL(this._resource.src);
        }
      });
      this._resource.setUp();
      this.resetImage();
      if (this._context) { this.updateCanvas(); }
    }
  }

  setUpResourceUsingImagePage() {
    this._src = this._imagePageMetadata.imageUrl;
    if (this.isImage(this.src) && (!this._resource || !(this._resource instanceof ImageResourceLoader))) {
      if (this._resourceChangeSub) {
        this._resourceChangeSub.unsubscribe();
      }
      if (!this._imageResource) {
        this._imageResource = new ImageResourceLoader();
      }
      this._resource = this._imageResource;
    }
    if (this._resource) {
      this.InitializeImageMetadata();

      this._resource.imagePageMetadata = this._imagePageMetadata;
      this._resource.viewport = { width: 0, height: 0, scale: 1, rotation: 0, x: 0, y: 0 };

      // Restart to Display state
      this._buttons[9].thereIsChangesOnResource = this._imagePageMetadata.isChanges;
      this._systemState = SystemState.Display;
      this.DisablePressedStateOnButtons();

      this._resource.src = this.src instanceof File ? URL.createObjectURL(this.src) : this.src;
      this._resourceChangeSub = this._resource.onResourceChange().subscribe(() => {
        this.updateCanvas();
        if (this.src instanceof File) {
          URL.revokeObjectURL(this._resource.src);
        }
      });
      this._resource.setUp();
      this.resetImage();
      if (this._context) { this.updateCanvas(); }
    }
  }

  private InitializeImageMetadata() {

    if (!this.imagePageMetadata.version) {
      this.imagePageMetadata.version = new Array<ImageLayers>();
    }

    if ( this.imagePageMetadata.version.length > 0) {
      this.currentImageLayerVersion = this.imagePageMetadata.version.length - 1;
    } else {
      this.imagePageMetadata.version.push(new ImageLayers());
      this.currentImageLayerVersion = 0 ;
    }
    this._resource.currentLayerVersion = this.currentImageLayerVersion;
  }
  //#endregion

  //#region Touch events
  onTap(evt) {
    switch (this._systemState) {
      case SystemState.AddNotation: {
        this._dirty = true;
        this.render(false);
        if (this._currentTapCanvasWorldPos) { this._prevTapCanvasWorldPos = this._currentTapCanvasWorldPos; }

        // calculate the currentTapCanvasWorldPos
        this._currentTapCanvasWorldPos = this._resource.matrixTransformer.toWorld(this.screenToCanvasCenter(evt.center));

        if (this._drawingRectangleMode) {
          this.openTextNoteInputDialog();

          this.ReturnToDisplayState();
        }
        this._drawingRectangleMode = !this._drawingRectangleMode;  // Entering or living the drawling mode
        break;
      }
      case SystemState.AddPolygon: {
        const currentTapCanvasWorldPos = this._resource.matrixTransformer.toWorld(this.screenToCanvasCenter(evt.center));
        this._inputPolygon.vertices.push(new Pixel(currentTapCanvasWorldPos));
        if (evt.tapCount === 2) {
          this._resource.AddNewCanvasWorldPolygon(this._inputPolygon);
          this.imagePageMetadata.isChanges = true;
          this._buttons[9].thereIsChangesOnResource = true;

           // return to the display state
           this._inputPolygon = undefined;
           this.ReturnToDisplayState();
        }
        break;
      }
      case SystemState.AddPolyline: {
        const currentTapCanvasWorldPos = this._resource.matrixTransformer.toWorld(this.screenToCanvasCenter(evt.center));
        this._inputPolyline.vertices.push(new Pixel(currentTapCanvasWorldPos));
        if (evt.tapCount === 2) {
          this._resource.AddNewCanvasWorldPolyline(this._inputPolyline);
          this.imagePageMetadata.isChanges = true;
          this._buttons[9].thereIsChangesOnResource = true;

           // return to the display state
           this._inputPolyline = undefined;
           this.ReturnToDisplayState();
        }
        break;
      }
      case SystemState.DeleteMode: {

        if (this.CheckTapOverTextboxNoteAndDelete(evt)) {
           this.imagePageMetadata.isChanges = true;
            this._buttons[9].thereIsChangesOnResource = true;
            this.ReturnToDisplayState();
           break;
           }
        if (this.CheckTapOverPolygonAndDelete(evt)) {
            this.imagePageMetadata.isChanges = true;
            this._buttons[9].thereIsChangesOnResource = true;
            this.ReturnToDisplayState();
           break;
           }
        if (this.CheckTapOverPolylineAndDelete(evt)) {
          this.imagePageMetadata.isChanges = true;
          this._buttons[9].thereIsChangesOnResource = true;
          this.ReturnToDisplayState();
          break;
        }
        break;
      }
      default: {
        break;
      }
    }
    const activeElement = this.getUIElement(this.screenToCanvasCenter(evt.center));
    if (activeElement !== null) { activeElement.onClick(evt); }
  }

  ReturnToDisplayState() {
  this._systemState = SystemState.Display;
  this.DisablePressedStateOnButtons();
  this._dirty = true;
  this.render(false);
  }

  CheckTapOverTextboxNoteAndDelete(evt): boolean {
    if (!(this._resource.imagePageMetadata.version[this._currentLayerVersion].annotationLayer)) { return false; }

    let indexToDelete: number;
    let textBoxToDelete: TextboxNote;
    const posOnImageWorld = this.CanvasCenterToImagePosition(this.screenToCanvasCenter(evt.center));


    for (let index = 0; index < this._resource.imagePageMetadata.version[this._currentLayerVersion].annotationLayer.length; index++) {
      const currentTextBox = this._resource.imagePageMetadata.version[this._currentLayerVersion].annotationLayer[index];
      if (TextboxNote.IsTextboxNoteContainThePoint(currentTextBox, posOnImageWorld)) {
        textBoxToDelete = currentTextBox;
        indexToDelete = index;
        break;
      }
    }
    if (textBoxToDelete) {
      this._resource.DeleteTextboxNote(indexToDelete);
      this._dirty = true;
      this.render(false);
      return true;
    }
    return false;
  }
  CheckTapOverPolygonAndDelete(evt): boolean {
    if (this._imagePageMetadata.version[this._currentLayerVersion].polygonLayer == null) { return ; }
      let mousePosOnPolygon: Polygon;
      let indexToDelete: number;

      const posOnImageWorld = this.CanvasCenterToImagePosition(this.screenToCanvasCenter(evt.center));

      for (let index = 0; index < this._imagePageMetadata.version[this._currentLayerVersion].polygonLayer.length; index++) {
        const currentPolygon = this._imagePageMetadata.version[this._currentLayerVersion].polygonLayer[index];
        if (Polygon.IsPolygonContainThePoint(currentPolygon, posOnImageWorld)) {
          mousePosOnPolygon = currentPolygon;
          indexToDelete = index;
          break;
        }
      }

      if (mousePosOnPolygon) {
        this._resource.DeletePolygon(indexToDelete);
        this._dirty = true;
        this.render(false);
        return true;
      }
      return false;
  }
  CheckTapOverPolylineAndDelete(evt): boolean {
    if (this._imagePageMetadata.version[this._currentLayerVersion].polylineLayer == null) { return ; }
      let mousePosOnPolyline: Polyline;
      let indexToDelete: number;

      const posOnImageWorld = this.CanvasCenterToImagePosition(this.screenToCanvasCenter(evt.center));

      for (let index = 0; index < this._imagePageMetadata.version[this._currentLayerVersion].polylineLayer.length; index++) {
        const currentPolyline = this._imagePageMetadata.version[this._currentLayerVersion].polylineLayer[index];
        if (Polyline.IsPolylineNearThePoint(currentPolyline, posOnImageWorld)) {
          mousePosOnPolyline = currentPolyline;
          indexToDelete = index;
          break;
        }
      }

      if (mousePosOnPolyline) {
        this._resource.DeletePolyline(indexToDelete);
        this._dirty = true;
        this.render(false);
        return true;
      }
      return false;
  }
  openTextNoteInputDialog() {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      description: 'Add Note'
    };

    const dialogRef = this.dialog.open(TextNoteDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
        data => this.OnCloseDialog(data)
    );
  }

  OnCloseDialog(data) {
   // console.log('Dialog output parents:', data);

    // get data from the dialog
    if (data) {
        // saving the rectangle in the resource
        const posOnImageWorldPrev =  this.CanvasWorldPositionToImagePosition(this._prevTapCanvasWorldPos);
        const posOnImageWorldCurrent = this.CanvasWorldPositionToImagePosition(this._currentTapCanvasWorldPos);

       const deltaImageX =  posOnImageWorldCurrent.x - posOnImageWorldPrev.x;
       const deltaImageY =  posOnImageWorldCurrent.y - posOnImageWorldPrev.y;

       // open Dialog and get Text of Cancel
       this._resource.AddNewTextboxNote(posOnImageWorldPrev , deltaImageX , deltaImageY , data.description);
       this.imagePageMetadata.isChanges = true;
       this._buttons[9].thereIsChangesOnResource = true;
       this._dirty = true;
       this.render(false);
    }
  }

  onTouchEnd() {
    this._touchStartState.viewport = undefined;
    this._touchStartState.scale = undefined;
    this._touchStartState.rotate = undefined;
  }

  processTouchEvent(evt) {
    if (!(this._resource)) {return; }
    if (this._systemState === SystemState.Display) {
      // process pan
      if (!this._touchStartState.viewport) { this._touchStartState.viewport = Object.assign({}, this._resource.viewport); }

      const viewport = this._resource.viewport;
      viewport.x = this._touchStartState.viewport.x + evt.deltaX;
      viewport.y = this._touchStartState.viewport.y + evt.deltaY;

      // process pinch in/out
      if (!this._touchStartState.scale) { this._touchStartState.scale = this._resource.viewport.scale; }
      const newScale = this._touchStartState.scale * evt.scale;
      viewport.scale = newScale > this._resource.maxScale ? this._resource.maxScale :
        newScale < this._resource.minScale ? this._resource.minScale : newScale;

      // process rotate left/right
      if (!this._touchStartState.rotate) { this._touchStartState.rotate = { rotation: viewport.rotation, startRotate: evt.rotation }; }
      if (evt.rotation !== 0) {
        const newAngle = this._touchStartState.rotate.rotation + evt.rotation - this._touchStartState.rotate.startRotate;
        viewport.rotation = this.config.rotateStepper ? toSquareAngle(newAngle) : newAngle;
      }
      this._dirty = true;
    }
  }
  //#endregion

  //#region Mouse Events
  private addEventListeners() {
    // zooming
    this._listenDestroyList.push(this._renderer.listen(this._canvas, 'DOMMouseScroll', (evt) => this.onMouseWheel(evt)));
    this._listenDestroyList.push(this._renderer.listen(this._canvas, 'mousewheel', (evt) => this.onMouseWheel(evt)));
    this._listenDestroyList.push(this._renderer.listen(this._canvas, 'mousemove', (evt) => this.onMouseMove(evt)));
  }

  private onMouseMove(evt) {
    if (!(this._resource)) {return; }
    // clean the draw on top of the image
    this._dirty = true;
    this.render(false);

    const posOnCanvas = this.screenToCanvasCenter({ x: evt.clientX, y: evt.clientY }); // calculate the position of the mouse on the canvas
    const canvasWorldPos = this._resource.matrixTransformer.toWorld(posOnCanvas); // calculate the Potion of the mouse in the canvas world
    const posOnImageWorld = this.CanvasCenterToImagePosition(posOnCanvas); // calculate the Potion of the mouse in the image world

    switch (this._systemState) {
      case SystemState.AddNotation: {
        if (this._drawingRectangleMode && this._currentTapCanvasWorldPos ) {
          const deltaX =  canvasWorldPos.x - this._currentTapCanvasWorldPos.x;
          const deltaY =  canvasWorldPos.y - this._currentTapCanvasWorldPos.y;
          Drawer.DrawRectangle(this._context , this._resource.matrixTransformer, this._currentTapCanvasWorldPos, deltaX , deltaY);
        }
        break;
      }
      case SystemState.AddPolygon: {
        const clonePolygon = this._inputPolygon.Clone();
        clonePolygon.vertices.push(canvasWorldPos);
        Drawer.drawPolygonCanvasWorld(this._context, this._resource.matrixTransformer , clonePolygon);
        break;
      }
      case SystemState.AddPolyline: {
        const clonePolyline = this._inputPolyline.Clone();
        clonePolyline.vertices.push(canvasWorldPos);
        Drawer.drawPolylineCanvasWorld(this._context, this._resource.matrixTransformer , clonePolyline);
        break;
      }
      case SystemState.DeleteMode: {

        // check if the mouse is on the annotation box and just make it alpha higher (do not print text note)
        if (this.checkAnnotationActivation(posOnImageWorld, posOnCanvas , false)) {break; }
        // check if the mouse is on the polygon and change the alpha accordingly.
        if (this.checkPolygonOver(posOnImageWorld, posOnCanvas)) {break; }

        if (this.checkPolylineOver(posOnImageWorld, posOnCanvas)) {break; }
        break;
      }
      default: {
        // Display mode.
        // Check if the mouse is on the buttons and activate the tooltip if true.
        this.checkTooltipActivation(posOnCanvas);
        // check if the mouse is on the annotation box and draw the text
        if (this.checkAnnotationActivation(posOnImageWorld, posOnCanvas , true)) {break; }
        // check if the mouse is on the polygon and change the alpha accordingly.
        if (this.checkPolygonOver(posOnImageWorld, posOnCanvas)) {break; }

        this.checkPolylineOver(posOnImageWorld, posOnCanvas);
        break;
      }
    }
  }

  private onMouseWheel(evt) {
    if (this._systemState === SystemState.Display) {
      if (!evt) { evt = event; }
      evt.preventDefault();
      if (evt.detail < 0 || evt.wheelDelta > 0) { // up -> larger
        this.zoomIn();
      } else { // down -> smaller
        this.zoomOut();
      }
    }
  }

  private checkTooltipActivation(pos: { x: number, y: number }) {
    this.getUIElements().forEach(x => x.hover = false);
    const activeElement = this.getUIElement(pos);
    const oldToolTip = this._currentTooltip;
    if (activeElement !== null) {
      if (typeof activeElement.hover !== 'undefined') {
        activeElement.hover = true;
      }
      if (typeof activeElement.tooltip !== 'undefined') {
        this._currentTooltip = activeElement.tooltip;
      }
    } else {
      if (oldToolTip  !== null) {
      this._currentTooltip = null ;
      this._dirty = true;
      return;
      }
    }
    if (oldToolTip !== this._currentTooltip) { this._dirty = true; }
  }

  // tslint:disable-next-line:max-line-length
  private checkAnnotationActivation(posOnImageWorld: { x: number, y: number } , posOnCanvas: { x: number, y: number } , print: boolean): boolean {
    if (this._resource.imagePageMetadata.version[this._currentLayerVersion].annotationLayer == null) {return; }
    const annotationLayer: TextboxNote[] = this._resource.imagePageMetadata.version[this._currentLayerVersion].annotationLayer;
    let mousePosOnTextBox: TextboxNote;

    for (let index = 0; index < annotationLayer.length; index++) {
      const currentTextBox = annotationLayer[index];
      if (TextboxNote.IsTextboxNoteContainThePoint(currentTextBox, posOnImageWorld)) {
        mousePosOnTextBox = currentTextBox;
        break;
      }
    }
    if (mousePosOnTextBox) {
        // console.log('print on pos {' + posOnCanvas.x + ',' + posOnCanvas.y + '} + the note: ' + mousePosOnTextBox.textNote);
        this._context.save();
        const mt = this._resource.matrixTransformer.matrix;
        this._context.setTransform(mt[0], mt[1], mt[2], mt[3], mt[4], mt[5]);

        Drawer.drawTextBoxBolder(this._context, mousePosOnTextBox , -this._resource._image.width / 2, -this._resource._image.height / 2);

        this._context.restore();
        if (print) {
        Drawer.drawNotationBox(this._context, posOnCanvas, this._canvas.width, this._canvas.height , mousePosOnTextBox.textNote);
        }
        return true;
    }
    return false;
  }

  private checkPolygonOver(posOnImageWorld: { x: number, y: number } , posOnCanvas: { x: number, y: number }): boolean {
      if (this._imagePageMetadata.version[this._currentLayerVersion].polygonLayer == null) { return ; }
      let mousePosOnPolygon: Polygon;

      for (let index = 0; index < this._imagePageMetadata.version[this._currentLayerVersion].polygonLayer.length; index++) {
        const currentPolygon = this._imagePageMetadata.version[this._currentLayerVersion].polygonLayer[index];
        if (Polygon.IsPolygonContainThePoint(currentPolygon, posOnImageWorld)) {
          mousePosOnPolygon = currentPolygon;
          break;
        }
      }

      if (mousePosOnPolygon) {
        this._context.save();
        const mt = this._resource.matrixTransformer.matrix;
        this._context.setTransform(mt[0], mt[1], mt[2], mt[3], mt[4], mt[5]);

        Drawer.drawPolygon(this._context, mousePosOnPolygon, -this._resource._image.width / 2, -this._resource._image.height / 2, 0.6);
        this._context.restore();
        return true;
      }
      return false;
  }
  private checkPolylineOver(posOnImageWorld: { x: number, y: number } , posOnCanvas: { x: number, y: number }): boolean {
    if (this._imagePageMetadata.version[this._currentLayerVersion].polylineLayer == null) { return ; }
    let mousePosOnPolyline: Polyline;

    for (let index = 0; index < this._imagePageMetadata.version[this._currentLayerVersion].polylineLayer.length; index++) {
      const currentPolyline = this._imagePageMetadata.version[this._currentLayerVersion].polylineLayer[index];
      if (Polyline.IsPolylineNearThePoint(currentPolyline, posOnImageWorld)) {
        mousePosOnPolyline = currentPolyline;
        break;
      }
    }

    if (mousePosOnPolyline) {
      this._context.save();
      const mt = this._resource.matrixTransformer.matrix;
      this._context.setTransform(mt[0], mt[1], mt[2], mt[3], mt[4], mt[5]);

      Drawer.drawPolyline(this._context, mousePosOnPolyline, -this._resource._image.width / 2, -this._resource._image.height / 2, 0.6);
      this._context.restore();
      return true;
    }
    return false;
}
  //#endregion

  //#region Button Actions
  private zoomIn() {
    if (this._systemState === SystemState.Display) {
      if (!this._resource) { return; }
      const newScale = this._resource.viewport.scale * (1 + this.config.scaleStep);
      this._resource.viewport.scale = newScale > this._resource.maxScale ? this._resource.maxScale : newScale;
      this._dirty = true;
    }
  }

  private zoomOut() {
    if (this._systemState === SystemState.Display) {
      if (!this._resource) { return; }
      const newScale = this._resource.viewport.scale * (1 - this.config.scaleStep);
      this._resource.viewport.scale = newScale < this._resource.minScale ? this._resource.minScale : newScale;
      this._dirty = true;
    }
  }

  private rotateLeft() {
    if (this._systemState === SystemState.Display) {
      if (!this._resource) { return; }
      const viewport = this._resource.viewport;
      viewport.rotation = viewport.rotation === 0 ? 270 : viewport.rotation - 90;
      this._dirty = true;
    }
  }

  private rotateRight() {
    if (this._systemState === SystemState.Display) {
      if (!this._resource) { return; }
      const viewport = this._resource.viewport;
      viewport.rotation = viewport.rotation === 270 ? 0 : viewport.rotation + 90;
      this._dirty = true;
      }
  }

  private resetImage() {
    if (this._systemState === SystemState.Display) {
      if (!this._resource) { return; }
      this._resource.resetViewport(this._canvas);
      this._dirty = true;
      }
  }

  private addNotationMode() {
    if (this._systemState === SystemState.AddNotation) {
      this.ReturnToDisplayState();
    } else {
      this._systemState = SystemState.AddNotation;
      this.UpdatePressedStateOnButton(5);
    }
    this._drawingRectangleMode = false;
    this._currentTapCanvasWorldPos = undefined;
    this._prevTapCanvasWorldPos = undefined;
  }

  private addPolygonMode() {
    if (this._systemState === SystemState.AddPolygon) {
      this.ReturnToDisplayState();
    } else {
      this._systemState = SystemState.AddPolygon;
      this.UpdatePressedStateOnButton(6);
    }
    this._inputPolygon = new Polygon();
  }

  private addPolylineMode() {
    if (this._systemState === SystemState.AddPolyline) {
      this.ReturnToDisplayState();
    } else {
      this._systemState = SystemState.AddPolyline;
      this.UpdatePressedStateOnButton(7);
    }
    this._inputPolyline = new Polyline();
  }


  private deleteMode() {
    if (this._systemState === SystemState.DeleteMode) {
      this.ReturnToDisplayState();
    } else {
      this._systemState = SystemState.DeleteMode;
      this.UpdatePressedStateOnButton(8);
    }
  }

  private saveChanges() {
    if (!(this._systemState === SystemState.Display)) {return; }
    if (!this.imagePageMetadata.isChanges) { return; }

    this.saveImagePage.emit(this._imagePageMetadata.pageNumber);

    this.imagePageMetadata.isChanges = false;
    this._buttons[9].thereIsChangesOnResource = false;
  }

  private DisablePressedStateOnButtons() {
    this._buttons.forEach(button => button.pressed = false);
  }
  private UpdatePressedStateOnButton(buttonsNumber: number) {
    this.DisablePressedStateOnButtons();
    this._buttons[buttonsNumber].pressed = true ;
  }
  //#endregion

  //#region Draw Canvas
  private updateCanvas() {
    this.resetImage();

    // start new render loop
    this.render(this._requestAnimationFrame);
    this._requestAnimationFrame = false;
  }

  private render(rAFrame) {
    const vm = this;
    // only re-render if dirty
    if (this._dirty && this._resource) {
      this._dirty = false;

      const ctx = this._context;
      ctx.save();

      this._resource.draw(ctx, this.config, this._canvas, () => {
        ctx.restore();

        if (vm._resource.loaded) {
          // draw buttons
          this.drawButtons(ctx);
        }
      });

      Drawer.drawSystemStateOnCanvas(this._context, this._systemState);
    }
    if (rAFrame) {
    requestAnimationFrame(() => this.render(true));
    }
  }

  private drawButtons(ctx) {
    const padding = this.config.tooltips.padding;
    const radius = this.config.tooltips.radius;
    const gap = 2 * radius + padding;
    const x = this._canvas.width - radius - padding;
    const y = this._canvas.height - radius - padding;

    // draw buttons
    for (let i = 0; i < this._buttons.length; i++) {
      this._buttons[i].draw(ctx, x, y - gap * i, radius);
    }

    // draw tooltip
    if (this._currentTooltip !== null && this._canvas.width > MIN_TOOLTIP_WIDTH_SPACE) {
      ctx.save();
      const fontSize = radius;
      ctx.font = fontSize + 'px sans-serif';

      // calculate position
      const textSize = ctx.measureText(this._currentTooltip).width
        , rectWidth = textSize + padding
        , rectHeight = fontSize * 0.70 + padding
        , rectX = this._canvas.width
          - (2 * radius + 2 * padding) // buttons
          - rectWidth
        , rectY = this._canvas.height - rectHeight - padding
        , textX = rectX + 0.5 * padding
        , textY = this._canvas.height - 1.5 * padding;

      ctx.globalAlpha = this.config.tooltips.bgAlpha;
      ctx.fillStyle = this.config.tooltips.bgStyle;
      Drawer.drawRoundRectangle(ctx, rectX, rectY, rectWidth, rectHeight, 8, true, false);

      ctx.globalAlpha = this.config.tooltips.textAlpha;
      ctx.fillStyle = this.config.tooltips.textStyle;
      ctx.fillText(this._currentTooltip, textX, textY);

      ctx.restore();
    }
  }

  //#endregion

  //#region Utils
  private getUIElements(): Button[] {
    const hoverElements = this._buttons.slice();
    return hoverElements;
  }

  private getUIElement(pos: { x: number, y: number }) {
    const activeUIElement = this.getUIElements().filter((uiElement) => {
      return uiElement.isWithinBounds(pos.x, pos.y);
    });
    return (activeUIElement.length > 0) ? activeUIElement[0] : null;
  }

  private isImage(file: string | File) {
    if (this._filetype && this._filetype.toLowerCase() === 'image') { return true; }
    return testFile(file, '\\.(png|jpg|jpeg|gif)|image/png');
  }

  private CanvasCenterToImagePosition(canvasPos: { x: number, y: number }) {
    const CanvasWorldPos = this._resource.matrixTransformer.toWorld(canvasPos);
    const ctx = this._context;
    Drawer.drawPointerCanvas(ctx, this._resource.matrixTransformer, CanvasWorldPos.x , CanvasWorldPos.y , this._systemState);
   return this.CanvasWorldPositionToImagePosition(CanvasWorldPos);
    // console.log('Point on the canvas x =' + canvasPos.x + ' y=' + canvasPos.y);
    // console.log('Point in the CANVASWorldPos  is x =' + CanvasWorldPos.x + ' y=' + CanvasWorldPos.y);
    // console.log('Point in the mouseImageWorld is x =' + imagePos.x + ' y=' + imagePos.y);
  }

   // translation from the canvasWorld to the image world
  private CanvasWorldPositionToImagePosition (CanvasWorldPos: { x: number, y: number }) {
    const imagePos = {
      x:   (CanvasWorldPos.x + this._resource._image.width / 2) ,
      y:   (CanvasWorldPos.y + this._resource._image.height / 2)
    };
    return imagePos;
  }

  private screenToCanvasCenter(pos: { x: number, y: number }) {
    const rect = this._canvas.getBoundingClientRect();
    return { x: pos.x - rect.left, y: pos.y - rect.top };
  }
  //#endregion

  public returnLastPolygon(): Polygon {
    return this._inputPolygon;
  }
}

function testFile(file: string | File, regexTest: string) {
  if (!file) { return false; }
  const name = file instanceof File ? file.name : file;
  return name.toLowerCase().match(regexTest) !== null;
}


