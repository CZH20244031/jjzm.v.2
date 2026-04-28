import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Mock Data ─────────────────────────────────────────────────

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

const experts: Expert[] = [
  {
    id: 'expert-1',
    name: '王志明',
    specialty: '禽病学',
    title: '教授 / 博士生导师',
    institution: '中国农业大学动物医学院',
    avatar: '王',
    color: 'bg-emerald-600',
    online: true,
    rating: 4.9,
    consultCount: 1256,
    responseTime: '30分钟内',
    tags: ['禽流感', '新城疫', '传染性支气管炎'],
  },
  {
    id: 'expert-2',
    name: '李秀芳',
    specialty: '营养学',
    title: '高级畜牧师',
    institution: '东北农业大学动物科学技术学院',
    avatar: '李',
    color: 'bg-teal-600',
    online: true,
    rating: 4.8,
    consultCount: 892,
    responseTime: '1小时内',
    tags: ['饲料配方', '营养配比', '添加剂'],
  },
  {
    id: 'expert-3',
    name: '张建国',
    specialty: '环境工程',
    title: '副教授',
    institution: '黑龙江八一农垦大学',
    avatar: '张',
    color: 'bg-green-600',
    online: false,
    rating: 4.7,
    consultCount: 634,
    responseTime: '2小时内',
    tags: ['环控系统', '通风设计', '温湿度管理'],
  },
  {
    id: 'expert-4',
    name: '陈丽华',
    specialty: '兽医药理学',
    title: '主任兽医师',
    institution: '黑龙江省畜牧兽医总站',
    avatar: '陈',
    color: 'bg-lime-600',
    online: true,
    rating: 4.9,
    consultCount: 1034,
    responseTime: '45分钟内',
    tags: ['用药规范', '休药期', '药敏试验'],
  },
  {
    id: 'expert-5',
    name: '刘德伟',
    specialty: '遗传育种',
    title: '研究员',
    institution: '中国农业科学院家禽研究所',
    avatar: '刘',
    color: 'bg-cyan-600',
    online: false,
    rating: 4.6,
    consultCount: 478,
    responseTime: '3小时内',
    tags: ['品种选育', '育肥技术', '肉鸡管理'],
  },
  {
    id: 'expert-6',
    name: '赵雪梅',
    specialty: '动物福利与行为学',
    title: '副教授',
    institution: '东北林业大学野生动物资源学院',
    avatar: '赵',
    color: 'bg-emerald-500',
    online: true,
    rating: 4.8,
    consultCount: 567,
    responseTime: '1小时内',
    tags: ['应激管理', '动物福利', '养殖密度'],
  },
]

