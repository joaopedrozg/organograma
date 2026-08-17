-- Migration incremental para base existente

alter table public.funcionarios
  add column if not exists is_usuario boolean not null default false,
  add column if not exists auth_user_id uuid references auth.users(id) on update cascade on delete set null,
  add column if not exists email_id uuid references public.emails(id) on update cascade on delete set null;

create index if not exists idx_funcionarios_auth_user_id on public.funcionarios(auth_user_id);
create index if not exists idx_funcionarios_email_id on public.funcionarios(email_id);

create or replace function public.link_funcionario_to_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.funcionarios f
  set auth_user_id = new.id
  from public.emails e
  where f.email_id = e.id
    and lower(e.email) = lower(new.email)
    and f.is_usuario = true
    and f.auth_user_id is null;

  return new;
end;
$$;

drop trigger if exists trg_link_funcionario_auth_user on auth.users;
create trigger trg_link_funcionario_auth_user
after insert on auth.users
for each row
execute function public.link_funcionario_to_auth_user();

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public grant select on tables to authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
