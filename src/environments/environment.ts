export const environment = {
  production: false,
  supabase: {
    url: 'https://ifcmqrmuloaargdojyyd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmY21xcm11bG9hYXJnZG9qeXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTUxODksImV4cCI6MjEwMTYzMTE4OX0.Wu2_L3A9ZqNsn3Vw1Zc8gstYe8BIQudhbcSykUUVGs0',
    passwordSetupRedirectUrl: 'http://localhost:4200/',
    inviteFunctionName: 'invite-funcionario-user',
    tables: {
      funcionario: 'funcionarios',
      cargo: 'cargos',
      departamento: 'departamentos',
      image: 'images',
      email: 'emails'
    },
    columns: {
      funcionario: {
        id: 'id',
        name: 'name',
        emailId: 'email_id',
        cargoId: 'cargo_id',
        departamentoId: 'departamento_id',
        parentId: 'gestor_id',
        imageId: 'image_id',
        authUserId: 'auth_user_id',
        isUsuario: 'is_usuario',
        dataCadastro: 'data_cadastro'
      },
      cargo: {
        id: 'id',
        nome: 'cargo'
      },
      departamento: {
        id: 'id',
        nome: 'departamento'
      },
      image: {
        id: 'id',
        imageUrl: 'image_url'
      },
      email: {
        id: 'id',
        email: 'email'
      }
    }
  }
};
