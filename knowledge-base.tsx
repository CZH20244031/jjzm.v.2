'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BookOpen,
  Search,
  Clock,
  Bookmark,
  BookmarkCheck,
  Printer,
  ShieldAlert,
  ThermometerSun,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  Play,
  AlertTriangle,
  ChevronRight,
  FileText,
  GraduationCap,
  UserCheck,
} from 'lucide-react'

// ─── Data Types ──────────────────────────────────────────────

type Difficulty = '入门' | '进阶' | '专家'
type Severity = '高' | '中' | '低'

interface Article {
  id: string
  title: string
  content: string
  category: string
  difficulty: Difficulty
  readingTime: number
  lastUpdated: string
  tags: string[]
}

interface Disease {
  id: string
  name: string
  nameEn: string
  severity: Severity
  symptoms: string[]
  prevention: string[]
  vaccination: string
  lastUpdated: string
}

interface Drug {
  id: string
  name: string
  type: string
  applicableDisease: string
  dosage: string
  administration: string
  withdrawalPeriod: string
  notes: string
}

interface SeasonGuide {
  id: string
  season: string
  icon: React.ReactNode
  temperature: string
  humidity: string
  keyPoints: string[]
  warnings: string[]
}

interface Video {
  id: string
  title: string
  category: string
  duration: string
  difficulty: Difficulty
  description: string
  gradient: string
  lastUpdated: string
}

// ─── Constants ───────────────────────────────────────────────

