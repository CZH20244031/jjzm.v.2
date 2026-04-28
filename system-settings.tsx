'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  RotateCcw,
  Building2,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Trash2,
  Download,
  RefreshCcw,
  Bell,
  Volume2,
  Monitor,
  BarChart3,
  Globe,
  Clock,
  Shield,
  Layers,
  Info,
  Code2,
  Users,
  CalendarCheck,
  Loader2,
  Save,
  Eye,
  Palette,
  Moon,
  Zap,
  Check,
  Database,
  Phone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────

interface FarmInfo {
  name: string
  address: string
  manager: string
  phone: string
  type: string
  certified: boolean
  capacity: string
  houses: string
}

interface EnvThresholds {
  tempOptimal: [number, number]
  tempWarning: [number, number]
  tempDanger: [number, number]
  humidityOptimal: [number, number]
  humidityWarning: [number, number]
  humidityDanger: [number, number]
  ammoniaOptimal: [number, number]
  ammoniaWarning: [number, number]
  ammoniaDanger: [number, number]
  co2Optimal: [number, number]
  co2Warning: [number, number]
  co2Danger: [number, number]
}

interface NotificationSettings {
  browserNotify: boolean
  soundAlert: boolean
  popupNotify: boolean
  levelEmergency: boolean
  levelHigh: boolean
  levelNormal: boolean
  levelSystem: boolean
  refreshInterval: string
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
  mergeSimilar: boolean
}

interface DisplaySettings {
  sidebarCollapsed: boolean
  compactMode: boolean
  animations: boolean
  refreshAnimation: boolean
  chartType: string
  chartAnimation: boolean
  showDataLabels: boolean
  language: string
  timezone: string
  dateFormat: string
}

interface AllSettings {
  farmInfo: FarmInfo
  envThresholds: EnvThresholds
  notification: NotificationSettings
  display: DisplaySettings
  lastBackup: string
}

// ─── Defaults ────────────────────────────────────────────

const defaultSettings: AllSettings = {
  farmInfo: {
    name: '极境智牧养殖基地',
    address: '黑龙江省哈尔滨市宾县',
    manager: '张经理',
    phone: '138****5678',
    type: '肉鸡养殖',
    certified: true,
    capacity: '70,000 只',
    houses: '4 栋',
  },
  envThresholds: {
    tempOptimal: [22, 26],
    tempWarning: [18, 32],
    tempDanger: [15, 35],
    humidityOptimal: [55, 70],
    humidityWarning: [40, 80],
    humidityDanger: [30, 90],
    ammoniaOptimal: [0, 20],
    ammoniaWarning: [20, 30],
    ammoniaDanger: [30, 50],
    co2Optimal: [0, 1500],
    co2Warning: [1500, 2500],
    co2Danger: [2500, 5000],
  },
  notification: {
    browserNotify: false,
    soundAlert: true,
    popupNotify: true,
    levelEmergency: true,
    levelHigh: true,
    levelNormal: true,
    levelSystem: false,
    refreshInterval: '45',
    dndEnabled: false,
    dndStart: '23:00',
    dndEnd: '07:00',
    mergeSimilar: true,
  },
  display: {
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
    refreshAnimation: true,
    chartType: 'line',
    chartAnimation: true,
    showDataLabels: false,
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
  },
  lastBackup: new Date().toISOString(),
}

// ─── Animation Variants ──────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Helper ──────────────────────────────────────────────

function loadSettings(): AllSettings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem('farm-settings')
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<AllSettings>
    return {
      farmInfo: { ...defaultSettings.farmInfo, ...parsed.farmInfo },
      envThresholds: { ...defaultSettings.envThresholds, ...parsed.envThresholds },
      notification: { ...defaultSettings.notification, ...parsed.notification },
      display: { ...defaultSettings.display, ...parsed.display },
      lastBackup: parsed.lastBackup || defaultSettings.lastBackup,
    }
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: AllSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem('farm-settings', JSON.stringify(settings))
}

// ─── Main Component ──────────────────────────────────────

