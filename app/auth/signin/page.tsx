import { Container, Title, Paper, Stack, Button, Divider, Alert } from '@mantine/core'
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
    <Container size={420} my={40}>
      <Title ta="center" mb="xl">
        Sign In
      </Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        {passwordReset && (
          <Alert color="green" mb="md">
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
        >
          Sign in with Google
        </Button>
      </Paper>
    </Container>
  )
}

