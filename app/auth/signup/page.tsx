import { Container, Title, Paper, Box } from '@mantine/core'
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
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center' }}>
      <Container size={420} py={40}>
        <Title ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
          Sign Up
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
          <SignUpForm />
        </Paper>
      </Container>
    </Box>
  )
}

