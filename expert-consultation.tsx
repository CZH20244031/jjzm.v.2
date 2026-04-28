'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Star,
  Phone,
  Video,
  HelpCircle,
  Loader2,
  ImageIcon,
  Eye,
  CircleDot,
  GraduationCap,
  Building2,
  MessageCircle,
  Brain,
  Bot,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Zap,
  ChevronDown,
  Tag,
} from 'lucide-react'

// ─── Data Types ──────────────────────────────────────────────

interface Expert {
  id: string
  name: string
  specialty: string
  title: string
  institution: string
  avatar: string
  color: string
  online: boolean
  rating: number
  consultCount: number
  responseTime: string
  tags: string[]
}

interface ConsultationRecord {
  id: string
  question: string
  answer: string
  expertName: string
  expertSpecialty: string
  category: string
  status: '待回复' | '已回复' | '已采纳'
  priority: '普通' | '紧急'
  createdAt: string
  answeredAt: string | null
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  views: number
}

interface ConsultationStats {
  totalExperts: number
  onlineExperts: number
  totalConsultations: number
  pendingCount: number
  avgResponseTime: string
  satisfactionRate: string
}

interface ConsultationData {
  experts: Expert[]
  consultationHistory: ConsultationRecord[]
  faqs: FAQ[]
  stats: ConsultationStats
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
  suggestedFollowUp?: string[]
  relatedTopics?: string[]
  expertSpecialty?: string
}

// ─── Quick Question Templates ────────────────────────────────

const QUICK_QUESTIONS = [
  { label: '冬季通风管理', question: '冬季鸡舍应该怎样做好通风管理？如何在保温和通风之间找到平衡？', icon: Zap },
  { label: '饲料配方优化', question: '肉鸡不同生长阶段的饲料配方应该如何调整优化？冬季需要增加哪些营养成分？', icon: Sparkles },
  { label: '疫病诊断', question: '鸡群出现精神萎靡、采食量下降、呼吸困难等症状，可能是哪些疫病？如何快速诊断？', icon: AlertCircle },
  { label: '出栏准备', question: '肉鸡出栏前需要做好哪些准备工作？休药期管理和出栏流程是怎样的？', icon: CheckCircle },
  { label: '环境调控', question: '鸡舍温湿度应该控制在什么范围？如何通过环控设备实现精确的环境调控？', icon: ChevronDown },
  { label: '用药咨询', question: '养殖过程中常用药物的休药期是多长时间？如何避免药物残留超标？', icon: HelpCircle },
]

// ─── Helper Functions ────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function StatusBadge({ status }: { status: ConsultationRecord['status'] }) {
  const config: Record<ConsultationRecord['status'], { className: string; icon: React.ReactNode }> = {
    '待回复': {
      className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    '已回复': {
      className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
      icon: <MessageSquare className="h-3 w-3 mr-1" />,
    },
    '已采纳': {
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`text-[10px] ${c.className}`}>
      {c.icon}
      {status}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: ConsultationRecord['priority'] }) {
  if (priority === '紧急') {
    return (
      <Badge className="bg-red-500 text-white text-[10px] hover:bg-red-500">
        <AlertCircle className="h-3 w-3 mr-1" />
        紧急
      </Badge>
    )
  }
  return null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-xs font-medium">{rating}</span>
    </div>
  )
}

// ─── Typing Indicator ────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

// ─── Animation Variants ──────────────────────────────────────

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

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ─── Main Component ──────────────────────────────────────────

