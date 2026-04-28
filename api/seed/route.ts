import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function POST() {
  const demoCheck = await withDemoFallback(() => ({
    success: true, message: '演示模式：数据库种子数据已就绪（无需重新生成）'
  }))
  if (demoCheck) return demoCheck

  try {
    // Delete existing data in reverse order due to foreign keys
    await db.slaughterRecord.deleteMany()
    await db.salesRecord.deleteMany()
    await db.vaccineRecord.deleteMany()
    await db.staff.deleteMany()
    await db.feedRecord.deleteMany()
    await db.schedulePlan.deleteMany()
    await db.alert.deleteMany()
    await db.costRecord.deleteMany()
    await db.healthAlert.deleteMany()
    await db.medicationRecord.deleteMany()
    await db.environmentRecord.deleteMany()
    await db.chickenBatch.deleteMany()
    await db.device.deleteMany()
    await db.chickenHouse.deleteMany()
    await db.farm.deleteMany()

    const now = new Date()

    // ==================== Farm ====================
    const farm = await db.farm.create({
      data: {
        name: '极境智牧养殖基地',
        address: '黑龙江省哈尔滨市宾县',
        owner: '张建国',
        phone: '138-0451-8888',
      },
    })

    // ==================== Chicken Houses ====================
    const houses = await Promise.all([
      db.chickenHouse.create({
        data: {
          farmId: farm.id,
          name: 'A1栋',
          capacity: 20000,
          status: '养殖中',
        },
      }),
      db.chickenHouse.create({
        data: {
          farmId: farm.id,
          name: 'A2栋',
          capacity: 15000,
          status: '养殖中',
        },
      }),
      db.chickenHouse.create({
        data: {
          farmId: farm.id,
          name: 'B1栋',
          capacity: 20000,
          status: '消毒中',
        },
      }),
      db.chickenHouse.create({
        data: {
          farmId: farm.id,
          name: 'B2栋',
          capacity: 15000,
          status: '空闲',
        },
      }),
    ])

    // ==================== Chicken Batches ====================
    const batches = await Promise.all([
      db.chickenBatch.create({
        data: {
          farmId: farm.id,
          houseId: houses[0].id,
          batchNo: 'PC-2025-001',
          breed: 'AA肉鸡',
          quantity: 20000,
          startDate: new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
          status: '已出栏',
          mortalityRate: 3.2,
          notes: '第42天出栏，均重2.85kg，料肉比1.58',
        },
      }),
      db.chickenBatch.create({
        data: {
          farmId: farm.id,
          houseId: houses[0].id,
          batchNo: 'PC-2025-002',
          breed: 'AA肉鸡',
          quantity: 19000,
          startDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: '养殖中',
          mortalityRate: 1.8,
          notes: '当前日龄35天，长势良好',
        },
      }),
      db.chickenBatch.create({
        data: {
          farmId: farm.id,
          houseId: houses[1].id,
          batchNo: 'PC-2025-003',
          breed: '科宝500',
          quantity: 15000,
          startDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          status: '养殖中',
          mortalityRate: 2.1,
          notes: '28天龄，出现轻微呼吸道症状',
        },
      }),
      db.chickenBatch.create({
        data: {
          farmId: farm.id,
          houseId: houses[2].id,
          batchNo: 'PC-2025-004',
          breed: '罗斯308',
          quantity: 18000,
          startDate: new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          status: '已出栏',
          mortalityRate: 4.5,
          notes: '因新城疫提前出栏，成活率偏低',
        },
      }),
      db.chickenBatch.create({
        data: {
          farmId: farm.id,
          houseId: houses[3].id,
          batchNo: 'PC-2025-005',
          breed: 'AA肉鸡',
          quantity: 15000,
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(now.getTime() + 49 * 24 * 60 * 60 * 1000),
          status: '待入栏',
          mortalityRate: 0,
          notes: '计划7天后入栏，雏鸡已预订',
        },
      }),
    ])

    // ==================== Devices (16 devices across 4 houses + public) ====================
    const deviceData = [
      // A1栋设备 (5台)
      { farmId: farm.id, houseId: houses[0].id, name: '温湿度传感器-A1-01', type: '传感器', model: 'TH-Pro 2000', status: '在线', location: 'A1栋东侧中部', lastOnlineAt: new Date(now.getTime() - 2 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[0].id, name: '氨气检测器-A1-01', type: '传感器', model: 'NH3-Sense V3', status: '在线', location: 'A1栋北侧入口', lastOnlineAt: new Date(now.getTime() - 1 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[0].id, name: '监控摄像头-A1-01', type: '摄像头', model: 'HK-DS2CD2T47', status: '在线', location: 'A1栋中央过道', lastOnlineAt: new Date(now.getTime() - 5 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[0].id, name: '环控控制器-A1-01', type: '控制器', model: 'Munters EPC-60', status: '在线', location: 'A1栋设备间', lastOnlineAt: new Date(now.getTime() - 3 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[0].id, name: 'LED照明-A1-01', type: '照明', model: 'AGRI-Light 200W', status: '在线', location: 'A1栋顶部中线', lastOnlineAt: new Date(now.getTime() - 4 * 60 * 1000) },
      // A2栋设备 (4台)
      { farmId: farm.id, houseId: houses[1].id, name: '温湿度传感器-A2-01', type: '传感器', model: 'TH-Pro 2000', status: '在线', location: 'A2栋西侧中部', lastOnlineAt: new Date(now.getTime() - 1 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[1].id, name: '氨气检测器-A2-01', type: '传感器', model: 'NH3-Sense V3', status: '在线', location: 'A2栋南侧入口', lastOnlineAt: new Date(now.getTime() - 3 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[1].id, name: '监控摄像头-A2-01', type: '摄像头', model: 'HK-DS2CD2T47', status: '故障', location: 'A2栋中央过道', lastOnlineAt: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[1].id, name: '通风风机-A2-01', type: '通风机', model: 'MB-36寸', status: '维护', location: 'A2栋北侧风机墙', lastOnlineAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      // B1栋设备 (3台)
      { farmId: farm.id, houseId: houses[2].id, name: '温湿度传感器-B1-01', type: '传感器', model: 'TH-Pro 2000', status: '离线', location: 'B1栋中部', lastOnlineAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[2].id, name: '通风风机-B1-01', type: '通风机', model: 'MB-36寸', status: '离线', location: 'B1栋南侧风机墙', lastOnlineAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[2].id, name: '消毒控制器-B1-01', type: '控制器', model: 'AGRI-DC V2.0', status: '在线', location: 'B1栋入口消毒区', lastOnlineAt: new Date(now.getTime() - 2 * 60 * 1000) },
      // B2栋设备 (2台)
      { farmId: farm.id, houseId: houses[3].id, name: '温湿度传感器-B2-01', type: '传感器', model: 'TH-Pro 2000', status: '在线', location: 'B2栋中部', lastOnlineAt: new Date(now.getTime() - 10 * 60 * 1000) },
      { farmId: farm.id, houseId: houses[3].id, name: '照明控制器-B2-01', type: '照明', model: 'AGRI-Light 150W', status: '在线', location: 'B2栋顶部', lastOnlineAt: new Date(now.getTime() - 8 * 60 * 1000) },
      // 公共设备 (2台)
      { farmId: farm.id, houseId: null, name: '气象站-01', type: '传感器', model: 'Davis Vantage Vue', status: '在线', location: '场区中心', lastOnlineAt: new Date(now.getTime() - 1 * 60 * 1000) },
      { farmId: farm.id, houseId: null, name: '中央控制系统', type: '控制器', model: 'AGRI-MC V5.0', status: '在线', location: '办公楼机房', lastOnlineAt: new Date(now.getTime() - 30 * 1000) },
    ]

    await Promise.all(
      deviceData.map((d) =>
        db.device.create({
          data: {
            ...d,
            lastPing: d.lastOnlineAt,
          },
        })
      )
    )

    // ==================== Environment Records (30 days of data) ====================
    const envRecords: { houseId: string; temperature: number; humidity: number; ammonia: number; co2: number; windSpeed: number; createdAt: Date }[] = []

    // Base values for each house
    const houseEnvBase = [
      { tempBase: 23.5, humBase: 62, nh3Base: 12, co2Base: 680 },  // A1 - good
      { tempBase: 25.1, humBase: 70, nh3Base: 18, co2Base: 820 },  // A2 - slightly high
      { tempBase: 21.0, humBase: 55, nh3Base: 8, co2Base: 420 },    // B1 - offline/disinfecting
      { tempBase: 20.5, humBase: 50, nh3Base: 5, co2Base: 380 },    // B2 - idle
    ]

    // Last 24h: every 15min (96 points per house)
    for (let i = 0; i < 96; i++) {
      const timestamp = new Date(now.getTime() - (96 - i) * 15 * 60 * 1000)
      for (let h = 0; h < 4; h++) {
        const base = houseEnvBase[h]
        const hourOfDay = timestamp.getHours()
        const dayNightOffset = Math.sin((hourOfDay - 6) * Math.PI / 12) * 2
        envRecords.push({
          houseId: houses[h].id,
          temperature: Math.round((base.tempBase + dayNightOffset + (Math.random() - 0.5) * 2) * 10) / 10,
          humidity: Math.round((base.humBase + (Math.random() - 0.5) * 8) * 10) / 10,
          ammonia: Math.round((base.nh3Base + (Math.random() - 0.5) * 6) * 10) / 10,
          co2: Math.round((base.co2Base + (Math.random() - 0.5) * 120) * 10) / 10,
          windSpeed: Math.round((1.2 + (Math.random() - 0.5) * 0.8) * 10) / 10,
          createdAt: timestamp,
        })
      }
    }

    // 1-7 days ago: every 1h (168 points per house)
    for (let day = 1; day <= 6; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now.getTime() - (day * 24 + 24 - hour) * 60 * 60 * 1000)
        for (let h = 0; h < 4; h++) {
          const base = houseEnvBase[h]
          const dayNightOffset = Math.sin((hour - 6) * Math.PI / 12) * 2
          // Simulate gradual drift over days
          const drift = (Math.random() - 0.5) * 0.5
          envRecords.push({
            houseId: houses[h].id,
            temperature: Math.round((base.tempBase + dayNightOffset + drift + (Math.random() - 0.5) * 2) * 10) / 10,
            humidity: Math.round((base.humBase + drift + (Math.random() - 0.5) * 8) * 10) / 10,
            ammonia: Math.round((base.nh3Base + (Math.random() - 0.5) * 6) * 10) / 10,
            co2: Math.round((base.co2Base + (Math.random() - 0.5) * 120) * 10) / 10,
            windSpeed: Math.round((1.2 + (Math.random() - 0.5) * 0.8) * 10) / 10,
            createdAt: timestamp,
          })
        }
      }
    }

    // 8-30 days ago: every 4h (132 points per house)
    for (let day = 7; day <= 29; day++) {
      for (let hour = 0; hour < 24; hour += 4) {
        const timestamp = new Date(now.getTime() - (day * 24 + 24 - hour) * 60 * 60 * 1000)
        for (let h = 0; h < 4; h++) {
          const base = houseEnvBase[h]
          const dayNightOffset = Math.sin((hour - 6) * Math.PI / 12) * 2
          const drift = (Math.random() - 0.5) * 1.0
          envRecords.push({
            houseId: houses[h].id,
            temperature: Math.round((base.tempBase + dayNightOffset + drift + (Math.random() - 0.5) * 2) * 10) / 10,
            humidity: Math.round((base.humBase + drift + (Math.random() - 0.5) * 8) * 10) / 10,
            ammonia: Math.round((base.nh3Base + (Math.random() - 0.5) * 6) * 10) / 10,
            co2: Math.round((base.co2Base + (Math.random() - 0.5) * 120) * 10) / 10,
            windSpeed: Math.round((1.2 + (Math.random() - 0.5) * 0.8) * 10) / 10,
            createdAt: timestamp,
          })
        }
      }
    }

    // Batch insert environment records in chunks to avoid SQLite limits
    const chunkSize = 500
    for (let i = 0; i < envRecords.length; i += chunkSize) {
      await db.environmentRecord.createMany({
        data: envRecords.slice(i, i + chunkSize),
      })
    }

    // ==================== Medication Records (8+) ====================
    const medicationData = [
      {
        batchId: batches[1].id, drugName: '新霉素可溶性粉', drugType: '抗生素', dosage: '100g/100L水',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        withdrawalDays: 7, operator: '王大明', notes: '预防肠道感染',
      },
      {
        batchId: batches[1].id, drugName: '新城疫-传染性支气管炎二联苗', drugType: '疫苗', dosage: '1羽份/只',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        withdrawalDays: 0, operator: '李技术员', notes: '14日龄首免',
      },
      {
        batchId: batches[1].id, drugName: '法氏囊炎疫苗', drugType: '疫苗', dosage: '1.5羽份/只',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        withdrawalDays: 0, operator: '李技术员', notes: '24日龄二免',
      },
      {
        batchId: batches[2].id, drugName: '泰乐菌素', drugType: '抗生素', dosage: '200g/吨料',
        administrationMethod: '拌料', applyDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        withdrawalDays: 5, operator: '王大明', notes: '治疗轻微呼吸道感染',
      },
      {
        batchId: batches[2].id, drugName: '维生素C电解质', drugType: '营养剂', dosage: '500g/1000L水',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        withdrawalDays: 0, operator: '赵助理', notes: '抗应激',
      },
      {
        batchId: batches[0].id, drugName: '球虫疫苗', drugType: '疫苗', dosage: '1羽份/只',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
        withdrawalDays: 0, operator: '李技术员', notes: '1日龄免疫',
      },
      {
        batchId: batches[0].id, drugName: '恩诺沙星', drugType: '抗生素', dosage: '150g/100L水',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        withdrawalDays: 10, operator: '王大明', notes: '治疗大肠杆菌',
      },
      {
        batchId: batches[0].id, drugName: '癸甲溴铵消毒液', drugType: '消毒剂', dosage: '1:500稀释',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        withdrawalDays: 0, operator: '赵助理', notes: '出栏前饮水消毒',
      },
      {
        batchId: batches[3].id, drugName: '新城疫IV系苗', drugType: '疫苗', dosage: '2羽份/只',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        withdrawalDays: 0, operator: '李技术员', notes: '7日龄首免',
      },
      {
        batchId: batches[3].id, drugName: '阿莫西林可溶性粉', drugType: '抗生素', dosage: '250g/100L水',
        administrationMethod: '饮水', applyDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        withdrawalDays: 7, operator: '王大明', notes: '继发感染治疗',
      },
    ]

    await Promise.all(
      medicationData.map((m) => {
        const withdrawalEnd = new Date(m.applyDate.getTime() + m.withdrawalDays * 24 * 60 * 60 * 1000)
        let status = '已记录'
        if (m.withdrawalDays > 0 && withdrawalEnd > now) {
          status = '休药中'
        } else if (m.withdrawalDays > 0 && withdrawalEnd <= now) {
          status = '已过休药期'
        }
        return db.medicationRecord.create({
          data: { ...m, withdrawalEnd, status },
        })
      })
    )

    // ==================== Health Alerts (10+) ====================
    const healthAlertData = [
      {
        batchId: batches[2].id, type: '呼吸道异常', severity: '高',
        description: 'A2栋鸡群出现打喷嚏、甩鼻症状，AI视觉检测到约8%个体存在呼吸道异常行为',
        aiConfidence: 87.5, status: '处理中',
      },
      {
        batchId: batches[1].id, type: '采食下降', severity: '一般',
        description: 'A1栋采食量较昨日下降5%，需持续关注',
        aiConfidence: 72.3, status: '待处理',
      },
      {
        batchId: batches[3].id, type: '活动异常', severity: '紧急',
        description: 'B1栋鸡群活动量骤降60%，结合高死亡率判断可能存在疫病',
        aiConfidence: 93.1, status: '已解决', resolvedAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batches[1].id, type: '扎堆行为', severity: '一般',
        description: 'A1栋东侧区域检测到鸡群扎堆现象，疑似温度偏低',
        aiConfidence: 68.9, status: '已解决', resolvedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batches[2].id, type: '冷应激', severity: '低',
        description: '夜间温度骤降导致A2栋鸡群出现轻微冷应激反应',
        aiConfidence: 55.2, status: '已忽略',
      },
      {
        batchId: batches[1].id, type: '采食下降', severity: '低',
        description: 'A1栋当日饮水量正常但采食量略有下降',
        aiConfidence: 45.0, status: '已忽略',
      },
      {
        batchId: batches[3].id, type: '呼吸道异常', severity: '高',
        description: 'B1栋鸡群出现呼吸急促，死亡率上升至4.5%',
        aiConfidence: 91.0, status: '已解决', resolvedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batches[2].id, type: '活动异常', severity: '一般',
        description: 'A2栋部分鸡只精神萎靡，卧地不起比例增加',
        aiConfidence: 76.8, status: '待处理',
      },
      {
        batchId: batches[1].id, type: '扎堆行为', severity: '高',
        description: 'A1栋凌晨3点检测到大面积扎堆，温度传感器显示22.1℃偏低',
        aiConfidence: 89.2, status: '处理中',
      },
      {
        batchId: batches[0].id, type: '采食下降', severity: '低',
        description: '出栏前三天采食量自然下降，属于正常现象',
        aiConfidence: 30.0, status: '已忽略',
      },
      {
        batchId: batches[2].id, type: '冷应激', severity: '紧急',
        description: '寒潮来袭，A2栋舍内温度降至19.5℃，鸡群出现明显冷应激',
        aiConfidence: 95.6, status: '处理中',
      },
      {
        batchId: batches[1].id, type: '活动异常', severity: '一般',
        description: 'AI检测到A1栋西侧鸡只活动减少，建议人工巡检',
        aiConfidence: 62.5, status: '待处理',
      },
    ]

    await Promise.all(
      healthAlertData.map((a, i) =>
        db.healthAlert.create({
          data: {
            ...a,
            createdAt: new Date(now.getTime() - (i + 1) * 4 * 60 * 60 * 1000),
          },
        })
      )
    )

    // ==================== Cost Records (15+) ====================
    const costData = [
      // Batch 1 (已出栏)
      { batchId: batches[0].id, category: '饲料', item: '肉鸡全价料（前期）', amount: 45000, quantity: 15000, unit: 'kg', date: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[0].id, category: '饲料', item: '肉鸡全价料（中期）', amount: 78000, quantity: 26000, unit: 'kg', date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[0].id, category: '饲料', item: '肉鸡全价料（后期）', amount: 92000, quantity: 30000, unit: 'kg', date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[0].id, category: '药品', item: '疫苗及药品', amount: 8500, quantity: 1, unit: '批', date: new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000), operator: '王大明' },
      { batchId: batches[0].id, category: '能耗', item: '电费（6周）', amount: 12000, quantity: 12000, unit: 'kWh', date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), operator: '行政部' },
      { batchId: batches[0].id, category: '人工', item: '饲养员工资', amount: 18000, quantity: 2, unit: '人', date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), operator: '人事部' },
      // Batch 2 (养殖中)
      { batchId: batches[1].id, category: '饲料', item: '肉鸡全价料（前期）', amount: 42000, quantity: 14000, unit: 'kg', date: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[1].id, category: '饲料', item: '肉鸡全价料（中期）', amount: 65000, quantity: 22000, unit: 'kg', date: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[1].id, category: '药品', item: '疫苗及抗生素', amount: 6800, quantity: 1, unit: '批', date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), operator: '王大明' },
      { batchId: batches[1].id, category: '能耗', item: '电费（当前月）', amount: 5800, quantity: 5800, unit: 'kWh', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), operator: '行政部' },
      { batchId: batches[1].id, category: '人工', item: '饲养员工资', amount: 9000, quantity: 1, unit: '人', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), operator: '人事部' },
      // Batch 3 (养殖中)
      { batchId: batches[2].id, category: '饲料', item: '肉鸡全价料（前期）', amount: 32000, quantity: 10000, unit: 'kg', date: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[2].id, category: '饲料', item: '肉鸡全价料（中期）', amount: 48000, quantity: 16000, unit: 'kg', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[2].id, category: '药品', item: '泰乐菌素及电解质', amount: 5200, quantity: 1, unit: '批', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), operator: '王大明' },
      { batchId: batches[2].id, category: '设备', item: '温湿度传感器更换', amount: 2800, quantity: 1, unit: '台', date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), operator: '维修组' },
      // Batch 4 (已出栏)
      { batchId: batches[3].id, category: '饲料', item: '全程饲料', amount: 210000, quantity: 70000, unit: 'kg', date: new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000), operator: '张采购' },
      { batchId: batches[3].id, category: '药品', item: '疫苗及药品（含疫病治疗）', amount: 15000, quantity: 1, unit: '批', date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), operator: '王大明' },
      { batchId: batches[3].id, category: '其他', item: '提前出栏损失补偿', amount: 12000, quantity: 1, unit: '次', date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), operator: '财务部' },
    ]

    await Promise.all(
      costData.map((c) => db.costRecord.create({ data: c }))
    )

    // ==================== System Alerts (10+) ====================
    const alertData = [
      {
        farmId: farm.id, type: '环境预警', level: 'warning', title: 'A2栋氨气浓度偏高',
        message: 'A2栋氨气浓度达到22ppm，超过标准值15ppm，建议增加通风量', source: '传感器', status: '未读',
      },
      {
        farmId: farm.id, type: '环境预警', level: 'danger', title: 'A2栋温度异常',
        message: '寒潮导致A2栋温度降至19.5℃，低于适宜温度下限22℃', source: '传感器', status: '未读',
      },
      {
        farmId: farm.id, type: '设备故障', level: 'warning', title: 'B1栋温湿度传感器离线',
        message: 'B1栋温湿度传感器-B1-01已离线超过6小时，请检查设备连接', source: '设备监控', status: '已读',
      },
      {
        farmId: farm.id, type: '设备故障', level: 'info', title: 'B1栋通风风机离线',
        message: 'B1栋通风风机-B1-01离线（B1栋正在消毒中）', source: '设备监控', status: '已处理',
      },
      {
        farmId: farm.id, type: '用药提醒', level: 'warning', title: 'PC-2025-003泰乐菌素休药期提醒',
        message: '批次PC-2025-003的泰乐菌素休药期将于2天后结束，请勿提前出栏', source: '用药管理', status: '未读',
      },
      {
        farmId: farm.id, type: '出栏锁定', level: 'critical', title: 'PC-2025-003出栏锁定警告',
        message: '批次PC-2025-003处于休药期内，系统已锁定出栏操作。预计3天后解除锁定', source: '用药管理', status: '未读',
      },
      {
        farmId: farm.id, type: '环境预警', level: 'info', title: 'A1栋环境指标正常',
        message: 'A1栋所有环境指标均在适宜范围内，继续保持当前管理', source: '传感器', status: '已读',
      },
      {
        farmId: farm.id, type: '系统通知', level: 'info', title: '系统数据备份完成',
        message: '每日自动数据备份已于凌晨3:00完成，共备份数据记录12,845条', source: '系统', status: '已读',
      },
      {
        farmId: farm.id, type: '环境预警', level: 'warning', title: 'A1栋CO2浓度偏高',
        message: 'A1栋CO2浓度达到850ppm，接近警戒值1000ppm', source: '传感器', status: '未读',
      },
      {
        farmId: farm.id, type: '系统通知', level: 'info', title: 'PC-2025-005入栏提醒',
        message: '批次PC-2025-005计划于7天后入栏B2栋，请提前完成入栏准备工作', source: '批次管理', status: '未读',
      },
      {
        farmId: farm.id, type: '用药提醒', level: 'info', title: 'PC-2025-002即将到期疫苗',
        message: '批次PC-2025-002的传染性支气管炎二联苗二免将在10天后到期', source: '用药管理', status: '未读',
      },
      {
        farmId: farm.id, type: '环境预警', level: 'danger', title: 'A2栋湿度超标',
        message: 'A2栋湿度达到78%，超过标准上限75%，需立即开启除湿设备', source: '传感器', status: '未读',
      },
    ]

    await Promise.all(
      alertData.map((a, i) =>
        db.alert.create({
          data: {
            ...a,
            createdAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000),
          },
        })
      )
    )

    // ==================== Schedule Plans (15+) ====================
    const scheduleData = [
      {
        title: '新城疫-传支二联苗 二免',
        description: '批次PC-2025-002第28天新城疫-传染性支气管炎二联苗加强免疫，饮水接种',
        type: '疫苗接种', priority: '高', status: '待执行', batchNo: 'PC-2025-002', houseName: 'A1栋',
        scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), assignee: '李技术员',
      },
      {
        title: '禽流感疫苗首免',
        description: '批次PC-2025-003第35天禽流感H5+H7三价苗注射接种',
        type: '疫苗接种', priority: '高', status: '进行中', batchNo: 'PC-2025-003', houseName: 'A2栋',
        scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), assignee: '李技术员',
      },
      {
        title: 'A1栋全面消毒',
        description: '批次PC-2025-002预计7天后出栏，提前准备出栏后A1栋空舍消毒流程',
        type: '消毒计划', priority: '中', status: '待执行', batchNo: 'PC-2025-002', houseName: 'A1栋',
        scheduledDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), assignee: '赵助理',
      },
      {
        title: 'B1栋空舍熏蒸消毒',
        description: '使用甲醛+高锰酸钾熏蒸消毒，密闭24小时后通风',
        type: '消毒计划', priority: '高', status: '进行中', houseName: 'B1栋',
        scheduledDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), assignee: '赵助理',
      },
      {
        title: 'A2栋通风风机维护',
        description: '检查并润滑A2栋全部6台风机，更换磨损皮带，测试运行参数',
        type: '设备维护', priority: '中', status: '待执行', houseName: 'A2栋',
        scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), assignee: '维修组',
      },
      {
        title: 'B2栋温湿度传感器校准',
        description: '新批次入栏前校准B2栋全部温湿度传感器，确保数据准确性',
        type: '设备维护', priority: '高', status: '待执行', houseName: 'B2栋',
        scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), assignee: '维修组',
      },
      {
        title: '6月份饲料采购计划',
        description: '采购肉鸡全价料（前期）20吨、全价料（中期）30吨、全价料（后期）25吨，预算18.5万元',
        type: '饲料采购', priority: '高', status: '进行中',
        scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), assignee: '张采购',
      },
      {
        title: '维生素预混料紧急补充',
        description: '当前库存仅剩3天用量，紧急采购维生素预混料500kg',
        type: '饲料采购', priority: '高', status: '已完成',
        scheduledDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), assignee: '张采购',
      },
      {
        title: '下周夜班排班表',
        description: '安排6月第二周A1/A2栋夜班饲养员轮值，每栋2人轮换',
        type: '人员安排', priority: '中', status: '待执行',
        scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), assignee: '张建国',
      },
      {
        title: '新员工入职培训',
        description: '2名新入职饲养员岗前培训：操作规范、安全须知、应急处理流程',
        type: '人员安排', priority: '低', status: '已完成',
        scheduledDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), assignee: '张建国',
      },
      {
        title: 'A1栋环境全面检测',
        description: '检测A1栋温度、湿度、氨气、CO2、风速、光照强度等6项指标，生成检测报告',
        type: '环境检测', priority: '中', status: '待执行', houseName: 'A1栋',
        scheduledDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), assignee: '李技术员',
      },
      {
        title: '水质检测',
        description: '检测养殖场水源大肠杆菌、重金属、pH值等指标，每季度一次',
        type: '环境检测', priority: '中', status: '已完成',
        scheduledDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), assignee: '李技术员',
      },
      {
        title: 'PC-2025-002出栏准备',
        description: '批次PC-2025-002预计7天后出栏，联系屠宰场、安排运输车辆、提前禁食',
        type: '出栏计划', priority: '高', status: '待执行', batchNo: 'PC-2025-002', houseName: 'A1栋',
        scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), assignee: '张建国',
      },
      {
        title: 'PC-2025-003紧急出栏评估',
        description: '因呼吸道疾病影响，评估PC-2025-003是否需要提前出栏，计算经济损失',
        type: '出栏计划', priority: '高', status: '已逾期', batchNo: 'PC-2025-003', houseName: 'A2栋',
        scheduledDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), assignee: '张建国',
      },
      {
        title: 'PC-2025-005入栏准备',
        description: '新批次PC-2025-005计划7天后入栏B2栋，准备鸡舍预热、设备检查、物资到位',
        type: '出栏计划', priority: '中', status: '进行中', batchNo: 'PC-2025-005', houseName: 'B2栋',
        scheduledDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), assignee: '赵助理',
      },
      {
        title: '法氏囊炎疫苗 三免',
        description: '批次PC-2025-003第35天法氏囊炎疫苗第三次免疫',
        type: '疫苗接种', priority: '中', status: '已完成', batchNo: 'PC-2025-003', houseName: 'A2栋',
        scheduledDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), assignee: '李技术员',
      },
      {
        title: '粪污处理系统检修',
        description: '季度维护粪污处理设备，清理管道，检查电机运行状态',
        type: '设备维护', priority: '低', status: '已逾期', houseName: '全场',
        scheduledDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), assignee: '维修组',
      },
      {
        title: 'C1栋新建鸡舍验收',
        description: '新建C1栋鸡舍竣工验收，检查通风系统、温控系统、饮水系统',
        type: '其他', priority: '中', status: '待执行',
        scheduledDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000), assignee: '张建国',
      },
    ]

    await Promise.all(
      scheduleData.map((s) => db.schedulePlan.create({ data: s }))
    )

    // ==================== Feed Records (18) ====================
    const feedData = [
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡前期料', quantity: 580, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 3.2, totalCost: 1856, recordDate: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000), operator: '张采购', notes: 'AA肉鸡前期开口料' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡中期料', quantity: 850, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 3.05, totalCost: 2592.5, recordDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '转中期料' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡后期料', quantity: 1100, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 2.95, totalCost: 3245, recordDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '出栏前催肥' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡后期料', quantity: 1050, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 2.95, totalCost: 3097.5, recordDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '预混料', quantity: 50, unit: 'kg', supplier: '正大集团', unitPrice: 8.5, totalCost: 425, recordDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), operator: '赵助理', notes: '维生素+矿物质预混' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡后期料', quantity: 980, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 2.95, totalCost: 2891, recordDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡后期料', quantity: 950, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 2.95, totalCost: 2802.5, recordDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡前期料', quantity: 420, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.35, totalCost: 1407, recordDate: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '科宝500前期料' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡中期料', quantity: 680, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.15, totalCost: 2142, recordDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡中期料', quantity: 720, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.15, totalCost: 2268, recordDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), operator: '赵助理', notes: '呼吸道感染期间减少投喂量' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡中期料', quantity: 650, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.15, totalCost: 2047.5, recordDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '预混料', quantity: 35, unit: 'kg', supplier: '正大集团', unitPrice: 8.5, totalCost: 297.5, recordDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), operator: '赵助理', notes: '抗应激营养补充' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡中期料', quantity: 700, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.15, totalCost: 2205, recordDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡后期料', quantity: 680, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.0, totalCost: 2040, recordDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), operator: '张采购', notes: '转入后期料' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '肉鸡后期料', quantity: 920, unit: 'kg', supplier: '哈铁饲料公司', unitPrice: 2.95, totalCost: 2714, recordDate: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), operator: '张采购', notes: '今日投喂' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '肉鸡后期料', quantity: 660, unit: 'kg', supplier: '北大荒饲料', unitPrice: 3.0, totalCost: 1980, recordDate: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), operator: '赵助理', notes: '今日投喂' },
      { batchId: batches[1].id, houseName: 'A1栋', feedType: '其他', quantity: 25, unit: 'kg', supplier: '生物科技', unitPrice: 15.0, totalCost: 375, recordDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), operator: '李技术员', notes: '微生态制剂-肠道调理' },
      { batchId: batches[2].id, houseName: 'A2栋', feedType: '其他', quantity: 20, unit: 'kg', supplier: '生物科技', unitPrice: 15.0, totalCost: 300, recordDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), operator: '李技术员', notes: '微生态制剂-呼吸道辅助' },
    ]

    await Promise.all(
      feedData.map((f) => db.feedRecord.create({ data: f }))
    )

    // ==================== Staff Members (12) ====================
    const staffData = [
      { name: '张建国', role: '场长', phone: '138-0451-8888', department: '管理部', houseName: '全场', status: '在岗', joinDate: new Date(now.getTime() - 365 * 5 * 24 * 60 * 60 * 1000), avatar: '张', skills: '养殖管理,团队管理,经营决策' },
      { name: '李技术员', role: '技术员', phone: '139-0451-6666', department: '生产部', houseName: '全场', status: '在岗', joinDate: new Date(now.getTime() - 365 * 3 * 24 * 60 * 60 * 1000), avatar: '李', skills: '疫苗接种,环境监测,疫病诊断' },
      { name: '王大明', role: '饲养员', phone: '150-0461-1234', department: '生产部', houseName: 'A1', status: '在岗', joinDate: new Date(now.getTime() - 365 * 2 * 24 * 60 * 60 * 1000), avatar: '王', skills: '肉鸡饲养,日常巡检,饲料配比' },
      { name: '赵助理', role: '饲养员', phone: '151-0461-5678', department: '生产部', houseName: 'A2', status: '在岗', joinDate: new Date(now.getTime() - 365 * 1.5 * 24 * 60 * 60 * 1000), avatar: '赵', skills: '肉鸡饲养,消毒作业,设备操作' },
      { name: '孙兽医', role: '兽医', phone: '137-0451-3333', department: '兽医部', houseName: '全场', status: '在岗', joinDate: new Date(now.getTime() - 365 * 4 * 24 * 60 * 60 * 1000), avatar: '孙', skills: '禽病诊疗,疫苗接种,药理分析' },
      { name: '陈小雪', role: '饲养员', phone: '152-0461-9012', department: '生产部', houseName: 'B1', status: '培训中', joinDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), avatar: '陈', skills: '新手培训,基础饲养' },
      { name: '刘师傅', role: '主管', phone: '136-0451-7777', department: '后勤部', houseName: '全场', status: '在岗', joinDate: new Date(now.getTime() - 365 * 6 * 24 * 60 * 60 * 1000), avatar: '刘', skills: '设备维修,水电管理,消防' },
      { name: '周强', role: '饲养员', phone: '153-0461-3456', department: '生产部', houseName: 'B2', status: '休假', joinDate: new Date(now.getTime() - 365 * 1 * 24 * 60 * 60 * 1000), avatar: '周', skills: '肉鸡饲养,环控操作' },
      { name: '吴芳', role: '技术员', phone: '158-0461-7890', department: '生产部', houseName: 'A1', status: '在岗', joinDate: new Date(now.getTime() - 365 * 2.5 * 24 * 60 * 60 * 1000), avatar: '吴', skills: '数据记录,环境监控,品质检测' },
      { name: '郑浩', role: '饲养员', phone: '155-0461-2345', department: '生产部', houseName: 'A2', status: '在岗', joinDate: new Date(now.getTime() - 365 * 0.8 * 24 * 60 * 60 * 1000), avatar: '郑', skills: '肉鸡饲养,清粪作业' },
      { name: '黄丽', role: '主管', phone: '156-0461-6789', department: '管理部', houseName: '全场', status: '在岗', joinDate: new Date(now.getTime() - 365 * 3.5 * 24 * 60 * 60 * 1000), avatar: '黄', skills: '人事管理,采购协调,财务' },
      { name: '马超', role: '兽医', phone: '138-0461-4444', department: '兽医部', houseName: '全场', status: '离职', joinDate: new Date(now.getTime() - 365 * 2 * 24 * 60 * 60 * 1000), avatar: '马', skills: '禽病诊疗,病理分析' },
    ]

    await Promise.all(
      staffData.map((s) => db.staff.create({ data: s }))
    )

    // ==================== Sales Records (10) ====================
    const salesData = [
      { batchNo: 'PC-2025-001', buyer: '哈尔滨双汇屠宰厂', buyerPhone: '0451-8765-4321', quantity: 19360, unitPrice: 12.5, totalPrice: 242000, saleDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), houseName: 'A1栋', breed: 'AA肉鸡', weight: 2.85, status: '已完成', paymentMethod: '银行转账', paymentStatus: '已结算', notes: '出栏均重2.85kg，成活率96.8%' },
      { batchNo: 'PC-2025-001', buyer: '哈尔滨正大食品', buyerPhone: '0451-8899-0011', quantity: 0, unitPrice: 0, totalPrice: 0, saleDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), houseName: 'A1栋', breed: 'AA肉鸡', weight: 2.85, status: '已取消', paymentMethod: '银行转账', paymentStatus: '已结算', notes: '因量不足取消，转给双汇' },
      { batchNo: 'PC-2025-004', buyer: '大庆金锣肉联', buyerPhone: '0459-555-6666', quantity: 17190, unitPrice: 11.8, totalPrice: 202842, saleDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), houseName: 'B1栋', breed: '罗斯308', weight: 2.65, status: '已完成', paymentMethod: '月结', paymentStatus: '部分结算', notes: '提前出栏，均重偏低' },
      { batchNo: 'PC-2025-004', buyer: '齐齐哈尔烤鸡连锁', buyerPhone: '0452-333-7777', quantity: 2000, unitPrice: 13.5, totalPrice: 27000, saleDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), houseName: 'B1栋', breed: '罗斯308', weight: 2.6, status: '已完成', paymentMethod: '现金', paymentStatus: '已结算', notes: '小型客户，自提' },
      { batchNo: 'PC-2025-002', buyer: '长春皓月集团', buyerPhone: '0431-8888-9999', quantity: 0, unitPrice: 12.0, totalPrice: 0, saleDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), houseName: 'A1栋', breed: 'AA肉鸡', weight: 0, status: '待确认', paymentMethod: '银行转账', paymentStatus: '未结算', notes: '预计出栏，已预订19000只' },
      { batchNo: 'PC-2025-002', buyer: '佳木斯食品加工厂', buyerPhone: '0454-222-3333', quantity: 0, unitPrice: 11.5, totalPrice: 0, saleDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), houseName: 'A1栋', breed: 'AA肉鸡', weight: 0, status: '待确认', paymentMethod: '月结', paymentStatus: '未结算', notes: '备选客户' },
      { batchNo: 'PC-2025-003', buyer: '哈尔滨双汇屠宰厂', buyerPhone: '0451-8765-4321', quantity: 0, unitPrice: 12.2, totalPrice: 0, saleDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), houseName: 'A2栋', breed: '科宝500', weight: 0, status: '待确认', paymentMethod: '银行转账', paymentStatus: '未结算', notes: '预计出栏' },
      { batchNo: 'PC-2025-001', buyer: '牡丹江肉联厂', buyerPhone: '0453-444-5555', quantity: 8000, unitPrice: 12.8, totalPrice: 102400, saleDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), houseName: 'A1栋', breed: 'AA肉鸡', weight: 2.9, status: '已完成', paymentMethod: '银行转账', paymentStatus: '已结算', notes: '历史订单-前期批次' },
      { batchNo: 'PC-2025-004', buyer: '绥化禽业合作社', buyerPhone: '0455-666-7777', quantity: 5000, unitPrice: 11.0, totalPrice: 55000, saleDate: new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000), houseName: 'B1栋', breed: '罗斯308', weight: 2.5, status: '已完成', paymentMethod: '月结', paymentStatus: '已结算', notes: '历史订单' },
      { batchNo: 'PC-2025-001', buyer: '吉林德大食品', buyerPhone: '0432-111-2222', quantity: 6000, unitPrice: 13.0, totalPrice: 78000, saleDate: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000), houseName: 'A1栋', breed: 'AA肉鸡', weight: 2.85, status: '已完成', paymentMethod: '银行转账', paymentStatus: '已结算', notes: '优质客户' },
    ]

    await Promise.all(
      salesData.map((s) => db.salesRecord.create({ data: s }))
    )

    // ==================== Vaccine Records (12) ====================
    const vaccineData = [
      { batchNo: 'PC-2025-002', vaccineName: '新城疫-传染性支气管炎二联苗', manufacturer: '哈尔滨维科生物', batchLotNo: '20250315A', houseName: 'A1栋', quantity: 19000, method: '饮水', operator: '李技术员', applyDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), dayAge: 14, status: '已完成', notes: '14日龄首免' },
      { batchNo: 'PC-2025-002', vaccineName: '法氏囊炎疫苗', manufacturer: '乾元浩生物', batchLotNo: '20250320B', houseName: 'A1栋', quantity: 19000, method: '饮水', operator: '李技术员', applyDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), dayAge: 24, status: '已完成', notes: '24日龄二免' },
      { batchNo: 'PC-2025-002', vaccineName: '禽流感H5+H7三价苗', manufacturer: '哈药集团', batchLotNo: '20250401C', houseName: 'A1栋', quantity: 19000, method: '注射', operator: '孙兽医', applyDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000), dayAge: 42, status: '计划中', notes: '35日龄首免-待执行' },
      { batchNo: 'PC-2025-003', vaccineName: '新城疫-传染性支气管炎二联苗', manufacturer: '哈尔滨维科生物', batchLotNo: '20250318A', houseName: 'A2栋', quantity: 15000, method: '饮水', operator: '李技术员', applyDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000), dayAge: 14, status: '已完成', notes: '14日龄首免' },
      { batchNo: 'PC-2025-003', vaccineName: '法氏囊炎疫苗', manufacturer: '乾元浩生物', batchLotNo: '20250322B', houseName: 'A2栋', quantity: 15000, method: '饮水', operator: '李技术员', applyDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), nextDate: null, dayAge: 35, status: '已完成', notes: '35日龄三免' },
      { batchNo: 'PC-2025-003', vaccineName: '禽流感H5+H7三价苗', manufacturer: '哈药集团', batchLotNo: '20250405D', houseName: 'A2栋', quantity: 15000, method: '注射', operator: '孙兽医', applyDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() + 49 * 24 * 60 * 60 * 1000), dayAge: 35, status: '计划中', notes: '35日龄首免-待执行' },
      { batchNo: 'PC-2025-001', vaccineName: '新城疫IV系苗', manufacturer: '中牧股份', batchLotNo: '20250201A', houseName: 'A1栋', quantity: 20000, method: '饮水', operator: '李技术员', applyDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), dayAge: 7, status: '已完成', notes: '7日龄首免' },
      { batchNo: 'PC-2025-001', vaccineName: '新城疫-传染性支气管炎二联苗', manufacturer: '哈尔滨维科生物', batchLotNo: '20250210B', houseName: 'A1栋', quantity: 20000, method: '饮水', operator: '李技术员', applyDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), dayAge: 14, status: '已完成', notes: '14日龄二免' },
      { batchNo: 'PC-2025-001', vaccineName: '禽流感H5+H7三价苗', manufacturer: '哈药集团', batchLotNo: '20250215C', houseName: 'A1栋', quantity: 20000, method: '注射', operator: '孙兽医', applyDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), nextDate: null, dayAge: 21, status: '已完成', notes: '21日龄首免' },
      { batchNo: 'PC-2025-004', vaccineName: '新城疫IV系苗', manufacturer: '中牧股份', batchLotNo: '20250120A', houseName: 'B1栋', quantity: 18000, method: '滴鼻', operator: '马超', applyDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), nextDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), dayAge: 7, status: '已完成', notes: '7日龄首免' },
      { batchNo: 'PC-2025-004', vaccineName: '禽流感H5+H7三价苗', manufacturer: '哈药集团', batchLotNo: '20250201C', houseName: 'B1栋', quantity: 18000, method: '注射', operator: '马超', applyDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), nextDate: null, dayAge: 14, status: '已完成', notes: '14日龄首免' },
      { batchNo: 'PC-2025-005', vaccineName: '马立克氏病疫苗', manufacturer: '乾元浩生物', batchLotNo: '20250410E', houseName: 'B2栋', quantity: 15000, method: '注射', operator: '孙兽医', applyDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), nextDate: null, dayAge: 1, status: '计划中', notes: '1日龄入栏当天免疫' },
    ]

    await Promise.all(
      vaccineData.map((v) => db.vaccineRecord.create({ data: v }))
    )

    // ==================== Slaughter Records (10) ====================
    const slaughterData = [
      {
        batchId: batches[0].id, batchNo: 'PC-2025-001', houseName: 'A1栋', breed: 'AA肉鸡',
        plannedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        actualDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        quantity: 19360, avgWeight: 2.85, totalPrice: 242000, buyer: '哈尔滨双汇屠宰厂',
        status: '已完成', approvalBy: '张建国', approvalAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        notes: '第42天出栏，均重2.85kg，料肉比1.58，客户满意',
      },
      {
        batchId: batches[3].id, batchNo: 'PC-2025-004', houseName: 'B1栋', breed: '罗斯308',
        plannedDate: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000),
        actualDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        quantity: 17200, avgWeight: 2.45, totalPrice: 189200, buyer: '齐齐哈尔金锣肉联',
        status: '已完成', approvalBy: '张建国', approvalAt: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000),
        notes: '因新城疫提前出栏，均重偏低，损失约3万元',
      },
      {
        batchId: batches[1].id, batchNo: 'PC-2025-002', houseName: 'A1栋', breed: 'AA肉鸡',
        plannedDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        quantity: 18662, avgWeight: 2.92, totalPrice: 245000, buyer: '哈尔滨双汇屠宰厂',
        status: '计划中',
        notes: '预计42天出栏，长势良好，已联系买家',
      },
      {
        batchId: batches[2].id, batchNo: 'PC-2025-003', houseName: 'A2栋', breed: '科宝500',
        plannedDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        quantity: 14685, avgWeight: 2.78, totalPrice: 198000, buyer: '大庆正大食品',
        status: '待审批',
        notes: '因呼吸道感染需评估是否提前出栏，已提交审批',
      },
      {
        batchId: batches[4].id, batchNo: 'PC-2025-005', houseName: 'B2栋', breed: 'AA肉鸡',
        plannedDate: new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000),
        quantity: 15000,
        status: '计划中',
        notes: '待入栏批次，预计56天后出栏',
      },
      {
        batchId: batches[1].id, batchNo: 'PC-2025-002', houseName: 'A1栋', breed: 'AA肉鸡',
        plannedDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        quantity: 5000, buyer: '本地零售渠道',
        status: '已审批', approvalBy: '张建国', approvalAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        notes: '分批出栏第一批，5000只供应本地市场',
      },
      {
        batchId: batches[2].id, batchNo: 'PC-2025-003', houseName: 'A2栋', breed: '科宝500',
        plannedDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        quantity: 14685, buyer: '大庆正大食品',
        status: '已审批', approvalBy: '张建国', approvalAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        notes: '紧急出栏申请已批准，等待执行',
      },
      {
        batchId: batches[1].id, batchNo: 'PC-2025-002', houseName: 'A1栋', breed: 'AA肉鸡',
        plannedDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        quantity: 3000, buyer: '沈阳食品批发市场',
        status: '执行中',
        notes: '正在装车运输，预计今晚到达',
      },
      {
        batchId: batches[0].id, batchNo: 'PC-2025-001', houseName: 'A1栋', breed: 'AA肉鸡',
        plannedDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        quantity: 2000, buyer: '本地散养鸡客户',
        status: '已取消',
        notes: '客户临时取消订单，已转售其他渠道',
      },
      {
        batchId: batches[3].id, batchNo: 'PC-2025-004', houseName: 'B1栋', breed: '罗斯308',
        plannedDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        actualDate: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
        quantity: 500, avgWeight: 2.1, totalPrice: 8500, buyer: '本地活鸡市场',
        status: '已完成', approvalBy: '李技术员', approvalAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
        notes: '提前淘汰弱鸡500只，均重偏低',
      },
    ]

    await Promise.all(
      slaughterData.map((s) => db.slaughterRecord.create({ data: s }))
    )

    // Count results
    const totalBatches = await db.chickenBatch.count()
    const totalDevices = await db.device.count()
    const totalEnvRecords = await db.environmentRecord.count()
    const totalMedications = await db.medicationRecord.count()
    const totalHealthAlerts = await db.healthAlert.count()
    const totalCosts = await db.costRecord.count()
    const totalAlerts = await db.alert.count()
    const totalSchedulePlans = await db.schedulePlan.count()
    const totalFeedRecords = await db.feedRecord.count()
    const totalStaff = await db.staff.count()
    const totalSales = await db.salesRecord.count()
    const totalVaccines = await db.vaccineRecord.count()
    const totalSlaughterRecords = await db.slaughterRecord.count()

    return NextResponse.json({
      success: true,
      message: '数据初始化完成',
      data: {
        farm: farm.name,
        houses: houses.length,
        batches: totalBatches,
        devices: totalDevices,
        envRecords: totalEnvRecords,
        medications: totalMedications,
        healthAlerts: totalHealthAlerts,
        costs: totalCosts,
        alerts: totalAlerts,
        schedulePlans: totalSchedulePlans,
        feedRecords: totalFeedRecords,
        staff: totalStaff,
        salesRecords: totalSales,
        vaccineRecords: totalVaccines,
        slaughterRecords: totalSlaughterRecords,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, message: '数据初始化失败', error: String(error) },
      { status: 500 }
    )
  }
}
