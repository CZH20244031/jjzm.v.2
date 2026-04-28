'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Printer,
  Download,
  Loader2,
  Calendar,
  CheckCircle,
  X,
  BarChart3,
  Thermometer,
  Layers,
  AlertTriangle,
  Pill,
  ClipboardList,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------- Types ----------

interface ReportOverview {
  totalInventory: number
  totalBatches: number
  activeBatches: number
  avgMortalityRate: number
  environmentScore: number
  recentAlertCount: number
  reportPeriod: string
}

interface EnvironmentHouse {
  house: string
  avgTemp: number
  avgHumidity: number
  maxAmmonia: number
  avgCO2: number
  recordCount: number
}

interface EnvironmentData {
  overallAvg: {
    temperature: number
    humidity: number
    ammonia: number
    co2: number
  }
  houses: EnvironmentHouse[]
  recordPeriod: string
  totalRecords: number
}

interface BatchItem {
  batchNo: string
  breed: string
  quantity: number
  currentQuantity: number
  houseName: string
  startDate: string
  status: string
  ageDays: number
  mortalityRate: number
}

interface CostBreakdownItem {
  category: string
  amount: number
  percentage: number
  recordCount: number
}

interface CostData {
  totalAmount: number
  breakdown: CostBreakdownItem[]
  recordCount: number
  period: string
}

interface HealthAlertItem {
  id: string
  type: string
  severity: string
  description: string
  status: string
  batchNo: string
  breed: string
  aiConfidence: number | null
  createdAt: string
}

interface HealthAlertData {
  alerts: HealthAlertItem[]
  stats: Record<string, number>
  totalCount: number
  resolvedCount: number
  pendingCount: number
}

interface MedicationRecordItem {
  id: string
  batchNo: string
  breed: string
  drugName: string
  drugType: string
  dosage: string
  administrationMethod: string
  applyDate: string
  withdrawalDays: number
  withdrawalEndDate: string
  operator: string
  status: string
  notes: string | null
}

interface MedicationData {
  records: MedicationRecordItem[]
  stats: Record<string, number>
  totalCount: number
  withdrawalAlertCount: number
}

interface ReportData {
  farmName: string
  reportType: string
  dateRange: { startDate: string; endDate: string }
  generatedAt: string
  overview?: ReportOverview
  environment?: EnvironmentData
  batches?: BatchItem[]
  cost?: CostData
  healthAlerts?: HealthAlertData
  medications?: MedicationData
}

// ---------- Section Config ----------

const SECTION_OPTIONS = [
  { key: '养殖概览', label: '养殖概览', icon: BarChart3, description: '总存栏、活跃批次、死淘率、环境评分' },
  { key: '环境监测', label: '环境监测', icon: Thermometer, description: '温湿度、氨气、CO₂数据表格' },
  { key: '批次详情', label: '批次详情', icon: Layers, description: '批次号、品种、数量、状态' },
  { key: '成本分析', label: '成本分析', icon: ClipboardList, description: '分类成本、占比、总计' },
  { key: '健康预警', label: '健康预警', icon: AlertTriangle, description: '近期预警类型、级别、处理状态' },
  { key: '用药记录', label: '用药记录', icon: Pill, description: '药物名称、剂量、休药期信息' },
]

// ---------- Helpers ----------

function getSeverityColor(severity: string) {
  switch (severity) {
    case '紧急': return 'bg-red-500 text-white'
    case '高': return 'bg-orange-500 text-white'
    case '一般': return 'bg-amber-400 text-white'
    case '低': return 'bg-blue-400 text-white'
    default: return 'bg-gray-400 text-white'
  }
}