const consultationHistory: ConsultationRecord[] = [
  {
    id: 'consult-1',
    question:
      '我养殖的白羽肉鸡在25日龄出现张口呼吸、气管啰音的症状，部分鸡只排白色水样稀便，请问该如何诊断和处理？',
    answer:
      '根据您描述的症状（张口呼吸、气管啰音、白色水样稀便），初步判断可能是传染性支气管炎（IB）的肾型感染。建议处理措施：1. 立即提高舍温2-3°C，减少冷应激；2. 饮水中添加电解多维和肾肿解毒药；3. 使用泰乐菌素预防继发感染，连用3-5天；4. 加强通风，保持空气新鲜；5. 如死亡率持续上升，建议采集病料送实验室确诊。同时注意与禽流感的鉴别诊断，如出现头部肿胀、脚趾出血等症状，需立即上报。',
    expertName: '王志明',
    expertSpecialty: '禽病学',
    category: '疾病诊断',
    status: '已采纳',
    priority: '紧急',
    createdAt: '2025-01-14T08:30:00Z',
    answeredAt: '2025-01-14T09:15:00Z',
  },
  {
    id: 'consult-2',
    question:
      '冬季鸡舍温度已经设定在24°C，但鸡群仍然扎堆，采食量下降明显，这是什么原因？',
    answer:
      '虽然温度计显示24°C，但鸡只扎堆说明体感温度不足。可能原因：1. 舍内存在贼风——检查门窗、通风口是否有漏风处；2. 地面温度过低——如果采用地面平养，地面温度可能比空气温度低5-8°C，建议增加垫料厚度至10-15cm；3. 湿度偏高——高湿度会增加体感寒冷，控制湿度在55-65%；4. 饲料能量不足——冬季代谢能应上浮50-100 kcal/kg。建议：先排查贼风问题，这是最常见的原因。',
    expertName: '张建国',
    expertSpecialty: '环境工程',
    category: '环境调控',
    status: '已采纳',
    priority: '普通',
    createdAt: '2025-01-13T14:20:00Z',
    answeredAt: '2025-01-13T15:45:00Z',
  },
  {
    id: 'consult-3',
    question:
      '请问肉鸡出栏前使用了恩诺沙星，休药期是几天？什么时候可以安全出栏？',
    answer:
      '恩诺沙星的休药期取决于给药途径：口服（饮水或拌料）休药期为8-11天，注射给药休药期为14天。如果您是饮水给药，建议按照11天计算，以确保安全。例如：1月10日最后一次给药，则最早可在1月21日出栏。重要提醒：1. 出栏前必须由驻场兽医确认休药期已结束并签字；2. 严禁在休药期内使用任何药物；3. 建议在系统中设置休药期倒计时提醒，避免误操作。',
    expertName: '陈丽华',
    expertSpecialty: '兽医药理学',
    category: '用药咨询',
    status: '已回复',
    priority: '普通',
    createdAt: '2025-01-12T09:10:00Z',
    answeredAt: '2025-01-12T09:55:00Z',
  },
  {
    id: 'consult-4',
    question:
      '肉鸡中后期（25日龄后）应该使用什么蛋白质水平的饲料？有没有推荐的品牌或配方？',
    answer:
      '肉鸡中后期（25日龄至出栏）推荐饲料营养水平：粗蛋白17-19%，代谢能3100-3200 kcal/kg，钙0.80-0.90%，赖氨酸≥0.95%，蛋氨酸≥0.40%。建议使用颗粒料（直径3-4mm），适口性好，减少浪费。配方参考（每吨）：玉米650kg、豆粕280kg、鱼粉20kg、植物油30kg、石粉10kg、磷酸氢钙5kg、预混料5kg。注意：更换饲料需过渡3天逐步混换；冬季代谢能标准上浮50-100 kcal/kg。',
    expertName: '李秀芳',
    expertSpecialty: '营养学',
    category: '营养配比',
    status: '已回复',
    priority: '普通',
    createdAt: '2025-01-11T16:30:00Z',
    answeredAt: '2025-01-11T17:20:00Z',
  },
  {
    id: 'consult-5',
    question:
      '最近发现鸡舍中有几只鸡出现精神萎靡、鸡冠苍白、排血便的情况，是否需要紧急处理？',
    answer:
      '根据您描述的"鸡冠苍白、排血便"症状，高度怀疑是球虫病。球虫病急性暴发时死亡率可达50-80%，必须立即处理。紧急处理措施：1. 饮水中添加地克珠利（1mg/L）或磺胺氯丙嗪钠（0.1-0.2g/L），连用3-5天；2. 饮水中添加维生素K3促进止血；3. 饮水中添加电解多维补充营养；4. 保持垫料干燥清洁，湿度控制在60%以下；5. 将病鸡隔离观察。注意：磺胺类药物休药期28天，需根据出栏计划谨慎使用。',
    expertName: '王志明',
    expertSpecialty: '禽病学',
    category: '疾病诊断',
    status: '已回复',
    priority: '紧急',
    createdAt: '2025-01-15T06:45:00Z',
    answeredAt: '2025-01-15T07:30:00Z',
  },
  {
    id: 'consult-6',
    question:
      '请问鸡群在进行疫苗免疫前后需要注意哪些事项？特别是新城疫和禽流感的免疫操作细节。',
    answer: '',
    expertName: '王志明',
    expertSpecialty: '禽病学',
    category: '饲养管理',
    status: '待回复',
    priority: '普通',
    createdAt: '2025-01-15T10:00:00Z',
    answeredAt: null,
  },
]

