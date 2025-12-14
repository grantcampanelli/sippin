'use client'

import { Group, Button, Container, Text, Menu, Avatar, ActionIcon } from '@mantine/core'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { IconBottle, IconLogout, IconDashboard, IconHome, IconBox, IconCamera } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  if (!session) {
    return (
      <nav style={{ 
        background: 'var(--gradient-wine)',
        padding: '1rem 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Container size="xl">
          <Group justify="space-between" align="center">
            <Link href="/" style={{ textDecoration: 'none', color: 'white' }}>
              <Group gap="xs">
                <IconBottle size={28} />
                <Text size="xl" fw={700} style={{ fontFamily: 'var(--font-playfair)' }}>
                  Sippin
                </Text>
              </Group>
            </Link>
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

  return (
    <nav style={{ 
      background: 'var(--gradient-wine)',
      padding: '1rem 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <Container size="xl">
        <Group justify="space-between" align="center">
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'white' }}>
            <Group gap="xs">
              <IconBottle size={28} />
              <Text size="xl" fw={700} style={{ fontFamily: 'var(--font-playfair)' }}>
                Sippin
              </Text>
            </Group>
          </Link>
          
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
            <Link href="/bottles/scan" style={{ textDecoration: 'none' }}>
              <Button 
                variant={isActive('/bottles/scan') ? 'filled' : 'subtle'} 
                color={isActive('/bottles/scan') ? 'amber' : 'white'}
                leftSection={<IconCamera size={18} />}
                style={isActive('/bottles/scan') ? { color: 'var(--color-brown)' } : { color: 'white' }}
              >
                Scan
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
                  style={{ 
                    background: 'transparent',
                  }}
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
                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={500}>{session.user?.name || session.user?.email}</Text>
                  <Text size="xs" c="dimmed">{session.user?.email}</Text>
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

