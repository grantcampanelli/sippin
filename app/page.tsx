import { Container, Title, Text, Button, Stack } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center">
        <Title order={1}>Welcome to Sippin</Title>
        <Text size="lg" c="dimmed">
          Track and manage your beverage collection
        </Text>
        {session ? (
          <Stack gap="md" align="center">
            <Text>Welcome back, {session.user?.name || session.user?.email}!</Text>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button>Go to Dashboard</Button>
            </Link>
          </Stack>
        ) : (
          <Stack gap="md" align="center">
            <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
              <Button>Sign In</Button>
            </Link>
            <Text size="sm" c="dimmed">
              or
            </Text>
            <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
              <Button variant="outline">Sign Up</Button>
            </Link>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

