import { Component , Input, Output , EventEmitter } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImagePage } from '../../../../models/image-page';
import { MatSelectChange } from '@angular/material';
import { VersionChangeEvent } from '../../../../models/events';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss']
})
export class ImageCardComponent  {
//#region Input properties

  _imagePage: ImagePage;
  get imagePage() { return this._imagePage; }
  @Input('imagePage') set imagePage(value) {
    this._imagePage = value;
    this.cardIndex = this._imagePage.pageNumber;
    this.imageUrl = this._imagePage.imageUrl;

    this.versions = new Array<number>();

    if (this._imagePage.version) {
      for (let index = 0; index < this._imagePage.version.length; index++) {
        this.versions.push(index);

      }
      this.selectedVersion = String(this._imagePage.version.length - 1);
    }
  }

  cardIndex: number;
  imageUrl: string;
  versions: Array<number>;
  selectedVersion = '0';

  // Option for upload
  // @Input('imageFile') set imageFile(value) {
  //   if (value === this._imageFile) { return; }
  //   this._imageFile = value;
  //   this.src = this.getSanitizerUrl(URL.createObjectURL(this._imageFile));
  // }
  //#endregion Input properties

  // private _imageFile: File;
  // public src: SafeUrl;

  // constructor(private sanitizer: DomSanitizer) { }



//#region Output properties
  @Output()
  imageCardEdit: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  versionChangeClicked: EventEmitter<VersionChangeEvent> = new EventEmitter<VersionChangeEvent>();
//#endregion Output properties


//#region Clicked function
public editImageClicked(): void {
  this.imageCardEdit.emit(this._imagePage.pageNumber);
  if (this._imagePage.version) {
    if (this._imagePage.version) {
      this.selectedVersion = String(this._imagePage.version.length - 1);
     this.versionChangeClicked.emit({version: parseInt(this.selectedVersion, 10), pageNumber: this.cardIndex});
    }
  }
}

public versionChangeSelection(version: MatSelectChange ) {
  console.log('version' + version.value);
  this.versionChangeClicked.emit({version: parseInt(version.value, 10), pageNumber: this.cardIndex});
}
//#endregion Clicked function


// #region Utils
// Option for upload
// private getSanitizerUrl(url: string) {
//   return this.sanitizer.bypassSecurityTrustUrl(url);
// }
//
}
