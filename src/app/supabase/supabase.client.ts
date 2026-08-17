import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabaseUrl = environment.supabase.url;
const supabaseAnonKey = environment.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configuração do Supabase ausente em src/environments/environment.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