const articles: Article[] = [
  {
    id: 'guide-1',
    title: '寒地肉鸡养殖环境标准',
    content: `寒地肉鸡养殖对环境参数要求严格，以下是核心环境标准：

**温度控制标准：**
• 第一周（0-7日龄）：32-35°C，之后每周降低2-3°C
• 育肥期（22日龄后）：维持在22-26°C
• 昼夜温差不超过3°C
• 地面温度与空气温度差不超过2°C

**湿度控制标准：**
• 第一周：65-70%
• 第二周起：55-70%
• 相对湿度长期低于40%会导致呼吸道疾病
• 相对湿度长期高于75%会导致球虫病高发

**空气质量标准：**
• 氨气（NH₃）浓度：＜20ppm（推荐＜15ppm）
• 二氧化碳（CO₂）浓度：＜3000ppm
• 硫化氢（H₂S）浓度：＜10ppm
• 粉尘浓度：＜4mg/m³

**光照标准：**
• 0-3日龄：24小时光照，光照强度30-40Lux
• 4-7日龄：23小时光照
• 8日龄后：20-22小时光照，光照强度15-20Lux
• 光照应均匀分布，无暗角

**饲养密度标准：**
• 地面平养：≤10只/m²（夏季≤8只/m²）
• 网上平养：≤14只/m²
• 笼养：≤20只/m²`,
    category: '养殖指南',
    difficulty: '入门',
    readingTime: 8,
    lastUpdated: '2025-01-10',
    tags: ['环境标准', '温度', '湿度', '氨气'],
  },
  {
    id: 'guide-2',
    title: '雏鸡入栏前的准备工作',
    content: `雏鸡入栏前7-10天需完成以下准备工作，确保入栏顺利：

**鸡舍清洗消毒：**
1. 清除上一批鸡的所有残余物（粪便、垫料、饲料等）
2. 用高压水枪清洗地面、墙壁、天花板、笼具
3. 使用2%火碱溶液喷洒消毒，作用2小时后冲洗
4. 福尔马林熏蒸消毒（每立方米28ml福尔马林+14g高锰酸钾）
5. 密闭熏蒸24-48小时，之后通风24小时

**设备检查与调试：**
• 检查保温设备（锅炉、暖风炉、热风炉）是否正常运转
• 检查通风系统（风机、进风口、湿帘）是否正常
• 检查饮水系统（水线、乳头饮水器）是否畅通无漏水
• 检查料线、料盘是否完好清洁
• 检查照明系统灯泡是否全亮

**预温预湿：**
• 入栏前24-48小时开始预温，使舍温达到33-35°C
• 在雏鸡到达前4小时使地面和垫料温度达到28°C以上
• 提前检查温度计和湿度计准确性

**物资准备：**
• 备好开口料（小鸡料）、开口多维电解质
• 准备葡萄糖水（入栏后前3天饮用）
• 备好常用急救药品（恩诺沙星、维生素C等）
• 准备好记录表格、温度记录本

**人员准备：**
• 安排好接雏人员，明确分工
• 接雏当天穿着消毒过的工作服和鞋套
• 准备好运输车辆并提前消毒`,
    category: '养殖指南',
    difficulty: '入门',
    readingTime: 10,
    lastUpdated: '2025-01-08',
    tags: ['雏鸡', '入栏', '消毒', '准备'],
  },
  {
    id: 'guide-3',
    title: '冬季通风与保温平衡策略',
    content: `寒区冬季养殖最大挑战是通风与保温的矛盾，以下是科学的平衡策略：

**通风优先原则：**
通风不足导致的氨气超标和缺氧，比低温造成的冷应激危害更大。宁可适当降低温度，也绝不能减少通风。

**最小通风量计算：**
• 基础通风量 = 鸡只数量 × 单只鸡最低换气量（0.015-0.02m³/分钟）
• 根据鸡只日龄逐步增加通风量
• 氨气浓度是判断通风是否充足的"金标准"

**通风模式选择：**
1. **最小通风模式**：室外温度低于-15°C时使用
   - 开启1-2台最小通风风机间歇运行
   - 每次运行5分钟，停10-15分钟
   - 进风口开度不超过5cm

2. **过渡通风模式**：室外温度-15°C至0°C时
   - 根据温度传感器自动调节风机开启数量
   - 进风口角度适当增大
   - 避免冷风直吹鸡群

3. **侧窗通风模式**：室外温度0°C以上时
   - 逐步打开侧窗进风口
   - 利用自然通风辅助
   - 结合纵向风机使用

**保温措施：**
• 使用双层塑料薄膜覆盖窗户和进风口
• 鸡舍门口加装棉门帘
• 地面增加垫料厚度至10-15cm
• 适当提高饲养密度（不超过标准15%）
• 修复鸡舍所有漏风处（尤其屋顶、门缝）

**极端低温应急预案：**
• 室外温度低于-25°C时，启动备用加热设备
• 准备发电机应对停电
• 饮水系统中添加温水（水温15-20°C）
• 每小时巡查一次鸡群状态`,
    category: '养殖指南',
    difficulty: '进阶',
    readingTime: 12,
    lastUpdated: '2025-01-05',
    tags: ['冬季', '通风', '保温', '寒区'],
  },
  {
    id: 'guide-4',
    title: '肉鸡各阶段饲料配比方案',
    content: `科学合理的饲料配比是肉鸡快速健康生长的关键。以下为寒区推荐方案：

**前期（0-10日龄）—— 开口料/小鸡料：**
• 粗蛋白：21-23%
• 代谢能：3000-3100 kcal/kg
• 钙：0.9-1.0%
• 总磷：0.45%
• 赖氨酸：≥1.15%
• 蛋氨酸：≥0.50%
• 建议使用破碎料，颗粒直径1-2mm
• 日采食量约15-25g/只

**中期（11-24日龄）—— 中鸡料：**
• 粗蛋白：19-21%
• 代谢能：3050-3150 kcal/kg
• 钙：0.85-0.95%
• 总磷：0.42%
• 赖氨酸：≥1.05%
• 蛋氨酸：≥0.45%
• 建议使用小颗粒料，直径2-3mm
• 日采食量约50-90g/只

**后期（25日龄至出栏）—— 大鸡料：**
• 粗蛋白：17-19%
• 代谢能：3100-3200 kcal/kg
• 钙：0.80-0.90%
• 总磷：0.38%
• 赖氨酸：≥0.95%
• 蛋氨酸：≥0.40%
• 建议使用颗粒料，直径3-4mm
• 日采食量约100-160g/只

**寒区特别注意事项：**
• 冬季代谢能标准上浮50-100 kcal/kg，补偿御寒消耗
• 在饲料中添加1-2%植物油提高能量浓度
• 寒区冬季可适当延长前期饲料使用时间1-2天
• 严禁使用发霉变质的饲料原料
• 更换饲料阶段需过渡3天，逐步混换`,
    category: '养殖指南',
    difficulty: '进阶',
    readingTime: 9,
    lastUpdated: '2024-12-28',
    tags: ['饲料', '配比', '营养', '阶段'],
  },
  {
    id: 'guide-5',
    title: '常见疫病识别与预防',
    content: `肉鸡养殖过程中常见的疫病需要早发现、早诊断、早处理。以下是主要疫病识别要点：

**呼吸道疾病识别：**
• **新城疫**：呼吸困难、咳嗽、排绿色稀粪、嗉囊积液
• **传染性支气管炎**：张口呼吸、气管啰音、流鼻涕
• **传染性喉气管炎**：严重呼吸困难、咳出带血黏液
• **禽流感**：高热、头面部肿胀、脚趾出血

**消化道疾病识别：**
• **鸡白痢**：白色石灰样糊状粪便、肛周羽毛污染
• **球虫病**：血便、鸡冠苍白、消瘦
• **大肠杆菌病**：腹泻、腹膜炎、心包炎
• **坏死性肠炎**：排暗红色或黑色粪便

**识别要点口诀：**
一看精神：病鸡精神萎靡、扎堆、嗜睡
二看采食：采食量突然下降10%以上需警惕
三看粪便：异常粪便颜色和形态是重要信号
四看呼吸：听有无异常呼吸音（啰音、喘鸣音）
五看体表：观察鸡冠颜色、皮肤有无异常

**预防核心原则：**
• 疫苗免疫是第一道防线，严格按照免疫程序执行
• 生物安全是第二道防线，做好人员车辆消毒
• 环境管理是第三道防线，控制好温湿度和通风
• 药物预防是第四道防线，在疫病高发期预防性投药`,
    category: '养殖指南',
    difficulty: '进阶',
    readingTime: 11,
    lastUpdated: '2025-01-12',
    tags: ['疫病', '识别', '预防', '呼吸道'],
  },
  {
    id: 'guide-6',
    title: '休药期管理规定',
    content: `休药期（停药期）管理是保障禽产品安全的核心环节，必须严格执行：

**什么是休药期：**
休药期是指畜禽停止给药到允许屠宰或其产品（蛋、奶等）允许上市的间隔时间。在休药期内，动物体内的药物残留量会逐步降低到国家规定的安全标准以下。

**常用药物休药期对照：**
• 恩诺沙星：休药期 8-11天（口服）/ 14天（注射）
• 环丙沙星：休药期 10天
• 泰乐菌素：休药期 5天（饮水）/ 1天（注射）
• 阿莫西林：休药期 7天
• 氟苯尼考：休药期 28天（口服）
• 地克珠利（抗球虫）：休药期 5天
• 马杜霉素（抗球虫）：休药期 5天
• 磺胺类药物：休药期 28天

**休药期管理制度：**
1. 每次用药必须记录：药品名称、批号、用量、开始日期
2. 系统自动计算休药期结束日期并设置提醒
3. 休药期内禁止使用任何药物
4. 休药期结束前，该批次鸡只不得出栏
5. 出栏前由兽医确认已过休药期并签字

**违规处罚：**
• 产品中药物残留超标将面临货值10-20倍的罚款
• 造成食品安全事故的，依法追究刑事责任
• 养殖场将被列入重点监管名单`,
    category: '养殖指南',
    difficulty: '入门',
    readingTime: 7,
    lastUpdated: '2025-01-06',
    tags: ['休药期', '管理', '安全', '法规'],
  },
  {
    id: 'guide-7',
    title: '出栏标准与注意事项',
    content: `肉鸡出栏是养殖周期的重要节点，做好出栏管理直接影响经济效益和产品质量。

**出栏标准判定：**
• 日龄标准：白羽肉鸡38-45日龄，黄羽肉鸡55-65日龄
• 体重标准：白羽肉鸡2.5-3.0kg，黄羽肉鸡1.5-2.5kg
• 料肉比标准：白羽肉鸡1.5-1.8，黄羽肉鸡1.8-2.2
• 成活率：全群成活率≥94%
• 均匀度：体重均匀度≥85%

**出栏前准备：**
1. 提前8-12小时断料（不断水），减少肠道内容物
2. 检查休药期是否全部结束
3. 出栏前3天停止使用任何药物
4. 检查运输车辆是否消毒合格
5. 通知屠宰场确认接收时间和数量
6. 准备好出栏相关的检疫证明材料

**抓鸡操作规范：**
• 抓鸡时间选择在夜间或清晨，减少应激
• 抓鸡腿（不抓翅膀），每手不超过4只
• 装笼密度适中，每笼不超过10只
• 轻抓轻放，禁止抛掷
• 夏季注意防暑降温，冬季注意保暖

**运输注意事项：**
• 运输时间控制在6小时以内
• 夏季运输避免中午高温时段
• 冬季运输做好保暖，车厢温度不低于10°C
• 途中匀速行驶，避免急刹车
• 运到后尽快卸车，减少等待时间`,
    category: '养殖指南',
    difficulty: '入门',
    readingTime: 8,
    lastUpdated: '2024-12-20',
    tags: ['出栏', '标准', '抓鸡', '运输'],
  },
  {
    id: 'guide-8',
    title: '环境应激的识别与处理',
    content: `环境应激是导致肉鸡生产性能下降和疾病发生的重要因素，需及时识别和处理。

**常见环境应激类型：**

1. **热应激（高温）**
   - 识别：鸡只张口呼吸、翅膀张开、饮水量剧增、采食量下降
   - 处理：开启湿帘降温系统、增加通风量、饮水中添加维生素C（150-200mg/L）和电解多维、降低饲养密度

2. **冷应激（低温）**
   - 识别：鸡只扎堆、羽毛蓬松、颤抖、靠近热源、叫声异常
   - 处理：检查升温设备、增加垫料、提高饲料能量浓度、封堵漏风处

3. **氨气应激**
   - 识别：人进入鸡舍感到刺眼流泪、鸡只眼睛红肿、呼吸道症状增多
   - 处理：增加通风量、清理粪污、加强舍内除臭、降低饲养密度

4. **噪音应激**
   - 识别：鸡只突然惊群、炸群、采食中断、增重放缓
   - 处理：消除噪音源（如风机异响）、鸡舍周围保持安静、人员操作轻缓

5. **断水应激**
   - 识别：鸡只拼命抢水、采食量骤降、粪便干燥
   - 处理：立即修复供水系统、饮水中添加电解多维、之后3天逐步恢复采食

6. **转群应激**
   - 识别：转群后鸡只采食下降、体重减轻、免疫力降低
   - 处理：转群前后饮水中加多维3-5天、选择阴凉时段转群、转群前4小时断料

**应激预防措施：**
• 保持环境参数稳定，温湿度日波动不超过3°C
• 日常操作定时定量，形成稳定规律
• 在预计应激事件前2天给予抗应激药物（维C、电解多维）
• 饲料中添加抗应激添加剂（酵母多糖、黄芪多糖等）`,
    category: '养殖指南',
    difficulty: '专家',
    readingTime: 13,
    lastUpdated: '2025-01-03',
    tags: ['应激', '热应激', '冷应激', '管理'],
  },
]

