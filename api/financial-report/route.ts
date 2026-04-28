import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { financialData } = await import('@/lib/demo-data')
    return {
      totalRevenue: financialData.summary.totalRevenue,
      totalCost: financialData.summary.totalCost,
      netProfit: financialData.summary.totalProfit,
      profitMargin: financialData.summary.profitRate,
      costByCategory: financialData.costBreakdown.map(c => ({ category: c.category, total: c.amount })),
      monthlyData: financialData.monthlyData,
      recentSales: [],
      recentCosts: [],
    }
  })
  if (demo) return demo

  try {
    // Fetch all cost records
    const costRecords = await db.costRecord.findMany({
      include: {
        batch: {
          select: { batchNo: true, house: { select: { name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Fetch all sales records
    const salesRecords = await db.salesRecord.findMany({
      orderBy: { saleDate: 'desc' },
    })

    // Fetch all feed records for feed cost aggregation
    const feedRecords = await db.feedRecord.findMany({
      orderBy: { recordDate: 'desc' },
    })

    // Calculate total revenue from sales
    const totalRevenue = salesRecords.reduce(
      (sum, s) => sum + (s.status === '已完成' ? s.totalPrice : 0),
      0
    )

    // Calculate total cost from cost records
    const totalCost = costRecords.reduce((sum, c) => sum + c.amount, 0)

    // Calculate net profit and profit margin
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Cost breakdown by category
    const categoryMap: Record<string, number> = {}
    costRecords.forEach((c) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + c.amount
    })
    const costByCategory = Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)

    // Monthly data aggregation
    const monthlyMap: Record<
      string,
      { revenue: number; cost: number; profit: number }
    > = {}

    // Aggregate sales by month
    salesRecords.forEach((s) => {
      if (s.status !== '已完成') return
      const d = new Date(s.saleDate)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { revenue: 0, cost: 0, profit: 0 }
      }
      monthlyMap[monthKey].revenue += s.totalPrice
    })

    // Aggregate costs by month
    costRecords.forEach((c) => {
      const d = new Date(c.date)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { revenue: 0, cost: 0, profit: 0 }
      }
      monthlyMap[monthKey].cost += c.amount
    })

    // Calculate profit per month
    const monthlyData = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(data.cost * 100) / 100,
        profit: Math.round((data.revenue - data.cost) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Recent sales (latest 10)
    const recentSales = salesRecords.slice(0, 10).map((s) => ({
      id: s.id,
      batchNo: s.batchNo,
      buyer: s.buyer,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      totalPrice: s.totalPrice,
      saleDate: s.saleDate,
      status: s.status,
      paymentStatus: s.paymentStatus,
    }))

    // Recent costs (latest 10)
    const recentCosts = costRecords.slice(0, 10).map((c) => ({
      id: c.id,
      category: c.category,
      item: c.item,
      amount: c.amount,
      date: c.date,
      batchNo: c.batch.batchNo,
      houseName: c.batch.house.name,
    }))

    return NextResponse.json({
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      costByCategory,
      monthlyData,
      recentSales,
      recentCosts,
    })
  } catch (error) {
    console.error('Financial report GET error:', error)
    const { financialData } = await import('@/lib/demo-data')
    return NextResponse.json({
      totalRevenue: financialData.summary.totalRevenue,
      totalCost: financialData.summary.totalCost,
      netProfit: financialData.summary.totalProfit,
      profitMargin: financialData.summary.profitRate,
      costByCategory: financialData.costBreakdown.map(c => ({ category: c.category, total: c.amount })),
      monthlyData: financialData.monthlyData,
      recentSales: [],
      recentCosts: [],
    })
  }
}
