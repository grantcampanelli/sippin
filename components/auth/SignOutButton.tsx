'use client'

import { Button } from '@mantine/core'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <Button onClick={handleSignOut} mt="md" variant="outline">
      Sign Out
    </Button>
  )
}

