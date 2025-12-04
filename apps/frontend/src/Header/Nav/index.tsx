'use client'
import React from 'react'
import Link from 'next/link'
import { authClient } from '@/access/authClient'
import { useMobileMenu } from '@/providers/MobileMenu'

export const HeaderNav: React.FC = () => {
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useMobileMenu()
  const { data: session } = authClient.useSession()
  const isOpen = isMobileMenuOpen
  const toggleMenu = toggleMobileMenu
  const closeMenu = () => setMobileMenuOpen(false)

  const navLinks = [
    { href: '/docs', label: 'Docs' },
    { href: '/deliverability', label: 'Deliverability' },
    { href: '/posts', label: 'Blog' },
    { href: 'https://github.com/pypes-dev/coldflow', label: 'GitHub', external: true },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-6 items-center" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium hover:text-primary transition-colors"
            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href={session ? '/dashboard' : '/auth/signup'}
          className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
         {session ? 'Dashboard' : 'Get Started'}
        </Link>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden flex flex-col gap-1.5 w-8 h-8 justify-center items-center"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <span
          className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </button>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="md:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg"
        >
          <nav className="container py-4 flex flex-col gap-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={closeMenu}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/auth/signup"
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-center"
              onClick={closeMenu}
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}