export function ExpertConsultation() {
  const [data, setData] = useState<ConsultationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<'普通' | '紧急'>('普通')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [aiExpertFocus, setAiExpertFocus] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/consultation')
      if (!res.ok) throw new Error('请求失败')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch {
      setError('加载问诊数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('expert-ai-chat-history')
      if (stored) {
        setChatMessages(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save chat history to localStorage
  const saveChatHistory = useCallback((messages: ChatMessage[]) => {
    setChatMessages(messages)
    try {
      localStorage.setItem('expert-ai-chat-history', JSON.stringify(messages.slice(-50)))
    } catch {
      // ignore quota errors
    }
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isAiTyping])

  // Copy message content
  async function copyMessage(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  // Send AI chat message
  async function sendAiMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 5) {
      toast.error('请至少输入5个字符的问题')
      return
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...chatMessages, userMessage]
    saveChatHistory(updatedMessages)
    setChatInput('')
    setIsAiTyping(true)

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ai',
          question: trimmed,
          expertId: aiExpertFocus || undefined,
          category: undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'AI回复失败')
        setIsAiTyping(false)
        return
      }

      const aiMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'ai',
        content: json.answer || '抱歉，暂时无法回答您的问题，请稍后重试。',
        timestamp: new Date().toISOString(),
        suggestedFollowUp: json.suggestedFollowUp || [],
        relatedTopics: json.relatedTopics || [],
        expertSpecialty: aiExpertFocus
          ? data?.experts.find((e) => e.id === aiExpertFocus)?.specialty
          : undefined,
      }

      saveChatHistory([...updatedMessages, aiMessage])
    } catch {
      toast.error('网络连接异常，请稍后重试')
    } finally {
      setIsAiTyping(false)
    }
  }

  // Clear chat
  function clearChat() {
    saveChatHistory([])
    toast.info('对话已清空')
  }

  // Handle quick question click
  function handleQuickQuestion(question: string) {
    sendAiMessage(question)
  }

  // Handle suggested follow-up click
  function handleFollowUp(question: string) {
    sendAiMessage(question)
  }

  const handleSubmit = async () => {
    if (!selectedExpert || !selectedCategory || !questionText.trim()) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: selectedExpert,
          category: selectedCategory,
          question: questionText,
          priority: selectedPriority,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmitResult({ success: true, message: json.message })
        // Reset form
        setSelectedExpert('')
        setSelectedCategory('')
        setQuestionText('')
        setSelectedPriority('普通')
        // Refresh data
        setTimeout(() => {
          setDialogOpen(false)
          setSubmitResult(null)
          fetchData()
        }, 2000)
      } else {
        setSubmitResult({ success: false, message: json.error || '提交失败' })
      }
    } catch {
      setSubmitResult({ success: false, message: '网络错误，请稍后重试' })
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">加载问诊数据中...</span>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || '数据加载异常'}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          重新加载
        </Button>
      </div>
    )
  }

  const { experts, consultationHistory, faqs, stats } = data

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute right-1/3 -top-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">专家问诊</h1>
                <p className="text-sm text-emerald-100">在线技术咨询与远程诊断</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>{stats.totalExperts} 位专家</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <CircleDot className="h-3.5 w-3.5" />
                <span>{stats.onlineExperts} 位在线</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Brain className="h-3.5 w-3.5" />
                <span>AI智能问诊</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Clock className="h-3.5 w-3.5" />
                <span>平均回复 {stats.avgResponseTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>满意度 {stats.satisfactionRate}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Main Tabs ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="ai-chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-chat" className="text-xs sm:text-sm">
              <Bot className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              AI对话问诊
            </TabsTrigger>
            <TabsTrigger value="experts" className="text-xs sm:text-sm">
              <User className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              专家团队
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              问诊记录
              {stats.pendingCount > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] bg-amber-500 text-white hover:bg-amber-500">
                  {stats.pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm">
              <HelpCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              常见问题
            </TabsTrigger>
          </TabsList>

          {/* ─── AI Chat Tab ──────────────────────────────── */}
          <TabsContent value="ai-chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Left: Controls Panel */}
              <div className="lg:col-span-1 space-y-4">
                {/* Expert Specialty Selector */}
                <Card className="border-t-2 border-t-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm font-semibold">专家方向</CardTitle>
                    </div>
                    <CardDescription className="text-[11px]">
                      选择AI回答侧重方向
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={aiExpertFocus} onValueChange={setAiExpertFocus}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="综合咨询（全领域）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          综合咨询（全领域）
                        </SelectItem>
                        {experts.map((expert) => (
                          <SelectItem key={expert.id} value={expert.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{expert.name}</span>
                              <span className="text-muted-foreground">· {expert.specialty}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {aiExpertFocus && aiExpertFocus !== 'all' && (
                      <div className="flex flex-wrap gap-1">
                        {experts
                          .find((e) => e.id === aiExpertFocus)
                          ?.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Questions */}
                <Card className="border-t-2 border-t-emerald-400/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm font-semibold">快捷提问</CardTitle>
                    </div>
                    <CardDescription className="text-[11px]">
                      点击快速向AI专家咨询
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {QUICK_QUESTIONS.map((qq) => (
                      <button
                        key={qq.label}
                        onClick={() => handleQuickQuestion(qq.question)}
                        disabled={isAiTyping}
                        className="flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-left text-xs hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <qq.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 shrink-0" />
                        <span className="font-medium truncate">{qq.label}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Chat Actions */}
                {chatMessages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-red-500 hover:text-red-700"
                    onClick={clearChat}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    清空对话
                  </Button>
                )}
              </div>

              {/* Right: Chat Area */}
              <div className="lg:col-span-3">
                <Card className="flex flex-col h-[620px] border-t-2 border-t-primary/30">
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            AI养殖顾问
                            {aiExpertFocus && aiExpertFocus !== 'all' && (
                              <span className="text-xs font-normal text-muted-foreground ml-2">
                                · {experts.find((e) => e.id === aiExpertFocus)?.specialty}方向
                              </span>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                            <CircleDot className="h-2.5 w-2.5" />
                            <span>在线 · 智能回复</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        {chatMessages.length} 条消息
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center">
                          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <Brain className="h-8 w-8 text-emerald-600/40" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">AI养殖顾问在线</p>
                          <p className="text-xs text-muted-foreground max-w-[300px]">
                            您可以输入养殖问题，或点击左侧快捷提问开始咨询
                          </p>
                          <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-[320px]">
                            {QUICK_QUESTIONS.slice(0, 3).map((qq) => (
                              <Badge
                                key={qq.label}
                                variant="outline"
                                className="text-[10px] cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                                onClick={() => handleQuickQuestion(qq.question)}
                              >
                                {qq.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <AnimatePresence mode="popLayout">
                            {chatMessages.map((msg) => (
                              <motion.div
                                key={msg.id}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                              >
                                {/* Avatar */}
                                {msg.role === 'ai' ? (
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                                      AI
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                                      我
                                    </AvatarFallback>
                                  </Avatar>
                                )}

                                {/* Message Bubble */}
                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  <div
                                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                      msg.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-sm'
                                        : 'bg-emerald-50 border border-emerald-200 text-foreground rounded-bl-sm'
                                    }`}
                                  >
                                    {msg.role === 'ai' ? (
                                      <div className="prose prose-sm max-w-none prose-headings:text-emerald-800 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                      </div>
                                    ) : (
                                      <p>{msg.content}</p>
                                    )}
                                  </div>

                                  {/* Timestamp + Actions */}
                                  <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatDate(msg.timestamp)}
                                    </span>
                                    {msg.role === 'ai' && (
                                      <button
                                        onClick={() => copyMessage(msg.id, msg.content)}
                                        className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-emerald-600 transition-colors"
                                      >
                                        {copiedId === msg.id ? (
                                          <>
                                            <Check className="h-3 w-3" />
                                            已复制
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3" />
                                            复制
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* Suggested Follow-ups */}
                                  {msg.role === 'ai' && msg.suggestedFollowUp && msg.suggestedFollowUp.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {msg.suggestedFollowUp.map((q, i) => (
                                        <button
                                          key={i}
                                          onClick={() => handleFollowUp(q)}
                                          disabled={isAiTyping}
                                          className="text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <Sparkles className="h-2.5 w-2.5 inline mr-1" />
                                          {q.length > 20 ? q.slice(0, 20) + '...' : q}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Related Topics */}
                                  {msg.role === 'ai' && msg.relatedTopics && msg.relatedTopics.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                                      {msg.relatedTopics.map((topic, i) => (
                                        <Badge
                                          key={i}
                                          variant="secondary"
                                          className="text-[10px]"
                                        >
                                          {topic}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Typing Indicator */}
                          {isAiTyping && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                            >
                              <TypingIndicator />
                            </motion.div>
                          )}

                          <div ref={chatEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>

                  {/* Input Area */}
                  <div className="shrink-0 border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="请输入您的养殖问题（至少5个字符）..."
                        className="min-h-[44px] max-h-[120px] resize-none text-sm flex-1"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendAiMessage(chatInput)
                          }
                        }}
                        disabled={isAiTyping}
                      />
                      <Button
                        size="sm"
                        onClick={() => sendAiMessage(chatInput)}
                        disabled={isAiTyping || chatInput.trim().length < 5}
                        className="h-11 w-11 p-0 shrink-0"
                      >
                        {isAiTyping ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      按 Enter 发送，Shift+Enter 换行 · AI回答仅供参考，重要决策请咨询专业兽医
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── Expert Cards Tab ──────────────────────────────── */}
          <TabsContent value="experts" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {experts.length} 位专家 · {stats.onlineExperts} 位在线
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {experts.map((expert) => (
                <Card
                  key={expert.id}
                  className="hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                  {/* Online indicator strip */}
                  <div
                    className={`h-1 ${
                      expert.online ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback
                            className={`${expert.color} text-white text-sm font-bold`}
                          >
                            {expert.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                            expert.online ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{expert.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {expert.title}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Institution */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{expert.institution}</span>
                    </div>

                    {/* Specialty badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {expert.specialty}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          expert.online
                            ? 'text-emerald-600 border-emerald-300'
                            : 'text-gray-500 border-gray-300'
                        }`}
                      >
                        <CircleDot
                          className={`h-3 w-3 mr-1 ${
                            expert.online ? 'text-emerald-500' : 'text-gray-400'
                          }`}
                        />
                        {expert.online ? '在线' : '离线'}
                      </Badge>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {expert.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <StarRating rating={expert.rating} />
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {expert.consultCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {expert.responseTime}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-8"
                        disabled={!expert.online}
                        onClick={() => {
                          setSelectedExpert(expert.id)
                          setDialogOpen(true)
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        {expert.online ? '发起问诊' : '暂不在线'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Video className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── Consultation History Tab ─────────────────────── */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {consultationHistory.length} 条问诊记录
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedExpert('')
                  setSelectedCategory('')
                  setQuestionText('')
                  setSelectedPriority('普通')
                  setSubmitResult(null)
                  setDialogOpen(true)
                }}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                发起新问诊
              </Button>
            </div>

            <div className="space-y-3">
              {consultationHistory.map((record) => (
                <Card key={record.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-emerald-600 text-white text-[10px] font-bold">
                            {record.expertName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{record.expertName}</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {record.expertSpecialty}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(record.createdAt)}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {record.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <PriorityBadge priority={record.priority} />
                        <StatusBadge status={record.status} />
                      </div>
                    </div>

                    {/* Question */}
                    <div className="rounded-lg bg-muted/50 p-3 mb-2">
                      <p className="text-sm leading-relaxed">{record.question}</p>
                    </div>

                    {/* Answer */}
                    {record.answer && (
                      <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-emerald-700">专家回复</span>
                          {record.answeredAt && (
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {formatDate(record.answeredAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {record.answer}
                        </p>
                      </div>
                    )}

                    {record.status === '待回复' && !record.answer && (
                      <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                        <span className="text-xs text-amber-600">等待专家回复中...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── FAQ Tab ─────────────────────────────────────── */}
          <TabsContent value="faq" className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                共 {faqs.length} 个常见问题 · 快速找到养殖常见问题的解答
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {['全部', '疾病防控', '环境管理', '用药规范', '营养配比', '饲养管理']
                .slice(0, 4)
                .map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="text-xs justify-center cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                  >
                    {cat}
                  </Badge>
                ))}
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-card rounded-lg border px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-3 text-left flex-1 min-w-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{faq.question}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-emerald-50 text-emerald-700"
                          >
                            {faq.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {faq.views} 次浏览
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-9 pb-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ─── New Consultation Dialog ────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              发起专家问诊
            </DialogTitle>
            <DialogDescription>
              详细描述您的问题，专家将在工作时间内尽快回复
            </DialogDescription>
          </DialogHeader>

          {submitResult ? (
            <div className="py-8 text-center">
              {submitResult.success ? (
                <>
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-emerald-700 mb-1">提交成功！</p>
                  <p className="text-xs text-muted-foreground">{submitResult.message}</p>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-7 w-7 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700 mb-1">提交失败</p>
                  <p className="text-xs text-muted-foreground">{submitResult.message}</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Expert Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  选择专家 <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择咨询专家" />
                  </SelectTrigger>
                  <SelectContent>
                    {experts.map((expert) => (
                      <SelectItem key={expert.id} value={expert.id} disabled={!expert.online}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              expert.online ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          <span>
                            {expert.name} - {expert.specialty}
                          </span>
                          {!expert.online && (
                            <span className="text-xs text-muted-foreground">(离线)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  问题类别 <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择问题类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="疾病诊断">疾病诊断</SelectItem>
                    <SelectItem value="饲养管理">饲养管理</SelectItem>
                    <SelectItem value="环境调控">环境调控</SelectItem>
                    <SelectItem value="用药咨询">用药咨询</SelectItem>
                    <SelectItem value="营养配比">营养配比</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Textarea */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  问题描述 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="请详细描述您的问题，包括症状、环境条件、已采取措施等信息（至少10个字符）"
                  className="min-h-[120px] resize-none"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {questionText.length < 10
                    ? `还需输入 ${10 - questionText.length} 个字符`
                    : `已输入 ${questionText.length} 个字符`}
                </p>
              </div>

              {/* Image Upload Placeholder */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">上传图片（可选）</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    点击或拖拽上传图片（支持 JPG、PNG 格式）
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    可上传鸡群症状、环境照片等辅助诊断
                  </p>
                </div>
              </div>

              {/* Priority Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">优先级</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={(v) => setSelectedPriority(v as '普通' | '紧急')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="普通">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        普通 - 24小时内回复
                      </div>
                    </SelectItem>
                    <SelectItem value="紧急">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        紧急 - 2小时内回复
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!submitResult && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedExpert ||
                  !selectedCategory ||
                  questionText.trim().length < 10
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    提交问诊
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
