'use client'

import { LayoutDashboard, ThermometerSun, Layers, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import type { TabId } from '@/components/app-sidebar'

interface MobileBottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onOpenSidebar: () => void
}

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// Primary tabs for mobile bottom nav - most frequently used
const primaryTabs: NavItem[] = [
  { id: 'dashboard', label: '总览', icon: LayoutDashboard },
  { id: 'environment', label: '环境', icon: ThermometerSun },
  { id: 'batches', label: '批次', icon: Layers },
  { id: 'alerts', label: '预警', icon: Bell },
]

export function MobileBottomNav({ activeTab, onTabChange, onOpenSidebar }: MobileBottomNavProps) {
  const { isMobile } = useAuth()

  if (!isMobile) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      {/* Safe area padding for iOS */}
      <nav className="flex items-center justify-around bg-background/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]" style={{ minHeight: '56px' }}>
        {primaryTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 transition-all duration-200 active:scale-95 relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <tab.icon className={cn(
                'h-5 w-5 transition-all duration-200',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] leading-none transition-all duration-200',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
        {/* More menu button - opens sidebar */}
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] leading-none font-medium">更多</span>
        </button>
      </nav>
    </div>
  )
}
