# Supabase Edge Functions

## invite-funcionario-user

Função responsável por:
- convidar usuário novo no Supabase Auth
- ou gerar link de recuperação para usuário existente
- e vincular `funcionarios.auth_user_id`

### Deploy

```bash
supabase functions deploy invite-funcionario-user
```

### Exemplo de invoke

```ts
await supabase.functions.invoke('invite-funcionario-user', {
  body: {
    email: 'usuario@empresa.com',
    name: 'Usuário Exemplo',
    funcionarioId: 'UUID_DO_FUNCIONARIO',
    redirectTo: 'https://seu-dominio.com/'
  }
});
```