const diseases: Disease[] = [
  {
    id: 'dis-1',
    name: '新城疫',
    nameEn: 'Newcastle Disease',
    severity: '高',
    symptoms: ['呼吸困难、张口呼吸', '排绿色稀便', '嗉囊积液、倒提有酸臭液体流出', '鸡冠和肉髯发绀', '神经症状：扭头、转圈、站立不稳', '肉鸡群体增重急剧下降'],
    prevention: [
      '严格执行免疫程序：7日龄Lasota弱毒苗滴鼻点眼，14日龄ND-IB二联灭活苗注射，28日龄Lasota弱毒苗饮水加强',
      '定期监测抗体水平，HI抗体效价低于4log2时需及时补免',
      '做好鸡舍消毒，新城疫病毒对常用消毒剂敏感',
      '实行"全进全出"制度，避免不同日龄鸡混养',
      '发现疑似病例立即隔离，全场紧急消毒',
    ],
    vaccination: '7日龄Lasota弱毒苗（滴鼻点眼）→ 14日龄ND-IB二联灭活苗（皮下注射）→ 28日龄Lasota弱毒苗（饮水）',
    lastUpdated: '2025-01-12',
  },
  {
    id: 'dis-2',
    name: '禽流感',
    nameEn: 'Avian Influenza',
    severity: '高',
    symptoms: ['突发高热（41-42°C）', '头面部水肿、流泪', '鸡冠和肉髯出血发绀', '脚趾鳞片出血', '呼吸困难、张口呼吸', '突然大量死亡'],
    prevention: [
      '严格执行国家强制免疫计划，使用H5+H7二价灭活苗',
      '免疫程序：7-10日龄首免，35-40日龄二免',
      '加强生物安全：封闭养殖、人员车辆严格消毒',
      '严禁引入来历不明的禽类和禽产品',
      '发现疑似病例立即上报当地畜牧部门',
    ],
    vaccination: '7-10日龄H5+H7二价灭活苗（皮下注射0.3ml）→ 35-40日龄加强免疫（皮下注射0.5ml）',
    lastUpdated: '2025-01-10',
  },
  {
    id: 'dis-3',
    name: '传染性支气管炎',
    nameEn: 'Infectious Bronchitis (IB)',
    severity: '中',
    symptoms: ['咳嗽、打喷嚏、气管啰音', '流鼻涕、流泪', '呼吸困难、张口呼吸', '肾脏型：排白色水样稀便', '肉鸡群体增重下降、均匀度降低', '雏鸡死亡率可达25%'],
    prevention: [
      '免疫程序：1日龄Ma5弱毒苗喷雾/滴鼻，14日龄H120弱毒苗饮水，20日龄IB灭活苗注射',
      '做好温湿度管理，寒冷和潮湿是诱发因素',
      '保证良好的通风，降低舍内氨气浓度',
      '不同血清型之间交叉保护有限，需选用当地流行毒株制备的疫苗',
    ],
    vaccination: '1日龄Ma5弱毒苗（喷雾/滴鼻）→ 14日龄H120弱毒苗（饮水）→ 20日龄IB多价灭活苗（注射）',
    lastUpdated: '2025-01-08',
  },
  {
    id: 'dis-4',
    name: '大肠杆菌病',
    nameEn: 'Colibacillosis',
    severity: '中',
    symptoms: ['精神萎靡、食欲减退', '腹泻、排黄白色稀便', '腹膜炎（腹部膨大、触诊有波动感）', '心包炎、肝周炎', '气囊浑浊增厚', '脐炎（雏鸡肚脐愈合不良）'],
    prevention: [
      '改善环境卫生，保持鸡舍干燥清洁',
      '做好通风换气，降低氨气浓度',
      '减少各种应激因素（转群、断喙、换料等）',
      '雏鸡入栏前做好鸡舍熏蒸消毒',
      '发病后通过药敏试验选择敏感药物，避免盲目用药',
    ],
    vaccination: '一般不使用疫苗预防，通过改善环境和药敏试验指导用药进行控制',
    lastUpdated: '2025-01-05',
  },
  {
    id: 'dis-5',
    name: '球虫病',
    nameEn: 'Coccidiosis',
    severity: '中',
    symptoms: ['血便（便中带血或呈番茄酱样）', '鸡冠苍白、消瘦', '饮水量增加', '采食量下降', '羽毛蓬松、精神萎靡', '急性暴发时死亡率可达50-80%'],
    prevention: [
      '保持垫料干燥清洁，湿度控制在60%以下',
      '饲养密度不宜过大，避免拥挤',
      '饲料中添加抗球虫药进行预防（轮换用药）',
      '常用药物：地克珠利、马杜霉素、盐霉素、莫能菌素（注意休药期）',
      '发现血便立即用药，饮水中添加维生素K3止血',
    ],
    vaccination: '非免疫鸡群可通过饲料中添加抗球虫药物预防，免疫鸡群在1-3日龄口服球虫疫苗',
    lastUpdated: '2025-01-07',
  },
  {
    id: 'dis-6',
    name: '鸡白痢',
    nameEn: 'Pullorum Disease',
    severity: '中',
    symptoms: ['排白色石灰样糊状粪便', '肛周羽毛被白色粪便污染', '雏鸡怕冷、扎堆', '呼吸困难、张口呼吸', '生长迟缓、消瘦', '脐炎、卵黄吸收不良'],
    prevention: [
      '鸡群定期进行鸡白痢净化检测，淘汰阳性个体',
      '雏鸡入栏前做好鸡舍熏蒸消毒（福尔马林高锰酸钾法）',
      '雏鸡入栏后饮水中添加恩诺沙星或氟苯尼考预防（注意休药期）',
      '保持育雏室温度和干燥，减少应激',
      '实行全进全出制度，空舍期间彻底消毒',
    ],
    vaccination: '无专用疫苗，主要通过种源净化和药物预防控制',
    lastUpdated: '2024-12-30',
  },
]

