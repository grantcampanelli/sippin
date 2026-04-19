'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Textarea,
  TextInput,
  NumberInput,
  ActionIcon,
  Box,
  Divider,
  Loader,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconFlask, IconPlus, IconTrash, IconX } from '@tabler/icons-react'

interface TastingEntry {
  id: string
  tastedAt: string
  nose: string | null
  palate: string | null
  finish: string | null
  rating: number | null
  context: string | null
  createdAt: string
}

export function TastingLog({ bottleId }: { bottleId: string }) {
  const [entries, setEntries] = useState<TastingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [nose, setNose] = useState('')
  const [palate, setPalate] = useState('')
  const [finish, setFinish] = useState('')
  const [context, setContext] = useState('')
  const [rating, setRating] = useState<number | ''>('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/bottles/${bottleId}/tastings`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setEntries(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bottleId])

  function resetForm() {
    setNose('')
    setPalate('')
    setFinish('')
    setContext('')
    setRating('')
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bottles/${bottleId}/tastings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nose,
          palate,
          finish,
          context,
          rating: rating === '' ? null : rating,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save tasting')
      }
      const created: TastingEntry = await res.json()
      setEntries((prev) => [created, ...prev])
      resetForm()
      setFormOpen(false)
      notifications.show({ message: 'Tasting saved', color: 'green' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save tasting'
      notifications.show({ message: msg, color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Delete this tasting entry?')) return
    try {
      const res = await fetch(`/api/tastings/${entryId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
      notifications.show({ message: 'Tasting deleted', color: 'gray' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete'
      notifications.show({ message: msg, color: 'red' })
    }
  }

  return (
    <Card
      padding="xl"
      radius="md"
      withBorder
      style={{ borderColor: 'var(--color-beige)', background: 'white' }}
    >
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
            <Group gap="sm">
              <IconFlask size={24} />
              <span>Tasting Log</span>
              {entries.length > 0 && (
                <Badge variant="light" color="wine">
                  {entries.length}
                </Badge>
              )}
            </Group>
          </Title>
          {!formOpen && (
            <Button
              leftSection={<IconPlus size={16} />}
              variant="light"
              color="wine"
              onClick={() => setFormOpen(true)}
            >
              Add tasting
            </Button>
          )}
        </Group>

        {formOpen && (
          <Card
            padding="md"
            radius="md"
            withBorder
            style={{ borderColor: 'var(--color-wine)', background: 'var(--color-cream)' }}
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600}>New tasting</Text>
                <ActionIcon
                  variant="subtle"
                  onClick={() => {
                    resetForm()
                    setFormOpen(false)
                  }}
                  aria-label="Cancel"
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
              <Textarea
                label="Nose"
                placeholder="What do you smell?"
                value={nose}
                onChange={(e) => setNose(e.currentTarget.value)}
                autosize
                minRows={2}
              />
              <Textarea
                label="Palate"
                placeholder="What do you taste?"
                value={palate}
                onChange={(e) => setPalate(e.currentTarget.value)}
                autosize
                minRows={2}
              />
              <Textarea
                label="Finish"
                placeholder="How does it end?"
                value={finish}
                onChange={(e) => setFinish(e.currentTarget.value)}
                autosize
                minRows={2}
              />
              <Group grow>
                <NumberInput
                  label="Rating (0–100)"
                  value={rating}
                  onChange={(val) =>
                    setRating(typeof val === 'number' ? val : '')
                  }
                  min={0}
                  max={100}
                  allowDecimal={false}
                />
                <TextInput
                  label="Context"
                  placeholder="Thanksgiving, tasting with Mike…"
                  value={context}
                  onChange={(e) => setContext(e.currentTarget.value)}
                />
              </Group>
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  onClick={() => {
                    resetForm()
                    setFormOpen(false)
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  style={{ background: 'var(--gradient-wine)' }}
                >
                  Save tasting
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {loading ? (
          <Group justify="center" py="lg">
            <Loader size="sm" />
          </Group>
        ) : entries.length === 0 && !formOpen ? (
          <Text c="dimmed" ta="center" py="md">
            No tastings yet. Add your first impressions above.
          </Text>
        ) : (
          <Stack gap="md">
            {entries.map((entry, idx) => (
              <Box key={entry.id}>
                {idx > 0 && <Divider mb="md" color="var(--color-beige)" />}
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                      {new Date(entry.tastedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {entry.context && (
                        <Text span c="dimmed" ml="xs">
                          · {entry.context}
                        </Text>
                      )}
                    </Text>
                  </Stack>
                  <Group gap="xs">
                    {entry.rating !== null && (
                      <Badge variant="filled" color="wine" size="lg">
                        {entry.rating}
                      </Badge>
                    )}
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Delete tasting"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Stack gap={6} mt="xs" pl="xs">
                  {entry.nose && (
                    <Text size="sm">
                      <Text span fw={600} c="dimmed">
                        Nose:{' '}
                      </Text>
                      {entry.nose}
                    </Text>
                  )}
                  {entry.palate && (
                    <Text size="sm">
                      <Text span fw={600} c="dimmed">
                        Palate:{' '}
                      </Text>
                      {entry.palate}
                    </Text>
                  )}
                  {entry.finish && (
                    <Text size="sm">
                      <Text span fw={600} c="dimmed">
                        Finish:{' '}
                      </Text>
                      {entry.finish}
                    </Text>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