const faqs: FAQ[] = [
  {
    id: 'faq-1',
    question: '肉鸡养殖过程中最常见的疾病有哪些？如何预防？',
    answer:
      '肉鸡养殖最常见的疾病包括：1. 大肠杆菌病——保持环境卫生、降低氨气浓度；2. 球虫病——保持垫料干燥、合理使用抗球虫药物；3. 新城疫——严格执行免疫程序；4. 传染性支气管炎——做好温湿度管理、按程序免疫；5. 慢性呼吸道病（CRD）——减少应激、合理使用抗生素。预防核心原则：疫苗免疫+生物安全+环境管理+合理用药。',
    category: '疾病防控',
    views: 3842,
  },
  {
    id: 'faq-2',
    question: '冬季鸡舍通风不足有什么危害？如何解决？',
    answer:
      '通风不足的危害远大于低温的危害：1. 氨气超标导致呼吸道疾病（结膜炎、气囊炎）；2. 二氧化碳浓度过高导致缺氧，生长缓慢；3. 湿度偏高导致球虫病高发；4. 粉尘浓度增加传播病原。解决方案：坚持"通风优先"原则，宁可降低2-3°C也要保证通风。使用最小通风模式，间歇运行风机，进风口开度不超过5cm。以氨气浓度作为通风是否充足的判断标准（<20ppm）。',
    category: '环境管理',
    views: 2956,
  },
  {
    id: 'faq-3',
    question: '什么是休药期？为什么要严格执行？',
    answer:
      '休药期（停药期）是指畜禽停止给药到允许屠宰或其产品允许上市的间隔时间。在休药期内，动物体内的药物残留量会逐步降低到国家规定的安全标准以下。必须严格执行的原因：1. 药物残留超标对人体健康有害（过敏反应、耐药菌感染、致癌等）；2. 产品中药物残留超标将面临货值10-20倍罚款；3. 造成食品安全事故将依法追究刑事责任。建议：每次用药记录在案，系统自动计算休药期结束日期并设置提醒。',
    category: '用药规范',
    views: 4521,
  },
  {
    id: 'faq-4',
    question: '肉鸡各阶段的饲料营养标准是什么？',
    answer:
      '分三个阶段：前期（0-10日龄）：粗蛋白21-23%，代谢能3000-3100 kcal/kg，开口料/破碎料；中期（11-24日龄）：粗蛋白19-21%，代谢能3050-3150 kcal/kg，小颗粒料；后期（25日龄至出栏）：粗蛋白17-19%，代谢能3100-3200 kcal/kg，颗粒料。冬季需上浮代谢能50-100 kcal/kg。更换饲料阶段需过渡3天逐步混换。严禁使用发霉变质原料。',
    category: '营养配比',
    views: 3210,
  },
  {
    id: 'faq-5',
    question: '如何判断鸡群是否发生了应激？怎样处理？',
    answer:
      '应激识别要点：1. 精神状态——鸡只萎靡、扎堆、嗜睡；2. 采食饮水——采食量突然下降10%以上；3. 粪便变化——异常颜色或形态；4. 行为表现——惊群、炸群、叫声异常；5. 生产指标——增重放缓、死淘率上升。处理方法：1. 消除应激源（噪音、温度突变、断水等）；2. 饮水中添加维生素C（150-200mg/L）和电解多维；3. 保持环境稳定，减少不必要操作；4. 饲料中添加抗应激添加剂（黄芪多糖、酵母多糖等）。',
    category: '饲养管理',
    views: 2187,
  },
  {
    id: 'faq-6',
    question: '肉鸡出栏前需要做哪些准备？',
    answer:
      '出栏前准备：1. 断料——提前8-12小时断料（不断水），减少肠道内容物；2. 核查休药期——确认所有药物休药期已结束；3. 出栏前3天停止用药；4. 检查运输车辆消毒合格证；5. 通知屠宰场确认接收时间和数量；6. 准备检疫证明材料。抓鸡操作：选择夜间或清晨，抓腿不抓翅，轻抓轻放。运输注意事项：时间控制在6小时内，注意防暑或保暖。',
    category: '饲养管理',
    views: 2678,
  },
  {
    id: 'faq-7',
    question: '鸡舍氨气浓度超标怎么快速降下来？',
    answer:
      '快速降氨措施：1. 立即增加通风量——开启最大通风模式15-30分钟；2. 清理粪污——及时清粪减少氨气产生源；3. 使用除臭剂——过磷酸钙（撒在粪便上）、EM菌液喷洒；4. 降低饲养密度——减少氨气产生量；5. 调整饲料蛋白——适当降低蛋白质水平，添加酶制剂提高蛋白质利用率。长期措施：1. 改善排水系统，防止粪便堆积；2. 定期使用微生物除臭剂；3. 保持垫料干燥。',
    category: '环境管理',
    views: 1890,
  },
  {
    id: 'faq-8',
    question: '如何通过观察鸡粪判断鸡群健康状况？',
    answer:
      '健康鸡粪标准：呈灰褐色或绿褐色，成型、表面有白色尿酸盐覆盖（约占1/3）。异常粪便判断：1. 白色石灰样糊状——鸡白痢（沙门氏菌）；2. 血便/番茄酱样——球虫病；3. 绿色稀便——新城疫、禽流感等病毒性疾病；4. 黄白色稀便——大肠杆菌病；5. 水样稀便——传染性支气管炎（肾型）、热应激。注意：发现异常粪便后，应结合鸡群整体状态（精神、采食、呼吸等）综合判断，必要时采集病料送检。',
    category: '疾病防控',
    views: 3456,
  },
]

