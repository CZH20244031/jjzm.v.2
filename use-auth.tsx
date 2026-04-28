'use client'

import { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react'

interface User {
  name: string
  role: string
  idNumber: string
}

interface AuthState {
  isAuthenticated: boolean
  isMobile: boolean
  user: User | null
  login: (name: string, idNumber: string, role: string) => void
  logout: () => void
  hasPermission: (level: 'full' | 'control' | 'view') => boolean
}

const AUTH_STORAGE_KEY = 'farm-auth'

const AuthContext = createContext<AuthState | null>(null)

function readAuthFromStorage(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as { user: User }
      return parsed.user ?? null
    }
  } catch {
    // ignore parse errors
  }
  return null
}

function saveAuthToStorage(user: User, isMobile: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, isMobile }))
  } catch {
    // ignore storage errors
  }
}

function clearAuthStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

// Simple external store for auth state to avoid setState-in-effect issues
let authListeners: (() => void)[] = []
let currentAuthUser: User | null = null

function subscribeToAuth(listener: () => void) {
  authListeners.push(listener)
  return () => {
    authListeners = authListeners.filter(l => l !== listener)
  }
}

function getAuthSnapshot(): User | null {
  return currentAuthUser
}

function getServerSnapshot(): User | null {
  return null
}

function emitAuthChange() {
  authListeners.forEach(l => l())
}

function setAuthUser(user: User | null) {
  currentAuthUser = user
  emitAuthChange()
}

// Initialize auth user from localStorage (client-side only)
if (typeof window !== 'undefined') {
  currentAuthUser = readAuthFromStorage()
}

function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768
      )
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

function getRolePermissionLevel(role: string): 'full' | 'control' | 'view' {
  switch (role) {
    case '场长':
    case '技术员':
      return 'full'
    case '饲养员':
      return 'control'
    case '访客':
      return 'view'
    default:
      return 'view'
  }
}

const permissionHierarchy: Record<string, number> = {
  view: 0,
  control: 1,
  full: 2,
}

function hasPermissionForLevel(userRole: string, requiredLevel: 'full' | 'control' | 'view'): boolean {
  const roleLevel = getRolePermissionLevel(userRole)
  return permissionHierarchy[roleLevel] >= permissionHierarchy[requiredLevel]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isMobile = useDeviceDetection()
  const user = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerSnapshot)

  const login = useCallback((name: string, idNumber: string, role: string) => {
    const newUser: User = { name, role, idNumber }
    setAuthUser(newUser)
    saveAuthToStorage(newUser, isMobile)
  }, [isMobile])

  const logout = useCallback(() => {
    setAuthUser(null)
    clearAuthStorage()
  }, [])

  const hasPermission = useCallback((level: 'full' | 'control' | 'view') => {
    if (!user) return false
    return hasPermissionForLevel(user.role, level)
  }, [user])

  // On desktop, auto-authenticate (no login required)
  const isAuthenticated = isMobile ? !!user : true

  const value: AuthState = {
    isAuthenticated,
    isMobile,
    user,
    login,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
