import { createClient } from '@supabase/supabase-js';

/**
 * Super Admin Supabase Client
 * 
 * SECURITY DIRECTIVE:
 * This client utilizes SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security
 * for backend provisioning, administrative customer creation, and license control.
 * 
 * It MUST NEVER be bundled or executed in client-side code or Electron renderer.
 */
export function getSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY ERROR: Supabase Admin Client cannot be initialized in the browser.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder')) {
    console.warn(
      '[Supabase Admin] Supabase URL or Service Role Key missing or placeholder in .env.local.'
    );
  }

  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    serviceRoleKey || 'placeholder',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'workwoeking@gmail.com';
