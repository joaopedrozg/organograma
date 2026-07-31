import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { Cargo, Departamento, Funcionario } from '../../models/models';
import { map, startWith } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { TextInputDialogComponent } from '../shared/text-input-dialog/text-input-dialog.component';

@Component({
  selector: 'app-funcionario-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './funcionario-modal.component.html',
  styleUrl: './funcionario-modal.component.scss'
})
export class FuncionarioModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  funcionarioForm: FormGroup;
  buscaControl = this.fb.control('');

  funcionarios = signal<Funcionario[]>([]);
  filteredFuncionarios = signal<Funcionario[]>([]);

  cargos = signal<Cargo[]>([]);
  departamentos = signal<Departamento[]>([]);

  filteredCargos!: Observable<Cargo[]>;
  filteredDepartamentos!: Observable<Departamento[]>;
  filteredGestores!: Observable<Funcionario[]>;

  editingFuncionarioId: string | null = null;
  isSaving = signal(false);

  displayedColumns: string[] = ['name', 'cargo', 'departamento', 'acoes'];

  constructor(
    public dialogRef: MatDialogRef<FuncionarioModalComponent>
  ) {
    this.funcionarioForm = this.fb.group({
      name: ['', Validators.required],
      cargo: ['', Validators.required],
      departamento: ['', Validators.required],
      parentId: [null],
      imagem: ['']
    });
  }

  ngOnInit(): void {
    this.carregarDados();
    this.setupFilters();

    this.buscaControl.valueChanges.subscribe(val => {
      this.filtrarFuncionarios(val || '');
    });
  }

  carregarDados(): void {
    this.apiService.getFuncionarios().subscribe({
      next: (data) => {
        this.funcionarios.set(data);
        this.filtrarFuncionarios(this.buscaControl.value || '');
        this.funcionarioForm.get('cargo')?.setValue(this.funcionarioForm.get('cargo')?.value ?? '', { emitEvent: true });
        this.funcionarioForm.get('departamento')?.setValue(this.funcionarioForm.get('departamento')?.value ?? '', { emitEvent: true });
        this.funcionarioForm.get('parentId')?.setValue(this.funcionarioForm.get('parentId')?.value ?? '', { emitEvent: true });
      },
      error: () => this.snackBar.open('Falha ao carregar funcionários.', 'Fechar', { duration: 4000 })
    });

    this.apiService.getCargos().subscribe({
      next: (data) => this.cargos.set(data),
      error: () => this.snackBar.open('Falha ao carregar cargos.', 'Fechar', { duration: 4000 })
    });

    this.apiService.getDepartamentos().subscribe({
      next: (data) => this.departamentos.set(data),
      error: () => this.snackBar.open('Falha ao carregar departamentos.', 'Fechar', { duration: 4000 })
    });
  }

  setupFilters(): void {
    this.filteredCargos = this.funcionarioForm.get('cargo')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.nome;
        return name ? this._filterCargos(name) : this.cargos().slice();
      })
    );

    this.filteredDepartamentos = this.funcionarioForm.get('departamento')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.nome;
        return name ? this._filterDeptos(name) : this.departamentos().slice();
      })
    );

    this.filteredGestores = this.funcionarioForm.get('parentId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterGestores(name) : this._availableGestores();
      })
    );
  }

  private _filterCargos(value: string): Cargo[] {
    const filterValue = value.toLowerCase();
    return this.cargos().filter(c => c.nome.toLowerCase().includes(filterValue));
  }

  private _filterDeptos(value: string): Departamento[] {
    const filterValue = value.toLowerCase();
    return this.departamentos().filter(d => d.nome.toLowerCase().includes(filterValue));
  }

  private _filterGestores(value: string): Funcionario[] {
    const filterValue = value.toLowerCase();
    return this._availableGestores().filter(f => f.name.toLowerCase().includes(filterValue));
  }

  private _availableGestores(): Funcionario[] {
    return this.funcionarios().filter(f => !this.editingFuncionarioId || f.id !== this.editingFuncionarioId);
  }

  displayFn(item: any): string {
    return item && (item.nome || item.name) ? (item.nome || item.name) : '';
  }

  filtrarFuncionarios(termo: string): void {
    const filterValue = termo.toLowerCase();
    this.filteredFuncionarios.set(
      this.funcionarios().filter(f =>
        f.name.toLowerCase().includes(filterValue) ||
        f.cargo?.nome.toLowerCase().includes(filterValue) ||
        f.departamento?.nome.toLowerCase().includes(filterValue)
      )
    );
  }

  salvar(): void {
    if (this.funcionarioForm.invalid) return;

    const formValue = this.funcionarioForm.value;

    // Garantir que cargo e depto sejam objetos selecionados (têm ID)
    if (!formValue.cargo.id || !formValue.departamento.id) {
        // Opcional: mostrar erro se não for selecionado do autocomplete
        return;
    }

    if (formValue.parentId && !formValue.parentId.id) {
      return;
    }

    const funcionario: Funcionario = {
      name: formValue.name,
      cargoId: formValue.cargo.id,
      departamentoId: formValue.departamento.id,
      parentId: formValue.parentId ? formValue.parentId.id : null,
      imagem: formValue.imagem
    };

    this.isSaving.set(true);

    if (this.editingFuncionarioId) {
      this.apiService.updateFuncionario(this.editingFuncionarioId, funcionario).subscribe(() => {
        this.isSaving.set(false);
        this.resetForm();
        this.carregarDados();
        this.snackBar.open('Funcionário atualizado com sucesso.', 'Fechar', {
          duration: 3000
        });
      }, () => {
        this.isSaving.set(false);
        this.snackBar.open('Não foi possível atualizar o funcionário.', 'Fechar', {
          duration: 4000
        });
      });
    } else {
      this.apiService.createFuncionario(funcionario).subscribe(() => {
        this.isSaving.set(false);
        this.resetForm();
        this.carregarDados();
        this.snackBar.open('Funcionário cadastrado com sucesso.', 'Fechar', {
          duration: 3000
        });
      }, () => {
        this.isSaving.set(false);
        this.snackBar.open('Não foi possível cadastrar o funcionário.', 'Fechar', {
          duration: 4000
        });
      });
    }
  }

  editar(f: Funcionario): void {
    this.editingFuncionarioId = f.id || null;
    const gestorAtual = this.funcionarios().find(funcionario => funcionario.id === f.parentId) || null;
    this.funcionarioForm.patchValue({
      name: f.name,
      cargo: f.cargo,
      departamento: f.departamento,
      parentId: gestorAtual,
      imagem: f.imagem
    });
  }

  resetForm(): void {
    this.editingFuncionarioId = null;
    this.funcionarioForm.reset();
  }

  addCargo(): void {
    const ref = this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Novo cargo',
        label: 'Nome do cargo',
        placeholder: 'Ex: Analista de Dados'
      }
    });

    ref.afterClosed().subscribe((nome) => {
      if (!nome) return;

      this.apiService.createCargo({ nome }).subscribe({
        next: (novo) => {
          this.cargos.set([...this.cargos(), novo]);
          this.funcionarioForm.get('cargo')?.setValue(novo);
          this.snackBar.open('Cargo criado com sucesso.', 'Fechar', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Não foi possível criar o cargo.', 'Fechar', { duration: 4000 });
        }
      });
    });
  }

  addDepartamento(): void {
    const ref = this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Novo departamento',
        label: 'Nome do departamento',
        placeholder: 'Ex: Engenharia'
      }
    });

    ref.afterClosed().subscribe((nome) => {
      if (!nome) return;

      this.apiService.createDepartamento({ nome }).subscribe({
        next: (novo) => {
          this.departamentos.set([...this.departamentos(), novo]);
          this.funcionarioForm.get('departamento')?.setValue(novo);
          this.snackBar.open('Departamento criado com sucesso.', 'Fechar', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Não foi possível criar o departamento.', 'Fechar', { duration: 4000 });
        }
      });
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
