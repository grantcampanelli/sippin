import { Container, Title, Paper } from '@mantine/core'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="xl">
        Sign Up
      </Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        <SignUpForm />
      </Paper>
    </Container>
  )
}

