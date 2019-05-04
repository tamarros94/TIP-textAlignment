import { Component , Input, Output , EventEmitter } from '@angular/core';
import { ImagePage } from '../../../models/image-page';
import { VersionChangeEvent } from '../../../models/events';

@Component({
  selector: 'app-showcase',
  templateUrl: './showcase.component.html',
  styleUrls: ['./showcase.component.scss']
})
export class ShowcaseComponent {
   // @Input() pages: File[];
 // @Input() pages: ImagePage[];

  _imagePages: ImagePage[];
  get imagePages() { return this._imagePages; }
  @Input('imagePages') set imagePages(value) {
    this._imagePages = value;
  }

  @Output()
  imageCardEdit: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  versionChange: EventEmitter<VersionChangeEvent> = new EventEmitter<VersionChangeEvent>();


  public onImageEditClicked(imagePageNumber: number) {
    this.imageCardEdit.emit(imagePageNumber);
  }

  public onVersionChangeClicked(event: VersionChangeEvent) {
    this.versionChange.emit(event);
  }
}
