import { Container, Title, Paper } from '@mantine/core'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="xl">
        Forgot Password
      </Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        <ForgotPasswordForm />
      </Paper>
    </Container>
  )
}

