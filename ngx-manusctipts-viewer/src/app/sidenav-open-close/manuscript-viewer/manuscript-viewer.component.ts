import { Component, OnInit, Input, ViewChild, ElementRef, HostListener, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Manuscript } from '../../models/manuscript';
import { ImagePage } from '../../models/image-page';
import { VersionChangeEvent } from '../../models/events';

@Component({
  selector: 'app-manuscript-viewer',
  templateUrl: './manuscript-viewer.component.html',
  styleUrls: ['./manuscript-viewer.component.scss']
})
export class ManuscriptViewerComponent implements AfterViewInit {


  // public  images: File[]; //option for upload
  public _workingImagePage: ImagePage;
  public _workingImagePageVersion: number;

  //#region Inputs
  private _manuscript: Manuscript;
  get manuscript() { return this._manuscript; }
  @Input('manuscript') set manuscript(value: Manuscript) {
   this._manuscript = value;
   if (this._manuscript) {
    if (this._manuscript.pages) {
      this._workingImagePage = this._manuscript.pages[0];
      if ((this._manuscript.pages[0].version) && (this._manuscript.pages[0].version.length >  0)) {
      this._workingImagePageVersion = this._manuscript.pages[0].version.length - 1;
      }
    } else {
      this._workingImagePage = null;
    }
   }
  }
  //#endregion

  //#region Outputs
  @Output()
  saveToServerImagePage: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  pageChanged: EventEmitter<ImagePage> = new EventEmitter<ImagePage>();
  //#endregion

  constructor() { }


  private onImageEditClicked(imagePageNumber: number ) {
    this._workingImagePage =  this._manuscript.pages[imagePageNumber - 1];
    this._workingImagePageVersion = 0;
    this.pageChanged.emit(this._workingImagePage);
  }

  private onVersionSelected(event: VersionChangeEvent) {
    if (this._workingImagePage.pageNumber === event.pageNumber) {
    this._workingImagePageVersion = event.version;
    }
  }

  private onSaveCurrentWorkingImagePage(workingPageIndex: number) {
    console.log('save to server to save page ' + workingPageIndex );
    this.saveToServerImagePage.emit(workingPageIndex);
  }

  // #region Option for upload
  // handleInputChange(event) {
  //   this.images = new Array(event.target.files.length);

  //  for (let index = 0; index < this.images.length; index++) {
  //   this.images[index] = event.target.files[index];
  //  }
  //  this.SetUp();
  // }
  // #endregion

  //#region For resize imageviewer by the parent size
  // tslint:disable-next-line:member-ordering
  @ViewChild('imagewrapper') wrapper: ElementRef;

  // tslint:disable-next-line:member-ordering
  private _canvasDim = { width: 10, height: 10 };
  get canvasDim() {
    return this._canvasDim;
  }

  ngAfterViewInit() {
    this.updateCanvasDim();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateCanvasDim();
  }

  private updateCanvasDim() {
    const el = this.wrapper && this.wrapper.nativeElement ? this.wrapper.nativeElement : null;
    if (el && (el.offsetWidth !== this._canvasDim.width || el.offsetHeight !== this._canvasDim.height)) {
      const newDim = { width: el.offsetWidth - 40, height: el.offsetHeight - 40 };
      setTimeout(() => this._canvasDim = newDim, 0);
    }
  }
  //#endregion

}
