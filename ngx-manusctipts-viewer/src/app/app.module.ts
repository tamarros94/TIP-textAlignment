import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {SidenavOpenCloseComponent} from './sidenav-open-close/sidenav-open-close.component';

// #region Angular Material
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MaterialModule } from './shared/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatDialogModule} from '@angular/material';
// #endregion

import { ManuscriptViewerComponent } from './sidenav-open-close/manuscript-viewer/manuscript-viewer.component';
import { ShowcaseComponent } from './sidenav-open-close/manuscript-viewer/showcase/showcase.component';
import { ImageCardComponent } from './sidenav-open-close/manuscript-viewer/showcase/image-card/image-card.component';
import { ImageviewerComponent } from './sidenav-open-close/manuscript-viewer/imageviewer/imageviewer.component';

import { HttpClientModule } from '@angular/common/http';
// tslint:disable-next-line:max-line-length
import { TextNoteDialogComponent } from 'src/app/sidenav-open-close/manuscript-viewer/imageviewer/text-note-dialog/text-note-dialog.component';



@NgModule({
  declarations: [
    AppComponent,
    SidenavOpenCloseComponent,
    ManuscriptViewerComponent,
    ShowcaseComponent,
    ImageCardComponent,
    ImageviewerComponent,
    TextNoteDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, MaterialModule, MatDialogModule, // Angular Material
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule   // import HttpClientModule after BrowserModule.
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [TextNoteDialogComponent]
})
export class AppModule { }
