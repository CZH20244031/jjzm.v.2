'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  ShieldCheck,
  Pill,
  AlertTriangle,
  Save,
  Trash2,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ThermometerSun,
  Activity,
  ImageIcon,
  X,
  Heart,
  History,
  Zap,
  Bug,
  Wind,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────

interface PossibleDisease {
  name: string
  probability: '高' | '中' | '低'
  severity: '严重' | '较重' | '中等' | '轻微'
  description: string
}

interface DiagnosisResult {
  possibleDiseases: PossibleDisease[]
  severity: '严重' | '较重' | '中等' | '轻微'
  recommendations: string[]
  treatmentSuggestions: string[]
  prevention: string[]
  summary: string
  diagnosisTime: string
  inputSymptoms: string
}

interface DiagnosisRecord {
  id: string
  symptoms: string
  batchNo: string
  breed: string
  age: string
  houseName: string
  diagnosis: DiagnosisResult
  savedAt: string
}

interface BatchOption {
  batchNo: string
  breed: string
  houseName: string
}

// ─── Quick Symptom Templates ────────────────────────────

const QUICK_SYMPTOMS = [
  { label: '呼吸道异常', desc: '咳嗽、打喷嚏、流鼻涕', icon: Wind },
  { label: '采食量下降', desc: '鸡群食欲明显降低', icon: AlertTriangle },
  { label: '扎堆行为', desc: '鸡群聚集取暖', icon: ThermometerSun },
  { label: '腹泻/水便', desc: '粪便异常', icon: Bug },
  { label: '精神萎靡', desc: '活动量明显减少', icon: Activity },
  { label: '死亡率上升', desc: '近期死淘数量增加', icon: AlertCircle },
]

// ─── Helpers ────────────────────────────────────────────

function getSeverityColor(severity: string) {
  switch (severity) {
    case '严重':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
    case '较重':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' }
    case '中等':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
    case '轻微':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' }
  }
}

function getProbabilityBadge(probability: string) {
  switch (probability) {
    case '高':
      return 'bg-red-500 text-white hover:bg-red-500'
    case '中':
      return 'bg-amber-500 text-white hover:bg-amber-500'
    case '低':
      return 'bg-emerald-500 text-white hover:bg-emerald-500'
    default:
      return 'bg-gray-400 text-white hover:bg-gray-400'
  }
}

