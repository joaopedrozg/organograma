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
    <div class="dialog-shell">
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
    </div>
  `,
  styles: [`
    .dialog-shell {
      background: rgba(8, 10, 18, 0.96);
      color: #f8fbff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(25px) saturate(180%);
    }

    h2[mat-dialog-title] {
      margin: 0;
      padding: 20px 24px 12px;
      color: #fff;
      font-weight: 800;
      font-size: 1.15rem;
    }

    mat-dialog-content {
      padding: 8px 24px 0;
    }

    .dialog-form {
      min-width: 320px;
      padding-top: 4px;
    }

    .full-width {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field {
      .mdc-text-field {
        background: rgba(255, 255, 255, 0.04) !important;
      }

      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing {
        border-color: rgba(255, 255, 255, 0.28) !important;
      }

      &.mat-focused {
        .mdc-notched-outline__leading,
        .mdc-notched-outline__notch,
        .mdc-notched-outline__trailing {
          border-color: #0fbcf9 !important;
          border-width: 2px !important;
          filter: drop-shadow(0 0 6px rgba(15, 188, 249, 0.5));
        }

        .mdc-floating-label {
          color: #0fbcf9 !important;
        }
      }

      .mdc-floating-label,
      .mat-mdc-input-element {
        color: #f8fbff !important;
      }

      .mat-mdc-input-element::placeholder {
        color: rgba(255, 255, 255, 0.62) !important;
      }

      .mat-mdc-form-field-error {
        color: #ff8a9b !important;
      }
    }

    mat-dialog-actions {
      padding: 12px 24px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    button[mat-button] {
      color: rgba(255, 255, 255, 0.78);
    }

    button[mat-flat-button] {
      background: linear-gradient(135deg, #8e44ad 0%, #0fbcf9 100%);
      color: #fff;
      box-shadow: 0 4px 15px rgba(15, 188, 249, 0.3);
    }

    button[disabled] {
      background: rgba(255, 255, 255, 0.1) !important;
      color: rgba(255, 255, 255, 0.2) !important;
      box-shadow: none;
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