const drugs: Drug[] = [
  {
    id: 'drug-1',
    name: '恩诺沙星',
    type: '抗生素',
    applicableDisease: '大肠杆菌病、鸡白痢、沙门氏菌病',
    dosage: '饮水：10mg/kg体重/天，连用3-5天',
    administration: '饮水',
    withdrawalPeriod: '8-11天',
    notes: '喹诺酮类药物，注意休药期',
  },
  {
    id: 'drug-2',
    name: '阿莫西林',
    type: '抗生素',
    applicableDisease: '大肠杆菌病、慢性呼吸道病',
    dosage: '饮水：20mg/kg体重/天，连用3-5天',
    administration: '饮水',
    withdrawalPeriod: '7天',
    notes: 'β-内酰胺类，对革兰氏阳性菌效果好',
  },
  {
    id: 'drug-3',
    name: '氟苯尼考',
    type: '抗生素',
    applicableDisease: '大肠杆菌病、鸡白痢、巴氏杆菌病',
    dosage: '饮水：20-30mg/kg体重/天，连用3-5天',
    administration: '饮水/拌料',
    withdrawalPeriod: '28天（口服）',
    notes: '酰胺醇类，注意超长休药期',
  },
  {
    id: 'drug-4',
    name: '泰乐菌素',
    type: '抗生素',
    applicableDisease: '慢性呼吸道病（CRD）、传染性鼻炎',
    dosage: '饮水：50-100mg/L，连用3-5天',
    administration: '饮水',
    withdrawalPeriod: '5天（饮水）',
    notes: '大环内酯类，对支原体有效',
  },
  {
    id: 'drug-5',
    name: '地克珠利',
    type: '抗球虫药',
    applicableDisease: '球虫病预防与治疗',
    dosage: '饮水：1mg/L，连用3-5天；混饲：1ppm',
    administration: '饮水/拌料',
    withdrawalPeriod: '5天',
    notes: '预防效果优于治疗，建议在球虫高发前使用',
  },
  {
    id: 'drug-6',
    name: '马杜霉素',
    type: '抗球虫药',
    applicableDisease: '球虫病预防',
    dosage: '混饲：5ppm（每吨饲料添加5g纯品）',
    administration: '拌料',
    withdrawalPeriod: '5天',
    notes: '聚醚类离子载体，严格控制用量，超量可致中毒',
  },
  {
    id: 'drug-7',
    name: '磺胺氯丙嗪钠',
    type: '抗生素',
    applicableDisease: '大肠杆菌病、禽霍乱、球虫病',
    dosage: '饮水：0.1-0.2g/L，连用3-5天',
    administration: '饮水',
    withdrawalPeriod: '28天',
    notes: '磺胺类药物，超长休药期，不宜在出栏前使用',
  },
  {
    id: 'drug-8',
    name: '黄芪多糖',
    type: '免疫增强剂',
    applicableDisease: '免疫调节、抗应激辅助',
    dosage: '饮水：200-400mg/L，连用5-7天',
    administration: '饮水',
    withdrawalPeriod: '无需休药',
    notes: '中药提取物，可提高免疫力，无残留风险',
  },
]