export function SystemSettings() {
  const [settings, setSettings] = useState<AllSettings>(() => loadSettings())
  const [saving, setSaving] = useState(false)
  const [editFarmInfo, setEditFarmInfo] = useState(false)

  // Persist to localStorage on change
  const updateSettings = useCallback((partial: Partial<AllSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  // Update nested farm info
  const updateFarmInfo = useCallback((partial: Partial<FarmInfo>) => {
    setSettings((prev) => {
      const next = { ...prev, farmInfo: { ...prev.farmInfo, ...partial } }
      saveSettings(next)
      return next
    })
  }, [])

  // Update nested env thresholds
  const updateEnvThresholds = useCallback((partial: Partial<EnvThresholds>) => {
    setSettings((prev) => {
      const next = { ...prev, envThresholds: { ...prev.envThresholds, ...partial } }
      saveSettings(next)
      return next
    })
  }, [])

  // Update nested notification
  const updateNotification = useCallback((partial: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, notification: { ...prev.notification, ...partial } }
      saveSettings(next)
      return next
    })
  }, [])

  // Update nested display
  const updateDisplay = useCallback((partial: Partial<DisplaySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, display: { ...prev.display, ...partial } }
      saveSettings(next)
      return next
    })
  }, [])

  // Reset to defaults
  const resetAll = useCallback(() => {
    saveSettings(defaultSettings)
    setSettings({ ...defaultSettings, lastBackup: new Date().toISOString() })
    toast.success('已恢复默认设置', { description: '所有设置已重置为初始值' })
  }, [])

  // Save thresholds with feedback
  const handleSaveThresholds = useCallback(() => {
    setSaving(true)
    setTimeout(() => {
      saveSettings(settings)
      setSaving(false)
      toast.success('环境预警阈值已保存', { description: '阈值设置将立即生效' })
    }, 500)
  }, [settings])

  // Clear cache
  const handleClearCache = useCallback(() => {
    const keys = Object.keys(localStorage)
    const preserved = ['farm-settings']
    keys.forEach((key) => {
      if (!preserved.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    toast.success('缓存已清除', { description: `已清理 ${keys.length - preserved.length} 条缓存数据` })
  }, [])

  // Export all data
  const handleExportData = useCallback(() => {
    try {
      const data: Record<string, string | null> = {}
      Object.keys(localStorage).forEach((key) => {
        data[key] = localStorage.getItem(key)
      })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `极境智牧-数据备份-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      updateSettings({ lastBackup: new Date().toISOString() })
      toast.success('数据已导出', { description: '数据备份文件已开始下载' })
    } catch {
      toast.error('导出失败', { description: '请稍后重试' })
    }
  }, [updateSettings])

  // Reset demo data
  const handleResetDemo = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' })
      toast.success('演示数据已重置', { description: '数据库已重新填充演示数据' })
    } catch {
      toast.error('重置失败', { description: '请稍后重试' })
    }
  }, [])

  const buildTime = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">系统设置</h1>
                  <p className="text-sm text-emerald-100">平台配置与个性化设置</p>
                </div>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/60 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  恢复默认
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认恢复默认设置？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将重置所有设置项为默认值，包括养殖场信息、预警阈值、通知偏好和显示设置。此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={resetAll}>确认恢复</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>

      {/* ─── Main Tabs ──────────────────────────────────── */}
      <Tabs defaultValue="basic" className="space-y-6">
        <motion.div variants={itemVariants}>
          <TabsList className="grid w-full sm:w-auto grid-cols-4">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">
              <Layers className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              基本设置
            </TabsTrigger>
            <TabsTrigger value="notification" className="text-xs sm:text-sm">
              <Bell className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              通知设置
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs sm:text-sm">
              <Palette className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              显示设置
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs sm:text-sm">
              <Info className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              关于系统
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 1: 基本设置                                */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="basic" className="space-y-4">
          {/* ─── 养殖场信息 ────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">养殖场信息</CardTitle>
                      <CardDescription className="text-xs">基本养殖场资料与认证信息</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white/10 border-white/60 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setEditFarmInfo(!editFarmInfo)}
                  >
                    {editFarmInfo ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        完成
                      </>
                    ) : (
                      <>
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        编辑
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: '养殖场名称', key: 'name' as const, icon: Building2 },
                    { label: '地址', key: 'address' as const, icon: Globe },
                    { label: '负责人', key: 'manager' as const, icon: Users },
                    { label: '联系电话', key: 'phone' as const, icon: Phone },
                    { label: '养殖场类型', key: 'type' as const, icon: Layers },
                    { label: '总容量', key: 'capacity' as const, icon: Layers },
                    { label: '鸡舍数量', key: 'houses' as const, icon: Building2 },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <item.icon className="h-3 w-3" />
                        {item.label}
                      </Label>
                      {editFarmInfo ? (
                        <Input
                          className="h-9 text-sm"
                          value={settings.farmInfo[item.key]}
                          onChange={(e) => updateFarmInfo({ [item.key]: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-medium">{settings.farmInfo[item.key]}</p>
                      )}
                    </div>
                  ))}
                  {/* 认证状态 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3 w-3" />
                      认证状态
                    </Label>
                    {settings.farmInfo.certified ? (
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">有机认证</Badge>
                    ) : (
                      <Badge variant="secondary">未认证</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 环境预警阈值 ──────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Thermometer className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">环境预警阈值</CardTitle>
                      <CardDescription className="text-xs">设置环境参数的预警和危险阈值</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleSaveThresholds}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    保存设置
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">温度 (°C)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-medium">适宜范围</span>
                        <span className="text-xs text-muted-foreground">{settings.envThresholds.tempOptimal[0]}°C - {settings.envThresholds.tempOptimal[1]}°C</span>
                      </div>
                      <Slider
                        min={10}
                        max={40}
                        step={1}
                        value={settings.envThresholds.tempOptimal}
                        onValueChange={(v) => updateEnvThresholds({ tempOptimal: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 font-medium">警告范围</span>
                        <span className="text-xs text-muted-foreground">&lt;{settings.envThresholds.tempWarning[0]}°C / &gt;{settings.envThresholds.tempWarning[1]}°C</span>
                      </div>
                      <Slider
                        min={5}
                        max={45}
                        step={1}
                        value={settings.envThresholds.tempWarning}
                        onValueChange={(v) => updateEnvThresholds({ tempWarning: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-600 font-medium">危险范围</span>
                        <span className="text-xs text-muted-foreground">&lt;{settings.envThresholds.tempDanger[0]}°C / &gt;{settings.envThresholds.tempDanger[1]}°C</span>
                      </div>
                      <Slider
                        min={0}
                        max={50}
                        step={1}
                        value={settings.envThresholds.tempDanger}
                        onValueChange={(v) => updateEnvThresholds({ tempDanger: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-red-500"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Humidity */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">湿度 (%)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-medium">适宜范围</span>
                        <span className="text-xs text-muted-foreground">{settings.envThresholds.humidityOptimal[0]}% - {settings.envThresholds.humidityOptimal[1]}%</span>
                      </div>
                      <Slider
                        min={20}
                        max={100}
                        step={1}
                        value={settings.envThresholds.humidityOptimal}
                        onValueChange={(v) => updateEnvThresholds({ humidityOptimal: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 font-medium">警告范围</span>
                        <span className="text-xs text-muted-foreground">&lt;{settings.envThresholds.humidityWarning[0]}% / &gt;{settings.envThresholds.humidityWarning[1]}%</span>
                      </div>
                      <Slider
                        min={10}
                        max={100}
                        step={1}
                        value={settings.envThresholds.humidityWarning}
                        onValueChange={(v) => updateEnvThresholds({ humidityWarning: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-600 font-medium">危险范围</span>
                        <span className="text-xs text-muted-foreground">&lt;{settings.envThresholds.humidityDanger[0]}% / &gt;{settings.envThresholds.humidityDanger[1]}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={settings.envThresholds.humidityDanger}
                        onValueChange={(v) => updateEnvThresholds({ humidityDanger: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-red-500"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ammonia */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">氨气 (ppm)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-medium">适宜范围</span>
                        <span className="text-xs text-muted-foreground">{settings.envThresholds.ammoniaOptimal[0]} - {settings.envThresholds.ammoniaOptimal[1]} ppm</span>
                      </div>
                      <Slider
                        min={0}
                        max={50}
                        step={1}
                        value={settings.envThresholds.ammoniaOptimal}
                        onValueChange={(v) => updateEnvThresholds({ ammoniaOptimal: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 font-medium">警告范围</span>
                        <span className="text-xs text-muted-foreground">{settings.envThresholds.ammoniaWarning[0]} - {settings.envThresholds.ammoniaWarning[1]} ppm</span>
                      </div>
                      <Slider
                        min={0}
                        max={60}
                        step={1}
                        value={settings.envThresholds.ammoniaWarning}
                        onValueChange={(v) => updateEnvThresholds({ ammoniaWarning: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-600 font-medium">危险范围</span>
                        <span className="text-xs text-muted-foreground">&gt;{settings.envThresholds.ammoniaDanger[0]} ppm</span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={settings.envThresholds.ammoniaDanger}
                        onValueChange={(v) => updateEnvThresholds({ ammoniaDanger: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-red-500"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* CO2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">CO₂ (ppm)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-medium">适宜范围</span>
                        <span className="text-xs text-muted-foreground">{settings.envThresholds.co2Optimal[0]} - {settings.envThresholds.co2Optimal[1]} ppm</span>
                      </div>
                      <Slider
                        min={0}
                        max={3000}
                        step={100}
                        value={settings.envThresholds.co2Optimal}
                        onValueChange={(v) => updateEnvThresholds({ co2Optimal: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 font-medium">警告范围</span>
                        <span className="text-xs text-muted-foreground">{settings.envThresholds.co2Warning[0]} - {settings.envThresholds.co2Warning[1]} ppm</span>
                      </div>
                      <Slider
                        min={0}
                        max={5000}
                        step={100}
                        value={settings.envThresholds.co2Warning}
                        onValueChange={(v) => updateEnvThresholds({ co2Warning: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-600 font-medium">危险范围</span>
                        <span className="text-xs text-muted-foreground">&gt;{settings.envThresholds.co2Danger[0]} ppm</span>
                      </div>
                      <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={settings.envThresholds.co2Danger}
                        onValueChange={(v) => updateEnvThresholds({ co2Danger: v as [number, number] })}
                        className="[&_[data-slot=slider-range]]:bg-red-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 数据管理 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">数据管理</CardTitle>
                    <CardDescription className="text-xs">缓存清理、数据导出与重置</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    onClick={handleClearCache}
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="text-xs font-medium">清除缓存</span>
                    <span className="text-[10px] text-muted-foreground">清理本地缓存数据</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary/50 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                    onClick={handleExportData}
                  >
                    <Download className="h-5 w-5" />
                    <span className="text-xs font-medium">导出所有数据</span>
                    <span className="text-[10px] text-muted-foreground">下载JSON备份文件</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary/50 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                      >
                        <RefreshCcw className="h-5 w-5" />
                        <span className="text-xs font-medium">重置演示数据</span>
                        <span className="text-[10px] text-muted-foreground">重新填充示例数据</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认重置演示数据？</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作将清空当前数据库并重新填充演示数据。所有自定义数据将丢失，此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetDemo}>确认重置</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  上次备份：{new Date(settings.lastBackup).toLocaleString('zh-CN')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 2: 通知设置                                */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="notification" className="space-y-4">
          {/* ─── 通知方式 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">通知方式</CardTitle>
                    <CardDescription className="text-xs">选择接收通知的方式</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {[
                    {
                      id: 'browserNotify',
                      label: '浏览器通知',
                      desc: '通过浏览器推送接收通知提醒',
                      icon: Monitor,
                      value: settings.notification.browserNotify,
                      onChange: (v: boolean) => updateNotification({ browserNotify: v }),
                    },
                    {
                      id: 'soundAlert',
                      label: '声音提醒',
                      desc: '收到通知时播放提示音效',
                      icon: Volume2,
                      value: settings.notification.soundAlert,
                      onChange: (v: boolean) => updateNotification({ soundAlert: v }),
                    },
                    {
                      id: 'popupNotify',
                      label: '弹窗通知',
                      desc: '在页面内显示弹窗通知消息',
                      icon: Bell,
                      value: settings.notification.popupNotify,
                      onChange: (v: boolean) => updateNotification({ popupNotify: v }),
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onChange}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 通知级别过滤 ──────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">通知级别过滤</CardTitle>
                    <CardDescription className="text-xs">选择需要接收的通知级别</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {[
                    {
                      id: 'levelEmergency',
                      label: '紧急通知',
                      desc: '设备故障、环境危险等紧急事件',
                      color: 'bg-red-500',
                      value: settings.notification.levelEmergency,
                      onChange: (v: boolean) => updateNotification({ levelEmergency: v }),
                    },
                    {
                      id: 'levelHigh',
                      label: '高优先级',
                      desc: '疫苗到期、用药提醒等重要通知',
                      color: 'bg-amber-500',
                      value: settings.notification.levelHigh,
                      onChange: (v: boolean) => updateNotification({ levelHigh: v }),
                    },
                    {
                      id: 'levelNormal',
                      label: '一般通知',
                      desc: '批次状态更新、任务完成等常规通知',
                      color: 'bg-blue-500',
                      value: settings.notification.levelNormal,
                      onChange: (v: boolean) => updateNotification({ levelNormal: v }),
                    },
                    {
                      id: 'levelSystem',
                      label: '系统通知',
                      desc: '系统维护、版本更新等系统消息',
                      color: 'bg-gray-500',
                      value: settings.notification.levelSystem,
                      onChange: (v: boolean) => updateNotification({ levelSystem: v }),
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={item.value}
                        onCheckedChange={item.onChange}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 通知频率 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">通知频率</CardTitle>
                    <CardDescription className="text-xs">配置通知刷新频率与免打扰时段</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-5">
                {/* Refresh interval */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">通知刷新间隔</Label>
                  </div>
                  <Select
                    value={settings.notification.refreshInterval}
                    onValueChange={(v) => updateNotification({ refreshInterval: v })}
                  >
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 秒</SelectItem>
                      <SelectItem value="45">45 秒</SelectItem>
                      <SelectItem value="60">1 分钟</SelectItem>
                      <SelectItem value="300">5 分钟</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* DND toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Moon className="h-4 w-4 text-muted-foreground" />
                      免打扰时段
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">在指定时段内屏蔽通知提醒</p>
                  </div>
                  <Switch
                    checked={settings.notification.dndEnabled}
                    onCheckedChange={(v) => updateNotification({ dndEnabled: v })}
                  />
                </div>

                {/* DND time range */}
                {settings.notification.dndEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 pl-6"
                  >
                    <Label className="text-xs text-muted-foreground">起始时间</Label>
                    <Input
                      type="time"
                      className="w-[120px] h-9 text-sm"
                      value={settings.notification.dndStart}
                      onChange={(e) => updateNotification({ dndStart: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground">至</span>
                    <Input
                      type="time"
                      className="w-[120px] h-9 text-sm"
                      value={settings.notification.dndEnd}
                      onChange={(e) => updateNotification({ dndEnd: e.target.value })}
                    />
                  </motion.div>
                )}

                <Separator />

                {/* Merge similar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      同类通知合并
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">将相同类型的连续通知合并为一条</p>
                  </div>
                  <Switch
                    checked={settings.notification.mergeSimilar}
                    onCheckedChange={(v) => updateNotification({ mergeSimilar: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 3: 显示设置                                */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="display" className="space-y-4">
          {/* ─── 界面设置 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">界面设置</CardTitle>
                    <CardDescription className="text-xs">自定义界面显示行为</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {[
                    {
                      id: 'sidebarCollapsed',
                      label: '侧边栏默认折叠',
                      desc: '进入页面时自动折叠侧边导航栏',
                      icon: Monitor,
                      value: settings.display.sidebarCollapsed,
                      onChange: (v: boolean) => updateDisplay({ sidebarCollapsed: v }),
                    },
                    {
                      id: 'compactMode',
                      label: '紧凑模式',
                      desc: '减少页面元素间距以显示更多内容',
                      icon: Layers,
                      value: settings.display.compactMode,
                      onChange: (v: boolean) => updateDisplay({ compactMode: v }),
                    },
                    {
                      id: 'animations',
                      label: '动画效果',
                      desc: '启用页面过渡和元素动画效果',
                      icon: Zap,
                      value: settings.display.animations,
                      onChange: (v: boolean) => updateDisplay({ animations: v }),
                    },
                    {
                      id: 'refreshAnimation',
                      label: '数据刷新动画',
                      desc: '数据更新时显示刷新动画提示',
                      icon: RefreshCcw,
                      value: settings.display.refreshAnimation,
                      onChange: (v: boolean) => updateDisplay({ refreshAnimation: v }),
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onChange}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 图表设置 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">图表设置</CardTitle>
                    <CardDescription className="text-xs">配置图表显示样式与动画</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-5">
                {/* Default chart type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">默认图表类型</p>
                      <p className="text-xs text-muted-foreground">设置数据展示的默认图表样式</p>
                    </div>
                  </div>
                  <Select
                    value={settings.display.chartType}
                    onValueChange={(v) => updateDisplay({ chartType: v })}
                  >
                    <SelectTrigger className="w-[120px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">折线图</SelectItem>
                      <SelectItem value="bar">柱状图</SelectItem>
                      <SelectItem value="area">面积图</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Chart animation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">图表动画</p>
                      <p className="text-xs text-muted-foreground">图表加载时显示过渡动画效果</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.display.chartAnimation}
                    onCheckedChange={(v) => updateDisplay({ chartAnimation: v })}
                  />
                </div>

                <Separator />

                {/* Data labels */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">数据标签显示</p>
                      <p className="text-xs text-muted-foreground">在图表数据点上显示具体数值</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.display.showDataLabels}
                    onCheckedChange={(v) => updateDisplay({ showDataLabels: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 语言与区域 ────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">语言与区域</CardTitle>
                    <CardDescription className="text-xs">设置语言、时区和日期格式</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Language */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">语言</p>
                      <p className="text-xs text-muted-foreground">界面显示语言</p>
                    </div>
                  </div>
                  <Select value={settings.display.language} disabled>
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Timezone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">时区</p>
                      <p className="text-xs text-muted-foreground">系统使用的时区</p>
                    </div>
                  </div>
                  <Select value={settings.display.timezone} disabled>
                    <SelectTrigger className="w-[160px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Date format */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">日期格式</p>
                      <p className="text-xs text-muted-foreground">日期显示的格式</p>
                    </div>
                  </div>
                  <Select
                    value={settings.display.dateFormat}
                    onValueChange={(v) => updateDisplay({ dateFormat: v })}
                  >
                    <SelectTrigger className="w-[150px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 4: 关于系统                                */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="about" className="space-y-4">
          {/* ─── 系统信息 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Info className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">系统信息</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: '系统名称', value: '极境智牧', icon: Layers },
                    { label: '版本号', value: 'v2.6.0', icon: Info },
                    { label: '构建时间', value: buildTime, icon: CalendarCheck },
                    { label: '模块数量', value: '24 个功能模块', icon: Layers },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary mt-0.5">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: '技术栈', value: 'Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui', icon: Code2 },
                    { label: '数据库', value: 'SQLite (Prisma ORM)', icon: Database },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary mt-0.5">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium break-all">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 开发团队 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">开发团队</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                      <Code2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">由 Z.ai Code 智能开发</p>
                      <p className="text-xs text-emerald-600 mt-0.5">AI 驱动的全栈开发平台</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { role: '前端架构', desc: 'React 19 + Next.js 16 + shadcn/ui' },
                      { role: '后端服务', desc: 'Prisma ORM + REST API' },
                      { role: '数据可视化', desc: 'Recharts + Framer Motion' },
                    ].map((item) => (
                      <div key={item.role} className="rounded-lg border p-3 text-center">
                        <p className="text-xs font-medium text-primary">{item.role}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 更新日志 ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">更新日志</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-96">
                  <div className="space-y-4 pr-3">
                    {[
                      {
                        version: 'v2.6.0',
                        date: '最新',
                        changes: ['采食量/饮水量按老师公式自动计算', '饮水量=日龄×10×数量，采食量=饮水量÷2', '新增登录界面、24个功能模块'],
                        color: 'bg-emerald-500',
                      },
                      {
                        version: 'v2.5.0',
                        date: '近期',
                        changes: ['新增饲料管理模块', '新增系统设置页面', '优化移动端体验'],
                        color: 'bg-blue-500',
                      },
                      {
                        version: 'v2.4.0',
                        date: '近期',
                        changes: ['新增AI智能诊断功能', '新增养殖计划排程', '性能优化与Bug修复'],
                        color: 'bg-blue-500',
                      },
                      {
                        version: 'v2.3.0',
                        date: '',
                        changes: ['新增数据大屏模块', '新增养殖日报功能', 'Dashboard图表增强'],
                        color: 'bg-violet-500',
                      },
                      {
                        version: 'v2.2.0',
                        date: '',
                        changes: ['新增专家问诊模块', '新增实时通知系统', '页面过渡动画'],
                        color: 'bg-amber-500',
                      },
                      {
                        version: 'v2.1.0',
                        date: '',
                        changes: ['新增养殖知识库', '数据导出功能', '知识库全文搜索'],
                        color: 'bg-teal-500',
                      },
                      {
                        version: 'v2.0.0',
                        date: '初始发布',
                        changes: ['初始发布：8个核心功能模块', '批次管理、环境智控、健康预警', '用药管理、成本分析、溯源管理'],
                        color: 'bg-gray-500',
                      },
                    ].map((log) => (
                      <div key={log.version} className="relative pl-6 pb-1">
                        {/* Timeline dot and line */}
                        <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${log.color}`} />
                        <div className="absolute left-[5px] top-[18px] bottom-0 w-px bg-border" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{log.version}</span>
                            {log.date && (
                              <Badge variant="secondary" className="text-[10px] h-5">{log.date}</Badge>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {log.changes.map((change, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}


