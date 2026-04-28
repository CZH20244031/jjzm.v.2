'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import {
  CloudSun,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Sun,
  Snowflake,
  Cloud,
  CloudLightning,
  CloudDrizzle,
  Eye,
  RefreshCw,
  MapPin,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Fan,
  Flame,
  UtensilsCrossed,
  ChevronRight,
  X,
} from 'lucide-react'

// === Types ===

interface CurrentWeather {
  temp: number
  humidity: number
  wind: number
  condition: string
  feelsLike: number
  visibility: number
  pressure: number
  uv: number
  dewPoint: number
}

interface ForecastDay {
  date: string
  day: string
  high: number
  low: number
  condition: string
  precipitation: number
  wind: number
  humidity: number
}

interface WeatherAlert {
  level: string
  title: string
  message: string
  suggestion: string
}

interface HistoricalTemp {
  date: string
  high: number
  low: number
  avg: number
}

interface FarmImpact {
  ventilation: string
  heating: string
  feeding: string
  overall: string
}

interface WeatherData {
  current: CurrentWeather
  forecast: ForecastDay[]
  alerts: WeatherAlert[]
  historicalTemps: HistoricalTemp[]
  farmImpact: FarmImpact
}

// === Chart Config ===

const chartConfig = {
  high: { label: '最高温度 (°C)', color: 'oklch(0.65 0.20 25)' },
  low: { label: '最低温度 (°C)', color: 'oklch(0.55 0.15 200)' },
  avg: { label: '平均温度 (°C)', color: 'oklch(0.55 0.15 145)' },
}

// === Helper Functions ===

function getWeatherIcon(condition: string, size: number = 20) {
  switch (condition) {
    case '晴':
      return <Sun className="text-amber-500" style={{ width: size, height: size }} />
    case '多云':
    case '多云转晴':
      return <CloudSun className="text-sky-400" style={{ width: size, height: size }} />
    case '阴':
      return <Cloud className="text-gray-400" style={{ width: size, height: size }} />
    case '小雨':
      return <CloudDrizzle className="text-blue-400" style={{ width: size, height: size }} />
    case '阵雨':
      return <CloudRain className="text-blue-500" style={{ width: size, height: size }} />
    case '雷阵雨':
      return <CloudLightning className="text-yellow-500" style={{ width: size, height: size }} />
    case '小雪':
    case '中雪':
    case '大雪':
      return <Snowflake className="text-blue-300" style={{ width: size, height: size }} />
    default:
      return <CloudSun className="text-sky-400" style={{ width: size, height: size }} />
  }
}

function getAlertLevelStyle(level: string) {
  switch (level) {
    case 'danger':
      return {
        bg: 'bg-gradient-to-r from-red-500/10 via-red-50 to-red-500/5 dark:from-red-500/20 dark:via-red-950/30 dark:to-red-500/10',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300',
        icon: 'bg-red-500',
        label: '红色预警',
        bar: 'from-red-500 to-orange-500',
      }
    case 'warning':
      return {
        bg: 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/5 dark:from-amber-500/20 dark:via-amber-950/30 dark:to-amber-500/10',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
        icon: 'bg-amber-500',
        label: '橙色预警',
        bar: 'from-amber-500 to-yellow-500',
      }
    case 'info':
      return {
        bg: 'bg-gradient-to-r from-sky-500/10 via-sky-50 to-sky-500/5 dark:from-sky-500/20 dark:via-sky-950/30 dark:to-sky-500/10',
        border: 'border-sky-200 dark:border-sky-800',
        badge: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
        icon: 'bg-sky-500',
        label: '蓝色提醒',
        bar: 'from-sky-500 to-teal-500',
      }
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/30',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-600',
        icon: 'bg-gray-400',
        label: '提示',
        bar: 'from-gray-400 to-gray-500',
      }
  }
}

