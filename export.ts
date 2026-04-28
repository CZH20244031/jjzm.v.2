/**
 * 通用CSV数据导出工具
 * 使用 fetch + blob 方式确保下载兼容性
 * 支持自动重试
 */

const EXPORT_TYPES = [
  'batches',
  'medications',
  'costs',
  'feed',
  'sales',
  'vaccines',
  'staff',
  'alerts',
  'health-alerts',
  'environment',
  'slaughter',
  'financial',
] as const

export type ExportType = (typeof EXPORT_TYPES)[number]

const EXPORT_LABELS: Record<ExportType, string> = {
  batches: '批次数据',
  medications: '用药数据',
  costs: '成本数据',
  feed: '饲料数据',
  sales: '销售数据',
  vaccines: '疫苗数据',
  staff: '员工数据',
  alerts: '预警数据',
  'health-alerts': '健康预警数据',
  environment: '环境数据',
  slaughter: '出栏数据',
  financial: '财务报表',
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  retries = 2,
  delayMs = 1500
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        await sleep(delayMs * (attempt + 1))
      }
    }
  }
  throw lastError || new Error('请求失败')
}

export async function exportCsv(
  type: ExportType,
  options?: {
    filename?: string
    onSuccess?: () => void
    onError?: (error: string) => void
  }
) {
  const {
    filename,
    onSuccess,
    onError,
  } = options || {}

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(`/api/export?type=${type}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => `HTTP ${response.status}`)
      const message = `导出失败: ${errorText}`
      onError?.(message)
      return
    }

    const text = await response.text()

    if (!text || text.length < 10) {
      const message = '导出数据为空，请检查数据是否存在'
      onError?.(message)
      return
    }

    // Create blob and trigger download
    const BOM = '\uFEFF'
    const csvContent = text.startsWith(BOM) ? text : BOM + text
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, filename || `${EXPORT_LABELS[type]}_${new Date().toISOString().split('T')[0]}.csv`)
    onSuccess?.()
  } catch (error) {
    const message = error instanceof Error
      ? (error.name === 'AbortError' ? '导出请求超时，请重试' : error.message)
      : '导出失败，请稍后重试'
    onError?.(message)
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  // Delay cleanup to ensure download starts
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 300)
}
