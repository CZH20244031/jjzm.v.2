'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TreePine, Eye, EyeOff, ChevronRight, Shield, Cpu, ThermometerSun, Users, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface UserInfo {
  name: string
  role: string
  avatar: string
}

interface AuthGateProps {
  children: React.ReactNode
}

const ROLES = [
  { id: 'manager', label: '场长', desc: '全系统管理权限', icon: Shield, color: 'from-emerald-500 to-teal-600' },
  { id: 'tech', label: '技术员', desc: '数据查看与分析', icon: Cpu, color: 'from-cyan-500 to-blue-500' },
  { id: 'veterinarian', label: '兽医', desc: '健康与用药管理', icon: ThermometerSun, color: 'from-amber-500 to-orange-500' },
  { id: 'worker', label: '饲养员', desc: '日常饲喂与巡检', icon: Users, color: 'from-violet-500 to-purple-500' },
]

const DEMO_USERS: Record<string, { password: string; name: string; role: string; avatar: string }> = {
  admin: { password: 'admin123', name: '王建国', role: '场长', avatar: '👨‍💼' },
  tech: { password: 'tech123', name: '李明辉', role: '技术员', avatar: '👨‍🔬' },
  vet: { password: 'vet123', name: '张伟', role: '兽医', avatar: '🧑‍⚕️' },
  worker: { password: '123456', name: '陈大勇', role: '饲养员', avatar: '👨‍🌾' },
}

// Simple auth store using localStorage with cached snapshot
let authListeners: Array<() => void> = []
let cachedUserJson: string | null = null
let cachedUser: UserInfo | null = null
let lastRawJson: string | null | undefined = undefined

function getStoredUser(): UserInfo | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('auth_user')
  if (raw === lastRawJson) return cachedUser
  lastRawJson = raw
  if (raw) {
    try {
      cachedUser = JSON.parse(raw)
      cachedUserJson = raw
    } catch {
      localStorage.removeItem('auth_user')
      cachedUser = null
      cachedUserJson = null
      lastRawJson = null
    }
  } else {
    cachedUser = null
    cachedUserJson = null
  }
  return cachedUser
}

function setStoredUser(user: UserInfo | null) {
  if (typeof window === 'undefined') return
  if (user) {
    const json = JSON.stringify(user)
    localStorage.setItem('auth_user', json)
    cachedUser = user
    cachedUserJson = json
    lastRawJson = json
  } else {
    localStorage.removeItem('auth_user')
    cachedUser = null
    cachedUserJson = null
    lastRawJson = null
  }
  authListeners.forEach(l => l())
}

function subscribeToAuth(callback: () => void) {
  authListeners.push(callback)
  return () => {
    authListeners = authListeners.filter(l => l !== callback)
  }
}

function useAuth() {
  return useSyncExternalStore(subscribeToAuth, getStoredUser, () => null)
}

function LoginScreen({ onLogin }: { onLogin: (user: UserInfo) => void }) {
  const [step, setStep] = useState<'role' | 'credential'>('role')
  const [selectedRole, setSelectedRole] = useState(DEMO_USERS['admin'])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleSelect = useCallback((role: typeof ROLES[number]) => {
    const userKey = role.id === 'manager' ? 'admin' : role.id === 'tech' ? 'tech' : role.id === 'veterinarian' ? 'vet' : 'worker'
    const user = DEMO_USERS[userKey]
    setSelectedRole(user)
    setUsername(userKey)
    setStep('credential')
    setError('')
  }, [])

  const handleLogin = useCallback(() => {
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    const user = DEMO_USERS[username]
    if (user && user.password === password) {
      setIsLoading(true)
      setTimeout(() => {
        onLogin({ name: user.name, role: user.role, avatar: user.avatar })
      }, 600)
    } else {
      setError('账号或密码错误')
      setIsLoading(false)
    }
  }, [username, password, onLogin])

  const handleBack = useCallback(() => {
    setStep('role')
    setPassword('')
    setError('')
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-emerald-200/30 dark:bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-teal-200/30 dark:bg-teal-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-emerald-100/40 dark:bg-emerald-400/5 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              {/* Logo Section */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                  className="inline-flex flex-col items-center gap-3"
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-500/20">
                      <Image src="/images/logo.png" alt="极境智牧" width={80} height={80} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-400 border-2 border-white dark:border-gray-900 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      极境智牧
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 tracking-wide">
                      智慧养殖管理平台
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Welcome Text */}
              <div className="mb-8 text-center">
                <h2 className="text-lg font-semibold text-foreground">欢迎登录</h2>
                <p className="text-sm text-muted-foreground mt-1">请选择您的登录身份</p>
              </div>

              {/* Role Cards */}
              <div className="space-y-3">
                {ROLES.map((role, index) => (
                  <motion.button
                    key={role.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm hover:bg-muted/50 active:scale-[0.98] transition-all group"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} shadow-sm shrink-0`}>
                      <role.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-foreground">{role.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{role.desc}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </motion.button>
                ))}
              </div>

              {/* Quick demo hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-center"
              >
                <p className="text-[11px] text-muted-foreground/60">
                  演示账号密码：admin / admin123
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="credential"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors active:scale-95"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                返回选择身份
              </button>

              {/* Role Badge */}
              <div className="flex flex-col items-center mb-8">
                <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 mb-3 ring-2 ring-emerald-500/20">
                  <Image src="/images/logo.png" alt="极境智牧" width={64} height={64} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedRole.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {selectedRole.role}
                  </span>
                </div>
              </div>

              {/* Login Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
                    登录账号
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      readOnly
                      className="w-full h-12 px-4 rounded-xl border border-border/60 bg-muted/30 text-sm text-foreground font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
                    登录密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="请输入密码"
                      autoFocus
                      className="w-full h-12 px-4 pr-12 rounded-xl border border-border/60 bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      登录中...
                    </div>
                  ) : (
                    '登 录'
                  )}
                </motion.button>
              </div>

              {/* Password hint */}
              <div className="mt-6 text-center">
                <p className="text-[11px] text-muted-foreground/50">
                  密码提示：{username === 'admin' ? 'admin123' : username === 'tech' ? 'tech123' : username === 'vet' ? 'vet123' : '123456'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom branding */}
      <div className="py-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/40">
          <TreePine className="h-3 w-3" />
          <span>© {new Date().getFullYear()} 极境智牧 · 智慧养殖管理平台</span>
        </div>
      </div>
    </div>
  )
}

export function AuthGate({ children }: AuthGateProps) {
  const user = useAuth()
  const isAuthenticated = user !== null

  const handleLogin = useCallback((userInfo: UserInfo) => {
    setStoredUser(userInfo)
  }, [])

  const handleLogout = useCallback(() => {
    setStoredUser(null)
  }, [])

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <>
      {/* User info bar on mobile - show logged in user */}
      {user && (
        <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center gap-2">
              <span className="text-sm">{user.avatar}</span>
              <span className="text-xs font-medium">{user.name}</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] text-white/70 hover:text-white active:scale-95 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      )}
      {/* Spacer for mobile top bar */}
      {user && <div className="h-8 md:hidden shrink-0" />}
      {children}
    </>
  )
}
