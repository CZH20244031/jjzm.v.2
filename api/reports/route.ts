import { NextResponse } from 'next/server'

function getDateString(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function getDayOfWeek(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
}

const statusOptions = ['正常', '正常', '正常', '关注', '正常', '异常', '正常'] as const

function getHistoricalReports() {
  const reports = []
  for (let i = 1; i <= 7; i++) {
    const mortality = Math.floor(Math.random() * 6) + 1
    const feed = +(Math.random() * 1.5 + 2.5).toFixed(1)
    const water = +(Math.random() * 2 + 4.5).toFixed(1)
    const compliance = +(Math.random() * 2 + 97.5).toFixed(1)
    const status = statusOptions[i - 1]
    reports.push({
      date: getDateString(i),
      dayOfWeek: getDayOfWeek(i),
      overallStatus: status,
      mortality,
      mortalityRate: ((mortality / 33000) * 100).toFixed(3) + '%',
      feedConsumption: feed + '吨',
      waterConsumption: water + 'm³',
      complianceRate: compliance + '%',
      newAlerts: Math.floor(Math.random() * 5),
      resolvedAlerts: Math.floor(Math.random() * 4),
      aiDetections: Math.floor(Math.random() * 10) + 5,
      activeTreatments: Math.floor(Math.random() * 3),
    })
  }
  return reports
}

export async function GET() {
  const today = getDateString(0)

  const todayReport = {
    date: today,
    farmName: '极境智牧养殖基地',
    weather: '晴 8°C~18°C',
    overallStatus: '正常',
    sections: {
      environment: {
        status: '正常',
        avgTemp: '23.5°C',
        avgHumidity: '62%',
        maxAmmonia: '20ppm',
        co2: '820ppm',
        issues: 1,
        details: [
          { house: '1号鸡舍', temp: '23.2°C', humidity: '61%', ammonia: '18ppm', status: '正常' },
          { house: '2号鸡舍', temp: '24.1°C', humidity: '63%', ammonia: '22ppm', status: '关注' },
          { house: '3号鸡舍', temp: '23.8°C', humidity: '64%', ammonia: '15ppm', status: '正常' },
          { house: '4号鸡舍', temp: '22.9°C', humidity: '60%', ammonia: '19ppm', status: '正常' },
        ],
      },
      production: {
        feedConsumption: '3.2吨',
        waterConsumption: '5.8m³',
        eggCount: null,
        mortality: 5,
        mortalityRate: '0.15%',
        mortalityTrend: 'down' as const,
        feedTrend: 'up' as const,
      },
      health: {
        newAlerts: 3,
        resolvedAlerts: 2,
        aiDetections: 12,
        status: '关注',
        severityBreakdown: { critical: 0, high: 1, normal: 2 },
      },
      medication: {
        activeTreatments: 2,
        withdrawalAlerts: 1,
        upcomingDoses: 1,
        treatments: [
          { batchNo: 'BSJ-2026-001', drug: '阿莫西林', dosage: '500mg/L', startDate: '2026-04-12', endDate: '2026-04-19', status: '进行中' },
          { batchNo: 'BSJ-2026-003', drug: '维生素C', dosage: '200mg/L', startDate: '2026-04-15', endDate: '2026-04-18', status: '即将结束' },
        ],
      },
      batches: {
        active: 2,
        totalBirds: 33343,
        incoming: 1,
        outgoing: 0,
        list: [
          { batchNo: 'BSJ-2026-001', breed: '白羽肉鸡', house: '1号鸡舍', ageDays: 35, totalBirds: 18200, status: '养殖中' },
          { batchNo: 'BSJ-2026-003', breed: '罗斯308', house: '3号鸡舍', ageDays: 28, totalBirds: 15143, status: '育肥中' },
        ],
      },
    },
  }

  const historicalReports = getHistoricalReports()

  const reportStats = {
    consecutiveNormalDays: 5,
    thisWeekMortality: 23,
    thisWeekFeedCost: 22800,
    avgCompliance: 99.2,
  }

  return NextResponse.json({
    todayReport,
    historicalReports,
    reportStats,
  })
}
