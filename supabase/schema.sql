-- Organograma + Supabase
-- Rode este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Usuários padrão do Supabase ficam em auth.users.
-- Não criamos tabela public.users para evitar duplicidade.

create table if not exists public.departamentos (
  id uuid primary key default gen_random_uuid(),
  departamento text not null unique
);

create table if not exists public.cargos (
  id uuid primary key default gen_random_uuid(),
  cargo text not null unique
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null unique
);

create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
);

-- Obs.: departamento_id foi incluído para compatibilidade com o frontend atual.
create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_id uuid references public.emails(id) on update cascade on delete set null,
  is_usuario boolean not null default false,
  auth_user_id uuid references auth.users(id) on update cascade on delete set null,
  cargo_id uuid not null references public.cargos(id) on update cascade,
  departamento_id uuid references public.departamentos(id) on update cascade,
  gestor_id uuid references public.funcionarios(id) on update cascade on delete set null,
  image_id uuid references public.images(id) on update cascade on delete set null,
  data_cadastro timestamptz not null default now()
);

create index if not exists idx_funcionarios_cargo_id on public.funcionarios(cargo_id);
create index if not exists idx_funcionarios_email_id on public.funcionarios(email_id);
create index if not exists idx_funcionarios_auth_user_id on public.funcionarios(auth_user_id);
create index if not exists idx_funcionarios_departamento_id on public.funcionarios(departamento_id);
create index if not exists idx_funcionarios_gestor_id on public.funcionarios(gestor_id);
create index if not exists idx_funcionarios_image_id on public.funcionarios(image_id);

-- =====================================================
-- AUDITORIA
-- =====================================================

create table if not exists public.aud_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  field_name text not null,
  old_value text,
  new_value text,
  user_made_change text not null,
  changed_date timestamptz not null default now()
);

create index if not exists idx_aud_log_table_name on public.aud_log(table_name);
create index if not exists idx_aud_log_changed_date on public.aud_log(changed_date desc);

create or replace view public.vw_aud_log_detalhado as
with base as (
  select
    l.*,
    case
      when l.old_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then l.old_value::uuid
      else null
    end as old_uuid,
    case
      when l.new_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then l.new_value::uuid
      else null
    end as new_uuid
  from public.aud_log l
)
select
  b.id,
  b.table_name,
  b.field_name,
  b.old_value,
  b.new_value,
  coalesce(
    old_cargo.cargo,
    old_departamento.departamento,
    old_gestor.name,
    old_image.image_url,
    old_email.email,
    b.old_value
  ) as old_value_resolvido,
  coalesce(
    new_cargo.cargo,
    new_departamento.departamento,
    new_gestor.name,
    new_image.image_url,
    new_email.email,
    b.new_value
  ) as new_value_resolvido,
  b.user_made_change,
  b.changed_date
from base b
left join public.cargos old_cargo
  on b.old_uuid = old_cargo.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'cargo_id')
      or (b.table_name = 'cargos' and b.field_name = 'id')
    )
left join public.cargos new_cargo
  on b.new_uuid = new_cargo.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'cargo_id')
      or (b.table_name = 'cargos' and b.field_name = 'id')
    )
left join public.departamentos old_departamento
  on b.old_uuid = old_departamento.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'departamento_id')
      or (b.table_name = 'departamentos' and b.field_name = 'id')
    )
left join public.departamentos new_departamento
  on b.new_uuid = new_departamento.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'departamento_id')
      or (b.table_name = 'departamentos' and b.field_name = 'id')
    )
left join public.funcionarios old_gestor
  on b.old_uuid = old_gestor.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'gestor_id')
      or (b.table_name = 'funcionarios' and b.field_name = 'id')
    )
left join public.funcionarios new_gestor
  on b.new_uuid = new_gestor.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'gestor_id')
      or (b.table_name = 'funcionarios' and b.field_name = 'id')
    )
left join public.images old_image
  on b.old_uuid = old_image.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'image_id')
      or (b.table_name = 'images' and b.field_name = 'id')
    )
left join public.images new_image
  on b.new_uuid = new_image.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'image_id')
      or (b.table_name = 'images' and b.field_name = 'id')
    )
