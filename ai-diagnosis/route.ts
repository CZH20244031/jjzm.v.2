import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const SYSTEM_PROMPT = `你是极境智牧平台的AI兽医专家，专精寒地肉鸡养殖的疾病诊断和健康管理。请根据用户提供的症状信息，给出专业的诊断建议。回答使用中文，格式清晰。

请严格按照以下JSON格式返回诊断结果（不要添加任何其他文字说明）：
{
  "possibleDiseases": [
    { "name": "疾病名称", "probability": "高/中/低", "severity": "严重/较重/中等/轻微", "description": "简要描述" }
  ],
  "severity": "严重/较重/中等/轻微",
  "recommendations": ["建议1", "建议2", "建议3"],
  "treatmentSuggestions": ["治疗方案1", "治疗方案2"],
  "prevention": ["预防措施1", "预防措施2", "预防措施3"],
  "summary": "综合诊断概述，一段话总结"
}

注意：
1. possibleDiseases 至少给出2-4个可能疾病
2. severity 为最可能的疾病的严重程度
3. recommendations 包含紧急处理建议
4. treatmentSuggestions 包含具体的用药和治疗建议
5. prevention 包含长期预防措施
6. 如果症状信息不足，在summary中说明需要更多信息`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symptoms, batchNo, breed, age, houseName } = body

    if (!symptoms || symptoms.trim().length < 5) {
      return NextResponse.json(
        { error: '请至少输入5个字符的症状描述' },
        { status: 400 }
      )
    }

    // Build user message with context
    let userMessage = `症状描述：${symptoms.trim()}`

    if (batchNo) userMessage += `\n批次编号：${batchNo}`
    if (breed) userMessage += `\n品种：${breed}`
    if (age) userMessage += `\n日龄：${age}`
    if (houseName) userMessage += `\n鸡舍：${houseName}`

    userMessage += '\n\n请根据以上信息进行诊断分析，严格按照JSON格式返回结果。'

    // Call LLM API
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: SYSTEM_PROMPT,
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
        { error: 'AI诊断服务暂时无响应，请稍后重试' },
        { status: 503 }
      )
    }

    // Parse JSON from response - handle markdown code blocks
    let jsonStr = rawContent.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    let diagnosisResult
    try {
      diagnosisResult = JSON.parse(jsonStr)
    } catch {
      // If JSON parsing fails, return the raw text as summary
      diagnosisResult = {
        possibleDiseases: [
          {
            name: '待进一步确诊',
            probability: '中',
            severity: '中等',
            description: rawContent.slice(0, 100),
          },
        ],
        severity: '中等',
        recommendations: ['建议尽快联系驻场兽医进行现场诊断'],
        treatmentSuggestions: ['暂无具体用药建议，请等待专业诊断'],
        prevention: ['加强日常观察，记录症状变化'],
        summary: rawContent,
      }
    }

    // Validate required fields
    const result = {
      ...diagnosisResult,
      possibleDiseases: Array.isArray(diagnosisResult.possibleDiseases)
        ? diagnosisResult.possibleDiseases
        : [],
      severity: diagnosisResult.severity || '中等',
      recommendations: Array.isArray(diagnosisResult.recommendations)
        ? diagnosisResult.recommendations
        : [],
      treatmentSuggestions: Array.isArray(diagnosisResult.treatmentSuggestions)
        ? diagnosisResult.treatmentSuggestions
        : [],
      prevention: Array.isArray(diagnosisResult.prevention)
        ? diagnosisResult.prevention
        : [],
      summary: diagnosisResult.summary || '',
      diagnosisTime: new Date().toISOString(),
      inputSymptoms: symptoms.trim(),
    }

    return NextResponse.json({
      success: true,
      diagnosis: result,
    })
  } catch (error) {
    console.error('AI Diagnosis API error:', error)
    return NextResponse.json({
      success: true,
      diagnosis: {
        possibleDiseases: [{ name: '待进一步确诊', probability: '中', severity: '中等', description: 'AI诊断服务暂时不可用，建议联系驻场兽医' }],
        severity: '中等',
        recommendations: ['建议尽快联系驻场兽医进行现场诊断', '保持鸡舍环境稳定'],
        treatmentSuggestions: ['暂无具体用药建议，请等待专业诊断'],
        prevention: ['加强日常观察，记录症状变化'],
        summary: 'AI诊断服务暂时不可用，建议联系驻场兽医进行现场诊断。',
        diagnosisTime: new Date().toISOString(),
        inputSymptoms: '',
      },
    })
  }
}
