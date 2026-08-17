import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

interface InvitePayload {
  email: string;
  name: string;
  funcionarioId: string;
  redirectTo?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const payload = (await req.json()) as InvitePayload;
    const email = payload.email?.trim().toLowerCase();

    if (!email || !payload.funcionarioId) {
      return new Response(JSON.stringify({ error: 'email e funcionarioId são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (listError) {
      throw listError;
    }

    const existingUser = existingUsers.users.find((u) => u.email?.toLowerCase() === email);
    let authUserId = existingUser?.id ?? null;

    if (!authUserId) {
      const inviteResponse = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          name: payload.name || ''
        },
        redirectTo: payload.redirectTo
      });

      if (inviteResponse.error) {
        throw inviteResponse.error;
      }

      authUserId = inviteResponse.data.user?.id ?? null;
    } else {
      const resetResponse = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: payload.redirectTo,
          data: {
            name: payload.name || ''
          }
        }
      });

      if (resetResponse.error) {
        throw resetResponse.error;
      }
    }

    if (authUserId) {
      const { error: updateError } = await adminClient
        .from('funcionarios')
        .update({ auth_user_id: authUserId, is_usuario: true })
        .eq('id', payload.funcionarioId);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(JSON.stringify({ ok: true, authUserId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro inesperado ao convidar usuário' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
});
