'use client'

import { Card, Stack, Title, Text, SimpleGrid, Box, Group, Button } from '@mantine/core'
import Link from 'next/link'
import { IconBottleFilled, IconMapPin, IconCamera, IconPlus } from '@tabler/icons-react'

export function WelcomeCard() {
  return (
    <Card
      padding="xl"
      radius="md"
      withBorder
      style={{
        borderColor: 'var(--color-beige)',
        background: 'white',
        textAlign: 'center'
      }}
    >
      <Stack gap="xl" align="center">
        <Box>
          <Title order={2} mb="md" style={{ color: 'var(--color-burgundy)' }}>
            Welcome to Sippin! 🍷
          </Title>
          <Text size="lg" c="dimmed" mb="xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Start building your collection by adding bottles or creating storage locations for your wine and spirits.
          </Text>
        </Box>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" style={{ width: '100%', maxWidth: '800px' }}>
          {/* Add Bottles Card */}
          <Card
            padding="xl"
            radius="md"
            withBorder
            style={{
              borderColor: 'var(--color-wine)',
              borderWidth: 2,
              background: 'var(--color-cream)',
            }}
          >
            <Stack gap="md" align="center">
              <Box
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--gradient-wine)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconBottleFilled size={40} color="white" />
              </Box>
              <div>
                <Title order={3} ta="center" mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                  Add Your First Bottle
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  Scan a bottle or add it manually to start tracking your collection
                </Text>
              </div>
              <Group gap="xs" mt="sm" justify="center">
                <Button
                  component={Link}
                  href="/bottles/scan"
                  leftSection={<IconCamera size={18} />}
                  variant="light"
                  size="md"
                  style={{ color: 'var(--color-wine)' }}
                >
                  Scan Bottle
                </Button>
                <Button
                  component={Link}
                  href="/bottles"
                  leftSection={<IconPlus size={18} />}
                  size="md"
                  style={{ background: 'var(--gradient-wine)' }}
                >
                  Add Manually
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Create Stash Card */}
          <Card
            padding="xl"
            radius="md"
            withBorder
            style={{
              borderColor: 'var(--color-amber)',
              borderWidth: 2,
              background: 'var(--color-cream)',
            }}
          >
            <Stack gap="md" align="center">
              <Box
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--gradient-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconMapPin size={40} color="white" />
              </Box>
              <div>
                <Title order={3} ta="center" mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                  Create a Storage Location
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  Set up your wine cellar, liquor cabinet, or any storage space
                </Text>
              </div>
              <Button
                component={Link}
                href="/stashes/create"
                leftSection={<IconPlus size={18} />}
                size="md"
                fullWidth
                style={{ background: 'var(--gradient-amber)', marginTop: '1rem' }}
              >
                Create Stash
              </Button>
            </Stack>
          </Card>
        </SimpleGrid>

        <Box mt="xl">
          <Text size="sm" c="dimmed" ta="center">
            💡 Tip: You can add bottles first and organize them into storage locations later, or set up your storage spaces first and add bottles to them.
          </Text>
        </Box>
      </Stack>
    </Card>
  )
}
