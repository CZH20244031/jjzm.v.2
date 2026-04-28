'use client'

import {
  LayoutDashboard,
  ThermometerSun,
  Layers,
  HeartPulse,
  Pill,
  Calculator,
  Bell,
  ScanLine,
  BookOpen,
  TreePine,
  MessageSquare,
  FileText,
  Monitor,
  Settings,
  Database,
  BarChart3,
  Brain,
  CalendarDays,
  Wheat,
  Sparkles,
  Users,
  Wrench,
  ShoppingCart,
  Syringe,
  Truck,
  Wallet,
  GitCompareArrows,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import Image from 'next/image'

export type TabId =
  | 'dashboard'
  | 'environment'
  | 'batches'
  | 'health'
  | 'medication'
  | 'cost'
  | 'alerts'
  | 'trace'
  | 'knowledge'
  | 'reports'
  | 'consultation'
  | 'ai-diagnosis'
  | 'farm-planning'
  | 'feed'
  | 'settings'
  | 'monitor'
  | 'staff'
  | 'devices'
  | 'sales'
  | 'vaccines'
  | 'slaughter'
  | 'financial-report'
  | 'batch-comparison'
  | 'notification-center'

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: '核心功能',
    icon: Database,
    items: [
      { id: 'dashboard', label: '总览仪表盘', icon: LayoutDashboard },
      { id: 'environment', label: '环境智控', icon: ThermometerSun },
      { id: 'batches', label: '批次管理', icon: Layers },
      { id: 'health', label: '健康预警', icon: HeartPulse },
    ],
  },
  {
    label: '经营管理',
    icon: BarChart3,
    items: [
      { id: 'medication', label: '用药管理', icon: Pill },
      { id: 'vaccines', label: '疫苗管理', icon: Syringe },
      { id: 'sales', label: '销售管理', icon: ShoppingCart },
      { id: 'slaughter', label: '出栏管理', icon: Truck },
      { id: 'cost', label: '成本分析', icon: Calculator },
      { id: 'reports', label: '养殖日报', icon: FileText },
      { id: 'alerts', label: '预警中心', icon: Bell },
    ],
  },
  {
    label: '数据中心',
    icon: Settings,
    items: [
      { id: 'trace', label: '溯源管理', icon: ScanLine },
      { id: 'knowledge', label: '养殖知识库', icon: BookOpen },
      { id: 'devices', label: '设备管理', icon: Wrench },
      { id: 'financial-report', label: '财务报表', icon: Wallet },
      { id: 'batch-comparison', label: '批次对比分析', icon: GitCompareArrows },
    ],
  },
  {
    label: '扩展服务',
    icon: Sparkles,
    items: [
      { id: 'consultation', label: '专家问诊', icon: MessageSquare },
      { id: 'ai-diagnosis', label: 'AI智能诊断', icon: Brain },
      { id: 'farm-planning', label: '养殖计划排程', icon: CalendarDays },
      { id: 'feed', label: '饲料管理', icon: Wheat },
      { id: 'monitor', label: '数据大屏', icon: Monitor },
      { id: 'staff', label: '员工管理', icon: Users },
      { id: 'notification-center', label: '消息通知中心', icon: Bell },
    ],
  },
  {
    label: '系统',
    icon: Settings,
    items: [
      { id: 'settings', label: '系统设置', icon: Settings },
    ],
  },
]

interface AppSidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Mobile backdrop gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/5 via-transparent to-teal-900/5 pointer-events-none z-0 hidden max-md:block" data-sidebar="mobile-glow" />
      {/* Subtle left border gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-300/20 to-transparent" />
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-emerald-500/20 shrink-0">
            <Image src="/images/logo.png" alt="极境智牧" width={32} height={32} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
              极境智牧
            </span>
            <span className="text-[10px] text-muted-foreground">
              智慧养殖管理平台
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navSections.map((section, sectionIndex) => (
          <div key={section.label}>
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{section.label}</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() => onTabChange(item.id)}
                        tooltip={item.label}
                        className={`min-h-11 data-[active=true]:bg-primary/8 data-[active=true]:shadow-[0_0_12px_rgba(16,185,129,0.08)] transition-all duration-200 active:scale-[0.98]`}
                      >
                        <item.icon className={`h-4 w-4 transition-colors duration-200 ${activeTab === item.id ? 'text-emerald-600' : ''}`} />
                        <span>{item.label}</span>
                        {/* Active indicator dot */}
                        {activeTab === item.id && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {sectionIndex < navSections.length - 1 && (
              <SidebarSeparator className="mx-3" />
            )}
          </div>
        ))}
      </SidebarContent>

      {/* Mobile close button - shown only on mobile drawer */}
      <div className="md:hidden border-t p-3">
        <button
          onClick={() => {
            // Close the mobile sidebar by dispatching a custom event
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
          }}
          className="flex items-center justify-center gap-2 w-full min-h-11 rounded-lg bg-muted/50 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-[0.98]"
        >
          <X className="h-4 w-4" />
          关闭菜单
        </button>
      </div>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden hidden md:block">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-primary/8 to-teal-50/50 border border-emerald-200/30 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 rounded-md overflow-hidden ring-1 ring-emerald-500/20">
              <Image src="/images/logo.png" alt="极境智牧" width={20} height={20} className="h-full w-full object-cover" />
            </div>
            <p className="text-xs font-semibold text-emerald-700">
              智慧养殖管理平台
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600">系统正常</span>
            </span>
            <span>·</span>
            <span>v2.6.0 · 24 模块</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export type { TabId }
