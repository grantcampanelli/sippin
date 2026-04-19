'use client'

import { Group, Button, Container, Text, Menu, Avatar, ActionIcon } from '@mantine/core'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { IconBottle, IconLogout, IconDashboard, IconBox } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'

// Height kept in sync with --nav-height in globals.css so pages can reliably
// subtract it with `min-height: calc(100dvh - var(--nav-height))`.
const NAV_STYLE: React.CSSProperties = {
  background: 'var(--gradient-wine)',
  height: 'var(--nav-height)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
}

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'white' }}>
      <Group gap="xs">
        <IconBottle size={28} />
        <Text size="xl" fw={700} style={{ fontFamily: 'var(--font-playfair)' }}>
          Sippin
        </Text>
      </Group>
    </Link>
  )
}

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Matches /bottles and /bottles/anything so nested routes keep the active highlight.
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  if (!session) {
    return (
      <nav style={NAV_STYLE}>
        <Container size="xl" style={{ width: '100%' }}>
          <Group justify="space-between" align="center">
            <Brand href="/" />
            <Group gap="sm">
              <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                <Button variant="subtle" color="white" style={{ color: 'white' }}>
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
                <Button variant="filled" color="amber" style={{ color: 'var(--color-brown)' }}>
                  Sign Up
                </Button>
              </Link>
            </Group>
          </Group>
        </Container>
      </nav>
    )
  }

  const displayName = session.user?.name || session.user?.email || ''
  const avatarInitial = session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'

  return (
    <nav style={NAV_STYLE}>
      <Container size="xl" style={{ width: '100%' }}>
        <Group justify="space-between" align="center">
          <Brand href="/dashboard" />

          <Group gap="md">
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button
                variant={isActive('/dashboard') ? 'filled' : 'subtle'}
                color={isActive('/dashboard') ? 'amber' : 'white'}
                leftSection={<IconDashboard size={18} />}
                style={isActive('/dashboard') ? { color: 'var(--color-brown)' } : { color: 'white' }}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/bottles" style={{ textDecoration: 'none' }}>
              <Button
                variant={isActive('/bottles') ? 'filled' : 'subtle'}
                color={isActive('/bottles') ? 'amber' : 'white'}
                leftSection={<IconBottle size={18} />}
                style={isActive('/bottles') ? { color: 'var(--color-brown)' } : { color: 'white' }}
              >
                Bottles
              </Button>
            </Link>
            <Link href="/stashes" style={{ textDecoration: 'none' }}>
              <Button
                variant={isActive('/stashes') ? 'filled' : 'subtle'}
                color={isActive('/stashes') ? 'amber' : 'white'}
                leftSection={<IconBox size={18} />}
                style={isActive('/stashes') ? { color: 'var(--color-brown)' } : { color: 'white' }}
              >
                Stashes
              </Button>
            </Link>

            <Menu shadow="md" width={200} position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  radius="xl"
                  aria-label="Open account menu"
                  style={{ background: 'transparent' }}
                >
                  <Avatar
                    size="sm"
                    radius="xl"
                    color="amber"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    {avatarInitial}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={500}>{displayName}</Text>
                  {session.user?.email && (
                    <Text size="xs" c="dimmed">{session.user.email}</Text>
                  )}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Container>
    </nav>
  )
}