// ─── AI Consultation System Prompt ─────────────────────────────

const AI_CONSULTATION_PROMPT = `你是一位经验丰富的禽类养殖专家顾问，专精寒地肉鸡养殖领域。你的职责是为养殖户提供实用、专业、详细的建议。

请遵循以下规则：
1. 使用中文回答，语言通俗易懂但保持专业性
2. 针对用户问题给出具体、可操作的建议
3. 如涉及疾病防控，同时提供预防措施
4. 如涉及用药，提醒休药期和注意事项
5. 适当结合寒地养殖特点（如冬季保温、通风管理等）

请严格按照以下JSON格式返回（不要添加任何其他文字说明）：
{
  "answer": "详细的专业回答，使用markdown格式，可以包含**加粗**、### 小标题、- 列表等格式",
  "suggestedFollowUp": ["追问问题1", "追问问题2", "追问问题3"],
  "relatedTopics": ["相关话题1", "相关话题2", "相关话题3"]
}

注意：
1. answer 字段内容要详尽实用，长度在200-500字之间
2. suggestedFollowUp 提供3个与当前问题相关的深入追问
3. relatedTopics 提供3个相关领域的话题标签
4. 如果用户指定了专家方向，回答应侧重于该方向的专业知识`

// ─── API Handlers ──────────────────────────────────────────────

