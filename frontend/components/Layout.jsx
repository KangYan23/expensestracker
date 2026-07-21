import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Title,
  Stack,
  Avatar,
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IconSun, IconMoon } from '@tabler/icons-react';

const navItems = [
  {
    label: 'Register Expense',
    description: 'Record a new transaction',
    href: '/',
  },
  {
    label: 'View Expenses',
    description: 'Browse expense records & analytics',
    href: '/expenses',
  },
];

export default function Layout({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} style={{ letterSpacing: '-0.5px' }}>
              EXPENSETRACKER
              <Text span c="dimmed" fw={400} size="sm" ml={6}>
                Personal Expense Tracker
              </Text>
            </Title>
          </Group>

          <Group gap="sm">
            <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <ActionIcon variant="subtle" color="gray" onClick={toggleColorScheme} size="lg" radius="md">
                {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>
            <Avatar size="sm" radius="xl" color="dark">
              E
            </Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar */}
      <AppShell.Navbar p="md">
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4} px={4}>
            Navigation
          </Text>
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <NavLink
                key={item.label}
                component={Link}
                href={item.href}
                active={isActive}
                label={item.label}
                description={item.description}
                variant="subtle"
                color="dark"
                style={{
                  borderRadius: '0 8px 8px 0',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  paddingLeft: isActive ? '16px' : '12px',
                  borderLeft: isActive
                    ? '4px solid var(--mantine-color-black)'
                    : '4px solid transparent',
                  backgroundColor: isActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            );
          })}
        </Stack>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
