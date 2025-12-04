'use client'

import React, { createContext, useCallback, use, useState } from 'react'

export interface MobileMenuContextType {
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (isOpen: boolean) => void
  toggleMobileMenu: () => void
}

const initialContext: MobileMenuContextType = {
  isMobileMenuOpen: false,
  setMobileMenuOpen: () => null,
  toggleMobileMenu: () => null,
}

const MobileMenuContext = createContext(initialContext)

export const MobileMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)

  const setMobileMenuOpen = useCallback((isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  return (
    <MobileMenuContext value={{ isMobileMenuOpen, setMobileMenuOpen, toggleMobileMenu }}>
      {children}
    </MobileMenuContext>
  )
}

export const useMobileMenu = (): MobileMenuContextType => use(MobileMenuContext)
