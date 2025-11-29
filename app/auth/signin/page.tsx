import { Container, Title, Paper, Stack, Button, Divider, Alert, Box } from '@mantine/core'
import { SignInForm } from '@/components/auth/SignInForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const passwordReset = params.passwordReset === 'true'

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center' }}>
      <Container size={420} py={40}>
        <Title ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
          Sign In
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
          {passwordReset && (
            <Alert color="green" mb="md" radius="md">
              Your password has been reset successfully. Please sign in with your new password.
            </Alert>
          )}
          <SignInForm />
          <Divider label="Or continue with" labelPosition="center" my="lg" />
          <Button
            component="a"
            href="/api/auth/signin/google"
            fullWidth
            variant="outline"
            style={{ 
              borderColor: 'var(--color-wine)',
              color: 'var(--color-wine)'
            }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

