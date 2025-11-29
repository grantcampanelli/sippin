import { Container, Title, Paper, Alert, Box } from '@mantine/core'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const { token, email } = params

  if (!token || !email) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center' }}>
        <Container size={420} py={40}>
          <Title ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
            Reset Password
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
            <Alert color="red" title="Invalid Link">
              The password reset link is invalid or missing required parameters.
            </Alert>
          </Paper>
        </Container>
      </Box>
    )
  }

  // Verify token is valid
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token: token,
      },
    },
  })

  if (!verificationToken || verificationToken.expires < new Date()) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center' }}>
        <Container size={420} py={40}>
          <Title ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
            Reset Password
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
            <Alert color="red" title="Invalid or Expired Link">
              The password reset link is invalid or has expired. Please request a new one.
            </Alert>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center' }}>
      <Container size={420} py={40}>
        <Title ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
          Reset Password
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
          <ResetPasswordForm token={token} email={email} />
        </Paper>
      </Container>
    </Box>
  )
}

