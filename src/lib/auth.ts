import { getSupabaseBrowserClient } from './supabase/client';

export interface AppUser {
  name: string;
  email: string;
  picture?: string;
  role: 'Owner' | 'Manager' | 'Cashier' | 'Customer';
  customerId?: string;
  isLoggedIn: boolean;
  loginTime?: string;
}

const AUTH_KEY = 'evo_bill_user_session';
const GOOGLE_CLIENT_ID_KEY = 'evo_bill_google_client_id';

export const DEFAULT_USER: AppUser = {
  name: 'Workwoeking',
  email: 'workwoeking@gmail.com',
  picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
  role: 'Owner',
  customerId: 'EVO-OWNER-0001',
  isLoggedIn: true,
  loginTime: new Date().toISOString(),
};

export function getCurrentUser(): AppUser {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      saveCurrentUser(DEFAULT_USER);
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function saveCurrentUser(user: AppUser) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user session', e);
  }
}

export async function logoutUser() {
  if (typeof window === 'undefined') return;
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    console.error('Logout error:', e);
  }

  const loggedOut: AppUser = {
    name: 'Guest',
    email: '',
    role: 'Cashier',
    isLoggedIn: false,
  };
  saveCurrentUser(loggedOut);
  document.cookie = 'evo_customer_id=; path=/; max-age=0;';
  window.dispatchEvent(new Event('auth-change'));
}

export function loginAsGoogle(
  email: string = 'workwoeking@gmail.com',
  name: string = 'Workwoeking',
  customerId: string = 'EVO-2026-0001'
) {
  const loggedIn: AppUser = {
    name,
    email,
    picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    role: email === 'workwoeking@gmail.com' ? 'Owner' : 'Customer',
    customerId,
    isLoggedIn: true,
    loginTime: new Date().toISOString(),
  };
  saveCurrentUser(loggedIn);
  if (typeof window !== 'undefined') {
    document.cookie = `evo_customer_id=${customerId}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    window.dispatchEvent(new Event('auth-change'));
  }
  return loggedIn;
}

/**
 * Initiates Live Google OAuth Authentication via Supabase
 */
export async function signInWithGoogleOAuth() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const redirectUrl = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

export function getGoogleClientId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || '';
}

export function setGoogleClientId(clientId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId);
}
