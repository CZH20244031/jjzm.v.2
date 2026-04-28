'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar, type TabId } from '@/components/app-sidebar'
import { Dashboard } from '@/components/dashboard'
import { Environment } from '@/components/environment'
import { BatchManagement } from '@/components/batch-management'
import { HealthAlerts } from '@/components/health-alerts'
import { Medication } from '@/components/medication'
import { CostAnalysis } from '@/components/cost-analysis'
import { AlertCenter } from '@/components/alert-center'
import { Traceability } from '@/components/traceability'
import { KnowledgeBase } from '@/components/knowledge-base'
import { ExpertConsultation } from '@/components/expert-consultation'
import { AIDiagnosis } from '@/components/ai-diagnosis'
import { FarmPlanning } from '@/components/farm-planning'
import { DailyReport } from '@/components/daily-report'
import { MonitorScreen } from '@/components/monitor-screen'
import { FeedManagement } from '@/components/feed-management'
import { SystemSettings } from '@/components/system-settings'
import { StaffManagement } from '@/components/staff-management'
import { DeviceManagement } from '@/components/device-management'
import { SalesManagement } from '@/components/sales-management'
import { SlaughterManagement } from '@/components/slaughter-management'
import { VaccineManagement } from '@/components/vaccine-management'
import { FinancialReport } from '@/components/financial-report'
import { BatchComparison } from '@/components/batch-comparison'
import { NotificationCenter } from '@/components/notification-center'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TreePine, Bell, User, X, CheckCheck, AlertTriangle, Wrench, Thermometer, Pill, Info, Shield, ArrowUp, RefreshCw, Hand } from 'lucide-react'
import Image from 'next/image'
import { useNotifications } from '@/hooks/use-notifications'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthGate } from '@/components/auth-gate'

const tabComponents: Record<TabId, React.ComponentType> = {
  dashboard: Dashboard,
  environment: Environment,
  batches: BatchManagement,
  health: HealthAlerts,
  medication: Medication,
  cost: CostAnalysis,
  alerts: AlertCenter,
  trace: Traceability,
  knowledge: KnowledgeBase,
  reports: DailyReport,
  consultation: ExpertConsultation,
  'ai-diagnosis': AIDiagnosis,
  'farm-planning': FarmPlanning,
  feed: FeedManagement,
  monitor: MonitorScreen,
  settings: SystemSettings,
  staff: StaffManagement,
  devices: DeviceManagement,
  sales: SalesManagement,
  vaccines: VaccineManagement,
  slaughter: SlaughterManagement,
  'financial-report': FinancialReport,
  'batch-comparison': BatchComparison,
  'notification-center': NotificationCenter,
}

const tabTitles: Record<TabId, string> = {
  dashboard: '总览仪表盘',
  environment: '环境智控',
  batches: '批次管理',
  health: '健康预警',
  medication: '用药管理',
  cost: '成本分析',
  alerts: '预警中心',
  trace: '溯源管理',
  knowledge: '养殖知识库',
  reports: '养殖日报',
  consultation: '专家问诊',
  'ai-diagnosis': 'AI智能诊断',
  'farm-planning': '养殖计划排程',
  feed: '饲料管理',
  monitor: '数据大屏',
  settings: '系统设置',
  staff: '员工管理',
  devices: '设备管理',
  sales: '销售管理',
  vaccines: '疫苗管理',
  slaughter: '出栏管理',
  'financial-report': '财务报表',
  'batch-comparison': '批次对比分析',
  'notification-center': '消息通知中心',
}

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
}

const panelVariants = {
  initial: { opacity: 0, y: -8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.95 },
}

function getAlertIcon(type: string) {
  switch (type) {
    case '环境预警': return <Thermometer className="h-3.5 w-3.5" />
    case '设备故障': return <Wrench className="h-3.5 w-3.5" />
    case '用药提醒': return <Pill className="h-3.5 w-3.5" />
    case '出栏锁定': return <Shield className="h-3.5 w-3.5" />
    case '系统通知': return <Info className="h-3.5 w-3.5" />
    default: return <Bell className="h-3.5 w-3.5" />
  }
}

function getLevelColor(level: string) {
  switch (level) {
    case 'critical': return 'text-red-600 dark:text-red-400'
    case 'danger': return 'text-orange-600 dark:text-orange-400'
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-blue-600 dark:text-blue-400'
  }
}