function formatTime(isoStr: string) {
  const d = new Date(isoStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

// ─── Animation Variants ─────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Loading Skeleton Component ─────────────────────────

function DiagnosisLoadingSkeleton() {
  return (
    <Card className="border-t-2 border-t-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">AI正在分析症状，请稍候...</span>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Diagnosis History Item ─────────────────────────────

function HistoryItem({ record, onSelect, onDelete }: { record: DiagnosisRecord; onSelect: (r: DiagnosisRecord) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/20">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 text-left flex-1 min-w-0 hover:bg-muted/30 rounded-md px-1 py-0.5 transition-colors"
        >
          <Brain className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{record.symptoms.slice(0, 40)}{record.symptoms.length > 40 ? '...' : ''}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {formatTime(record.savedAt)}
              </span>
              {record.breed && (
                <span className="text-[10px] text-muted-foreground">{record.breed}</span>
              )}
            </div>
          </div>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onSelect(record)}>
            <Activity className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => onDelete(record.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <Separator />
          <div className="px-4 py-3 space-y-2">
            <div className="text-xs font-medium">诊断概要</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{record.diagnosis.summary}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${getSeverityColor(record.diagnosis.severity).bg} ${getSeverityColor(record.diagnosis.severity).text} border-0`}>
                {record.diagnosis.severity}
              </Badge>
              {record.diagnosis.possibleDiseases.slice(0, 2).map((d) => (
                <Badge key={d.name} variant="secondary" className="text-[10px]">
                  {d.name}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────

export function AIDiagnosis() {
  // Form state
  const [symptoms, setSymptoms] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [houseName, setHouseName] = useState('')

  // Data state
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // History state
  const [history, setHistory] = useState<DiagnosisRecord[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Fetch batch data
  useEffect(() => {
    async function fetchBatches() {
      try {
        const res = await fetch('/api/batches')
        if (res.ok) {
          const json = await res.json()
          const activeBatches = (json.batches || [])
            .filter((b: { status: string }) => b.status === '养殖中')
            .map((b: { batchNo: string; breed: string; houseName: string }) => ({
              batchNo: b.batchNo,
              breed: b.breed,
              houseName: b.houseName,
            }))
          setBatches(activeBatches)
        }
      } catch {
        // silently fail
      }
    }
    fetchBatches()
  }, [])

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai-diagnosis-history')
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: DiagnosisRecord[]) => {
    setHistory(newHistory)
    try {
      localStorage.setItem('ai-diagnosis-history', JSON.stringify(newHistory))
    } catch {
      // ignore quota errors
    }
  }, [])

  // Handle batch selection
  function handleBatchChange(batchNo: string) {
    setSelectedBatch(batchNo)
    const batch = batches.find((b) => b.batchNo === batchNo)
    if (batch) {
      setBreed(batch.breed)
      setHouseName(batch.houseName)
    } else {
      setBreed('')
      setHouseName('')
    }
  }

  // Handle quick symptom click
  function handleQuickSymptom(desc: string) {
    setSymptoms((prev) => {
      if (prev.trim()) {
        return prev.trim() + '；' + desc
      }
      return desc
    })
  }

  // Submit diagnosis
  async function handleSubmit() {
    if (!symptoms.trim() || symptoms.trim().length < 5) {
      setError('请至少输入5个字符的症状描述')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/ai-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          batchNo: selectedBatch || undefined,
          breed: breed || undefined,
          age: age || undefined,
          houseName: houseName || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || '诊断请求失败')
        setIsSubmitting(false)
        return
      }

      if (json.success && json.diagnosis) {
        setDiagnosisResult(json.diagnosis)
        toast.success('AI诊断完成', {
          description: '已生成诊断报告，请查看分析结果',
        })
      } else {
        setError(json.error || '诊断结果异常')
      }
    } catch {
      setError('网络连接异常，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Save diagnosis to history
  function saveDiagnosisRecord() {
    if (!diagnosisResult) return

    const record: DiagnosisRecord = {
      id: `diag-${Date.now()}`,
      symptoms: symptoms.trim(),
      batchNo: selectedBatch,
      breed,
      age,
      houseName,
      diagnosis: diagnosisResult,
      savedAt: new Date().toISOString(),
    }

    const newHistory = [record, ...history].slice(0, 50) // Keep max 50 records
    saveHistory(newHistory)
    toast.success('诊断记录已保存')
  }

  // Delete history record
  function deleteRecord(id: string) {
    const newHistory = history.filter((r) => r.id !== id)
    saveHistory(newHistory)
    setConfirmDeleteId(null)
    toast.info('记录已删除')
  }

  // Load record from history
  function loadFromHistory(record: DiagnosisRecord) {
    setSymptoms(record.symptoms)
    setSelectedBatch(record.batchNo)
    setBreed(record.breed)
    setAge(record.age)
    setHouseName(record.houseName)
    setDiagnosisResult(record.diagnosis)
  }

  // Reset form
  function resetForm() {
    setSymptoms('')
    setSelectedBatch('')
    setBreed('')
    setAge('')
    setHouseName('')
    setDiagnosisResult(null)
    setError(null)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ===== Header ===== */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute right-1/3 -top-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">AI智能诊断</h1>
                <p className="text-sm text-emerald-100">智能分析症状，快速获取专业诊断建议</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI驱动精准诊断</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>寒地肉鸡专属模型</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>专业兽医知识库</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Zap className="h-3.5 w-3.5" />
                <span>秒级响应</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Tabs ===== */}
      <Tabs defaultValue="diagnosis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnosis" className="text-xs sm:text-sm">
            <Brain className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
            智能诊断
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
            诊断记录
            {history.length > 0 && (
              <Badge className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary">
                {history.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Diagnosis Tab ─── */}
        <TabsContent value="diagnosis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: Input Form */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              <Card className="border-t-2 border-t-primary/30 transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-semibold">症状描述</CardTitle>
                    </div>
                    {symptoms.trim().length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        已输入 {symptoms.trim().length} 字
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Textarea */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      症状描述 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder="请详细描述鸡群的异常表现，如：呼吸症状、粪便状态、精神状态、采食变化等..."
                      className="min-h-[120px] resize-none"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  {/* Quick Symptoms */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      常见症状快选（点击添加）
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_SYMPTOMS.map((qs) => (
                        <button
                          key={qs.label}
                          onClick={() => handleQuickSymptom(qs.desc)}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs hover:bg-primary/5 hover:border-primary/30 transition-all duration-150 group"
                        >
                          <qs.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{qs.label}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{qs.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Farm Context Selects */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      养殖信息（可选，有助于更准确诊断）
                    </Label>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">选择批次</Label>
                      <Select value={selectedBatch} onValueChange={handleBatchChange}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="请选择养殖批次（自动填充品种和鸡舍）" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((b) => (
                            <SelectItem key={b.batchNo} value={b.batchNo} className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{b.batchNo}</span>
                                <span className="text-muted-foreground">{b.breed}</span>
                                <span className="text-muted-foreground">· {b.houseName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">品种</Label>
                        <Select value={breed} onValueChange={setBreed}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="品种" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="白羽肉鸡" className="text-xs">白羽肉鸡</SelectItem>
                            <SelectItem value="AA肉鸡" className="text-xs">AA肉鸡</SelectItem>
                            <SelectItem value="科宝500" className="text-xs">科宝500</SelectItem>
                            <SelectItem value="罗斯308" className="text-xs">罗斯308</SelectItem>
                            <SelectItem value="黄羽肉鸡" className="text-xs">黄羽肉鸡</SelectItem>
                            <SelectItem value="817肉杂鸡" className="text-xs">817肉杂鸡</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">日龄</Label>
                        <Select value={age} onValueChange={setAge}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="日龄" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-7日龄" className="text-xs">1-7日龄</SelectItem>
                            <SelectItem value="8-14日龄" className="text-xs">8-14日龄</SelectItem>
                            <SelectItem value="15-21日龄" className="text-xs">15-21日龄</SelectItem>
                            <SelectItem value="22-28日龄" className="text-xs">22-28日龄</SelectItem>
                            <SelectItem value="29-35日龄" className="text-xs">29-35日龄</SelectItem>
                            <SelectItem value="36日龄以上" className="text-xs">36日龄以上</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">鸡舍</Label>
                        <Select value={houseName} onValueChange={setHouseName}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="鸡舍" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A1栋" className="text-xs">A1栋</SelectItem>
                            <SelectItem value="A2栋" className="text-xs">A2栋</SelectItem>
                            <SelectItem value="B1栋" className="text-xs">B1栋</SelectItem>
                            <SelectItem value="B2栋" className="text-xs">B2栋</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Placeholder */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">上传症状图片（可选）</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                      <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">点击上传鸡群症状照片</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">支持 JPG、PNG，最多3张</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-9 text-xs"
                      onClick={handleSubmit}
                      disabled={isSubmitting || symptoms.trim().length < 5}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          AI诊断中...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          开始智能诊断
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetForm} className="h-9">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3"
                      >
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-xs text-red-700">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Diagnosis Result */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              {isSubmitting ? (
                <DiagnosisLoadingSkeleton />
              ) : diagnosisResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {/* Summary Card */}
                  <Card className="border-t-2 border-t-primary/30 transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Brain className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-sm font-semibold">诊断结果</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${getSeverityColor(diagnosisResult.severity).bg} ${getSeverityColor(diagnosisResult.severity).text} border-0`}>
                            <Heart className="h-3 w-3 mr-1" />
                            严重程度：{diagnosisResult.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTime(diagnosisResult.diagnosisTime)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary */}
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-primary">综合诊断</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{diagnosisResult.summary}</p>
                      </div>

                      {/* Possible Diseases */}
                      {diagnosisResult.possibleDiseases.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-xs font-semibold">疑似疾病</span>
                          </div>
                          <div className="space-y-2">
                            {diagnosisResult.possibleDiseases.map((disease, index) => {
                              const sevColor = getSeverityColor(disease.severity)
                              return (
                                <motion.div
                                  key={disease.name}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1, duration: 0.3 }}
                                  className={`rounded-lg border ${sevColor.border} ${sevColor.bg} p-3`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center gap-1.5">
                                        <span className={`h-2 w-2 rounded-full ${sevColor.dot}`} />
                                        <span className="text-sm font-semibold">{disease.name}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Badge className={`text-[10px] ${getProbabilityBadge(disease.probability)}`}>
                                        可能性：{disease.probability}
                                      </Badge>
                                      <Badge variant="outline" className={`text-[10px] ${sevColor.text}`}>
                                        {disease.severity}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{disease.description}</p>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Treatment & Prevention Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Treatment Suggestions */}
                    <Card className="border-t-2 border-t-orange-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            <Pill className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-sm font-semibold">治疗方案</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosisResult.treatmentSuggestions.map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{t}</span>
                            </li>
                          ))}
                        </ul>
                        {diagnosisResult.treatmentSuggestions.length === 0 && (
                          <p className="text-xs text-muted-foreground">暂无具体治疗方案</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Prevention */}
                    <Card className="border-t-2 border-t-emerald-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-sm font-semibold">预防措施</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosisResult.prevention.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{p}</span>
                            </li>
                          ))}
                        </ul>
                        {diagnosisResult.prevention.length === 0 && (
                          <p className="text-xs text-muted-foreground">暂无预防措施建议</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  {diagnosisResult.recommendations.length > 0 && (
                    <Card className="border-t-2 border-t-amber-400 transition-all duration-200 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-sm font-semibold">紧急建议</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosisResult.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground leading-relaxed">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Save Button */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      AI诊断仅供参考，重要决策请咨询专业兽医
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveDiagnosisRecord}
                      className="text-xs"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      保存诊断记录
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* Empty State */
                <Card className="border-t-2 border-t-primary/10">
                  <CardContent className="py-16">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Brain className="h-8 w-8 text-primary/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">等待诊断</p>
                      <p className="text-xs text-muted-foreground max-w-[280px]">
                        请在左侧描述鸡群的异常症状，AI将为您进行智能分析并给出专业诊断建议
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {history.length} 条诊断记录（本地存储）
            </p>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700"
                onClick={() => {
                  setConfirmDeleteId('all')
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                清空全部
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <History className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">暂无诊断记录</p>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    完成AI诊断后，诊断记录将自动保存到这里
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2 pr-3">
                {history.map((record) => (
                  <HistoryItem
                    key={record.id}
                    record={record}
                    onSelect={loadFromHistory}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== Delete Confirmation Dialog ===== */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              {confirmDeleteId === 'all'
                ? '确定要清空所有诊断记录吗？此操作不可撤销。'
                : '确定要删除这条诊断记录吗？此操作不可撤销。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (confirmDeleteId === 'all') {
                  saveHistory([])
                } else if (confirmDeleteId) {
                  deleteRecord(confirmDeleteId)
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
