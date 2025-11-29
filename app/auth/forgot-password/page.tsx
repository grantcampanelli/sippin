import { Container, Title, Paper, Box } from '@mantine/core'
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
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center' }}>
      <Container size={420} py={40}>
        <Title ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
          Forgot Password
        </Title>
        <Paper 
          withBorder 
          shadow="lg" 
          p={40} 
          radius="md"
          style={{ 
            borderColor: 'var(--color-beige)',
            background: 'white'
          }}
        >
          <ForgotPasswordForm />
        </Paper>
      </Container>
    </Box>
  )
}

