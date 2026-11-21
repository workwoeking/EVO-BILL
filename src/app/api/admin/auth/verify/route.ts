import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient, SUPER_ADMIN_EMAIL } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ authenticated: false, isSuperAdmin: false }, { status: 401 });
    }

    const email = user.email || '';
    
    // Check if the user is the primary software owner
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({
        authenticated: true,
        isSuperAdmin: true,
        email,
        userId: user.id,
      });
    }

    // Otherwise check admin_roles table via admin client
    const adminClient = getSupabaseAdminClient();
    const { data: adminRole } = await adminClient
      .from('admin_roles')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminRole && adminRole.role === 'super_admin') {
      return NextResponse.json({
        authenticated: true,
        isSuperAdmin: true,
        email,
        userId: user.id,
      });
    }

    return NextResponse.json({
      authenticated: true,
      isSuperAdmin: false,
      error: 'User is not authorized as a Super Admin',
    }, { status: 403 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
