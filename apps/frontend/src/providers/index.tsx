import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { MobileMenuProvider } from './MobileMenu'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <MobileMenuProvider>{children}</MobileMenuProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
