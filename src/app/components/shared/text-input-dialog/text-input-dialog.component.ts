import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface TextInputDialogData {
  title: string;
  label: string;
  placeholder?: string;
  value?: string;
}

@Component({
  selector: 'app-text-input-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.label }}</mat-label>
          <input matInput [placeholder]="data.placeholder || data.label" formControlName="value" />
          @if (form.get('value')?.hasError('required')) {
            <mat-error>Campo obrigatório</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="button" (click)="confirm()" [disabled]="form.invalid">
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      min-width: 320px;
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class TextInputDialogComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    value: ['', Validators.required]
  });

  constructor(
    public dialogRef: MatDialogRef<TextInputDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: TextInputDialogData
  ) {
    this.form.setValue({ value: this.data.value ?? '' });
  }

  close(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.value?.trim() || undefined);
  }
}
