import {Component} from '@angular/core';
import {ManuscriptService} from './services/services.imageService';
import {ImageviewerComponent} from './sidenav-open-close/manuscript-viewer/imageviewer/imageviewer.component';
import {ImageLayers, ImagePage, Polygon} from './models/image-page';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ManuscriptService, ImageviewerComponent]
})
export class AppComponent {

  constructor(private _manuscriptService: ManuscriptService) {
  }
  public addManualAlign() {
    this._manuscriptService.saveMatches().toPromise().then(x => alert('saved'));
  }
}