function getLevelBg(level: string) {
  switch (level) {
    case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400'
    case 'danger': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    case 'warning': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
    default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  }
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [currentTime, setCurrentTime] = useState('')
  const { unreadCount, recentAlerts, showPanel, setShowPanel, markAllRead, dismissNotification, togglePanel } = useNotifications()
  const panelRef = useRef<HTMLDivElement>(null)
  // Page transition loading bar - use ref to avoid sync setState in effect
  const [pageLoading, setPageLoading] = useState(false)
  const prevTabRef = useRef<TabId>(activeTab)

  // Scroll-to-top state
  const [showScrollTop, setShowScrollTop] = useState(false)
  const mainScrollRef = useRef<HTMLDivElement>(null)

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollEl = mainScrollRef.current
      if (!scrollEl) return
      setShowScrollTop(scrollEl.scrollTop > 400)
    }
    const scrollEl = mainScrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollEl.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    const scrollEl = mainScrollRef.current
    if (scrollEl) {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = mainScrollRef.current
    if (!scrollEl || scrollEl.scrollTop > 5) return
    touchStartY.current = e.touches[0].clientY
    isPulling.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return
    const scrollEl = mainScrollRef.current
    if (!scrollEl || scrollEl.scrollTop > 5) {
      isPulling.current = false
      setPullDistance(0)
      return
    }
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100))
    }
  }, [isRefreshing])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(0)
      // Simulate refresh - re-trigger page data by toggling activeTab
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1200)
    } else {
      setPullDistance(0)
    }
    isPulling.current = false
  }, [pullDistance, isRefreshing])
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab
      const show = () => setPageLoading(true)
      const hide = () => setPageLoading(false)
      show()
      const timer = setTimeout(hide, 400)
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${h}:${m}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPanel, setShowPanel])

  const ActiveComponent = tabComponents[activeTab]

  return (
    <AuthGate>
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset className="bg-gradient-to-br from-emerald-50/30 via-background to-transparent">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="h-6 w-6 rounded overflow-hidden ring-1 ring-emerald-500/20">
                <Image src="/images/logo.png" alt="极境智牧" width={24} height={24} className="h-full w-full object-cover" />
              </div>
              <span className="text-sm font-bold">极境智牧</span>
            </div>
            <Separator orientation="vertical" className="h-5 md:hidden" />
            <h2 className="text-sm font-medium text-foreground">
              {tabTitles[activeTab]}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              系统运行正常
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              {currentTime}
            </div>

            <ThemeToggle />

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={togglePanel}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="通知"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {showPanel && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={panelVariants}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-popover shadow-lg z-50 overflow-hidden"
                  >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">通知中心</span>
                        {unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={markAllRead}
                          >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            全部已读
                          </Button>
                        )}
                        <button
                          onClick={() => setShowPanel(false)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Panel Content */}
                    <ScrollArea className="h-[320px]">
                      {recentAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Bell className="h-8 w-8 mb-2 text-muted-foreground/50" />
                          <p className="text-xs">暂无新通知</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {recentAlerts.map((alert) => (
                            <div
                              key={alert.id}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                            >
                              <div className={`mt-0.5 rounded-lg p-1.5 shrink-0 ${getLevelBg(alert.level)}`}>
                                {getAlertIcon(alert.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium truncate">{alert.title}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                  {alert.message}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                  {formatTimeAgo(alert.createdAt)}
                                </span>
                              </div>
                              <button
                                onClick={() => dismissNotification(alert.id)}
                                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/0 group-hover:text-muted-foreground hover:bg-muted transition-all shrink-0 mt-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Panel Footer */}
                    <div className="border-t px-4 py-2.5 bg-muted/20">
                      <button
                        onClick={() => {
                          setShowPanel(false)
                          setActiveTab('alerts')
                        }}
                        className="flex items-center justify-center gap-1.5 w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        查看全部预警
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar */}
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Top loading progress bar */}
        <div className="absolute top-0 left-0 right-0 z-50 h-[2px]">
          <motion.div
            initial={false}
            animate={pageLoading ? { width: '70%', opacity: 1 } : { width: '100%', opacity: 0 }}
            transition={pageLoading ? { duration: 0.3, ease: 'easeOut' } : { duration: 0.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
            style={{ width: pageLoading ? '0%' : '100%' }}
          />
        </div>

        {/* Pull-to-refresh indicator */}
        <div className="relative overflow-hidden">
          <AnimatePresence>
            {(pullDistance > 5 || isRefreshing) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-2 text-xs text-primary font-medium"
                style={{ height: Math.max(pullDistance, isRefreshing ? 40 : 0) }}
              >
                <motion.div
                  animate={{ rotate: isRefreshing ? 360 : pullDistance > 60 ? 180 : 0 }}
                  transition={{ duration: isRefreshing ? 0.8 : 0.3, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
                >
                  <RefreshCw className={`h-4 w-4 ${pullDistance > 60 || isRefreshing ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                </motion.div>
                <span className={pullDistance > 60 || isRefreshing ? 'text-emerald-500' : 'text-muted-foreground'}>
                  {isRefreshing ? '刷新中...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>

            {/* Swipe gesture hint on Dashboard */}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground/60 md:hidden"
              >
                <Hand className="h-3.5 w-3.5" />
                <span>左右滑动查看更多卡片</span>
                <Hand className="h-3.5 w-3.5 rotate-180" />
              </motion.div>
            )}
          </div>

          {/* Scroll-to-top button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={scrollToTop}
                className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95"
                aria-label="回到顶部"
              >
                <ArrowUp className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-4 px-4 sm:px-6 mt-auto">
          {/* Gradient top border */}
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent mb-4" />
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TreePine className="h-3.5 w-3.5 text-primary" />
              <span>极境智牧-智慧养殖管理平台 v2.6.0</span>
            </div>
            <div className="flex items-center gap-3">
              <span>共 23 个功能模块</span>
              <span className="text-emerald-400">·</span>
              <span>© {new Date().getFullYear()} 极境智牧 · 智慧养殖管理平台</span>
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
    </AuthGate>
  )
}
