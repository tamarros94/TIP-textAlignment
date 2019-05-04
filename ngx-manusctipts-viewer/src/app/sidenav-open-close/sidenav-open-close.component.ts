import {Component, Input, OnInit} from '@angular/core';
import { ManuscriptService } from '../services/services.imageService';
import { error } from 'util';
import { Manuscript } from '../models/manuscript';
import { ImagePage } from '../models/image-page';

@Component({
  selector: 'app-sidenav-open-close',
  templateUrl: './sidenav-open-close.component.html',
  styleUrls: ['./sidenav-open-close.component.scss']
})
export class SidenavOpenCloseComponent implements OnInit {
  @Input()
  name: string;
  opened: boolean;
  public profileManuscripts: Manuscript[];
  userName = 'HodAmran';
  errorMessage: string;
  _currentWorkingManuscript: number;

  constructor(private _manuscriptService: ManuscriptService) {
    this.opened = true;
    // this._currentWorkingManuscript = 0 ;
   }

   //#region  toggle navigation
  public selectedVal: number;
  public onValChange(val: number) {
    console.log('change to manuscript ' + val );
    this._currentWorkingManuscript = val ;
    this._manuscriptService.cacheCurrentPage(
      this.profileManuscripts[ this._currentWorkingManuscript].pages[0],
      this._currentWorkingManuscript, this.name);
  }
  public pageChanged(val: ImagePage) {
    this._manuscriptService.cacheCurrentPage(val, this._currentWorkingManuscript, this.name);
  }
  //#region

  ngOnInit(): void {
    this._manuscriptService.getManuscriptOfUser()
              .subscribe(profileManuscripts => {
                  this.profileManuscripts = profileManuscripts;
              },
              // tslint:disable-next-line:no-shadowed-variable
              error => this.errorMessage = <any>error);
  }

  saveToServerImagePage(imagePageIndex: number) {
    const mIndex = this._currentWorkingManuscript;
    console.log('send To server imagePage ' + imagePageIndex +
                ' of manuscript ' +
                this.profileManuscripts[mIndex].id);
    this._manuscriptService.postImagPageToManuscript(
      this.profileManuscripts[mIndex].id,
      this.profileManuscripts[mIndex].pages[imagePageIndex]
    );
  }

}
