// Demo data for all API routes - used when database is unavailable (Vercel deployment)

export const FARM_NAME = '极境智牧养殖基地'
export const FARM_ADDRESS = '黑龙江省哈尔滨市宾县'

// Dashboard
export const dashboardData = {
  totalInventory: 33343,
  activeBatches: 2,
  todayAlerts: 5,
  envComplianceRate: 94.2,
  recentAlerts: [
    { id: 'a1', type: '环境预警', level: 'warning', title: '3号棚氨气偏高', message: '氨气浓度达到25ppm，建议加强通风', status: '未处理', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'a2', type: '设备故障', level: 'danger', title: '2号棚风机异常', message: '3号风机转速偏低，请检查', status: '未处理', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'a3', type: '用药提醒', level: 'info', title: '第5批停药提醒', message: '恩诺沙星停药期还剩2天', status: '未处理', createdAt: new Date(Date.now() - 7200000).toISOString() },
  ],
  batchOverview: [
    { id: 'b1', batchNo: 'JJ2026-005', breed: '罗斯308', quantity: 14685, status: '养殖中', houseName: '1号棚', mortalityRate: 1.8, startDate: '2026-03-18', expectedEndDate: '2026-04-27' },
    { id: 'b2', batchNo: 'JJ2026-006', breed: '罗斯308', quantity: 18658, status: '养殖中', houseName: '2号棚', mortalityRate: 2.1, startDate: '2026-03-11', expectedEndDate: '2026-04-20' },
  ],
  weeklyStats: { totalMortality: 15, avgAmmonia: 16.5, totalFeedCost: 28500, avgWeight: 2.35 },
  environmentTrend: Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    return {
      date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
      temperature: +(23 + Math.random() * 4).toFixed(1),
      humidity: +(58 + Math.random() * 10).toFixed(1),
      ammonia: +(12 + Math.random() * 8).toFixed(1),
      co2: Math.round(750 + Math.random() * 300),
    }
  }),
  batchProduction: [
    { batchNo: 'JJ2026-005', breed: '罗斯308', houseName: '1号棚', daysSinceStart: 39, totalDays: 42, progress: 93, currentQuantity: 14685, estimatedWeight: 2.85, fcr: 1.62, stage: 'late' },
    { batchNo: 'JJ2026-006', breed: '罗斯308', houseName: '2号棚', daysSinceStart: 46, totalDays: 42, progress: 100, currentQuantity: 18658, estimatedWeight: 3.05, fcr: 1.68, stage: 'near-out' },
  ],
  recentActivities: [
    { id: 'act1', type: '用药记录', description: '第5批使用恩诺沙星', timestamp: new Date(Date.now() - 3600000).toISOString(), detail: '用量500ml，饮水给药' },
    { id: 'act2', type: '环境预警', description: '3号棚氨气预警已处理', timestamp: new Date(Date.now() - 7200000).toISOString(), detail: '已开启全部风机' },
    { id: 'act3', type: '批次操作', description: 'JJ2026-006称重记录', timestamp: new Date(Date.now() - 14400000).toISOString(), detail: '平均体重2.95kg' },
    { id: 'act4', type: '日常巡检', description: '全厂区日常巡检完成', timestamp: new Date(Date.now() - 28800000).toISOString(), detail: '各棚状态正常' },
  ],
  weeklyComparison: {
    mortality: { thisWeek: 15, lastWeek: 22, unit: '只', trend: 'down', change: -31.8 },
    feed: { thisWeek: 5.65, lastWeek: 5.20, unit: '吨', trend: 'up', change: 8.7 },
    medicineCost: { thisWeek: 2800, lastWeek: 3200, unit: '元', trend: 'down', change: -12.5 },
    envRate: { thisWeek: 94.2, lastWeek: 91.5, unit: '%', trend: 'up', change: 2.95 },
  },
  feedWater: {
    todayFeedTon: 5.65,
    todayWaterM3: 11.31,
    yesterdayFeedTon: 5.20,
    yesterdayWaterM3: 10.40,
    avgDays: 34,
    totalInventory: 33343,
    formula: '饮水量=日龄×10×数量，采食量=饮水量÷2',
    details: [
      { batchNo: 'JJ2026-005', breed: '罗斯308', daysSinceStart: 39, currentQuantity: 14685, waterMl: 572715, waterL: 572.7, feedG: 286357.5, feedKg: 286.4 },
      { batchNo: 'JJ2026-006', breed: '罗斯308', daysSinceStart: 46, currentQuantity: 18658, waterMl: 858268, waterL: 858.3, feedG: 429134, feedKg: 429.1 },
    ],
  },
}

