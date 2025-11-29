'use client'
import React from 'react'
import Link from 'next/link'

export const HeaderNav: React.FC = () => {

  return (
    <nav className="flex gap-6 items-center">
      <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
        Docs
      </Link>
      <Link href="/deliverability" className="text-sm font-medium hover:text-primary transition-colors">
        Deliverability
      </Link>
      <Link href="/posts" className="text-sm font-medium hover:text-primary transition-colors">
        Blog
      </Link>
      <Link href="https://github.com/pypes-dev/coldflow" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
        GitHub
      </Link>
      <Link href="/admin" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
        Get Started
      </Link>
    </nav>
  )
}