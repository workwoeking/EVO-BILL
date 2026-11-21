import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  // Clear the development/admin session cookie
  response.cookies.delete('evo_admin_session');
  return response;
}
