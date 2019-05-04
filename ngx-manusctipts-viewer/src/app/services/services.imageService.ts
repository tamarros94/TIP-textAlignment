import {Injectable} from '@angular/core';

import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {tap, catchError} from 'rxjs/operators';

import {HttpErrorResponse} from '@angular/common/http/src/response';
import {Manuscript} from '../models/manuscript';
import {ImagePage} from '../models/image-page';

@Injectable()
export class ManuscriptService {

  public _imageUrl = './api/manuscripts.json';
  private _currentMenuScripts = {
    right: {},
    left: {}
  };
  // this option is a server url
  // private _imageUrl = 'http://localhost:65267/api/images';


  constructor(private _http: HttpClient) {

  }

  public postImagPageToManuscript(manuscriptID: string, imagePage: ImagePage) {
    const urlPosting = 'http://localhost:3060/' + manuscriptID;
    return this._http.post(urlPosting, imagePage)
      .pipe(
        catchError(this.handleError)
      );
  }

  public getManuscriptOfUser(): Observable<Manuscript[]> {
    return this._http.get<Manuscript[]>(this._imageUrl)
      .pipe(
        tap(data => console.log('All: ' + JSON.stringify(data)))
        , catchError(this.handleError)
      );
  }

  public cacheCurrentPage(imagePage: ImagePage, menuScriptId: number, side: string) {
    this._currentMenuScripts[side] = {menuScriptId, imagePage};
  }

  public saveMatches() {
    // @ts-ignore
    const rightImagePage: ImagePage = this._currentMenuScripts['right']['imagePage'];
    // @ts-ignore
    const leftImagePage: ImagePage = this._currentMenuScripts['left']['imagePage'];

    const matches = {
      rightMenuScriptId: this._currentMenuScripts['right']['menuScriptId'],
      leftMenuScriptId: this._currentMenuScripts['left']['menuScriptId'],
      rightPage: {
        number: rightImagePage.pageNumber,
        polygons: rightImagePage.version[rightImagePage.version.length - 1].polygonLayer
          .slice(this.getStartPolygon(rightImagePage, leftImagePage))
      },
      leftPage: {
        number: leftImagePage.pageNumber,
        polygons: leftImagePage.version[leftImagePage.version.length - 1].polygonLayer
          .slice(this.getStartPolygon(rightImagePage, leftImagePage))
      }
    };
    console.log(JSON.stringify(matches));
    return this._http.post('localhost:3000/matches', matches);
  }

  private getStartPolygon(rightImagePage: ImagePage, leftImagePage: ImagePage) {
    return rightImagePage.version[rightImagePage.version.length - 1]
      .polygonLayer.length - 1 - this.getShortNumberOfPolygons(rightImagePage, leftImagePage);
  }

  private getShortNumberOfPolygons(rightImage: ImagePage, leftImage: ImagePage) {
    return Math.min(rightImage.version[rightImage.version.length - 1].polygonLayer.length,
      leftImage.version[leftImage.version.length - 1].polygonLayer.length);
  }

  private handleError(err: HttpErrorResponse) {
    console.log(err.message);
    return throwError(err.message);
  }
}
