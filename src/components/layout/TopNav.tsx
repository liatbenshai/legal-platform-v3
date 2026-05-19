'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/lib/auth/actions'
import { useUser } from '@/lib/hooks/useUser'

interface NavItem {
  href: string
  label: string
  icon: string
  matches: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'לוח בקרה',
    icon: 'ti-layout-dashboard',
    matches: (p) => p === '/dashboard',
  },
  {
    href: '/clients',
    label: 'תיקי לקוחות',
    icon: 'ti-users',
    matches: (p) => p === '/clients' || p.startsWith('/clients/'),
  },
  {
    href: '/library',
    label: 'ספריית סעיפים',
    icon: 'ti-book-2',
    matches: (p) => p === '/library',
  },
  {
    href: '/library/dictionary',
    label: 'מילון הטיות',
    icon: 'ti-language-hiragana',
    matches: (p) => p === '/library/dictionary',
  },
  {
    href: '/settings',
    label: 'הגדרות',
    icon: 'ti-settings',
    matches: (p) => p === '/settings',
  },
]

interface TopNavProps {
  clientsCount?: number
}

export function TopNav({ clientsCount }: TopNavProps) {
  const pathname = usePathname() ?? ''
  const { user } = useUser()

  const initial = (user?.email ?? '?').trim().charAt(0).toUpperCase()

  return (
    <header style={{ backgroundColor: 'var(--bg-titlebar)' }}>
      <div
        style={{
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-dark)',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              backgroundColor: 'var(--color-accent)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i
              className="ti ti-scale"
              style={{ color: 'var(--color-primary)', fontSize: 16 }}
              aria-hidden="true"
            />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-inverse)',
            }}
          >
            משרד עורך דין
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-primary)',
              }}
              aria-hidden="true"
            >
              {initial}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-inverse)',
                  direction: 'ltr',
                }}
              >
                {user?.email ?? '—'}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                padding: '6px 10px',
                fontSize: 12,
                color: 'var(--text-on-dark-muted)',
                backgroundColor: 'transparent',
                border: '0.5px solid var(--border-dark)',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              התנתקות
            </button>
          </form>
        </div>
      </div>

      <nav
        style={{
          padding: '0 20px',
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.matches(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '12px 14px',
                color: isActive
                  ? 'var(--text-inverse)'
                  : 'var(--text-on-dark-muted)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                borderBottom: `2px solid ${
                  isActive ? 'var(--color-accent)' : 'transparent'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <i
                className={`ti ${item.icon}`}
                style={{ fontSize: 16 }}
                aria-hidden="true"
              />
              {item.label}
              {item.href === '/clients' &&
                typeof clientsCount === 'number' &&
                clientsCount > 0 && (
                  <span
                    style={{
                      backgroundColor: isActive
                        ? 'var(--color-accent)'
                        : 'var(--border-dark)',
                      color: isActive
                        ? 'var(--color-primary)'
                        : 'var(--text-inverse)',
                      fontSize: 11,
                      padding: '1px 7px',
                      borderRadius: 9,
                      fontWeight: 500,
                    }}
                  >
                    {clientsCount}
                  </span>
                )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
