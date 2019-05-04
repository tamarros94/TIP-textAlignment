import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup , ReactiveFormsModule } from '@angular/forms';
import { EventEmitter } from 'events';

@Component({
  selector: 'app-text-note-dialog',
  templateUrl: './text-note-dialog.component.html',
  styleUrls: ['./text-note-dialog.component.scss']
})
export class TextNoteDialogComponent implements OnInit {

    form: FormGroup;
    description: string;
    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<TextNoteDialogComponent>,
        @Inject(MAT_DIALOG_DATA) data) {

        this.description = data.description;
    }

    ngOnInit() {
        this.form = this.fb.group({
            description: [, []]
        });
    }

    save() {
        this.dialogRef.close(this.form.value);
    }

    cancel() {
        this.dialogRef.close();
    }
}