const seasonGuides: SeasonGuide[] = [
  {
    id: 'season-spring',
    season: '春季',
    icon: <CloudSun className="h-5 w-5 text-emerald-500" />,
    temperature: '20-25°C（目标）',
    humidity: '55-65%',
    keyPoints: [
      '气温回升但昼夜温差大，需注意夜间保温',
      '春季为疫病高发季节，加强消毒和免疫',
      '注意通风换气，防止舍内氨气超标',
      '逐步减少保温设备使用，避免温度骤变',
      '做好春防免疫工作：禽流感、新城疫补免',
      '注意预防呼吸道疾病（IB、CRD高发）',
    ],
    warnings: [
      '倒春寒可能导致大幅降温，做好应急准备',
      '春季大风天气注意鸡舍门窗加固',
      '湿度回升注意预防霉菌和球虫病',
    ],
  },
  {
    id: 'season-summer',
    season: '夏季',
    icon: <Sun className="h-5 w-5 text-amber-500" />,
    temperature: '22-26°C（目标）',
    humidity: '50-65%',
    keyPoints: [
      '夏季以降温为核心任务，充分利用湿帘和风机',
      '饮水中添加维生素C和电解多维抗热应激',
      '降低饲养密度10-15%',
      '增加饮水位，保证充足清洁饮水',
      '饲料中添加碳酸氢钠（小苏打）0.2-0.3%缓解热应激',
      '清早和傍晚喂料，避开高温时段',
    ],
    warnings: [
      '极端高温天气（>35°C）启动紧急降温预案',
      '湿帘水温和水质要达标，定期清洗',
      '注意饲料防霉，高温高湿易导致霉菌毒素超标',
    ],
  },
  {
    id: 'season-autumn',
    season: '秋季',
    icon: <CloudRain className="h-5 w-5 text-orange-500" />,
    temperature: '18-24°C（目标）',
    humidity: '55-65%',
    keyPoints: [
      '秋季气候适宜，是肉鸡养殖的黄金季节',
      '做好入冬前鸡舍修缮：检查保温设施、封堵漏风处',
      '逐步调整通风模式，为冬季通风做准备',
      '秋季昼夜温差增大，注意夜间保温',
      '做好饲料储存，防止秋季雨水淋湿',
      '秋防免疫：禽流感、新城疫加强免疫',
    ],
    warnings: [
      '秋季连阴雨天气注意防潮防霉',
      '台风和大风天气注意鸡舍安全',
      '秋季候鸟迁徙，加强禽流感防控',
    ],
  },
  {
    id: 'season-winter',
    icon: <Snowflake className="h-5 w-5 text-cyan-500" />,
    season: '冬季',
    temperature: '22-26°C（舍内目标）',
    humidity: '55-70%',
    keyPoints: [
      '冬季核心矛盾：保温与通风的平衡',
      '通风优先原则：宁可低2-3°C，不可通风不足',
      '使用最小通风模式，间歇运行风机',
      '增加垫料厚度至10-15cm，提高保温效果',
      '冬季代谢能上浮50-100 kcal/kg，增加能量浓度',
      '饮水温度保持在15-20°C，防止饮水冰凉',
      '准备好备用加热设备和发电机',
    ],
    warnings: [
      '极端低温（<-25°C）启动应急预案',
      '停电风险增大，做好发电准备',
      '冬季用火取暖注意消防安全和一氧化碳中毒',
      '室外结冰注意防滑，保障人员安全',
    ],
  },
]

