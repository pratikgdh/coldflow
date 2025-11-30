import { SideNavbar } from '@/components/SideNavbar/SideNavbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <SideNavbar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
