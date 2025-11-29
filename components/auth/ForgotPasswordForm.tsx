'use client'

import { useForm } from '@mantine/form'
import { TextInput, Button, Stack, Alert, Text } from '@mantine/core'
import { useState } from 'react'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'An error occurred. Please try again.')
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Stack gap="md">
        <Alert color="green" title="Email Sent">
          If an account with that email exists, we've sent you a password reset link.
          Please check your email.
        </Alert>
        <Text size="sm" c="dimmed" ta="center">
          <Link href="/auth/signin" style={{ textDecoration: 'none', color: 'var(--color-wine)' }}>
            Back to Sign In
          </Link>
        </Text>
      </Stack>
    )
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Enter your email address and we'll send you a link to reset your password.
        </Text>
        {error && <Alert color="red">{error}</Alert>}
        <TextInput
          label="Email"
          placeholder="your@email.com"
          required
          {...form.getInputProps('email')}
        />
        <Button 
          type="submit" 
          fullWidth 
          loading={loading}
          size="md"
          style={{ 
            background: 'var(--gradient-wine)',
            color: 'white'
          }}
        >
          Send Reset Link
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          <Link href="/auth/signin" style={{ textDecoration: 'none', color: 'var(--color-wine)' }}>
            Back to Sign In
          </Link>
        </Text>
      </Stack>
    </form>
  )
}

