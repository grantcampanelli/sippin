import { Container, Title, Text } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/auth/SignOutButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <Container size="md" py="xl">
      <Title order={1}>Dashboard</Title>
      <Text mt="md">Welcome, {session.user?.name || session.user?.email}!</Text>
      <SignOutButton />
    </Container>
  )
}

