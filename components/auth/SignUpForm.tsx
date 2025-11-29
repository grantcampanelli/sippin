'use client'

import { useForm } from '@mantine/form'
import { TextInput, PasswordInput, Button, Stack, Alert } from '@mantine/core'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignUpForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'An error occurred. Please try again.')
        return
      }

      router.push('/auth/signin?registered=true')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}
        <TextInput
          label="Name"
          placeholder="Your name"
          required
          {...form.getInputProps('name')}
        />
        <TextInput
          label="Email"
          placeholder="your@email.com"
          required
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          required
          {...form.getInputProps('password')}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your password"
          required
          {...form.getInputProps('confirmPassword')}
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
          Sign Up
        </Button>
      </Stack>
    </form>
  )
}

