import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/supabase/adminService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDashboardMetrics();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
