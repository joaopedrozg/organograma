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
  email?: string;
  emailId?: string | null;
  isUsuario?: boolean;
  authUserId?: string | null;
  cargoId: string;
  departamentoId: string;
  parentId?: string | null;
  imagem?: string;
  imageId?: string | null;
  dataCadastro?: string;
  cargo?: Cargo;
  departamento?: Departamento;
}