function getSeverityPrintBg(severity: string) {
  switch (severity) {
    case '紧急': return '#ef4444'
    case '高': return '#f97316'
    case '一般': return '#fbbf24'
    case '低': return '#60a5fa'
    default: return '#9ca3af'
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case '养殖中': return 'bg-emerald-100 text-emerald-700'
    case '待入栏': return 'bg-blue-100 text-blue-700'
    case '已出栏': return 'bg-gray-100 text-gray-600'
    case '异常': return 'bg-red-100 text-red-700'
    case '待处理': return 'bg-amber-100 text-amber-700'
    case '处理中': return 'bg-blue-100 text-blue-700'
    case '已解决': return 'bg-emerald-100 text-emerald-700'
    case '已忽略': return 'bg-gray-100 text-gray-500'
    case '休药中': return 'bg-orange-100 text-orange-700'
    case '已过休药期': return 'bg-emerald-100 text-emerald-700'
    case '已记录': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getEnvScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-red-600'
}

// ---------- Print Report Component ----------

function PrintReport({ data, sections }: { data: ReportData; sections: string[] }) {
  return (
    <div style={{
      fontFamily: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif',
      color: '#1a1a1a',
      lineHeight: '1.6',
      fontSize: '14px',
    }}>
      {/* Print-specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 12mm;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        .report-header {
          border-bottom: 3px solid #059669;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .report-section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        .report-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #065f46;
          border-left: 4px solid #059669;
          padding-left: 10px;
          margin-bottom: 12px;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .report-table th {
          background-color: #f0fdf4;
          color: #065f46;
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #d1fae5;
        }
        .report-table td {
          padding: 7px 12px;
          border: 1px solid #e5e7eb;
        }
        .report-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .stat-card {
          display: inline-block;
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #d1fae5;
          background-color: #f0fdf4;
          margin: 4px;
          min-width: 140px;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #065f46;
        }
        .severity-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: white;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .report-footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 2px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          display: flex;
          justify-content: space-between;
        }
        .print-hidden {
          display: none !important;
        }
      `}</style>

      {/* Header */}
      <div className="report-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#065f46', margin: '0 0 4px 0' }}>
              🐔 {data.farmName}
            </h1>
            <p style={{ fontSize: '16px', color: '#374151', margin: '0 0 8px 0' }}>
              {data.reportType === '日报' ? '养殖日报' : data.reportType === '周报' ? '养殖周报' : '养殖月报'}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#6b7280' }}>
            <div>报告期间：{data.dateRange.startDate} ~ {data.dateRange.endDate}</div>
            <div>生成时间：{new Date(data.generatedAt).toLocaleString('zh-CN')}</div>
          </div>
        </div>
      </div>

      {/* Section 1: 养殖概览 */}
      {sections.includes('养殖概览') && data.overview && (
        <div className="report-section">
          <div className="report-section-title">一、养殖概览</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <div className="stat-card">
              <div className="stat-label">总存栏量</div>
              <div className="stat-value">{data.overview.totalInventory.toLocaleString()} 只</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">活跃批次</div>
              <div className="stat-value">{data.overview.activeBatches} 个</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">平均死淘率</div>
              <div className="stat-value" style={{ color: data.overview.avgMortalityRate > 5 ? '#dc2626' : '#059669' }}>
                {data.overview.avgMortalityRate}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">环境评分</div>
              <div className="stat-value" style={{
                color: data.overview.environmentScore >= 90 ? '#059669'
                  : data.overview.environmentScore >= 70 ? '#d97706' : '#dc2626'
              }}>
                {data.overview.environmentScore} 分
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">总批次数</div>
              <div className="stat-value">{data.overview.totalBatches} 个</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">近期预警</div>
              <div className="stat-value" style={{ color: data.overview.recentAlertCount > 0 ? '#d97706' : '#059669' }}>
                {data.overview.recentAlertCount} 条
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: 环境监测 */}
      {sections.includes('环境监测') && data.environment && (
        <div className="report-section">
          <div className="report-section-title">二、环境监测（{data.environment.recordPeriod}，共{data.environment.totalRecords}条记录）</div>
          <table className="report-table">
            <thead>
              <tr>
                <th>鸡舍</th>
                <th>平均温度 (°C)</th>
                <th>平均湿度 (%)</th>
                <th>最高氨气 (ppm)</th>
                <th>平均CO₂ (ppm)</th>
                <th>记录数</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: 600, backgroundColor: '#ecfdf5' }}>
                <td>全场平均</td>
                <td>{data.environment.overallAvg.temperature}</td>
                <td>{data.environment.overallAvg.humidity}</td>
                <td>{data.environment.overallAvg.ammonia}</td>
                <td>{data.environment.overallAvg.co2}</td>
                <td>{data.environment.totalRecords}</td>
              </tr>
              {data.environment.houses.map((house) => (
                <tr key={house.house}>
                  <td>{house.house}</td>
                  <td style={{ color: house.avgTemp > 28 || house.avgTemp < 18 ? '#dc2626' : '#1a1a1a' }}>
                    {house.avgTemp}
                  </td>
                  <td>{house.avgHumidity}</td>
                  <td style={{ color: house.maxAmmonia > 20 ? '#dc2626' : house.maxAmmonia > 15 ? '#d97706' : '#1a1a1a' }}>
                    {house.maxAmmonia}
                  </td>
                  <td style={{ color: house.avgCO2 > 1500 ? '#dc2626' : house.avgCO2 > 1000 ? '#d97706' : '#1a1a1a' }}>
                    {house.avgCO2}
                  </td>
                  <td>{house.recordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            📌 标准参考：温度 18~28°C，湿度 50~70%，氨气 &lt;15ppm，CO₂ &lt;1000ppm
          </div>
        </div>
      )}

      {/* Section 3: 批次详情 */}
      {sections.includes('批次详情') && data.batches && (
        <div className="report-section">
          <div className="report-section-title">三、批次详情（共{data.batches.length}个批次）</div>
          <table className="report-table">
            <thead>
              <tr>
                <th>批次号</th>
                <th>品种</th>
                <th>入栏数量</th>
                <th>当前数量</th>
                <th>日龄</th>
                <th>鸡舍</th>
                <th>状态</th>
                <th>死淘率</th>
              </tr>
            </thead>
            <tbody>
              {data.batches.map((batch) => (
                <tr key={batch.batchNo}>
                  <td style={{ fontWeight: 600 }}>{batch.batchNo}</td>
                  <td>{batch.breed}</td>
                  <td>{batch.quantity.toLocaleString()}</td>
                  <td>{batch.currentQuantity.toLocaleString()}</td>
                  <td>{batch.ageDays}天</td>
                  <td>{batch.houseName}</td>
                  <td>
                    <span className="status-badge" style={{
                      backgroundColor: batch.status === '养殖中' ? '#d1fae5' : batch.status === '异常' ? '#fee2e2' : '#f3f4f6',
                      color: batch.status === '养殖中' ? '#065f46' : batch.status === '异常' ? '#991b1b' : '#4b5563',
                    }}>
                      {batch.status}
                    </span>
                  </td>
                  <td style={{ color: batch.mortalityRate > 5 ? '#dc2626' : '#1a1a1a' }}>
                    {batch.mortalityRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 4: 成本分析 */}
      {sections.includes('成本分析') && data.cost && (
        <div className="report-section">
          <div className="report-section-title">四、成本分析（{data.cost.period}）</div>
          <div style={{ marginBottom: '12px', fontSize: '15px' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>总成本：</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626' }}>
              ¥{data.cost.totalAmount.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
              （共{data.cost.recordCount}条记录）
            </span>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>成本类别</th>
                <th>金额 (元)</th>
                <th>占比</th>
                <th>记录数</th>
                <th>占比条形图</th>
              </tr>
            </thead>
            <tbody>
              {data.cost.breakdown.map((item) => (
                <tr key={item.category}>
                  <td style={{ fontWeight: 600 }}>{item.category}</td>
                  <td>¥{item.amount.toLocaleString()}</td>
                  <td>{item.percentage}%</td>
                  <td>{item.recordCount}</td>
                  <td>
                    <div style={{
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      height: '16px',
                      width: '120px',
                      position: 'relative',
                    }}>
                      <div style={{
                        backgroundColor: item.category === '饲料' ? '#059669' :
                          item.category === '药品' ? '#7c3aed' :
                          item.category === '能耗' ? '#d97706' :
                          item.category === '人工' ? '#2563eb' : '#6b7280',
                        borderRadius: '4px',
                        height: '16px',
                        width: `${Math.min(item.percentage, 100)}%`,
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, backgroundColor: '#f0fdf4' }}>
                <td>合计</td>
                <td>¥{data.cost.totalAmount.toLocaleString()}</td>
                <td>100%</td>
                <td>{data.cost.recordCount}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Section 5: 健康预警 */}
      {sections.includes('健康预警') && data.healthAlerts && (
        <div className="report-section">
          <div className="report-section-title">
            五、健康预警
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280', marginLeft: '12px' }}>
              共{data.healthAlerts.totalCount}条 · 已解决{data.healthAlerts.resolvedCount}条 · 待处理{data.healthAlerts.pendingCount}条
            </span>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>类型</th>
                <th>级别</th>
                <th>批次</th>
                <th>描述</th>
                <th>状态</th>
                <th>AI置信度</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {data.healthAlerts.alerts.map((alert) => (
                <tr key={alert.id}>
                  <td style={{ fontWeight: 500 }}>{alert.type}</td>
                  <td>
                    <span className="severity-badge" style={{
                      backgroundColor: getSeverityPrintBg(alert.severity),
                    }}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>{alert.batchNo}</td>
                  <td style={{ maxWidth: '200px' }}>{alert.description}</td>
                  <td>
                    <span className="status-badge" style={{
                      backgroundColor: alert.status === '已解决' ? '#d1fae5' :
                        alert.status === '待处理' ? '#fef3c7' :
                        alert.status === '处理中' ? '#dbeafe' : '#f3f4f6',
                      color: alert.status === '已解决' ? '#065f46' :
                        alert.status === '待处理' ? '#92400e' :
                        alert.status === '处理中' ? '#1e40af' : '#4b5563',
                    }}>
                      {alert.status}
                    </span>
                  </td>
                  <td>{alert.aiConfidence ? `${alert.aiConfidence}%` : '-'}</td>
                  <td>{alert.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 6: 用药记录 */}
      {sections.includes('用药记录') && data.medications && (
        <div className="report-section">
          <div className="report-section-title">
            六、用药记录
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280', marginLeft: '12px' }}>
              共{data.medications.totalCount}条 · 休药期预警{data.medications.withdrawalAlertCount}条
            </span>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>批次</th>
                <th>药物名称</th>
                <th>类型</th>
                <th>剂量</th>
                <th>给药方式</th>
                <th>用药日期</th>
                <th>休药期</th>
                <th>操作员</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {data.medications.records.map((med) => (
                <tr key={med.id}>
                  <td style={{ fontWeight: 500 }}>{med.batchNo}</td>
                  <td>{med.drugName}</td>
                  <td>{med.drugType}</td>
                  <td>{med.dosage}</td>
                  <td>{med.administrationMethod}</td>
                  <td>{med.applyDate}</td>
                  <td>{med.withdrawalDays}天</td>
                  <td>{med.operator}</td>
                  <td>
                    <span className="status-badge" style={{
                      backgroundColor: med.status === '休药中' ? '#ffedd5' :
                        med.status === '已过休药期' ? '#d1fae5' : '#dbeafe',
                      color: med.status === '休药中' ? '#9a3412' :
                        med.status === '已过休药期' ? '#065f46' : '#1e40af',
                    }}>
                      {med.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="report-footer">
        <div>
          <strong>{data.farmName}</strong> · {data.reportType} · {data.dateRange.startDate} ~ {data.dateRange.endDate}
        </div>
        <div>
          报告生成时间：{new Date(data.generatedAt).toLocaleString('zh-CN')} | 极境智牧智能养殖管理平台
        </div>
      </div>

      {/* Print-only: trigger print */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          `,
        }}
      />
    </div>
  )
}

// ---------- Main Component ----------

export function ReportGenerator() {
  const [open, setOpen] = useState(false)
  const [reportType, setReportType] = useState<string>('日报')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [selectedSections, setSelectedSections] = useState<string[]>(
    SECTION_OPTIONS.map((s) => s.key)
  )
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Update date range when report type changes
  useEffect(() => {
    const now = new Date()
    let start = new Date()
    if (reportType === '周报') {
      start.setDate(now.getDate() - 7)
    } else if (reportType === '月报') {
      start.setMonth(now.getMonth() - 1)
    }
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
  }, [reportType])

  function toggleSection(key: string) {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  function selectAllSections() {
    setSelectedSections(SECTION_OPTIONS.map((s) => s.key))
  }

  function deselectAllSections() {
    setSelectedSections([])
  }

  async function handleGenerate() {
    if (selectedSections.length === 0) {
      setError('请至少选择一个报告章节')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/report-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          dateRange: { startDate, endDate },
          sections: selectedSections,
        }),
      })

      if (!res.ok) {
        throw new Error('获取报告数据失败')
      }

      const data: ReportData = await res.json()
      setReportData(data)

      // Open print window
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>${data.farmName} - ${data.reportType}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif;
                padding: 20mm 15mm;
                color: #1a1a1a;
                line-height: 1.6;
                font-size: 14px;
              }
              @page { size: A4; margin: 10mm; }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="
              position: fixed; top: 0; left: 0; right: 0;
              background: white; z-index: 100;
              padding: 12px 24px;
              display: flex; justify-content: center; gap: 12px;
              border-bottom: 1px solid #e5e7eb;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
              <button onclick="window.print()" style="
                padding: 8px 20px; border: none; border-radius: 6px;
                background: #059669; color: white; font-size: 14px;
                cursor: pointer; font-weight: 600;
              ">🖨️ 打印报告</button>
              <button onclick="window.close()" style="
                padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px;
                background: white; color: #374151; font-size: 14px;
                cursor: pointer;
              ">关闭</button>
            </div>
            <div style="margin-top: 50px;" id="report-content"></div>
          </body>
          </html>
        `)

        // Inject report data and render
        const reportHTML = generateReportHTML(data, selectedSections)
        printWindow.document.getElementById('report-content')!.innerHTML = reportHTML
        printWindow.document.close()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成报告失败')
    } finally {
      setLoading(false)
    }
  }

  function generateReportHTML(data: ReportData, sections: string[]): string {
    let html = ''

    // Header
    html += `
      <div style="border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #065f46; margin: 0 0 4px 0;">
              🐔 ${data.farmName}
            </h1>
            <p style="font-size: 16px; color: #374151; margin: 0 0 8px 0;">
              ${data.reportType === '日报' ? '养殖日报' : data.reportType === '周报' ? '养殖周报' : '养殖月报'}
            </p>
          </div>
          <div style="text-align: right; font-size: 13px; color: #6b7280;">
            <div>报告期间：${data.dateRange.startDate} ~ ${data.dateRange.endDate}</div>
            <div>生成时间：${new Date(data.generatedAt).toLocaleString('zh-CN')}</div>
          </div>
        </div>
      </div>
    `

    // Section 1: 养殖概览
    if (sections.includes('养殖概览') && data.overview) {
      const o = data.overview
      html += `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-bottom: 12px;">一、养殖概览</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${statCardHTML('总存栏量', `${o.totalInventory.toLocaleString()} 只`, '#059669')}
            ${statCardHTML('活跃批次', `${o.activeBatches} 个`, '#059669')}
            ${statCardHTML('平均死淘率', `${o.avgMortalityRate}%`, o.avgMortalityRate > 5 ? '#dc2626' : '#059669')}
            ${statCardHTML('环境评分', `${o.environmentScore} 分`, o.environmentScore >= 90 ? '#059669' : o.environmentScore >= 70 ? '#d97706' : '#dc2626')}
            ${statCardHTML('总批次数', `${o.totalBatches} 个`, '#059669')}
            ${statCardHTML('近期预警', `${o.recentAlertCount} 条`, o.recentAlertCount > 0 ? '#d97706' : '#059669')}
          </div>
        </div>
      `
    }

    // Section 2: 环境监测
    if (sections.includes('环境监测') && data.environment) {
      const env = data.environment
      html += `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-bottom: 12px;">
            二、环境监测（${env.recordPeriod}，共${env.totalRecords}条记录）
          </div>
          ${reportTableHTML(
            ['鸡舍', '平均温度(°C)', '平均湿度(%)', '最高氨气(ppm)', '平均CO₂(ppm)', '记录数'],
            [
              [
                '<b>全场平均</b>',
                env.overallAvg.temperature.toString(),
                env.overallAvg.humidity.toString(),
                env.overallAvg.ammonia.toString(),
                env.overallAvg.co2.toString(),
                env.totalRecords.toString(),
              ],
              ...env.houses.map((h) => [
                h.house,
                h.avgTemp.toString(),
                h.avgHumidity.toString(),
                h.maxAmmonia.toString(),
                h.avgCO2.toString(),
                h.recordCount.toString(),
              ]),
            ],
            true
          )}
          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            📌 标准参考：温度 18~28°C，湿度 50~70%，氨气 &lt;15ppm，CO₂ &lt;1000ppm
          </div>
        </div>
      `
    }

    // Section 3: 批次详情
    if (sections.includes('批次详情') && data.batches) {
      html += `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-bottom: 12px;">
            三、批次详情（共${data.batches.length}个批次）
          </div>
          ${reportTableHTML(
            ['批次号', '品种', '入栏数量', '当前数量', '日龄', '鸡舍', '状态', '死淘率'],
            data.batches.map((b) => [
              `<b>${b.batchNo}</b>`,
              b.breed,
              b.quantity.toLocaleString(),
              b.currentQuantity.toLocaleString(),
              `${b.ageDays}天`,
              b.houseName,
              `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;background:${b.status === '养殖中' ? '#d1fae5' : b.status === '异常' ? '#fee2e2' : '#f3f4f6'};color:${b.status === '养殖中' ? '#065f46' : b.status === '异常' ? '#991b1b' : '#4b5563'}">${b.status}</span>`,
              `<span style="color:${b.mortalityRate > 5 ? '#dc2626' : '#1a1a1a'}">${b.mortalityRate}%</span>`,
            ])
          )}
        </div>
      `
    }

    // Section 4: 成本分析
    if (sections.includes('成本分析') && data.cost) {
      const cost = data.cost
      html += `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-bottom: 12px;">
            四、成本分析（${cost.period}）
          </div>
          <div style="margin-bottom: 12px; font-size: 15px;">
            <span style="font-weight: 600; color: #374151;">总成本：</span>
            <span style="font-size: 22px; font-weight: 800; color: #dc2626;">¥${cost.totalAmount.toLocaleString()}</span>
            <span style="font-size: 12px; color: #6b7280; margin-left: 8px;">（共${cost.recordCount}条记录）</span>
          </div>
          ${reportTableHTML(
            ['成本类别', '金额(元)', '占比', '记录数'],
            [
              ...cost.breakdown.map((c) => [
                `<b>${c.category}</b>`,
                `¥${c.amount.toLocaleString()}`,
                `${c.percentage}%`,
                c.recordCount.toString(),
              ]),
              ['<b>合计</b>', `<b>¥${cost.totalAmount.toLocaleString()}</b>`, '<b>100%</b>', `<b>${cost.recordCount}</b>`],
            ],
            true,
            cost.breakdown.length > 0
          )}
        </div>
      `
    }

    // Section 5: 健康预警
    if (sections.includes('健康预警') && data.healthAlerts) {
      const health = data.healthAlerts
      html += `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-bottom: 12px;">
            五、健康预警
            <span style="font-size: 12px; font-weight: 400; color: #6b7280; margin-left: 12px;">
              共${health.totalCount}条 · 已解决${health.resolvedCount}条 · 待处理${health.pendingCount}条
            </span>
          </div>
          ${reportTableHTML(
            ['类型', '级别', '批次', '描述', '状态', 'AI置信度', '日期'],
            health.alerts.map((a) => [
              a.type,
              `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;color:white;background:${getSeverityPrintBg(a.severity)}">${a.severity}</span>`,
              a.batchNo,
              a.description,
              `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;background:${a.status === '已解决' ? '#d1fae5' : a.status === '待处理' ? '#fef3c7' : '#dbeafe'};color:${a.status === '已解决' ? '#065f46' : a.status === '待处理' ? '#92400e' : '#1e40af'}">${a.status}</span>`,
              a.aiConfidence ? `${a.aiConfidence}%` : '-',
              a.createdAt,
            ])
          )}
        </div>
      `
    }

    // Section 6: 用药记录
    if (sections.includes('用药记录') && data.medications) {
      const meds = data.medications
      html += `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-size: 16px; font-weight: 700; color: #065f46; border-left: 4px solid #059669; padding-left: 10px; margin-bottom: 12px;">
            六、用药记录
            <span style="font-size: 12px; font-weight: 400; color: #6b7280; margin-left: 12px;">
              共${meds.totalCount}条 · 休药期预警${meds.withdrawalAlertCount}条
            </span>
          </div>
          ${reportTableHTML(
            ['批次', '药物名称', '类型', '剂量', '给药方式', '用药日期', '休药期', '操作员', '状态'],
            meds.records.map((m) => [
              m.batchNo,
              m.drugName,
              m.drugType,
              m.dosage,
              m.administrationMethod,
              m.applyDate,
              `${m.withdrawalDays}天`,
              m.operator,
              `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;background:${m.status === '休药中' ? '#ffedd5' : m.status === '已过休药期' ? '#d1fae5' : '#dbeafe'};color:${m.status === '休药中' ? '#9a3412' : m.status === '已过休药期' ? '#065f46' : '#1e40af'}">${m.status}</span>`,
            ])
          )}
        </div>
      `
    }

    // Footer
    html += `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; display: flex; justify-content: space-between;">
        <div><b>${data.farmName}</b> · ${data.reportType} · ${data.dateRange.startDate} ~ ${data.dateRange.endDate}</div>
        <div>报告生成时间：${new Date(data.generatedAt).toLocaleString('zh-CN')} | 极境智牧智能养殖管理平台</div>
      </div>
    `

    return html
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <FileText className="h-3.5 w-3.5" />
            生成报告
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
              生成养殖报告
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-80px)] pr-3">
            <div className="space-y-6 pb-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">报告类型</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="日报">📅 日报</SelectItem>
                    <SelectItem value="周报">📆 周报</SelectItem>
                    <SelectItem value="月报">🗓️ 月报</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">日期范围</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">开始日期</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">结束日期</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">报告章节</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllSections}>
                      全选
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAllSections}>
                      清空
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {SECTION_OPTIONS.map((section) => (
                    <motion.div
                      key={section.key}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <label
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                          selectedSections.includes(section.key)
                            ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                            : 'border-transparent bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedSections.includes(section.key)}
                          onCheckedChange={() => toggleSection(section.key)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            selectedSections.includes(section.key)
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <section.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{section.label}</div>
                            <div className="text-xs text-muted-foreground">{section.description}</div>
                          </div>
                          {selectedSections.includes(section.key) && (
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
                  >
                    <X className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate Button */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleGenerate}
                  disabled={loading || selectedSections.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4" />
                      生成并打印
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="gap-1.5">
                  取消
                </Button>
              </div>

              {/* Preview (if data loaded) */}
              {reportData && !loading && (
                <div className="mt-4">
                  <Separator className="mb-4" />
                  <div className="text-xs text-muted-foreground mb-2">
                    ✅ 报告数据已生成，打印窗口已打开。如未弹出，请检查浏览器弹窗设置。
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------- HTML Helpers ----------

function statCardHTML(label: string, value: string, color: string) {
  return `
    <div style="display:inline-block;padding:10px 18px;border-radius:8px;border:1px solid #d1fae5;background-color:#f0fdf4;margin:4px;min-width:140px;">
      <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">${label}</div>
      <div style="font-size:20px;font-weight:700;color:${color};">${value}</div>
    </div>
  `
}

function reportTableHTML(
  headers: string[],
  rows: string[][],
  hasHighlight = false,
  hasTotalRow = false
) {
  const highlightStyle = hasHighlight ? 'background-color:#ecfdf5;font-weight:600;' : ''
  const totalRowStyle = 'background-color:#f0fdf5;font-weight:700;'

  return `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr>
          ${headers.map((h) => `<th style="background-color:#f0fdf4;color:#065f46;padding:8px 10px;text-align:left;font-weight:600;border:1px solid #d1fae5;font-size:12px;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, idx) => {
          const isTotal = hasTotalRow && idx === rows.length - 1
          const isFirst = hasHighlight && idx === 0
          const style = isTotal ? totalRowStyle : isFirst ? highlightStyle : ''
          const bgEven = !isTotal && !isFirst && idx % 2 === 1 ? 'background-color:#f9fafb;' : ''
          return `<tr style="${style}${bgEven}">
            ${row.map((cell, ci) => `<td style="padding:6px 10px;border:1px solid #e5e7eb;${ci === 0 ? 'font-weight:500;' : ''}${ci === 0 && !isTotal ? 'min-width:80px;' : ''}">${cell}</td>`).join('')}
          </tr>`
        }).join('')}
      </tbody>
    </table>
  `
}
