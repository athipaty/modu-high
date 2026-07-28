import { api } from '../services/api'

const KEY = 'modu_high_token'

export function getToken(): string | null {
  return localStorage.getItem(KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(KEY, token)
}

export function clearToken() {
  localStorage.removeItem(KEY)
}

export async function login(password: string) {
  const res = await api.post('/auth/login', { password })
  saveToken(res.data.token)
  return res.data
}

export async function verify(): Promise<boolean> {
  const token = getToken()
  if (!token) return false
  try {
    const res = await api.post('/auth/verify', { token })
    return res.data.valid === true
  } catch {
    clearToken()
    return false
  }
}

export function logout() {
  clearToken()
  window.location.href = '/login'
}