export async function GET() {
  try {
    return NextResponse.json({
      experts,
      consultationHistory,
      faqs,
      stats: {
        totalExperts: experts.length,
        onlineExperts: experts.filter((e) => e.online).length,
        totalConsultations: consultationHistory.length,
        pendingCount: consultationHistory.filter((c) => c.status === '待回复').length,
        avgResponseTime: '1.2小时',
        satisfactionRate: '96.8%',
      },
    })
  } catch (error) {
    console.error('Consultation API error:', error)
    return NextResponse.json({ success: true, mode: 'ai', answer: '由于网络原因，AI顾问暂时无法连接。建议您稍后重试或选择专家问诊模式。', suggestedFollowUp: ['如何进行日常巡检？', '肉鸡常见疾病有哪些？'], relatedTopics: ['养殖管理', '疾病防控'], timestamp: new Date().toISOString() })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, expertId, category, question, priority } = body

    // ── AI Chat Mode ──
    if (mode === 'ai') {
      if (!question || question.trim().length < 5) {
        return NextResponse.json(
          { error: '请至少输入5个字符的问题描述' },
          { status: 400 }
        )
      }

      // Build user message with context
      let userMessage = `养殖户提问：${question.trim()}`

      // Add expert specialty context if provided
      if (expertId) {
        const expert = experts.find((e) => e.id === expertId)
        if (expert) {
          userMessage += `\n\n请侧重于"${expert.specialty}"方向的专业知识进行回答。`
          if (expert.tags.length > 0) {
            userMessage += `专家擅长领域：${expert.tags.join('、')}`
          }
        }
      }

      if (category) {
        userMessage += `\n问题类别：${category}`
      }

      userMessage += '\n\n请严格按照JSON格式返回结果。'

      // Call LLM API
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: AI_CONSULTATION_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        thinking: { type: 'disabled' },
      })

      const rawContent = completion.choices[0]?.message?.content

      if (!rawContent || rawContent.trim().length === 0) {
        return NextResponse.json(
          { error: 'AI顾问暂时无响应，请稍后重试' },
          { status: 503 }
        )
      }

      // Parse JSON from response - handle markdown code blocks
      let jsonStr = rawContent.trim()
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }

      let aiResult
      try {
        aiResult = JSON.parse(jsonStr)
      } catch {
        // If JSON parsing fails, use raw text as answer
        aiResult = {
          answer: rawContent,
          suggestedFollowUp: [
            '能详细说明一下具体的操作步骤吗？',
            '这个问题在冬季有没有特别的注意事项？',
            '如何判断我的鸡群是否存在这个问题的风险？',
          ],
          relatedTopics: ['养殖管理', '疾病防控', '环境调控'],
        }
      }

      return NextResponse.json({
        success: true,
        mode: 'ai',
        answer: aiResult.answer || rawContent,
        suggestedFollowUp: Array.isArray(aiResult.suggestedFollowUp)
          ? aiResult.suggestedFollowUp
          : [],
        relatedTopics: Array.isArray(aiResult.relatedTopics)
          ? aiResult.relatedTopics
          : [],
        timestamp: new Date().toISOString(),
      })
    }

    // ── Expert Consultation Mode (existing behavior) ──
    if (!expertId || !category || !question) {
      return NextResponse.json({ error: '请填写完整的问诊信息' }, { status: 400 })
    }

    if (question.trim().length < 10) {
      return NextResponse.json({ error: '问题描述至少需要10个字符' }, { status: 400 })
    }

    const expert = experts.find((e) => e.id === expertId)

    const newConsultation = {
      id: `consult-${Date.now()}`,
      question: question.trim(),
      answer: '',
      expertName: expert?.name ?? '待分配',
      expertSpecialty: expert?.specialty ?? '',
      category,
      status: '待回复' as const,
      priority: (priority || '普通') as '普通' | '紧急',
      createdAt: new Date().toISOString(),
      answeredAt: null,
    }

    return NextResponse.json({
      success: true,
      mode: 'expert',
      message: '问诊提交成功，专家将在工作时间内回复您',
      consultation: newConsultation,
    })
  } catch (error) {
    console.error('Consultation API error:', error)
    return NextResponse.json({ error: '服务出现异常，请稍后重试' })
  }
}
