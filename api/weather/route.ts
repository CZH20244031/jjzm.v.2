import { NextResponse } from 'next/server'

// Mock weather data for Binxian, Heilongjiang (宾县)
// Realistic for northeastern China near Harbin — cold winters, warm summers

function getDateStr(daysOffset: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function getDayLabel(offset: number) {
  if (offset === 0) return '今天'
  if (offset === 1) return '明天'
  if (offset === 2) return '后天'
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return weekdays[d.getDay()]
}

export async function GET() {
  const current = {
    temp: 22,
    humidity: 55,
    wind: 12,
    condition: '多云',
    feelsLike: 20,
    visibility: 15,
    pressure: 1013,
    uv: 5,
    dewPoint: 12,
  }

  // 7-day forecast with varied conditions typical of northeastern China summer
  const forecast = [
    { date: getDateStr(0), day: getDayLabel(0), high: 25, low: 15, condition: '多云', precipitation: 20, wind: 12, humidity: 55 },
    { date: getDateStr(1), day: getDayLabel(1), high: 27, low: 16, condition: '晴', precipitation: 5, wind: 8, humidity: 48 },
    { date: getDateStr(2), day: getDayLabel(2), high: 30, low: 18, condition: '晴', precipitation: 10, wind: 10, humidity: 50 },
    { date: getDateStr(3), day: getDayLabel(3), high: 28, low: 19, condition: '阵雨', precipitation: 65, wind: 15, humidity: 72 },
    { date: getDateStr(4), day: getDayLabel(4), high: 24, low: 17, condition: '雷阵雨', precipitation: 80, wind: 22, humidity: 80 },
    { date: getDateStr(5), day: getDayLabel(5), high: 26, low: 15, condition: '多云转晴', precipitation: 30, wind: 14, humidity: 60 },
    { date: getDateStr(6), day: getDayLabel(6), high: 29, low: 17, condition: '晴', precipitation: 5, wind: 9, humidity: 45 },
  ]

  // Weather alerts
  const alerts = [
    {
      level: 'warning',
      title: '高温预警',
      message: '未来3天最高气温将超过35°C，请注意防暑降温',
      suggestion: '加强通风，增加饮水和电解质补充，适当降低饲养密度，开启湿帘降温系统',
    },
    {
      level: 'info',
      title: '降雨提醒',
      message: '预计后天有中到大雨，降水概率80%',
      suggestion: '提前检查鸡舍屋顶防水，做好排水准备，储备饲料防止受潮',
    },
    {
      level: 'danger',
      title: '大风蓝色预警',
      message: '后天预计风力5-6级，阵风可达7级',
      suggestion: '加固鸡舍门窗和围栏，暂停室外作业，检查供电线路安全',
    },
  ]

  // Historical 7-day temperature data for chart
  const historicalTemps = [
    { date: getDateStr(-7), high: 23, low: 13, avg: 18 },
    { date: getDateStr(-6), high: 25, low: 14, avg: 20 },
    { date: getDateStr(-5), high: 21, low: 12, avg: 17 },
    { date: getDateStr(-4), high: 19, low: 11, avg: 15 },
    { date: getDateStr(-3), high: 22, low: 13, avg: 18 },
    { date: getDateStr(-2), high: 26, low: 15, avg: 21 },
    { date: getDateStr(-1), high: 24, low: 14, avg: 19 },
  ]

  // Farm impact analysis
  const farmImpact = {
    ventilation: '建议全开风机，保持舍内空气流通，降低氨气浓度',
    heating: '当前气温无需供暖，夜间低温时可适当关闭部分通风口',
    feeding: '增加饮水供应量，饲料中适量添加电解质和维生素C',
    overall: '适宜',
  }

  return NextResponse.json({
    current,
    forecast,
    alerts,
    historicalTemps,
    farmImpact,
  })
}
