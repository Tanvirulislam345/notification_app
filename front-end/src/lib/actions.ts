'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError } from './api';
import type { AuthResponse, Organization, Member, Invitation, Role } from '../types';

const ACCESS_MAX = 15 * 60;          // 15 minutes in seconds
const REFRESH_MAX = 7 * 24 * 60 * 60; // 7 days in seconds

async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ACCESS_MAX,
    path: '/',
  });
  jar.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_MAX,
    path: '/',
  });
}

function extractRefreshToken(setCookieHeader: string | null): string {
  if (!setCookieHeader) return '';
  const match = setCookieHeader.match(/refresh_token=([^;]+)/);
  return match?.[1] ?? '';
}

export async function getToken(): Promise<string> {
  const jar = await cookies();
  return jar.get('access_token')?.value ?? '';
}

// ── Auth Actions ──────────────────────────────────────────────────────────────

export async function registerAction(_: unknown, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const organizationName = formData.get('organizationName') as string;

  try {
    const res = await api.post<{ message: string }>('/auth/register', {
      name, email, password, organizationName,
    });
    return { success: true, message: res.message };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Registration failed' };
  }
}

export async function loginAction(_: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const res = await api.loginRaw({ email, password });
    if (!res.ok) {
      let message = 'Invalid credentials';
      try {
        const body = await res.json();
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
      } catch {}
      return { success: false, message };
    }

    const body: AuthResponse = await res.json();
    // Extract refresh_token JWT from Set-Cookie header
    const setCookie = res.headers.get('set-cookie') ?? '';
    const refreshToken = extractRefreshToken(setCookie);
    await setAuthCookies(body.accessToken, refreshToken);
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Login failed' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const token = await getToken();
  try { await api.post('/auth/logout', {}, token); } catch {}
  const jar = await cookies();
  jar.delete('access_token');
  jar.delete('refresh_token');
  redirect('/login');
}

export async function forgotPasswordAction(_: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  try {
    const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return { success: true, message: res.message };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Request failed' };
  }
}

export async function resetPasswordAction(_: unknown, formData: FormData) {
  const token = formData.get('token') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirm = formData.get('confirm') as string;
  if (newPassword !== confirm) return { success: false, message: 'Passwords do not match' };
  try {
    const res = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return { success: true, message: res.message };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Reset failed' };
  }
}

// ── Dashboard Actions ─────────────────────────────────────────────────────────

export async function getOrganization(): Promise<Organization> {
  const token = await getToken();
  return api.get<Organization>('/organizations/me', token);
}

export async function getMembers(): Promise<Member[]> {
  const token = await getToken();
  return api.get<Member[]>('/organizations/members', token);
}

export async function getInvitations(): Promise<Invitation[]> {
  const token = await getToken();
  return api.get<Invitation[]>('/invitations', token);
}

export async function getRoles(): Promise<Role[]> {
  const token = await getToken();
  return api.get<Role[]>('/roles', token);
}

export async function sendInvitationAction(_: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const roleId = formData.get('roleId') as string;
  const token = await getToken();
  try {
    const res = await api.post<{ message: string }>('/invitations/send', { email, roleId }, token);
    return { success: true, message: res.message };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Failed to send invitation' };
  }
}

export async function revokeInvitationAction(id: string) {
  const token = await getToken();
  try {
    await api.delete(`/invitations/${id}`, token);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Failed to revoke' };
  }
}

export async function acceptInvitationAction(_: unknown, formData: FormData) {
  const invToken = formData.get('token') as string;
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;
  try {
    const res = await api.post<{ message: string }>('/invitations/accept', {
      token: invToken, name, password,
    });
    return { success: true, message: res.message };
  } catch (e) {
    return { success: false, message: e instanceof ApiError ? e.message : 'Failed to accept invitation' };
  }
}