function getOverallColor(overall: string) {
  switch (overall) {
    case '适宜':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case '一般':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case '不利':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// === Main Component ===

export function WeatherAlerts() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const forecastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchWeather()
  }, [])

  async function fetchWeather() {
    try {
      setLoading(true)
      const res = await fetch('/api/weather')
      if (!res.ok) throw new Error('获取天气数据失败')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch weather:', err)
    } finally {
      setLoading(false)
    }
  }

  const activeAlerts = data?.alerts.filter((a) => !dismissedAlerts.has(a.title)) ?? []

  const handleDismissAlert = (title: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(title))
  }

  // === Loading Skeleton ===
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-56" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">天气预警</h1>
          <p className="text-muted-foreground text-sm mt-1">
            实时天气监测与养殖环境预警
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWeather}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          刷新天气
        </Button>
      </div>

      {/* Weather Alert Banners */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {activeAlerts.map((alert, index) => {
              const style = getAlertLevelStyle(alert.level)
              const isExpanded = expandedAlert === alert.title
              return (
                <motion.div
                  key={alert.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`relative overflow-hidden rounded-lg border ${style.border} ${style.bg}`}
                >
                  {/* Gradient bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.bar}`} />
                  <div className="p-3 sm:p-4 pl-5 sm:pl-6">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 mt-0.5 rounded-full p-1.5 ${style.icon} text-white`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] px-2 py-0.5 border ${style.badge}`}>
                            {style.label}
                          </Badge>
                          <span className="text-sm font-semibold">{alert.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 overflow-hidden"
                            >
                              <div className="flex items-start gap-2 rounded-md bg-white/60 dark:bg-black/20 p-2.5 border border-dashed">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">养殖建议</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    {alert.suggestion}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.title)}
                        >
                          {isExpanded ? '收起' : '查看建议'}
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                          </motion.div>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDismissAlert(alert.title)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Weather + Farm Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Weather Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-emerald-400 to-teal-500 opacity-90" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />

              <CardContent className="relative p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Main weather info */}
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium opacity-90">宾县 · 黑龙江</span>
                    </div>
                    <div className="flex items-end gap-3 mb-2">
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-5xl sm:text-6xl font-bold leading-none"
                      >
                        {data.current.temp}°
                      </motion.span>
                      <div className="pb-1.5">
                        {getWeatherIcon(data.current.condition, 36)}
                      </div>
                    </div>
                    <p className="text-lg font-medium mb-1">{data.current.condition}</p>
                    <p className="text-sm opacity-80">
                      体感温度 {data.current.feelsLike}°C
                    </p>
                  </div>

                  {/* Right: Weather details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-white w-full sm:w-auto sm:min-w-[260px]">
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <Droplets className="h-3.5 w-3.5" />
                        <span className="text-[10px]">湿度</span>
                      </div>
                      <p className="text-lg font-bold">{data.current.humidity}%</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <Wind className="h-3.5 w-3.5" />
                        <span className="text-[10px]">风速</span>
                      </div>
                      <p className="text-lg font-bold">{data.current.wind}km/h</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-[10px]">能见度</span>
                      </div>
                      <p className="text-lg font-bold">{data.current.visibility}km</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <Gauge className="h-3.5 w-3.5" />
                        <span className="text-[10px]">气压</span>
                      </div>
                      <p className="text-lg font-bold">{data.current.pressure}hPa</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <Sun className="h-3.5 w-3.5" />
                        <span className="text-[10px]">紫外线</span>
                      </div>
                      <p className="text-lg font-bold">{data.current.uv}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <Thermometer className="h-3.5 w-3.5" />
                        <span className="text-[10px]">露点</span>
                      </div>
                      <p className="text-lg font-bold">{data.current.dewPoint}°C</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Farm Impact Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                养殖影响分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Overall status */}
              <div className={`flex items-center justify-between rounded-lg border p-3 ${getOverallColor(data.farmImpact.overall)}`}>
                <span className="text-xs font-medium">综合评估</span>
                <Badge variant="outline" className="text-xs font-bold">
                  {data.farmImpact.overall}
                </Badge>
              </div>

              {/* Impact items */}
              <div className="space-y-2.5">
                <div className="group flex items-start gap-2.5 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 rounded-md bg-sky-50 p-1.5 group-hover:bg-sky-100 transition-colors">
                    <Fan className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">通风建议</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {data.farmImpact.ventilation}
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-2.5 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 rounded-md bg-orange-50 p-1.5 group-hover:bg-orange-100 transition-colors">
                    <Flame className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">供暖建议</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {data.farmImpact.heating}
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-2.5 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 rounded-md bg-emerald-50 p-1.5 group-hover:bg-emerald-100 transition-colors">
                    <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">饲喂建议</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {data.farmImpact.feeding}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs: Forecast + History */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="forecast" className="text-xs">
            7日天气预报
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            历史温度趋势
          </TabsTrigger>
        </TabsList>

        {/* 7-day Forecast */}
        <TabsContent value="forecast">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CloudSun className="h-4 w-4 text-sky-500" />
                  未来7天天气预报
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full" ref={forecastRef}>
                  <div className="flex gap-3 pb-2 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
                    {data.forecast.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.06 }}
                        className={`flex flex-col items-center rounded-xl border p-3 sm:p-4 min-w-[120px] sm:min-w-0 sm:flex-1 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default ${
                          index === 0
                            ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200 dark:from-emerald-950/30 dark:to-background dark:border-emerald-800'
                            : 'bg-card hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          {day.day}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {day.date}
                        </span>
                        <div className="my-3">
                          {getWeatherIcon(day.condition, 32)}
                        </div>
                        <p className="text-xs font-medium mb-2">{day.condition}</p>

                        {/* Temperature bar */}
                        <div className="w-full flex items-center gap-1.5 mb-2">
                          <ArrowDownRight className="h-3 w-3 text-blue-400 shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(((day.low + 10) / 45) * 100, 100)}%` }}
                              transition={{ duration: 0.6, delay: index * 0.06 + 0.3 }}
                              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-sky-400"
                            />
                          </div>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums w-7 text-right">
                            {day.low}°
                          </span>
                        </div>
                        <div className="w-full flex items-center gap-1.5">
                          <ArrowUpRight className="h-3 w-3 text-red-400 shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(((day.high + 10) / 45) * 100, 100)}%` }}
                              transition={{ duration: 0.6, delay: index * 0.06 + 0.4 }}
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400"
                            />
                          </div>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums w-7 text-right">
                            {day.high}°
                          </span>
                        </div>

                        {/* Precipitation */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <Droplets className="h-3 w-3 text-sky-400" />
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {day.precipitation}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Wind className="h-3 w-3 text-gray-400" />
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {day.wind}km/h
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Historical Temperature Trend */}
        <TabsContent value="history">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    过去7天温度趋势
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      <ArrowUpRight className="h-3 w-3 mr-0.5 text-red-500" />
                      最高
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <ArrowDownRight className="h-3 w-3 mr-0.5 text-blue-500" />
                      最低
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <Thermometer className="h-3 w-3 mr-0.5 text-emerald-500" />
                      均温
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <AreaChart data={data.historicalTemps} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} domain={[10, 30]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="high"
                      stroke="oklch(0.65 0.20 25)"
                      strokeWidth={2}
                      fill="url(#fillHigh)"
                      dot={{ r: 4, fill: 'oklch(0.65 0.20 25)' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="oklch(0.55 0.15 145)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: 'oklch(0.55 0.15 145)' }}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="low"
                      stroke="oklch(0.55 0.15 200)"
                      strokeWidth={2}
                      fill="url(#fillAvg)"
                      dot={{ r: 4, fill: 'oklch(0.55 0.15 200)' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ChartContainer>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5">
                    <p className="text-[10px] text-muted-foreground">最高温</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {Math.max(...data.historicalTemps.map((t) => t.high))}°C
                    </p>
                  </div>
                  <div className="text-center rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5">
                    <p className="text-[10px] text-muted-foreground">平均温</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(data.historicalTemps.reduce((s, t) => s + t.avg, 0) / data.historicalTemps.length)}°C
                    </p>
                  </div>
                  <div className="text-center rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-2.5">
                    <p className="text-[10px] text-muted-foreground">最低温</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {Math.min(...data.historicalTemps.map((t) => t.low))}°C
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Bottom: Forecast Detail Table + All Alerts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Forecast Detail Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="h-4 w-4 text-gray-500" />
                预报详情
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {data.forecast.map((day, index) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/30 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="w-10 shrink-0 text-center">
                      <p className="text-xs font-semibold">{day.day}</p>
                      <p className="text-[10px] text-muted-foreground">{day.date}</p>
                    </div>
                    <div className="shrink-0">
                      {getWeatherIcon(day.condition, 24)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{day.condition}</p>
                      <p className="text-[10px] text-muted-foreground">
                        降水 {day.precipitation}% · 风 {day.wind}km/h · 湿度 {day.humidity}%
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{day.high}°</span>
                      <span className="text-muted-foreground mx-0.5">/</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{day.low}°</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* All Alerts Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  预警信息汇总
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {data.alerts.length} 条预警
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alerts.map((alert, index) => {
                  const style = getAlertLevelStyle(alert.level)
                  return (
                    <motion.div
                      key={alert.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.08 }}
                      className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`shrink-0 mt-0.5 rounded-full p-1 ${style.icon} text-white`}>
                          <AlertTriangle className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-1.5 py-0 border ${style.badge}`}>
                              {style.label}
                            </Badge>
                            <span className="text-xs font-semibold">{alert.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                              {alert.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