const videos: Video[] = [
  {
    id: 'video-1',
    title: '雏鸡入栏第一天操作全流程',
    category: '入门操作',
    duration: '18:30',
    difficulty: '入门',
    description: '从接雏、运输、入栏到饮水开食，完整演示雏鸡入栏第一天的所有操作要点和注意事项。',
    gradient: 'from-emerald-400 to-green-600',
    lastUpdated: '2025-01-11',
  },
  {
    id: 'video-2',
    title: '鸡舍温度与湿度调控实操',
    category: '入门操作',
    duration: '22:15',
    difficulty: '入门',
    description: '详细讲解温度计湿度计的正确放置位置，以及如何根据温度变化调整保温设备和通风系统。',
    gradient: 'from-teal-400 to-cyan-600',
    lastUpdated: '2025-01-09',
  },
  {
    id: 'video-3',
    title: '疫苗免疫操作规范',
    category: '入门操作',
    duration: '25:40',
    difficulty: '入门',
    description: '点眼、滴鼻、饮水、注射四种免疫方法的操作要点和常见错误，确保免疫效果。',
    gradient: 'from-lime-400 to-emerald-600',
    lastUpdated: '2025-01-06',
  },
  {
    id: 'video-4',
    title: '冬季通风与保温平衡实战',
    category: '进阶技术',
    duration: '32:10',
    difficulty: '进阶',
    description: '寒区冬季养殖核心难题的解决方案，通过实际案例讲解不同温度条件下的通风策略和设备调节方法。',
    gradient: 'from-green-400 to-teal-600',
    lastUpdated: '2025-01-04',
  },
  {
    id: 'video-5',
    title: '饲料品质鉴别与配方调整',
    category: '进阶技术',
    duration: '28:55',
    difficulty: '进阶',
    description: '教你如何通过感官判断饲料品质，以及根据不同生长阶段和季节调整饲料配方。',
    gradient: 'from-amber-400 to-orange-600',
    lastUpdated: '2024-12-29',
  },
  {
    id: 'video-6',
    title: '鸡病临床诊断技术',
    category: '进阶技术',
    duration: '35:20',
    difficulty: '进阶',
    description: '通过解剖和临床观察，学会识别常见鸡病的特征性病变和症状，提高早期诊断能力。',
    gradient: 'from-orange-400 to-red-500',
    lastUpdated: '2024-12-25',
  },
  {
    id: 'video-7',
    title: '寒区肉鸡养殖经济效益分析',
    category: '专家讲座',
    duration: '45:00',
    difficulty: '专家',
    description: '资深养殖专家深入分析寒区肉鸡养殖的成本构成、利润空间和风险因素，帮助养殖户做出科学决策。',
    gradient: 'from-rose-400 to-pink-600',
    lastUpdated: '2024-12-20',
  },
  {
    id: 'video-8',
    title: '现代化鸡舍环境控制系统详解',
    category: '专家讲座',
    duration: '50:30',
    difficulty: '专家',
    description: '自动化环境控制系统的原理、安装、调试和日常维护，以及常见故障排除方法。',
    gradient: 'from-violet-400 to-purple-600',
    lastUpdated: '2024-12-15',
  },
  {
    id: 'video-9',
    title: '肉鸡出栏管理与运输规范',
    category: '进阶技术',
    duration: '20:45',
    difficulty: '进阶',
    description: '出栏前准备、抓鸡技巧、装笼规范和运输管理的全流程实操，减少出栏应激和损耗。',
    gradient: 'from-sky-400 to-blue-600',
    lastUpdated: '2024-12-18',
  },
]

// ─── Helper Components ───────────────────────────────────────

