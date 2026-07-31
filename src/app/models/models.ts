export interface Cargo {
  id?: string;
  nome: string;
}

export interface Departamento {
  id?: string;
  nome: string;
}

export interface Funcionario {
  id?: string;
  name: string;
  cargoId: string;
  departamentoId: string;
  parentId?: string | null;
  imagem?: string;
  cargo?: Cargo;
  departamento?: Departamento;
}
