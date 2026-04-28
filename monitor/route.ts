import { NextResponse } from 'next/server'

// Generate 24-hour temperature history data
function generateEnvironmentHistory() {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  // Base temperatures with slight variations for each house
  const baseA1 = 23
  const baseA2 = 24.5
  const baseB1 = 21
  const baseB2 = 20

  return hours.map((time, i) => {
    const variation = Math.sin((i - 6) * Math.PI / 12) * 2 // Warm during day, cool at night
    return {
      time,
      A1: Math.round((baseA1 + variation + (Math.random() * 1.5 - 0.75)) * 10) / 10,
      A2: Math.round((baseA2 + variation + (Math.random() * 1.5 - 0.75)) * 10) / 10,
      B1: Math.round((baseB1 + variation * 0.8 + (Math.random() * 1.2 - 0.6)) * 10) / 10,
      B2: Math.round((baseB2 + variation * 0.8 + (Math.random() * 1.2 - 0.6)) * 10) / 10,
    }
  })
}

// Generate 7-day feed consumption data
function generateFeedTrend() {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const month = d.getMonth() + 1
    const day = d.getDate()
    days.push({
      day: `${month}/${day}`,
      value: 2800 + Math.floor(Math.random() * 800),
    })
  }
  return days
}

export async function GET() {
  // This route uses mock data and doesn't require a database.
  // It works seamlessly in both local and Vercel deployments.
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    farmOverview: {
      name: '极境智牧养殖基地',
      totalCapacity: 70000,
      currentInventory: 33343,
      activeBatches: 2,
      todayMortality: 5,
      todayFeed: 3200,
      environmentScore: 96,
    },
    houses: [
      {
        id: 'A1',
        name: 'A1栋',
        batchNo: 'PC-2025-002',
        breed: 'AA肉鸡',
        birds: 18658,
        age: 35,
        temperature: 24,
        humidity: 63,
        ammonia: 12,
        co2: 656,
        status: '正常',
        feedToday: 1200,
      },
      {
        id: 'A2',
        name: 'A2栋',
        batchNo: 'PC-2025-003',
        breed: '科宝500',
        birds: 14685,
        age: 28,
        temperature: 25.7,
        humidity: 66,
        ammonia: 20,
        co2: 784,
        status: '关注',
        feedToday: 980,
      },
      {
        id: 'B1',
        name: 'B1栋',
        batchNo: null,
        breed: null,
        birds: 0,
        age: 0,
        temperature: 22.4,
        humidity: 54,
        ammonia: 6,
        co2: 463,
        status: '消毒中',
        feedToday: 0,
      },
      {
        id: 'B2',
        name: 'B2栋',
        batchNo: 'PC-2025-005',
        breed: 'AA肉鸡',
        birds: 0,
        age: 0,
        temperature: 22.2,
        humidity: 49,
        ammonia: 7,
        co2: 405,
        status: '待入栏',
        feedToday: 0,
      },
    ],
    alerts: [
      {
        type: '环境预警',
        level: 'warning',
        message: 'A2栋氨气浓度偏高(20ppm)',
        time: '15分钟前',
      },
      {
        type: '设备故障',
        level: 'warning',
        message: 'B1栋温湿度传感器离线',
        time: '6小时前',
      },
      {
        type: '用药提醒',
        level: 'info',
        message: 'PC-2025-003泰乐菌素休药期提醒',
        time: '1小时前',
      },
    ],
    environmentHistory: generateEnvironmentHistory(),
    feedTrend: generateFeedTrend(),
  })
}