left join public.emails old_email
  on b.old_uuid = old_email.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'email_id')
      or (b.table_name = 'emails' and b.field_name = 'id')
    )
left join public.emails new_email
  on b.new_uuid = new_email.id
 and (
      (b.table_name = 'funcionarios' and b.field_name = 'email_id')
      or (b.table_name = 'emails' and b.field_name = 'id')
    );

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

grant select on public.vw_aud_log_detalhado to authenticated;

create or replace function public.log_row_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text;
  old_json jsonb;
  new_json jsonb;
  old_text text;
  new_text text;
  k text;
begin
  actor := coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    auth.uid()::text,
    current_user
  );

  if tg_op = 'INSERT' then
    new_json := to_jsonb(new);

    for k, new_text in
      select key, value
      from jsonb_each_text(new_json)
    loop
      insert into public.aud_log (table_name, field_name, old_value, new_value, user_made_change, changed_date)
      values (tg_table_name, k, null, new_text, actor, now());
    end loop;

    return new;
  end if;

  if tg_op = 'DELETE' then
    old_json := to_jsonb(old);

    for k, old_text in
      select key, value
      from jsonb_each_text(old_json)
    loop
      insert into public.aud_log (table_name, field_name, old_value, new_value, user_made_change, changed_date)
      values (tg_table_name, k, old_text, null, actor, now());
    end loop;

    return old;
  end if;

  old_json := to_jsonb(old);
  new_json := to_jsonb(new);

  for k in
    select key
    from jsonb_object_keys(new_json) as key
  loop
    old_text := old_json ->> k;
    new_text := new_json ->> k;

    if old_text is distinct from new_text then
      insert into public.aud_log (table_name, field_name, old_value, new_value, user_made_change, changed_date)
      values (tg_table_name, k, old_text, new_text, actor, now());
    end if;
  end loop;

  return new;
end;
$$;

create or replace function public.attach_audit_triggers_all_tables()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  trg_name text;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename <> 'aud_log'
  loop
    trg_name := 'trg_audit_' || t.tablename;

    execute format('drop trigger if exists %I on public.%I', trg_name, t.tablename);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.log_row_changes()',
      trg_name,
      t.tablename
    );
  end loop;
end;
$$;

select public.attach_audit_triggers_all_tables();

-- =====================================================
-- GRANTS
-- =====================================================

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public grant select on tables to authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

-- =====================================================
-- RLS (opcional, mas recomendado)
-- =====================================================

alter table public.departamentos enable row level security;
alter table public.cargos enable row level security;
alter table public.images enable row level security;
alter table public.emails enable row level security;
alter table public.funcionarios enable row level security;
alter table public.aud_log enable row level security;

-- Ajuste estas policies conforme sua regra de negócio.
-- Política base: usuário autenticado pode ler/escrever dados funcionais.

drop policy if exists "authenticated read departamentos" on public.departamentos;
create policy "authenticated read departamentos" on public.departamentos
for select to authenticated
using (true);

drop policy if exists "authenticated write departamentos" on public.departamentos;
create policy "authenticated write departamentos" on public.departamentos
for all to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read cargos" on public.cargos;
create policy "authenticated read cargos" on public.cargos
for select to authenticated
using (true);

drop policy if exists "authenticated write cargos" on public.cargos;
create policy "authenticated write cargos" on public.cargos
for all to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read images" on public.images;
create policy "authenticated read images" on public.images
for select to authenticated
using (true);

drop policy if exists "authenticated write images" on public.images;
create policy "authenticated write images" on public.images
for all to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read emails" on public.emails;
create policy "authenticated read emails" on public.emails
for select to authenticated
using (true);

drop policy if exists "authenticated write emails" on public.emails;
create policy "authenticated write emails" on public.emails
for all to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read funcionarios" on public.funcionarios;
create policy "authenticated read funcionarios" on public.funcionarios
for select to authenticated
using (true);

drop policy if exists "authenticated write funcionarios" on public.funcionarios;
create policy "authenticated write funcionarios" on public.funcionarios
for all to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read aud_log" on public.aud_log;
create policy "authenticated read aud_log" on public.aud_log
for select to authenticated
using (true);
