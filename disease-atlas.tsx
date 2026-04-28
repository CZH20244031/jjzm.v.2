'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, Bug, HeartPulse, Syringe, Thermometer,
  CalendarDays, Activity, TrendingUp, ChevronRight, Brain, Microscope,
  Pill, FileWarning, CheckCircle2, XCircle, ClipboardList, Stethoscope,
  Zap, Eye, BookOpen, Sprout, ArrowLeft, Clock, Target, ShieldAlert,
  AlertOctagon, Dna, FlaskConical, Scale, Beaker, Leaf,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Disease {
  name: string
  severity: 'high' | 'medium' | 'low'
  symptoms: string[]
  prevention: string[]
  treatment: string[]
  season: string
  ageRange: string
}

interface DiseaseCategory {
  name: string
  type: 'viral' | 'bacterial' | 'parasitic' | 'metabolic'
  icon: string
  color: string
  description: string
  diseases: Disease[]
}

interface SeasonalRisk {
  month: string
  risks: { disease: string; level: 'high' | 'medium' | 'low' }[]
}

interface VaccinationEntry {
  age: string
  vaccine: string
  method: string
  description: string
  type: string
}

interface EmergencyStep {
  step: number
  title: string
  description: string
  icon: string
  timeLimit: string
}

interface HealthScoreData {
  immunity: number
  hygiene: number
  biosecurity: number
  nutrition: number
  monitoring: number
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const stats = {
  totalDiseases: 16,
  activeAlerts: 2,
  vaccinationRate: 94.5,
  monthlyCases: 3,
}

const categories: DiseaseCategory[] = [
  {
    name: '病毒性疾病',
    type: 'viral',
    icon: 'Bug',
    color: '#ef4444',
    description: '由病毒引起的传染病，传播速度快，危害严重',
    diseases: [
      {
        name: '新城疫', severity: 'high',
        symptoms: ['呼吸困难、气喘', '神经症状（扭颈、观星）', '排绿色稀便', '产蛋率骤降', '腺胃乳头出血'],
        prevention: ['按时疫苗接种（Lasota、Clone30）', '严格隔离消毒制度', '控制人员车辆进出', '加强饲养管理提高免疫力'],
        treatment: ['紧急接种Clone30疫苗', '使用抗病毒药物辅助治疗', '添加多维电解质', '抗生素防止继发感染', '淘汰重症鸡只'],
        season: '冬春', ageRange: '所有日龄',
      },
      {
        name: '禽流感', severity: 'high',
        symptoms: ['突发高热（41-42℃）', '头部水肿、肉髯发紫', '呼吸困难、张口呼吸', '下痢、排黄绿色粪便', '脚鳞出血'],
        prevention: ['定期接种禽流感灭活疫苗', '严格执行生物安全措施', '禁止与野生鸟类接触', '加强环境消毒（含氯消毒剂）'],
        treatment: ['立即上报疫情', '配合政府扑杀措施', '全场紧急消毒', '封场隔离', '对周边区域进行监测'],
        season: '冬春', ageRange: '所有日龄',
      },
      {
        name: '传染性支气管炎', severity: 'medium',
        symptoms: ['咳嗽、喷嚏、气管啰音', '鼻窦肿胀、流鼻涕', '产蛋下降、畸形蛋增多', '肾型：尿酸盐沉积', '输卵管发育不良'],
        prevention: ['7日龄首免H120疫苗', '35日龄二免H52疫苗', '开产前接种灭活疫苗', '保持舍内温度稳定', '减少应激因素'],
        treatment: ['使用抗病毒药物（利巴韦林）', '添加止咳平喘药物', '补充多维增强抵抗力', '使用抗生素防继发感染', '保温并改善通风'],
        season: '秋冬', ageRange: '1-6周龄最易感',
      },
      {
        name: '传染性法氏囊病', severity: 'high',
        symptoms: ['精神萎靡、羽毛蓬松', '排白色水样稀便', '法氏囊肿大出血', '脱水、消瘦', '免疫抑制导致继发感染'],
        prevention: ['14-18日龄首免法氏囊疫苗', '28-32日龄二免', '做好环境消毒（碘制剂）', '控制舍内湿度', '母源抗体监测'],
        treatment: ['注射高免卵黄抗体', '使用肾肿解毒药', '补充电解多维', '添加抗生素防继发感染', '提高舍温2-3℃'],
        season: '春夏', ageRange: '3-6周龄',
      },
    ],
  },
  {
    name: '细菌性疾病',
    type: 'bacterial',
    icon: 'Microscope',
    color: '#f59e0b',
    description: '由细菌感染引起的疾病，常与饲养环境密切相关',
    diseases: [
      {
        name: '大肠杆菌病', severity: 'medium',
        symptoms: ['心包炎、肝周炎', '气囊浑浊增厚', '卵黄性腹膜炎', '排黄白色稀便', '败血症、突然死亡'],
        prevention: ['加强环境卫生管理', '控制饲养密度', '减少氨气等有害气体', '种蛋严格消毒', '定期预防性投药'],
        treatment: ['药敏试验选择敏感药物', '常用恩诺沙星、氟苯尼考', '交替用药防止耐药', '配合中药制剂', '淘汰病重鸡只'],
        season: '全年', ageRange: '各日龄均可发生',
      },
      {
        name: '沙门氏菌病', severity: 'medium',
        symptoms: ['雏鸡排白色糊状粪便', '肛门周围羽毛粘结', '精神沉郁、食欲废绝', '肺型：呼吸困难', '关节肿大、跛行'],
        prevention: ['种鸡群净化', '种蛋熏蒸消毒', '雏鸡入舍前消毒', '防止饲料水源污染', '添加微生态制剂'],
        treatment: ['氟苯尼考拌料', '恩诺沙星饮水', '硫酸粘菌素拌料', '补充电解多维', '严重鸡群及时淘汰'],
        season: '春夏', ageRange: '雏鸡最易感（1-3周龄）',
      },
      {
        name: '鸡白痢', severity: 'medium',
        symptoms: ['排白色石灰样粪便', '肛门被粪便堵塞', '翅膀下垂、闭眼嗜睡', '扎堆、怕冷', '生长发育迟缓'],
        prevention: ['种鸡白痢净化检测', '种蛋孵化消毒', '雏鸡开口添加抗菌药', '育雏温度适宜', '坚持全进全出制度'],
        treatment: ['恩诺沙星饮水5天', '氟苯尼考拌料', '复方新诺明拌料', '电解多维饮水', '改善育雏环境'],
        season: '冬春', ageRange: '1-3周龄雏鸡',
      },
      {
        name: '禽霍乱', severity: 'high',
        symptoms: ['突然死亡（急性型）', '鸡冠肉髯发紫肿胀', '剧烈腹泻、粪便带血', '体温升至43-44℃', '肝脏表面有灰白色坏死点'],
        prevention: ['定期接种禽霍乱灭活疫苗', '严格消毒鸡舍及用具', '减少应激因素', '防止水源饲料污染', '病死鸡无害化处理'],
        treatment: ['青霉素+链霉素肌肉注射', '恩诺沙星饮水', '磺胺类药物拌料', '全场紧急消毒', '隔离病鸡群'],
        season: '夏秋', ageRange: '成年鸡多发',
      },
    ],
  },
  {
    name: '寄生虫性疾病',
    type: 'parasitic',
    icon: 'Bug',
    color: '#22c55e',
    description: '由寄生虫引起的疾病，影响生长性能和饲料转化率',
    diseases: [
      {
        name: '球虫病', severity: 'high',
        symptoms: ['血便、番茄样粪便', '精神萎靡、食欲下降', '鸡冠苍白贫血', '生长迟缓、料肉比升高', '盲肠肿胀出血'],
        prevention: ['雏鸡使用抗球虫药物预防', '保持垫料干燥清洁', '控制饲养密度', '定期轮换用药', '使用球虫疫苗免疫'],
        treatment: ['地克珠利饮水', '磺胺氯丙嗪钠饮水', '托曲珠利饮水', '补充维生素K止血', '电解多维恢复体力'],
        season: '春夏雨季', ageRange: '15-50日龄最易感',
      },
      {
        name: '蛔虫病', severity: 'low',
        symptoms: ['生长缓慢、消瘦', '产蛋率下降', '腹泻、偶尔带虫', '羽毛粗乱无光泽', '严重感染时肠梗阻'],
        prevention: ['定期驱虫（每2个月）', '及时清理鸡粪', '保持运动场干燥', '饲料中添加驱虫药', '做好饮水卫生'],
        treatment: ['伊维菌素拌料', '芬苯达唑拌料', '左旋咪唑饮水', '驱虫后补充营养', '粪便堆积发酵杀虫卵'],
        season: '全年', ageRange: '2月龄以上鸡群',
      },
      {
        name: '住白细胞原虫病', severity: 'medium',
        symptoms: ['鸡冠苍白、贫血', '排绿色稀便', '咳血、呼吸困难', '运动失调、共济失调', '肌肉及内脏出血'],
        prevention: ['消灭库蠓等传播媒介', '鸡舍安装防虫网', '使用杀虫剂喷洒环境', '流行季节预防性投药', '减少户外活动时间'],
        treatment: ['磺胺间甲氧嘧啶饮水', '乙胺嘧啶拌料', '复方新诺明拌料', '添加维生素K', '补充铁剂改善贫血'],
        season: '夏秋', ageRange: '1-3月龄青年鸡',
      },
      {
        name: '组织滴虫病', severity: 'low',
        symptoms: ['排硫磺色粪便', '头部发黑（黑头病）', '盲肠肿大、干酪样渗出', '肝脏出现同心圆坏死灶', '精神沉郁、食欲减退'],
        prevention: ['定期驱除异刺线虫', '避免鸡与火鸡混养', '保持环境卫生', '及时清除粪便', '做好饮水消毒'],
        treatment: ['甲硝唑饮水', '卡巴胂拌料', '地美硝唑预混剂', '补充多维恢复体质', '改善环境卫生'],
        season: '春夏', ageRange: '4-16周龄',
      },
    ],
  },
  {
    name: '营养代谢性疾病',
    type: 'metabolic',
    icon: 'Pill',
    color: '#a855f7',
    description: '由营养失衡或代谢障碍引起的疾病，多与饲料管理有关',
    diseases: [
      {
        name: '痛风', severity: 'medium',
        symptoms: ['关节肿大、行动困难', '内脏表面尿酸盐沉积', '排白色稀便（含尿酸盐）', '食欲下降、精神萎靡', '肾脏肿大苍白'],
        prevention: ['合理搭配饲料蛋白含量', '保证充足饮水', '控制钙磷比例适当', '避免长期使用磺胺类药物', '添加维生素A促进尿酸排出'],
        treatment: ['降低饲料蛋白质水平', '补充充足清洁饮水', '添加碳酸氢钠碱化尿液', '增加维生素A、D的供给', '使用肾肿解毒药'],
        season: '全年', ageRange: '肉鸡3-6周龄、蛋鸡产蛋期',
      },
      {
        name: '脂肪肝综合征', severity: 'low',
        symptoms: ['鸡冠苍白或发黄', '产蛋率突然下降', '过度肥胖、体重超标', '肝脏肿大呈黄色', '突然死亡（肝破裂）'],
        prevention: ['合理控制能量饲料', '添加氯化胆碱和蛋氨酸', '保证适当运动空间', '避免饲料突变应激', '控制日粮能量蛋白比'],
        treatment: ['降低饲料能量水平', '添加氯化胆碱（每吨1000g）', '补充维生素B12和叶酸', '添加维生素E和硒', '逐步调整饲料配方'],
        season: '夏季高温期', ageRange: '产蛋高峰期母鸡',
      },
      {
        name: '维生素缺乏症', severity: 'low',
        symptoms: ['VA缺乏：夜盲、上皮角化', 'VD缺乏：佝偻病、软壳蛋', 'VE缺乏：脑软化、渗出性素质', 'VB缺乏：脚趾蜷曲、生长停滞', 'VK缺乏：出血不止'],
        prevention: ['使用优质维生素预混料', '注意维生素保存（避光防潮）', '定期检测饲料维生素含量', '应激期间增加维生素添加量', '饲料加工温度不宜过高'],
        treatment: ['确诊缺乏种类后针对性补充', '紧急注射对应维生素制剂', '饮水添加复合维生素', '调整饲料配方', '使用抗氧化剂保护维生素'],
        season: '全年', ageRange: '快速生长期和产蛋高峰期',
      },
      {
        name: '矿物质代谢紊乱', severity: 'low',
        symptoms: ['钙磷缺乏：软骨症、软壳蛋', '锌缺乏：羽毛异常、皮肤角化', '锰缺乏：滑腱症、跛行', '硒缺乏：渗出性素质', '铁缺乏：贫血'],
        prevention: ['使用优质矿物质预混料', '定期检测饲料矿物质含量', '注意矿物质间拮抗关系', '应激期适当增加添加量', '保证饮水清洁'],
        treatment: ['确诊后针对性补充矿物质', '调整饲料矿物质配比', '饮水添加电解多维', '严重个体注射补充', '持续监测恢复情况'],
        season: '全年', ageRange: '各日龄均可发生',
      },
    ],
  },
]

const seasonalRisk: SeasonalRisk[] = [
  { month: '1月', risks: [{ disease: '新城疫', level: 'high' }, { disease: '禽流感', level: 'high' }, { disease: '传染性支气管炎', level: 'medium' }, { disease: '鸡白痢', level: 'medium' }] },
  { month: '2月', risks: [{ disease: '新城疫', level: 'high' }, { disease: '禽流感', level: 'high' }, { disease: '传染性支气管炎', level: 'high' }, { disease: '鸡白痢', level: 'medium' }] },
  { month: '3月', risks: [{ disease: '新城疫', level: 'medium' }, { disease: '传染性法氏囊病', level: 'medium' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '沙门氏菌病', level: 'low' }] },
  { month: '4月', risks: [{ disease: '传染性法氏囊病', level: 'high' }, { disease: '球虫病', level: 'medium' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '沙门氏菌病', level: 'low' }] },
  { month: '5月', risks: [{ disease: '球虫病', level: 'high' }, { disease: '传染性法氏囊病', level: 'medium' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '组织滴虫病', level: 'low' }] },
  { month: '6月', risks: [{ disease: '球虫病', level: 'high' }, { disease: '脂肪肝综合征', level: 'medium' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '住白细胞原虫病', level: 'low' }] },
  { month: '7月', risks: [{ disease: '脂肪肝综合征', level: 'high' }, { disease: '禽霍乱', level: 'high' }, { disease: '住白细胞原虫病', level: 'medium' }, { disease: '球虫病', level: 'medium' }] },
  { month: '8月', risks: [{ disease: '禽霍乱', level: 'high' }, { disease: '住白细胞原虫病', level: 'high' }, { disease: '脂肪肝综合征', level: 'medium' }, { disease: '球虫病', level: 'medium' }] },
  { month: '9月', risks: [{ disease: '禽霍乱', level: 'medium' }, { disease: '住白细胞原虫病', level: 'medium' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '组织滴虫病', level: 'low' }] },
  { month: '10月', risks: [{ disease: '传染性支气管炎', level: 'medium' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '禽霍乱', level: 'low' }, { disease: '痛风', level: 'low' }] },
  { month: '11月', risks: [{ disease: '新城疫', level: 'high' }, { disease: '传染性支气管炎', level: 'high' }, { disease: '大肠杆菌病', level: 'medium' }, { disease: '痛风', level: 'low' }] },
  { month: '12月', risks: [{ disease: '新城疫', level: 'high' }, { disease: '禽流感', level: 'high' }, { disease: '传染性支气管炎', level: 'high' }, { disease: '鸡白痢', level: 'medium' }] },
]

const vaccinationSchedule: VaccinationEntry[] = [
  { age: '1日龄', vaccine: '马立克氏病疫苗', method: '皮下注射', description: '雏鸡出壳后24小时内接种', type: '必免' },
  { age: '7日龄', vaccine: '新城疫Lasota + 传染性支气管炎H120', method: '点眼/滴鼻', description: '首免，建立基础免疫', type: '必免' },
  { age: '14日龄', vaccine: '传染性法氏囊病活疫苗', method: '饮水免疫', description: '首免，预防法氏囊病', type: '必免' },
  { age: '21日龄', vaccine: '禽流感灭活疫苗（H5+H7）', method: '颈部皮下注射', description: '首免禽流感疫苗', type: '必免' },
  { age: '35日龄', vaccine: '新城疫Lasota + 传染性支气管炎H52', method: '点眼/饮水', description: '二免新城疫和传支', type: '必免' },
  { age: '60日龄', vaccine: '禽流感灭活疫苗（H5+H7）', method: '肌肉注射', description: '二免禽流感，加强免疫', type: '必免' },
  { age: '90日龄', vaccine: '新城疫I系苗', method: '肌肉注射', description: '加强免疫新城疫', type: '必免' },
  { age: '120日龄', vaccine: '新城疫-传支-减蛋综合征三联灭活苗', method: '肌肉注射', description: '开产前免疫，保护产蛋期', type: '必免' },
]

const emergencyProtocol: EmergencyStep[] = [
  { step: 1, title: '立即隔离', description: '将疑似病鸡立即转移至隔离舍，与健康鸡群完全分开。关闭发病鸡舍通道，禁止无关人员进入。', icon: 'Shield', timeLimit: '30分钟内' },
  { step: 2, title: '现场封锁', description: '对发病鸡舍及周边区域实施封锁管理。设立警示标识，所有进出人员和物品必须严格消毒。', icon: 'AlertTriangle', timeLimit: '1小时内' },
  { step: 3, title: '采样送检', description: '采集病鸡的血液、粪便、组织等样本，送往兽医实验室进行病原学检测和药敏试验。', icon: 'Microscope', timeLimit: '2小时内' },
  { step: 4, title: '紧急消毒', description: '使用含氯消毒剂或过氧乙酸对鸡舍、用具、环境进行全面消毒。每日消毒2次，连续7天。', icon: 'Syringe', timeLimit: '4小时内' },
  { step: 5, title: '跟踪报告', description: '建立疫情档案，每日记录发病数、死亡数、治疗情况。重大疫情按规定向当地兽医主管部门报告。', icon: 'FileWarning', timeLimit: '持续跟踪' },
]

const healthScore: HealthScoreData = {
  immunity: 94,
  hygiene: 88,
  biosecurity: 82,
  nutrition: 91,
  monitoring: 85,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSeverityBadge(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high':
      return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">高风险</Badge>
    case 'medium':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20">中风险</Badge>
    case 'low':
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">低风险</Badge>
  }
}

function getCategoryIcon(type: string, className: string) {
  switch (type) {
    case 'viral': return <Bug className={className} />
    case 'bacterial': return <Microscope className={className} />
    case 'parasitic': return <Sprout className={className} />
    case 'metabolic': return <Pill className={className} />
    default: return <Bug className={className} />
  }
}

function getCategoryBg(type: string) {
  switch (type) {
    case 'viral': return 'from-red-500/10 via-red-500/5 to-transparent'
    case 'bacterial': return 'from-amber-500/10 via-amber-500/5 to-transparent'
    case 'parasitic': return 'from-emerald-500/10 via-emerald-500/5 to-transparent'
    case 'metabolic': return 'from-purple-500/10 via-purple-500/5 to-transparent'
    default: return 'from-gray-500/10 via-gray-500/5 to-transparent'
  }
}

function getCategoryBorder(type: string) {
  switch (type) {
    case 'viral': return 'border-red-500/20 hover:border-red-500/40'
    case 'bacterial': return 'border-amber-500/20 hover:border-amber-500/40'
    case 'parasitic': return 'border-emerald-500/20 hover:border-emerald-500/40'
    case 'metabolic': return 'border-purple-500/20 hover:border-purple-500/40'
    default: return 'border-gray-500/20'
  }
}

function getCategoryAccent(type: string) {
  switch (type) {
    case 'viral': return 'text-red-500'
    case 'bacterial': return 'text-amber-500'
    case 'parasitic': return 'text-emerald-500'
    case 'metabolic': return 'text-purple-500'
    default: return 'text-gray-500'
  }
}

function getRiskColor(level: string) {
  switch (level) {
    case 'high': return 'bg-red-500/90'
    case 'medium': return 'bg-amber-500/90'
    case 'low': return 'bg-emerald-500/90'
    default: return 'bg-gray-500/90'
  }
}

function getRiskBg(level: string) {
  switch (level) {
    case 'high': return 'bg-red-50 dark:bg-red-950/30'
    case 'medium': return 'bg-amber-50 dark:bg-amber-950/30'
    case 'low': return 'bg-emerald-50 dark:bg-emerald-950/30'
    default: return 'bg-gray-50 dark:bg-gray-950/30'
  }
}

function getRiskText(level: string) {
  switch (level) {
    case 'high': return 'text-red-600 dark:text-red-400'
    case 'medium': return 'text-amber-600 dark:text-amber-400'
    case 'low': return 'text-emerald-600 dark:text-emerald-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

function getStepIcon(iconName: string) {
  switch (iconName) {
    case 'Shield': return <Shield className="h-5 w-5" />
    case 'AlertTriangle': return <AlertTriangle className="h-5 w-5" />
    case 'Microscope': return <Microscope className="h-5 w-5" />
    case 'Syringe': return <Syringe className="h-5 w-5" />
    case 'FileWarning': return <FileWarning className="h-5 w-5" />
    default: return <Shield className="h-5 w-5" />
  }
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// ─── Radar Data ─────────────────────────────────────────────────────────────

const radarData = [
  { dimension: '免疫覆盖率', value: healthScore.immunity, fullMark: 100 },
  { dimension: '环境卫生', value: healthScore.hygiene, fullMark: 100 },
  { dimension: '生物安全', value: healthScore.biosecurity, fullMark: 100 },
  { dimension: '营养管理', value: healthScore.nutrition, fullMark: 100 },
  { dimension: '疫病监测', value: healthScore.monitoring, fullMark: 100 },
]

// ─── Seasonal Bar Chart Data ────────────────────────────────────────────────

const seasonalBarData = seasonalRisk.map((m) => ({
  month: m.month,
  high: m.risks.filter((r) => r.level === 'high').length,
  medium: m.risks.filter((r) => r.level === 'medium').length,
  low: m.risks.filter((r) => r.level === 'low').length,
}))

// ─── Component ──────────────────────────────────────────────────────────────

export function DiseaseAtlas() {
  const [selectedCategory, setSelectedCategory] = useState<DiseaseCategory | null>(null)
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null)

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">疫病防控图谱</h1>
              <p className="text-sm text-emerald-100 mt-0.5">Disease Prevention Atlas · 全方位疫病防控知识中心</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-emerald-200" />
                <span className="text-xs text-emerald-100">追踪疫病</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalDiseases}</div>
              <span className="text-[10px] text-emerald-200">种疫病类型</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-200" />
                <span className="text-xs text-emerald-100">活跃预警</span>
              </div>
              <div className="text-2xl font-bold">{stats.activeAlerts}</div>
              <span className="text-[10px] text-emerald-200">项需要关注</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Syringe className="h-4 w-4 text-cyan-200" />
                <span className="text-xs text-emerald-100">疫苗接种率</span>
              </div>
              <div className="text-2xl font-bold">{stats.vaccinationRate}%</div>
              <span className="text-[10px] text-emerald-200">整体覆盖率</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-rose-200" />
                <span className="text-xs text-emerald-100">本月新增</span>
              </div>
              <div className="text-2xl font-bold">{stats.monthlyCases}</div>
              <span className="text-[10px] text-emerald-200">例疑似病例</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Main Tabs ─────────────────────────────────────────── */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted/50">
          <TabsTrigger value="categories" className="text-xs py-2 px-1 sm:text-sm sm:px-3 gap-1">
            <Dna className="h-3.5 w-3.5 hidden sm:block" />
            疾病分类
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="text-xs py-2 px-1 sm:text-sm sm:px-3 gap-1">
            <CalendarDays className="h-3.5 w-3.5 hidden sm:block" />
            季节风险
          </TabsTrigger>
          <TabsTrigger value="vaccination" className="text-xs py-2 px-1 sm:text-sm sm:px-3 gap-1">
            <Syringe className="h-3.5 w-3.5 hidden sm:block" />
            免疫计划
          </TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs py-2 px-1 sm:text-sm sm:px-3 gap-1">
            <AlertOctagon className="h-3.5 w-3.5 hidden sm:block" />
            应急预案
          </TabsTrigger>
          <TabsTrigger value="healthscore" className="text-xs py-2 px-1 sm:text-sm sm:px-3 gap-1">
            <Activity className="h-3.5 w-3.5 hidden sm:block" />
            健康评分
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Disease Categories ─────────────────────── */}
        <TabsContent value="categories">
          <AnimatePresence mode="wait">
            {selectedDisease ? (
              <DiseaseDetail
                key="detail"
                disease={selectedDisease}
                category={selectedCategory!}
                onBack={() => setSelectedDisease(null)}
              />
            ) : selectedCategory ? (
              <CategoryDiseases
                key="category"
                category={selectedCategory}
                onSelectDisease={setSelectedDisease}
                onBack={() => setSelectedCategory(null)}
              />
            ) : (
              <motion.div
                key="grid"
                variants={stagger}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {categories.map((cat) => (
                  <motion.div key={cat.type} variants={fadeUp}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className="w-full text-left group"
                    >
                      <Card className={`overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${getCategoryBorder(cat.type)}`}>
                        <CardContent className="p-5">
                          <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryBg(cat.type)} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                          <div className="relative z-10">
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${getCategoryBg(cat.type)}`}>
                              <span className={getCategoryAccent(cat.type)}>
                                {getCategoryIcon(cat.type, 'h-5 w-5')}
                              </span>
                            </div>
                            <h3 className="mt-3 font-semibold text-sm">{cat.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                            <div className="flex items-center justify-between mt-4">
                              <Badge variant="secondary" className="text-[10px]">
                                {cat.diseases.length} 种疾病
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="flex gap-1 mt-3">
                              {cat.diseases.map((d) => (
                                <span
                                  key={d.name}
                                  className={`inline-block h-1.5 rounded-full ${getRiskColor(d.severity)}`}
                                  style={{ width: `${d.severity === 'high' ? 40 : d.severity === 'medium' ? 28 : 20}px` }}
                                  title={`${d.name} - ${d.severity === 'high' ? '高' : d.severity === 'medium' ? '中' : '低'}风险`}
                                />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ── Tab 2: Seasonal Risk Map ──────────────────────── */}
        <TabsContent value="seasonal">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">季节性风险热力图</CardTitle>
                </div>
                <CardDescription>各月份疫病风险分布，颜色越深风险越高</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>风险等级：</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-500/90" />高风险</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-500/90" />中风险</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-500/90" />低风险</span>
                </div>

                {/* Risk Grid */}
                <ScrollArea className="w-full">
                  <div className="min-w-[640px]">
                    {/* Header row */}
                    <div className="grid grid-cols-[60px_repeat(12,1fr)] gap-1 mb-1">
                      <div className="text-[10px] text-muted-foreground p-1" />
                      {seasonalRisk.map((m) => (
                        <div key={m.month} className="text-[10px] text-center font-medium text-muted-foreground p-1">
                          {m.month}
                        </div>
                      ))}
                    </div>
                    {/* Disease rows */}
                    {['新城疫', '禽流感', '传染性支气管炎', '传染性法氏囊病', '球虫病', '禽霍乱', '大肠杆菌病'].map((diseaseName) => (
                      <div key={diseaseName} className="grid grid-cols-[60px_repeat(12,1fr)] gap-1 mb-0.5">
                        <div className="text-[10px] text-muted-foreground p-1 flex items-center truncate" title={diseaseName}>
                          {diseaseName}
                        </div>
                        {seasonalRisk.map((m) => {
                          const risk = m.risks.find((r) => r.disease === diseaseName)
                          return (
                            <div
                              key={`${m.month}-${diseaseName}`}
                              className={`aspect-square rounded-sm flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-default ${
                                risk ? getRiskColor(risk.level) : 'bg-muted/30'
                              }`}
                              title={risk ? `${diseaseName} - ${risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}` : `${diseaseName} - 无风险`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">月度风险分布统计</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonalBarData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--popover))',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} 种`,
                          name === 'high' ? '高风险' : name === 'medium' ? '中风险' : '低风险',
                        ]}
                      />
                      <Bar dataKey="high" name="high" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="a" />
                      <Bar dataKey="medium" name="medium" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="low" name="low" fill="#22c55e" radius={[3, 3, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Tab 3: Vaccination Schedule ───────────────────── */}
        <TabsContent value="vaccination">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">免疫接种计划</CardTitle>
                </div>
                <CardDescription>标准免疫程序，按照日龄执行疫苗接种</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Timeline + Table */}
                <div className="space-y-0">
                  {vaccinationSchedule.map((entry, idx) => (
                    <motion.div
                      key={entry.age}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex gap-4"
                    >
                      {/* Timeline column */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {idx + 1}
                        </div>
                        {idx < vaccinationSchedule.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-6 ${idx === vaccinationSchedule.length - 1 ? 'pb-0' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                          <Badge variant="outline" className="w-fit text-xs font-semibold bg-primary/5 border-primary/20">
                            {entry.age}
                          </Badge>
                          <span className="text-sm font-medium">{entry.vaccine}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            {entry.method}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{entry.description}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vaccination Table */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">免疫计划一览表</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">日龄</TableHead>
                        <TableHead>疫苗名称</TableHead>
                        <TableHead className="hidden sm:table-cell">接种方式</TableHead>
                        <TableHead className="hidden md:table-cell">说明</TableHead>
                        <TableHead className="w-[60px] text-center">类型</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaccinationSchedule.map((entry) => (
                        <TableRow key={entry.age}>
                          <TableCell className="font-medium">{entry.age}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="text-xs">{entry.vaccine}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary" className="text-[10px]">{entry.method}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{entry.description}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{entry.type}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Tab 4: Emergency Protocol ─────────────────────── */}
        <TabsContent value="emergency">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Alert Banner */}
            <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">疫病应急响应协议</h3>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                    发现疑似传染病时，请立即按照以下5步应急流程操作。快速响应是控制疫情蔓延的关键。
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Steps */}
            <div className="space-y-3">
              {emergencyProtocol.map((step, idx) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
                    step.step === 1
                      ? 'border-red-200 dark:border-red-900/30'
                      : 'border-border'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Step Number & Icon */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            step.step === 1
                              ? 'bg-red-500/15 text-red-500'
                              : step.step <= 3
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {getStepIcon(step.icon)}
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground">步骤 {step.step}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold">{step.title}</h4>
                            {step.step === 1 && (
                              <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 text-[10px]">
                                紧急
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-medium text-muted-foreground">{step.timeLimit}</span>
                          </div>
                        </div>

                        {/* Completion indicator */}
                        <div className="flex items-center">
                          {step.step <= 2 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            </div>
                          ) : step.step <= 4 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10">
                              <Zap className="h-3 w-3 text-amber-500" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Contact Card */}
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold">紧急联系</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      重大动物疫情请拨打 <span className="font-semibold text-foreground">12345</span> 政务服务热线，或联系当地农业农村局兽医部门。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Tab 5: Health Score ───────────────────────────── */}
        <TabsContent value="healthscore">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Radar Chart */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">健康评分雷达图</CardTitle>
                  </div>
                  <CardDescription>五大维度综合评估养殖场健康管理水平</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Radar
                          name="健康评分"
                          dataKey="value"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Score Details */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">维度详情</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: '免疫覆盖率', value: healthScore.immunity, icon: Syringe, color: 'text-emerald-500', desc: '核心疫苗完整接种率' },
                    { label: '环境卫生', value: healthScore.hygiene, icon: Sprout, color: 'text-teal-500', desc: '鸡舍清洁消毒达标率' },
                    { label: '生物安全', value: healthScore.biosecurity, icon: Shield, color: 'text-amber-500', desc: '防疫隔离措施执行度' },
                    { label: '营养管理', value: healthScore.nutrition, icon: Leaf, color: 'text-lime-500', desc: '饲料配方科学性评估' },
                    { label: '疫病监测', value: healthScore.monitoring, icon: Eye, color: 'text-cyan-500', desc: '日常巡检与监测频率' },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.value}</span>
                          <span className="text-[10px] text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <Progress
                        value={item.value}
                        className={`h-2 ${item.value >= 90 ? '[&>div]:bg-emerald-500' : item.value >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                      />
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold">综合健康评分</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round((healthScore.immunity + healthScore.hygiene + healthScore.biosecurity + healthScore.nutrition + healthScore.monitoring) / 5)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">改进建议</CardTitle>
                </div>
                <CardDescription>基于健康评分的智能化改进建议</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      title: '提升生物安全',
                      desc: '加强车辆人员进出消毒流程，完善防鸟防鼠设施',
                      icon: ShieldAlert,
                      priority: 'high',
                      score: healthScore.biosecurity,
                    },
                    {
                      title: '加强疫病监测',
                      desc: '增加巡检频次至每日2次，完善异常报告机制',
                      icon: Stethoscope,
                      priority: 'medium',
                      score: healthScore.monitoring,
                    },
                    {
                      title: '保持环境卫生',
                      desc: '持续优化消毒方案，定期评估垫料质量',
                      icon: FlaskConical,
                      priority: 'low',
                      score: healthScore.hygiene,
                    },
                  ].map((rec) => (
                    <motion.div
                      key={rec.title}
                      whileHover={{ y: -2 }}
                      className="rounded-xl border p-4 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <rec.icon className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-xs font-semibold">{rec.title}</h4>
                        {getSeverityBadge(rec.priority as 'high' | 'medium' | 'low')}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.desc}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">当前评分：{rec.score}/100</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function CategoryDiseases({
  category,
  onSelectDisease,
  onBack,
}: {
  category: DiseaseCategory
  onSelectDisease: (d: Disease) => void
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 -ml-2 text-xs gap-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回分类
      </Button>

      <Card className="mb-4 border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getCategoryBg(category.type)}`}>
              <span className={getCategoryAccent(category.type)}>
                {getCategoryIcon(category.type, 'h-5 w-5')}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold">{category.name}</h2>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {category.diseases.map((disease, idx) => (
          <motion.div
            key={disease.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <button
              onClick={() => onSelectDisease(disease)}
              className="w-full text-left group"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border hover:border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{disease.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {disease.season}
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {disease.ageRange}
                        </span>
                      </div>
                    </div>
                    {getSeverityBadge(disease.severity)}
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        主要症状
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {disease.symptoms.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px] font-normal">{s}</Badge>
                        ))}
                        {disease.symptoms.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{disease.symptoms.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function DiseaseDetail({
  disease,
  category,
  onBack,
}: {
  disease: Disease
  category: DiseaseCategory
  onBack: () => void
}) {
  const [activeSection, setActiveSection] = useState<'symptoms' | 'prevention' | 'treatment'>('symptoms')

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 -ml-2 text-xs gap-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回{category.name}
      </Button>

      {/* Header */}
      <Card className="mb-4 border-primary/10 overflow-hidden">
        <div className={`h-1 ${getRiskColor(disease.severity)}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getCategoryBg(category.type)}`}>
                <span className={getCategoryAccent(category.type)}>
                  {getCategoryIcon(category.type, 'h-6 w-6')}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{disease.name}</h2>
                  {getSeverityBadge(disease.severity)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{category.name}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">多发季节</p>
                <p className="text-xs font-medium">{disease.season}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">易感日龄</p>
                <p className="text-xs font-medium">{disease.ageRange}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'symptoms' as const, label: '症状', icon: Stethoscope },
          { key: 'prevention' as const, label: '预防措施', icon: Shield },
          { key: 'treatment' as const, label: '治疗方案', icon: Pill },
        ].map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === sec.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <sec.icon className="h-3.5 w-3.5" />
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          <Card>
            <CardContent className="p-5">
              {activeSection === 'symptoms' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    临床症状
                  </h3>
                  <div className="space-y-2 mt-3">
                    {disease.symptoms.map((symptom, idx) => (
                      <motion.div
                        key={symptom}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 mt-0.5">
                          <XCircle className="h-3 w-3 text-red-500" />
                        </div>
                        <span className="text-sm text-foreground/90">{symptom}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'prevention' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    预防措施
                  </h3>
                  <div className="space-y-2 mt-3">
                    {disease.prevention.map((item, idx) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        </div>
                        <span className="text-sm text-foreground/90">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'treatment' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Pill className="h-4 w-4 text-amber-500" />
                    治疗方案
                  </h3>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-3 mb-3">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      ⚠️ 以下治疗方案仅供参考，具体用药请遵医嘱并参照药敏试验结果
                    </p>
                  </div>
                  <div className="space-y-2 mt-3">
                    {disease.treatment.map((item, idx) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 mt-0.5 text-[10px] font-bold text-amber-600">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-foreground/90">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// Phone icon helper (inline to avoid import issues)
function Phone({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
