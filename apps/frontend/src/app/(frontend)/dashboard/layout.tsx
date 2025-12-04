'use client'
import { SideNavbar } from '@/components/SideNavbar/SideNavbar'
import { useMobileMenu } from '@/providers/MobileMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isMobileMenuOpen, setMobileMenuOpen } = useMobileMenu()

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <SideNavbar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