// Environment
export const environmentData = {
  current: { temperature: 24.5, humidity: 62, ammonia: 15, co2: 850 },
  history: Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0')
    return {
      time: `${h}:00`,
      temperature: +(22 + Math.sin(i / 24 * Math.PI * 2 - 1) * 3 + Math.random()).toFixed(1),
      humidity: +(58 + Math.cos(i / 24 * Math.PI * 2) * 8 + Math.random()).toFixed(1),
      ammonia: +(12 + Math.sin(i / 24 * Math.PI) * 5 + Math.random() * 2).toFixed(1),
      co2: Math.round(750 + Math.sin(i / 12 * Math.PI) * 200 + Math.random() * 50),
    }
  }),
  houses: [
    { id: 'h1', name: '1号棚', temperature: 24.2, humidity: 61, ammonia: 14, co2: 820 },
    { id: 'h2', name: '2号棚', temperature: 25.1, humidity: 60, ammonia: 16, co2: 880 },
    { id: 'h3', name: '3号棚', temperature: 23.8, humidity: 64, ammonia: 18, co2: 920 },
    { id: 'h4', name: '4号棚', temperature: 24.6, humidity: 59, ammonia: 13, co2: 790 },
  ],
}

// Alerts
export const alertsData = {
  data: [
    { id: 'al1', farmId: 'f1', type: '环境预警', level: 'warning', title: '3号棚氨气浓度偏高', message: '当前氨气浓度25ppm，超过标准值20ppm', source: '环境传感器', status: '未读', createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'al2', farmId: 'f1', type: '设备故障', level: 'danger', title: '2号棚3号风机异常', message: '风机转速低于标准值30%', source: '设备监控', status: '未读', createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'al3', farmId: 'f1', type: '出栏锁定', level: 'critical', title: 'JJ2026-006已到出栏日龄', message: '该批次已达到42天标准出栏日龄', source: '批次管理', status: '未读', createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 12,
  unread: 5,
}

// Batches
export const batchesData = {
  data: [
    { id: 'b1', farmId: 'f1', houseId: 'h1', batchNo: 'JJ2026-005', breed: '罗斯308', quantity: 15000, startDate: '2026-03-18', expectedEndDate: '2026-04-27', actualEndDate: null, status: '养殖中', mortalityRate: 1.8, notes: '长势良好', createdAt: '2026-03-18T00:00:00.000Z', updatedAt: new Date().toISOString() },
    { id: 'b2', farmId: 'f1', houseId: 'h2', batchNo: 'JJ2026-006', breed: '罗斯308', quantity: 19000, startDate: '2026-03-11', expectedEndDate: '2026-04-20', actualEndDate: null, status: '养殖中', mortalityRate: 2.1, notes: '准备出栏', createdAt: '2026-03-11T00:00:00.000Z', updatedAt: new Date().toISOString() },
    { id: 'b3', farmId: 'f1', houseId: 'h3', batchNo: 'JJ2026-004', breed: '罗斯308', quantity: 14500, startDate: '2026-02-10', expectedEndDate: '2026-03-22', actualEndDate: '2026-03-23', status: '已出栏', mortalityRate: 2.8, notes: '平均出栏重3.1kg', createdAt: '2026-02-10T00:00:00.000Z', updatedAt: '2026-03-23T00:00:00.000Z' },
    { id: 'b4', farmId: 'f1', houseId: 'h4', batchNo: 'JJ2026-003', breed: 'AA肉鸡', quantity: 12000, startDate: '2026-01-05', expectedEndDate: '2026-02-14', actualEndDate: '2026-02-15', status: '已出栏', mortalityRate: 3.2, notes: '平均出栏重2.9kg', createdAt: '2026-01-05T00:00:00.000Z', updatedAt: '2026-02-15T00:00:00.000Z' },
  ],
  total: 4,
}

// Medications
export const medicationsData = {
  data: [
    { id: 'm1', batchId: 'b1', drugName: '恩诺沙星', drugType: '抗生素', dosage: '500ml/次', administrationMethod: '饮水', applyDate: '2026-04-24', withdrawalDays: 7, withdrawalEnd: '2026-05-01', operator: '张伟', notes: '呼吸道感染', status: '停药中', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm2', batchId: 'b2', drugName: '维生素AD3E', drugType: '营养补充', dosage: '1000g/吨料', administrationMethod: '拌料', applyDate: '2026-04-22', withdrawalDays: 0, withdrawalEnd: null, operator: '陈大勇', notes: '增强体质', status: '已完成', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 2,
}

// Health alerts
export const healthAlertsData = {
  data: [
    { id: 'ha1', batchId: 'b1', type: '死淘异常', severity: 'medium', description: '1号棚今日死淘5只，超过日均标准', aiConfidence: 85, status: '处理中', resolvedAt: null, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ha2', batchId: 'b2', type: '体重不达标', severity: 'low', description: '2号棚平均体重低于预期5%', aiConfidence: 72, status: '已处理', resolvedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 2,
}

// Costs
export const costsData = {
  data: [
    { id: 'c1', batchId: 'b1', category: '饲料', item: '肉鸡全价料', amount: 15000, quantity: 10, unit: '吨', date: '2026-04-24', operator: '陈大勇', notes: '5号棚本月饲料', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'c2', batchId: 'b1', category: '兽药', item: '恩诺沙星', amount: 350, quantity: 5, unit: '瓶', date: '2026-04-24', operator: '张伟', notes: '呼吸道治疗', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'c3', batchId: 'b2', category: '人工', item: '饲养员工资', amount: 8000, quantity: 2, unit: '人', date: '2026-04-20', operator: '王建国', notes: '本月工资', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'c4', batchId: 'b1', category: '能源', item: '电费', amount: 3200, quantity: 1, unit: '月', date: '2026-04-15', operator: '王建国', notes: '4月份电费', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 4,
}

// Feed
export const feedData = {
  data: [
    { id: 'f1', batchId: 'b1', feedType: '肉鸡前期料', quantity: 8000, unit: 'kg', supplier: '双胞胎饲料', price: 3.8, date: '2026-04-20', operator: '陈大勇', notes: '1号棚', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'f2', batchId: 'b2', feedType: '肉鸡后期料', quantity: 12000, unit: 'kg', supplier: '双胞胎饲料', price: 3.5, date: '2026-04-22', operator: '陈大勇', notes: '2号棚', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 2,
}

// Staff
export const staffData = {
  data: [
    { id: 's1', name: '张建国', role: '场长', phone: '138****5678', joinDate: '2024-01-15', status: '在岗', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 's2', name: '李明辉', role: '技术员', phone: '139****1234', joinDate: '2024-03-20', status: '在岗', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 's3', name: '张伟', role: '兽医', phone: '137****5678', joinDate: '2024-06-10', status: '在岗', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 's4', name: '陈大勇', role: '饲养员', phone: '136****9012', joinDate: '2025-01-08', status: '在岗', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 's5', name: '刘小明', role: '饲养员', phone: '135****3456', joinDate: '2025-02-15', status: '在岗', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 5,
}

// Devices
export const devicesData = {
  data: [
    { id: 'd1', name: '温湿度传感器-1号棚', type: '环境传感器', house: '1号棚', status: '在线', lastMaintenance: '2026-04-10', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd2', name: '风机-1号棚-1号', type: '通风设备', house: '1号棚', status: '运行中', lastMaintenance: '2026-04-08', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd3', name: '自动饲喂器-1号棚', type: '饲喂设备', house: '1号棚', status: '在线', lastMaintenance: '2026-04-12', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd4', name: '氨气检测仪-2号棚', type: '环境传感器', house: '2号棚', status: '在线', lastMaintenance: '2026-04-09', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd5', name: '摄像头-1号棚', type: '监控设备', house: '1号棚', status: '在线', lastMaintenance: '2026-04-05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd6', name: '风机-2号棚-2号', type: '通风设备', house: '2号棚', status: '异常', lastMaintenance: '2026-04-06', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 6,
}

// Sales
export const salesData = {
  data: [
    { id: 'sr1', batchId: 'b3', buyer: '哈尔滨肉联', quantity: 14200, avgWeight: 3.1, totalPrice: 284000, date: '2026-03-23', status: '已完成', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sr2', batchId: 'b4', buyer: '宾县食品公司', quantity: 11600, avgWeight: 2.9, totalPrice: 208800, date: '2026-02-15', status: '已完成', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 2,
}

// Vaccines
export const vaccinesData = {
  data: [
    { id: 'v1', batchId: 'b1', vaccineName: '新城疫-传支二联苗', manufacturer: '哈药集团', batchLotNo: '20260301', houseName: '1号棚', quantity: 15000, method: '饮水', operator: '张伟', applyDate: '2026-03-18', nextDate: '2026-04-18', dayAge: 1, status: '已完成', notes: '首免', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'v2', batchId: 'b1', vaccineName: '禽流感H5+H7', manufacturer: '中牧股份', batchLotNo: '20260215', houseName: '1号棚', quantity: 15000, method: '注射', operator: '张伟', applyDate: '2026-03-25', nextDate: '2026-04-25', dayAge: 8, status: '已完成', notes: '二免', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 2,
}

// Slaughter
export const slaughterData = {
  data: [
    { id: 'sl1', batchId: 'b3', batchNo: 'JJ2026-004', houseName: '3号棚', breed: '罗斯308', plannedDate: '2026-03-22', actualDate: '2026-03-23', quantity: 14200, avgWeight: 3.1, totalPrice: 284000, buyer: '哈尔滨肉联', status: '已完成', approvalBy: '王建国', approvalAt: '2026-03-22T10:00:00.000Z', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  total: 1,
}

// Monitor
export const monitorData = {
  timestamp: new Date().toISOString(),
  farmOverview: { name: FARM_NAME, totalCapacity: 70000, currentInventory: 33343, activeBatches: 2, todayMortality: 5, avgWeight: 2.35, fcr: 1.65, totalBatches: 8 },
  environment: environmentData,
  batches: batchesData.data.filter(b => b.status === '养殖中'),
  alerts: alertsData.data.slice(0, 3),
  feed: { todayFeed: 5.65, todayWater: 11.31 },
}

// Reports
export function getReportData() {
  const today = new Date().toISOString().split('T')[0]
  return {
    date: today,
    farmName: FARM_NAME,
    weather: '晴 8°C~18°C',
    overallStatus: '正常',
    sections: {
      environment: { status: '正常', temperature: '24.5°C', humidity: '62%', ammonia: '15ppm', co2: '850ppm' },
      production: { totalInventory: 33343, mortality: 5, avgWeight: '2.35kg', feedIntake: '5.65吨', waterIntake: '11.31m³' },
      health: { alerts: 2, treatments: 1, vaccinations: 0 },
      batches: [
        { batchNo: 'JJ2026-005', house: '1号棚', quantity: 14685, age: 39, status: '养殖中', progress: 93 },
        { batchNo: 'JJ2026-006', house: '2号棚', quantity: 18658, age: 46, status: '待出栏', progress: 100 },
      ],
    },
  }
}

// Financial report
export const financialData = {
  summary: { totalRevenue: 492800, totalCost: 385600, totalProfit: 107200, profitRate: 21.7, avgCostPerChicken: 11.57, avgRevenuePerChicken: 14.78 },
  monthlyData: Array.from({ length: 6 }, (_, i) => {
    const m = new Date(Date.now() - (5 - i) * 30 * 86400000)
    return {
      month: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      revenue: Math.round(80000 + Math.random() * 40000),
      cost: Math.round(60000 + Math.random() * 30000),
      profit: 0,
    }
  }).map(d => ({ ...d, profit: d.revenue - d.cost })),
  costBreakdown: [
    { category: '饲料', amount: 245000, percentage: 63.5 },
    { category: '雏鸡', amount: 55000, percentage: 14.3 },
    { category: '人工', amount: 35000, percentage: 9.1 },
    { category: '兽药疫苗', amount: 22000, percentage: 5.7 },
    { category: '能源', amount: 15600, percentage: 4.0 },
    { category: '折旧维修', amount: 13000, percentage: 3.4 },
  ],
}

// Batch comparison
export const batchComparisonData = {
  batches: [
    { batchNo: 'JJ2026-004', breed: '罗斯308', quantity: 14500, mortalityRate: 2.8, avgWeight: 3.1, fcr: 1.62, costPerKg: 8.5, days: 42 },
    { batchNo: 'JJ2026-003', breed: 'AA肉鸡', quantity: 12000, mortalityRate: 3.2, avgWeight: 2.9, fcr: 1.68, costPerKg: 8.8, days: 40 },
  ],
}

// Traceability
export const traceabilityData = {
  data: [
    { id: 't1', batchNo: 'JJ2026-004', breed: '罗斯308', source: '正大雏鸡', intakeDate: '2026-02-10', vaccineRecords: 5, medicationRecords: 2, slaughterDate: '2026-03-23', buyer: '哈尔滨肉联', weight: 3.1 },
    { id: 't2', batchNo: 'JJ2026-003', breed: 'AA肉鸡', source: '正大雏鸡', intakeDate: '2026-01-05', vaccineRecords: 5, medicationRecords: 3, slaughterDate: '2026-02-15', buyer: '宾县食品公司', weight: 2.9 },
  ],
  total: 2,
}

// Weather
export function getWeatherData() {
  return {
    current: { temp: 22, humidity: 55, wind: 12, condition: '多云', feelsLike: 20, visibility: 15, pressure: 1013, uv: 5, dewPoint: 12 },
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0].slice(5),
      day: i === 0 ? '今天' : i === 1 ? '明天' : i === 2 ? '后天' : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(Date.now() + i * 86400000).getDay()],
      high: 25 + Math.round(Math.random() * 6 - 3),
      low: 15 + Math.round(Math.random() * 4),
      condition: ['多云', '晴', '晴', '阵雨', '多云转晴', '晴', '多云'][i] || '晴',
      precipitation: [20, 5, 10, 65, 30, 5, 15][i],
      wind: 12 + Math.round(Math.random() * 10),
      humidity: 50 + Math.round(Math.random() * 20),
    })),
    alerts: [
      { level: 'warning', title: '高温预警', message: '未来3天最高气温将超过35°C，请注意防暑降温', suggestion: '加强通风，增加饮水和电解质补充' },
      { level: 'info', title: '降雨提醒', message: '预计后天有中到大雨，降水概率80%', suggestion: '提前检查鸡舍屋顶防水，做好排水准备' },
    ],
    historicalTemps: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (7 - i) * 86400000).toISOString().split('T')[0].slice(5),
      high: 23 + Math.round(Math.random() * 5),
      low: 13 + Math.round(Math.random() * 4),
      avg: 18 + Math.round(Math.random() * 4),
    })),
    farmImpact: { ventilation: '建议全开风机，保持舍内空气流通', heating: '当前气温无需供暖', feeding: '增加饮水供应量', overall: '适宜' },
  }
}

// Smart feeding (formula-based)
export function getSmartFeedingData(daysAge: number, quantity: number) {
  const waterMl = daysAge * 10 * quantity
  const feedG = waterMl / 2
  return {
    daysAge,
    quantity,
    waterPerChicken: `${daysAge * 10}ml/只/天`,
    feedPerChicken: `${(daysAge * 10 / 2).toFixed(0)}g/只/天`,
    totalWater: `${(waterMl / 1000).toFixed(1)}L`,
    totalFeed: `${(feedG / 1000).toFixed(1)}kg`,
  }
}
