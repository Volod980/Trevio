'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
  isAdmin?: boolean
}

export function Navbar({ user, isAdmin }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-[#2E2E2E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center">
              <span className="text-background font-bold text-sm font-serif">T</span>
            </div>
            <span className="font-serif text-xl font-semibold text-text-primary group-hover:text-accent transition-colors">
              Trevio
            </span>
          </Link>

          {/* Nav links */}
          {user && (
            <div className="flex items-center gap-1">
              {isAdmin ? (
                <>
                  <NavLink href="/admin" active={pathname === '/admin'}>
                    All Orders
                  </NavLink>
                  <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                    My Orders
                  </NavLink>
                </>
              ) : (
                <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                  My Orders
                </NavLink>
              )}
              <Link
                href="/orders/new"
                className={`
                  text-sm font-medium px-4 py-1.5 rounded-[8px] transition-all duration-200
                  bg-accent text-background hover:bg-accent-dark
                `}
              >
                + New Order
              </Link>
            </div>
          )}

          {/* User menu */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-surface border border-[#2E2E2E] flex items-center justify-center">
                  <span className="text-xs font-medium text-text-secondary">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                {isAdmin && (
                  <span className="text-xs text-accent font-medium hidden sm:block">Admin</span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`
        text-sm font-medium px-4 py-1.5 rounded-[8px] transition-all duration-200
        ${active
          ? 'text-text-primary bg-card border border-[#2E2E2E]'
          : 'text-text-muted hover:text-text-secondary hover:bg-surface'
        }
      `}
    >
      {children}
    </Link>
  )
}
