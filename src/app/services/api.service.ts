import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Cargo, Departamento, Funcionario } from '../models/models';
import { supabase } from '../supabase/supabase.client';
import { environment } from '../../environments/environment';

type RowData = Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly config = environment.supabase;

  private get funcionarioTable(): string {
    return this.config.tables.funcionario;
  }

  private get cargoTable(): string {
    return this.config.tables.cargo;
  }

  private get departamentoTable(): string {
    return this.config.tables.departamento;
  }

  private get imageTable(): string {
    return this.config.tables.image;
  }

  private get emailTable(): string {
    return this.config.tables.email;
  }

  private get funcionarioColumns() {
    return this.config.columns.funcionario;
  }

  private get cargoColumns() {
    return this.config.columns.cargo;
  }

  private get departamentoColumns() {
    return this.config.columns.departamento;
  }

  private get imageColumns() {
    return this.config.columns.image;
  }

  private get emailColumns() {
    return this.config.columns.email;
  }

  // Funcionários
  getFuncionarios(): Observable<Funcionario[]> {
    return from(this.fetchFuncionarios());
  }

  createFuncionario(funcionario: Funcionario): Observable<Funcionario> {
    return from(this.createFuncionarioInternal(funcionario));
  }

  updateFuncionario(id: string, funcionario: Funcionario): Observable<Funcionario> {
    return from(this.updateFuncionarioInternal(id, funcionario));
  }

  deleteFuncionario(id: string): Observable<void> {
    return from(this.deleteFuncionarioInternal(id));
  }

  // Cargos
  getCargos(): Observable<Cargo[]> {
    return from(this.fetchCargos());
  }

  createCargo(cargo: Cargo): Observable<Cargo> {
    return from(this.createCargoInternal(cargo));
  }

  // Departamentos
  getDepartamentos(): Observable<Departamento[]> {
    return from(this.fetchDepartamentos());
  }

  createDepartamento(depto: Departamento): Observable<Departamento> {
    return from(this.createDepartamentoInternal(depto));
  }

  private async fetchFuncionarios(): Promise<Funcionario[]> {
    const [funcionariosRes, cargosRes, departamentosRes, imagesRes, emailsRes] = await Promise.all([
      supabase.from(this.funcionarioTable).select('*'),
      supabase.from(this.cargoTable).select('*'),
      supabase.from(this.departamentoTable).select('*'),
      supabase.from(this.imageTable).select('*'),
      supabase.from(this.emailTable).select('*')
    ]);

    if (funcionariosRes.error) throw funcionariosRes.error;
    if (cargosRes.error) throw cargosRes.error;
    if (departamentosRes.error) throw departamentosRes.error;
    if (imagesRes.error) throw imagesRes.error;
    if (emailsRes.error) throw emailsRes.error;

    const cargos = (cargosRes.data ?? []).map((row) => this.mapCargo(row as RowData));
    const departamentos = (departamentosRes.data ?? []).map((row) => this.mapDepartamento(row as RowData));

    const cargosPorId = new Map<string, Cargo>(cargos.map((c) => [String(c.id), c]));
    const departamentosPorId = new Map<string, Departamento>(departamentos.map((d) => [String(d.id), d]));
    const imageUrlPorId = new Map<string, string>(
      (imagesRes.data ?? []).map((row) => {
        const data = row as RowData;
        const id = this.readValue(data, [this.imageColumns.id]);
        const imageUrl = this.readValue(data, [this.imageColumns.imageUrl]);
        return [String(id), imageUrl != null ? String(imageUrl) : ''];
      })
    );
    const emailPorId = new Map<string, string>(
      (emailsRes.data ?? []).map((row) => {
        const data = row as RowData;
        const id = this.readValue(data, [this.emailColumns.id]);
        const email = this.readValue(data, [this.emailColumns.email]);
        return [String(id), email != null ? String(email) : ''];
      })
    );

    return (funcionariosRes.data ?? []).map((row) =>
      this.mapFuncionario(row as RowData, cargosPorId, departamentosPorId, imageUrlPorId, emailPorId)
    );
  }

  private async createFuncionarioInternal(funcionario: Funcionario): Promise<Funcionario> {
    const payload = await this.toFuncionarioPayload(funcionario);
    const { data, error } = await supabase
      .from(this.funcionarioTable)
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return this.mapFuncionario(data as RowData);
  }

  private async updateFuncionarioInternal(id: string, funcionario: Funcionario): Promise<Funcionario> {
    const payload = await this.toFuncionarioPayload(funcionario);
    const { data, error } = await supabase
      .from(this.funcionarioTable)
      .update(payload)
      .eq(this.funcionarioColumns.id, id)
      .select('*')
      .single();

    if (error) throw error;

    return this.mapFuncionario(data as RowData);
  }

  private async deleteFuncionarioInternal(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.funcionarioTable)
      .delete()
      .eq(this.funcionarioColumns.id, id);

    if (error) throw error;
  }

  private async fetchCargos(): Promise<Cargo[]> {
    const { data, error } = await supabase
      .from(this.cargoTable)
      .select('*')
      .order(this.cargoColumns.nome, { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => this.mapCargo(row as RowData));
  }

  private async createCargoInternal(cargo: Cargo): Promise<Cargo> {
    const payload = {
      [this.cargoColumns.nome]: cargo.nome
    };

    const { data, error } = await supabase
      .from(this.cargoTable)
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return this.mapCargo(data as RowData);
  }

  private async fetchDepartamentos(): Promise<Departamento[]> {
    const { data, error } = await supabase
      .from(this.departamentoTable)
      .select('*')
      .order(this.departamentoColumns.nome, { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => this.mapDepartamento(row as RowData));
  }

  private async createDepartamentoInternal(depto: Departamento): Promise<Departamento> {
    const payload = {
      [this.departamentoColumns.nome]: depto.nome
    };

    const { data, error } = await supabase
      .from(this.departamentoTable)
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return this.mapDepartamento(data as RowData);
  }

  private mapFuncionario(
    row: RowData,
    cargosPorId?: Map<string, Cargo>,
    departamentosPorId?: Map<string, Departamento>,
    imageUrlPorId?: Map<string, string>,
    emailPorId?: Map<string, string>
  ): Funcionario {
    const id = this.readValue(row, [this.funcionarioColumns.id]);
    const name = this.readValue(row, [this.funcionarioColumns.name, 'nome']) ?? '';
    const cargoId = this.readValue(row, [this.funcionarioColumns.cargoId, 'cargoId', 'cargo_id']) ?? '';
    const departamentoId =
      this.readValue(row, [this.funcionarioColumns.departamentoId, 'departamentoId', 'departamento_id']) ?? '';
    const parentId = this.readValue(row, [this.funcionarioColumns.parentId, 'parentId', 'parent_id', 'gestor_id']);
    const imageId = this.readValue(row, [this.funcionarioColumns.imageId, 'image_id']);
    const emailId = this.readValue(row, [this.funcionarioColumns.emailId, 'email_id']);
    const isUsuario = this.readValue(row, [this.funcionarioColumns.isUsuario, 'is_usuario']);
    const authUserId = this.readValue(row, [this.funcionarioColumns.authUserId, 'auth_user_id']);
    const imagem = imageId != null ? imageUrlPorId?.get(String(imageId)) : null;
    const email = emailId != null ? emailPorId?.get(String(emailId)) : null;
    const dataCadastro = this.readValue(row, [this.funcionarioColumns.dataCadastro, 'data_cadastro']);

    const funcionario: Funcionario = {
      id: id != null ? String(id) : undefined,
      name: String(name),
      email: email != null && email !== '' ? String(email) : undefined,
      emailId: emailId != null && emailId !== '' ? String(emailId) : null,
      isUsuario: Boolean(isUsuario),
      authUserId: authUserId != null && authUserId !== '' ? String(authUserId) : null,
      cargoId: String(cargoId),
      departamentoId: String(departamentoId),
      parentId: parentId == null || parentId === '' ? null : String(parentId),
      imagem: imagem != null && imagem !== '' ? String(imagem) : undefined,
      imageId: imageId != null && imageId !== '' ? String(imageId) : null,
      dataCadastro: dataCadastro != null ? String(dataCadastro) : undefined
    };

    const cargo = cargosPorId?.get(funcionario.cargoId);
    const departamento = departamentosPorId?.get(funcionario.departamentoId);

    if (cargo) {
      funcionario.cargo = cargo;
    }

    if (departamento) {
      funcionario.departamento = departamento;
    }

    return funcionario;
  }

  private mapCargo(row: RowData): Cargo {
    const id = this.readValue(row, [this.cargoColumns.id]);
    const nome = this.readValue(row, [this.cargoColumns.nome, 'name']) ?? '';

    return {
      id: id != null ? String(id) : undefined,
      nome: String(nome)
    };
  }

  private mapDepartamento(row: RowData): Departamento {
    const id = this.readValue(row, [this.departamentoColumns.id]);
    const nome = this.readValue(row, [this.departamentoColumns.nome, 'name']) ?? '';

    return {
      id: id != null ? String(id) : undefined,
      nome: String(nome)
    };
  }

  private async toFuncionarioPayload(funcionario: Funcionario): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = {
      [this.funcionarioColumns.name]: funcionario.name,
      [this.funcionarioColumns.cargoId]: funcionario.cargoId,
      [this.funcionarioColumns.departamentoId]: funcionario.departamentoId,
      [this.funcionarioColumns.parentId]: funcionario.parentId ?? null
    };

    if (this.funcionarioColumns.emailId) {
      payload[this.funcionarioColumns.emailId] = await this.resolveEmailId(funcionario.email, funcionario.emailId);
    }

    if (this.funcionarioColumns.isUsuario) {
      payload[this.funcionarioColumns.isUsuario] = Boolean(funcionario.isUsuario);
    }

    if (this.funcionarioColumns.authUserId) {
      payload[this.funcionarioColumns.authUserId] = funcionario.authUserId ?? null;
    }

    if (this.funcionarioColumns.imageId) {
      payload[this.funcionarioColumns.imageId] = await this.resolveImageId(funcionario.imagem, funcionario.imageId);
    }

    return payload;
  }

  private async resolveImageId(imageUrl?: string, imageId?: string | null): Promise<string | null> {
    if (imageId) {
      return imageId;
    }

    const cleanedUrl = imageUrl?.trim();
    if (!cleanedUrl) {
      return null;
    }

    const { data: existing, error: selectError } = await supabase
      .from(this.imageTable)
      .select(this.imageColumns.id)
      .eq(this.imageColumns.imageUrl, cleanedUrl)
      .maybeSingle();

    if (selectError) throw selectError;

    const existingRow = (existing ?? null) as RowData | null;

    if (existingRow && existingRow[this.imageColumns.id] != null) {
      return String(existingRow[this.imageColumns.id]);
    }

    const imagePayload: Record<string, unknown> = {
      [this.imageColumns.imageUrl]: cleanedUrl
    };

    const { data: created, error: insertError } = await supabase
      .from(this.imageTable)
      .insert(imagePayload as never)
      .select(this.imageColumns.id)
      .single();

    if (insertError) throw insertError;

    const createdRow = (created ?? null) as unknown as RowData | null;

    return createdRow && createdRow[this.imageColumns.id] != null
      ? String(createdRow[this.imageColumns.id])
      : null;
  }

  private async resolveEmailId(email?: string, emailId?: string | null): Promise<string | null> {
    if (emailId) {
      return emailId;
    }

    const cleanedEmail = email?.trim().toLowerCase();
    if (!cleanedEmail) {
      return null;
    }

    const { data: existing, error: selectError } = await supabase
      .from(this.emailTable)
      .select(this.emailColumns.id)
      .eq(this.emailColumns.email, cleanedEmail)
      .maybeSingle();

    if (selectError) throw selectError;

    const existingRow = (existing ?? null) as RowData | null;
    if (existingRow && existingRow[this.emailColumns.id] != null) {
      return String(existingRow[this.emailColumns.id]);
    }

    const emailPayload: Record<string, unknown> = {
      [this.emailColumns.email]: cleanedEmail
    };

    const { data: created, error: insertError } = await supabase
      .from(this.emailTable)
      .insert(emailPayload as never)
      .select(this.emailColumns.id)
      .single();

    if (insertError) throw insertError;

    const createdRow = (created ?? null) as unknown as RowData | null;

    return createdRow && createdRow[this.emailColumns.id] != null
      ? String(createdRow[this.emailColumns.id])
      : null;
  }

  private readValue(row: RowData, keys: string[]): unknown {
    for (const key of keys) {
      if (key in row) {
        return row[key];
      }
    }

    return null;
  }
}