function DifficultyBadge({ level }: { level: Difficulty }) {
  const styles: Record<Difficulty, string> = {
    '入门': 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
    '进阶': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    '专家': 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  }
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[level]}`}>
      {level}
    </Badge>
  )
}

function SeverityBadge({ level }: { level: Severity }) {
  const styles: Record<Severity, string> = {
    '高': 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    '中': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    '低': 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  }
  return (
    <Badge className={`text-[10px] ${styles[level]}`}>
      {level}
    </Badge>
  )
}

function ReadingTime({ minutes }: { minutes: number }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock className="h-3 w-3" />
      {minutes} 分钟阅读
    </span>
  )
}

function LastUpdated({ date }: { date: string }) {
  return (
    <span className="text-[11px] text-muted-foreground">
      更新于 {date}
    </span>
  )
}

function BookmarkButton({
  articleId,
  bookmarked,
  onToggle,
}: {
  articleId: string
  bookmarked: boolean
  onToggle: (id: string) => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => onToggle(articleId)}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4 text-muted-foreground hover:text-primary" />
      )}
    </Button>
  )
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── Tab Content Components ──────────────────────────────────

function BreedingGuideTab({
  searchQuery,
  bookmarks,
  onToggleBookmark,
}: {
  searchQuery: string
  bookmarks: Set<string>
  onToggleBookmark: (id: string) => void
}) {
  const filtered = articles.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q))
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {filtered.length} 篇文章
          {bookmarks.size > 0 && ` · 已收藏 ${bookmarks.size} 篇`}
        </p>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {filtered.map((article) => (
          <AccordionItem
            key={article.id}
            value={article.id}
            className="bg-card rounded-lg border px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      <HighlightText text={article.title} query={searchQuery} />
                    </span>
                    <DifficultyBadge level={article.difficulty} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <ReadingTime minutes={article.readingTime} />
                    <LastUpdated date={article.lastUpdated} />
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      <HighlightText text={tag} query={searchQuery} />
                    </Badge>
                  ))}
                </div>
                <BookmarkButton
                  articleId={article.id}
                  bookmarked={bookmarks.has(article.id)}
                  onToggle={onToggleBookmark}
                />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {article.content.split('\n').map((line, i) => (
                  <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                    <HighlightText text={line} query={searchQuery} />
                  </p>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">未找到匹配的文章</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DiseasePreventionTab({ searchQuery }: { searchQuery: string }) {
  const filtered = diseases.filter((d) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      d.name.includes(q) ||
      d.nameEn.toLowerCase().includes(q) ||
      d.symptoms.some((s) => s.includes(q)) ||
      d.prevention.some((p) => p.includes(q))
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted-foreground">
          共 {filtered.length} 种疫病
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((disease) => (
          <Card key={disease.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    <HighlightText text={disease.name} query={searchQuery} />
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    <HighlightText text={disease.nameEn} query={searchQuery} />
                  </CardDescription>
                </div>
                <SeverityBadge level={disease.severity} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">主要症状</p>
                <ul className="space-y-1">
                  {disease.symptoms.map((symptom, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        <HighlightText text={symptom} query={searchQuery} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">防控措施</p>
                <ul className="space-y-1">
                  {disease.prevention.map((step, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">
                        <HighlightText text={step} query={searchQuery} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">免疫程序</p>
                <p className="text-[11px] text-foreground leading-relaxed">
                  <HighlightText text={disease.vaccination} query={searchQuery} />
                </p>
              </div>
              <LastUpdated date={disease.lastUpdated} />
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">未找到匹配的疫病信息</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MedicationStandardsTab({ searchQuery }: { searchQuery: string }) {
  const filtered = drugs.filter((d) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      d.name.includes(q) ||
      d.type.includes(q) ||
      d.applicableDisease.includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">抗生素使用警示</p>
            <p className="text-xs text-orange-600 mt-1 leading-relaxed">
              抗生素的不规范使用是导致细菌耐药性增加的主要原因。请严格遵照兽医师处方用药，
              严禁超剂量、超疗程使用抗生素，严格执行休药期规定。鼓励在专业指导下使用中药和微生态制剂替代抗生素。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">常用药物规范</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              共 {filtered.length} 种药物
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">药品名称</TableHead>
                  <TableHead className="text-xs">类型</TableHead>
                  <TableHead className="text-xs">适用疾病</TableHead>
                  <TableHead className="text-xs">用法用量</TableHead>
                  <TableHead className="text-xs">给药方式</TableHead>
                  <TableHead className="text-xs">休药期</TableHead>
                  <TableHead className="text-xs">备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((drug) => (
                  <TableRow key={drug.id}>
                    <TableCell className="text-xs font-medium">
                      <HighlightText text={drug.name} query={searchQuery} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          drug.type === '抗生素'
                            ? 'text-red-600 border-red-200'
                            : drug.type === '抗球虫药'
                              ? 'text-amber-600 border-amber-200'
                              : 'text-green-600 border-green-200'
                        }`}
                      >
                        {drug.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px]">
                      <HighlightText text={drug.applicableDisease} query={searchQuery} />
                    </TableCell>
                    <TableCell className="text-xs">
                      <HighlightText text={drug.dosage} query={searchQuery} />
                    </TableCell>
                    <TableCell className="text-xs">{drug.administration}</TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          drug.withdrawalPeriod === '无需休药'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : parseInt(drug.withdrawalPeriod) >= 14
                              ? 'bg-red-100 text-red-700 hover:bg-red-100'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        }`}
                      >
                        {drug.withdrawalPeriod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <HighlightText text={drug.notes} query={searchQuery} />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      未找到匹配的药物信息
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EnvironmentManagementTab({ searchQuery }: { searchQuery: string }) {
  const filtered = seasonGuides.filter((g) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      g.season.includes(q) ||
      g.keyPoints.some((k) => k.includes(q)) ||
      g.warnings.some((w) => w.includes(q)) ||
      g.temperature.includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Environment Parameter Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ThermometerSun className="h-4 w-4 text-primary" />
            各阶段环境参数标准
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">生长阶段</TableHead>
                  <TableHead className="text-xs">日龄</TableHead>
                  <TableHead className="text-xs">温度 (°C)</TableHead>
                  <TableHead className="text-xs">湿度 (%)</TableHead>
                  <TableHead className="text-xs">光照 (小时/天)</TableHead>
                  <TableHead className="text-xs">光照强度 (Lux)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs font-medium">育雏前期</TableCell>
                  <TableCell className="text-xs">0-3天</TableCell>
                  <TableCell className="text-xs">33-35</TableCell>
                  <TableCell className="text-xs">65-70</TableCell>
                  <TableCell className="text-xs">24</TableCell>
                  <TableCell className="text-xs">30-40</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-medium">育雏中期</TableCell>
                  <TableCell className="text-xs">4-7天</TableCell>
                  <TableCell className="text-xs">30-33</TableCell>
                  <TableCell className="text-xs">60-70</TableCell>
                  <TableCell className="text-xs">23</TableCell>
                  <TableCell className="text-xs">25-30</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-medium">育雏后期</TableCell>
                  <TableCell className="text-xs">8-14天</TableCell>
                  <TableCell className="text-xs">27-30</TableCell>
                  <TableCell className="text-xs">55-70</TableCell>
                  <TableCell className="text-xs">22</TableCell>
                  <TableCell className="text-xs">20-25</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-medium">生长期</TableCell>
                  <TableCell className="text-xs">15-21天</TableCell>
                  <TableCell className="text-xs">25-28</TableCell>
                  <TableCell className="text-xs">55-65</TableCell>
                  <TableCell className="text-xs">21</TableCell>
                  <TableCell className="text-xs">15-20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-medium">育肥前期</TableCell>
                  <TableCell className="text-xs">22-28天</TableCell>
                  <TableCell className="text-xs">22-26</TableCell>
                  <TableCell className="text-xs">55-65</TableCell>
                  <TableCell className="text-xs">20-22</TableCell>
                  <TableCell className="text-xs">15-20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-medium">育肥后期</TableCell>
                  <TableCell className="text-xs">29天至出栏</TableCell>
                  <TableCell className="text-xs">22-26</TableCell>
                  <TableCell className="text-xs">55-65</TableCell>
                  <TableCell className="text-xs">20-22</TableCell>
                  <TableCell className="text-xs">15-20</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Season-specific guidance */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">四季环境管理指南</p>
        {filtered.map((guide) => (
          <Card key={guide.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {guide.icon}
                  <CardTitle className="text-base">
                    <HighlightText text={guide.season} query={searchQuery} />
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">目标温度</p>
                  <p className="text-sm font-bold mt-0.5">{guide.temperature}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">目标湿度</p>
                  <p className="text-sm font-bold mt-0.5">{guide.humidity}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">管理要点</p>
                <ul className="space-y-1.5">
                  {guide.keyPoints.map((point, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        <HighlightText text={point} query={searchQuery} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-[10px] font-medium text-amber-800 mb-1.5">⚠️ 注意事项</p>
                <ul className="space-y-1">
                  {guide.warnings.map((w, i) => (
                    <li key={i} className="text-[11px] text-amber-700 flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span><HighlightText text={w} query={searchQuery} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Response */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            极端天气应急响应程序
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="h-4 w-4 text-cyan-500" />
                <p className="text-xs font-medium">极端低温（≤-25°C）</p>
              </div>
              <ol className="space-y-1 pl-4 list-decimal text-xs text-muted-foreground">
                <li>立即启动所有备用加热设备</li>
                <li>检查发电设备，确保随时可用</li>
                <li>封闭所有非必要进风口</li>
                <li>保持最小通风量（氨气监测为主）</li>
                <li>饮水中添加温水（15-20°C）</li>
                <li>每30分钟巡查一次鸡群状态</li>
                <li>必要时联络备用鸡舍准备转移</li>
              </ol>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium">极端高温（≥35°C）</p>
              </div>
              <ol className="space-y-1 pl-4 list-decimal text-xs text-muted-foreground">
                <li>开启全部湿帘和风机，最大通风量降温</li>
                <li>饮水中添加维生素C（200mg/L）和电解多维</li>
                <li>在鸡舍内安装喷雾降温装置</li>
                <li>减少饲养密度或分群</li>
                <li>停止喂料至气温下降（不断水）</li>
                <li>密切观察鸡只呼吸状态和死亡率</li>
              </ol>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="h-4 w-4 text-gray-500" />
                <p className="text-xs font-medium">停电应急</p>
              </div>
              <ol className="space-y-1 pl-4 list-decimal text-xs text-muted-foreground">
                <li>立即启动备用发电机</li>
                <li>优先保障通风和供水系统运行</li>
                <li>人工巡查鸡舍，观察鸡群状态</li>
                <li>冬季停电需特别关注温度下降速度</li>
                <li>联系电力部门确认恢复时间</li>
                <li>停电超过2小时考虑转移鸡群</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VideoTutorialsTab({ searchQuery }: { searchQuery: string }) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filtered = videos.filter((v) => {
    const matchSearch = !searchQuery
      ? true
      : v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.includes(searchQuery)
    const matchCategory = activeCategory === 'all' || v.category === activeCategory
    return matchSearch && matchCategory
  })

  const categories = ['all', '入门操作', '进阶技术', '专家讲座']

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          共 {filtered.length} 个教程
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? '全部' : cat}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((video) => (
          <Card key={video.id} className="hover:shadow-md transition-shadow overflow-hidden group">
            {/* Gradient Thumbnail */}
            <div
              className={`relative h-36 bg-gradient-to-br ${video.gradient} flex items-center justify-center`}
            >
              <div className="h-14 w-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                <Play className="h-7 w-7 text-white ml-1" />
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <Badge className="bg-black/40 text-white border-transparent text-[10px]">
                  {video.duration}
                </Badge>
                <DifficultyBadge level={video.difficulty} />
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-tight">
                  <HighlightText text={video.title} query={searchQuery} />
                </h3>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                <HighlightText text={video.category} query={searchQuery} />
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <HighlightText text={video.description} query={searchQuery} />
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {video.duration}
                </div>
                <LastUpdated date={video.lastUpdated} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">未找到匹配的教程</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // Count matches across all categories
  const totalMatches = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    const guideCount = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))
    ).length
    const diseaseCount = diseases.filter(
      (d) =>
        d.name.includes(q) ||
        d.nameEn.toLowerCase().includes(q) ||
        d.symptoms.some((s) => s.includes(q)) ||
        d.prevention.some((p) => p.includes(q))
    ).length
    const drugCount = drugs.filter(
      (d) =>
        d.name.includes(q) ||
        d.type.includes(q) ||
        d.applicableDisease.includes(q)
    ).length
    const envCount = seasonGuides.filter(
      (g) =>
        g.season.includes(q) ||
        g.keyPoints.some((k) => k.includes(q)) ||
        g.warnings.some((w) => w.includes(q))
    ).length
    const videoCount = videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.category.includes(q)
    ).length
    return { guideCount, diseaseCount, drugCount, envCount, videoCount, total: guideCount + diseaseCount + drugCount + envCount + videoCount }
  }, [searchQuery])

  return (
    <div className="space-y-6 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            养殖知识库
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            寒地肉鸡养殖专业知识与操作指南
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          打印页面
        </Button>
      </div>

      {/* Search */}
      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={'搜索知识库：输入关键词如"温度"、"新城疫"、"恩诺沙星"...'}
          className="pl-9 h-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
            onClick={() => setSearchQuery('')}
          >
            清除
          </Button>
        )}
      </div>

      {/* Search Results Summary */}
      {totalMatches && (
        <Card className="bg-primary/5 border-primary/10 print:hidden">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              搜索「<span className="font-medium text-foreground">{searchQuery}</span>」
              共找到 <span className="font-medium text-primary">{totalMatches.total}</span> 条结果：
              养殖指南 {totalMatches.guideCount} 条 · 疫病防控 {totalMatches.diseaseCount} 条 ·
              用药规范 {totalMatches.drugCount} 条 · 环境管理 {totalMatches.envCount} 条 · 视频教程 {totalMatches.videoCount} 条
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="w-full flex print:hidden overflow-x-auto">
          <TabsTrigger value="guide" className="flex-1 text-xs">
            <FileText className="h-3.5 w-3.5 mr-1 hidden sm:block" />
            养殖指南
          </TabsTrigger>
          <TabsTrigger value="disease" className="flex-1 text-xs">
            <ShieldAlert className="h-3.5 w-3.5 mr-1 hidden sm:block" />
            疫病防控
          </TabsTrigger>
          <TabsTrigger value="medication" className="flex-1 text-xs">
            <GraduationCap className="h-3.5 w-3.5 mr-1 hidden sm:block" />
            用药规范
          </TabsTrigger>
          <TabsTrigger value="environment" className="flex-1 text-xs">
            <ThermometerSun className="h-3.5 w-3.5 mr-1 hidden sm:block" />
            环境管理
          </TabsTrigger>
          <TabsTrigger value="video" className="flex-1 text-xs">
            <Play className="h-3.5 w-3.5 mr-1 hidden sm:block" />
            视频教程
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <BreedingGuideTab
            searchQuery={searchQuery}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        </TabsContent>
        <TabsContent value="disease">
          <DiseasePreventionTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="medication">
          <MedicationStandardsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="environment">
          <EnvironmentManagementTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="video">
          <VideoTutorialsTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      {/* Footer Notice */}
      <Card className="bg-muted/30 print:hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">知识库声明</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                本知识库内容仅供参考，实际养殖操作请结合当地实际情况并在专业兽医指导下进行。
                药物使用请严格遵照兽医师处方和国家相关法规。如有疑问，请联系当地畜牧兽医部门。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
