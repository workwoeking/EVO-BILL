export interface AppUser {
  name: string;
  email: string;
  picture?: string;
  role: 'Owner' | 'Manager' | 'Cashier';
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

export function logoutUser() {
  if (typeof window === 'undefined') return;
  const loggedOut: AppUser = {
    name: 'Guest',
    email: '',
    role: 'Cashier',
    isLoggedIn: false,
  };
  saveCurrentUser(loggedOut);
  window.dispatchEvent(new Event('auth-change'));
}

export function loginAsGoogle(email: string = 'workwoeking@gmail.com', name: string = 'Workwoeking') {
  const loggedIn: AppUser = {
    name,
    email,
    picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    role: 'Owner',
    isLoggedIn: true,
    loginTime: new Date().toISOString(),
  };
  saveCurrentUser(loggedIn);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'));
  }
  return loggedIn;
}

export function getGoogleClientId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || '';
}

export function setGoogleClientId(clientId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId);
}
