import { NextResponse } from 'next/server'

export async function GET() {
  const data = {
    todaySummary: {
      electricity: 385,
      water: 12.5,
      gas: 45,
      totalCost: 2867,
      elecTrend: -3.2,
      waterTrend: 1.5,
      gasTrend: -5.0,
    },

    houseData: [
      {
        house: 'A1栋',
        electricity: 98,
        water: 3.2,
        gas: 12,
        cost: 728,
        trend: [95, 102, 98, 88, 92, 96, 98],
      },
      {
        house: 'A2栋',
        electricity: 105,
        water: 3.5,
        gas: 13,
        cost: 785,
        trend: [100, 108, 112, 99, 103, 107, 105],
      },
      {
        house: 'B1栋',
        electricity: 92,
        water: 2.8,
        gas: 11,
        cost: 682,
        trend: [88, 95, 90, 85, 89, 94, 92],
      },
      {
        house: 'B2栋',
        electricity: 90,
        water: 3.0,
        gas: 9,
        cost: 672,
        trend: [85, 92, 88, 82, 87, 91, 90],
      },
    ],

    electricityTrend: [
      { date: '06-14', value: 392, cost: 294 },
      { date: '06-15', value: 378, cost: 284 },
      { date: '06-16', value: 405, cost: 304 },
      { date: '06-17', value: 398, cost: 299 },
      { date: '06-18', value: 410, cost: 308 },
      { date: '06-19', value: 375, cost: 281 },
      { date: '06-20', value: 385, cost: 289 },
    ],

    waterTrend: [
      { date: '06-14', value: 11.8, cost: 59 },
      { date: '06-15', value: 12.3, cost: 62 },
      { date: '06-16', value: 11.5, cost: 58 },
      { date: '06-17', value: 13.0, cost: 65 },
      { date: '06-18', value: 12.1, cost: 61 },
      { date: '06-19', value: 12.8, cost: 64 },
      { date: '06-20', value: 12.5, cost: 63 },
    ],

    costBreakdown: [
      { name: '电费', value: 11550, color: '#f59e0b' },
      { name: '水费', value: 3750, color: '#3b82f6' },
      { name: '燃气费', value: 6750, color: '#f97316' },
      { name: '饲料', value: 28500, color: '#10b981' },
      { name: '人工及其他', value: 8500, color: '#8b5cf6' },
    ],

    efficiency: {
      energyPerBird: 0.0115,
      costPerKg: 1.82,
      waterPerFeed: 2.1,
      benchmarkEnergy: 0.013,
      benchmarkCost: 2.0,
      benchmarkWaterPerFeed: 2.0,
    },

    monthlyProjection: [
      { month: '1月', actual: 28500, projected: 28000 },
      { month: '2月', actual: 31200, projected: 30500 },
      { month: '3月', actual: 29800, projected: 29200 },
      { month: '4月', actual: 27500, projected: 27800 },
      { month: '5月', actual: 26400, projected: 26000 },
      { month: '6月', actual: null, projected: 25800 },
    ],

    alertRules: [
      {
        id: 1,
        type: '电力',
        threshold: '>500 kWh/天',
        level: 'warning',
        house: '全部',
        status: 'active',
        description: '单日用电量超过500kWh时发出预警',
      },
      {
        id: 2,
        type: '用水',
        threshold: '>15 m³/天',
        level: 'warning',
        house: '全部',
        status: 'active',
        description: '单日用水量超过15立方米时发出预警',
      },
      {
        id: 3,
        type: '燃气',
        threshold: '>60 m³/天',
        level: 'danger',
        house: '全部',
        status: 'active',
        description: '单日燃气用量超过60立方米时发出紧急预警',
      },
      {
        id: 4,
        type: '成本',
        threshold: '>¥3,500/天',
        level: 'danger',
        house: '全部',
        status: 'active',
        description: '单日总能源成本超过3500元时发出预警',
      },
      {
        id: 5,
        type: '电力',
        threshold: '连续3天上升',
        level: 'info',
        house: '全部',
        status: 'active',
        description: '用电量连续3天上升趋势预警',
      },
    ],
  }

  return NextResponse.json(data)
}
