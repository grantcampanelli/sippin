'use client'

import { useForm } from '@mantine/form'
import { PasswordInput, Button, Stack, Alert, Text } from '@mantine/core'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ResetPasswordFormProps {
  token: string
  email: string
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password: values.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'An error occurred. Please try again.')
        return
      }

      setSuccess(true)
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin?passwordReset=true')
      }, 2000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Stack gap="md">
        <Alert color="green" title="Password Reset Successful">
          Your password has been reset successfully. Redirecting to sign in...
        </Alert>
      </Stack>
    )
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Enter your new password below.
        </Text>
        {error && <Alert color="red">{error}</Alert>}
        <PasswordInput
          label="New Password"
          placeholder="Enter your new password"
          required
          {...form.getInputProps('password')}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your new password"
          required
          {...form.getInputProps('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={loading}>
          Reset Password
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </Text>
      </Stack>
    </form>
  )
}

