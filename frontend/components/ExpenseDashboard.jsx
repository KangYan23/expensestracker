import { useEffect, useState, useCallback } from 'react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Loader,
    Paper,
    Progress,
    RingProgress,
    ScrollArea,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';

import {
    IconTrash,
    IconCash,
    IconCalendarMonth,
    IconChartPie,
    IconReceipt2,
    IconArrowUpRight,
    IconAlertCircle,
} from '@tabler/icons-react';


const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CATEGORY_COLORS = {
    Food: 'orange',
    Transport: 'blue',
    Entertainment: 'grape',
    Health: 'green',
    Shopping: 'pink',
    Bills: 'red',
    Education: 'cyan',
    Other: 'gray',
};

const CATEGORY_EMOJI = {
    Food: '🍔',
    Transport: '🚗',
    Entertainment: '🎬',
    Health: '💊',
    Shopping: '🛍️',
    Bills: '📄',
    Education: '📚',
    Other: '📦',
};

function fmtRM(n) {
    return `RM ${Number(n).toFixed(2)}`;
}

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <Card shadow="sm" radius="md" withBorder p="lg">
            <Group justify="space-between" mb={4}>
                <Text size="sm" c="dimmed" fw={500}>{label}</Text>
                <Box
                    style={{
                        background: `var(--mantine-color-${color}-1)`,
                        borderRadius: 8,
                        padding: 6,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Icon size={18} color={`var(--mantine-color-${color}-6)`} />
                </Box>
            </Group>
            <Text fw={700} size="xl" mt={4}>{value}</Text>
            {sub && <Text size="xs" c="dimmed" mt={2}>{sub}</Text>}
        </Card>
    );
}

export default function ExpenseDashboard() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch(`${API}/api/expenses`);
            if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
            const data = await res.json();
            setExpenses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch failed:', err);
            setFetchError(`${err.message} — is the backend running at ${API}?`);
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);



    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await fetch(`${API}/api/expenses/${id}`, { method: 'DELETE' });
            setExpenses((prev) => prev.filter((e) => e._id !== id));
        } finally {
            setDeleting(null);
        }
    };

    // ── Stats ──────────────────────────────────────────────────────────
    const total = expenses.reduce((s, e) => s + e.amount, 0);

    const now = new Date();
    const thisMonth = expenses
        .filter((e) => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, e) => s + e.amount, 0);

    const avg = expenses.length ? total / expenses.length : 0;

    const byCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {});

    const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    const ringData = categoryEntries.slice(0, 5).map(([cat, val]) => ({
        value: total > 0 ? Math.round((val / total) * 100) : 0,
        color: `var(--mantine-color-${CATEGORY_COLORS[cat] || 'gray'}-5)`,
        tooltip: `${cat}: ${fmtRM(val)}`,
    }));

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <Box p={{ base: 'xs', sm: 'md' }}>

            {/* Header */}
            <Group mb="lg">
                <div>
                    <Title order={2} fw={700}>Expense Dashboard</Title>
                    <Text c="dimmed" size="sm">Track and manage your spending</Text>
                </div>
            </Group>

            {/* Error banner */}
            {fetchError && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    mb="md"
                    title="Could not load expenses"
                    withCloseButton
                    onClose={() => setFetchError(null)}
                >
                    {fetchError}
                </Alert>
            )}

            {/* Stat Cards */}
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} mb="lg">
                <StatCard
                    icon={IconCash}
                    label="Total Spent"
                    value={fmtRM(total)}
                    color="blue"
                    sub={`Across ${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`}
                />
                <StatCard
                    icon={IconCalendarMonth}
                    label="This Month"
                    value={fmtRM(thisMonth)}
                    color="green"
                    sub={now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                />
                <StatCard
                    icon={IconArrowUpRight}
                    label="Avg per Transaction"
                    value={fmtRM(avg)}
                    color="violet"
                    sub="All time average"
                />
            </SimpleGrid>

            {/* Chart + Breakdown */}
            {categoryEntries.length > 0 && (
                <Paper shadow="sm" radius="md" withBorder p="lg" mb="lg">
                    <Group align="flex-start" gap="xl" wrap="wrap">
                        <RingProgress
                            size={150}
                            thickness={16}
                            sections={ringData}
                            label={
                                <Stack gap={0} align="center">
                                    <IconChartPie size={24} color="var(--mantine-color-blue-5)" />
                                    <Text size="xs" c="dimmed">Breakdown</Text>
                                </Stack>
                            }
                        />
                        <Stack gap="xs" style={{ flex: 1, minWidth: 200 }}>
                            <Text fw={600} size="sm" mb={4}>Category Breakdown</Text>
                            {categoryEntries.map(([cat, val]) => (
                                <Box key={cat}>
                                    <Group justify="space-between" mb={2}>
                                        <Text size="sm">{CATEGORY_EMOJI[cat]} {cat}</Text>
                                        <Text size="sm" fw={500}>{fmtRM(val)}</Text>
                                    </Group>
                                    <Progress
                                        value={total > 0 ? (val / total) * 100 : 0}
                                        color={CATEGORY_COLORS[cat] || 'gray'}
                                        size="sm"
                                        radius="xl"
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Group>
                </Paper>
            )}

            {/* Expense List */}
            <Paper shadow="sm" radius="md" withBorder>
                <Group p="md" pb={0} justify="space-between">
                    <Group gap="xs">
                        <IconReceipt2 size={18} />
                        <Text fw={600}>All Expenses</Text>
                    </Group>
                    <Group gap="xs">
                        <Text size="xs" c="dimmed">{expenses.length} records</Text>
                        <Button size="xs" variant="subtle" onClick={fetchExpenses} loading={loading}>
                            Refresh
                        </Button>
                    </Group>
                </Group>
                <Divider mt="md" />

                {loading ? (
                    <Stack align="center" py="xl">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">Loading expenses…</Text>
                    </Stack>
                ) : expenses.length === 0 ? (
                    <Stack align="center" py="xl">
                        <Text size="sm" c="dimmed">
                            {fetchError
                                ? 'Could not fetch — check the error above.'
                                : 'No expenses yet. Click "Add Expense" to get started.'}
                        </Text>
                    </Stack>
                ) : (
                    <ScrollArea>
                        <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Title</Table.Th>
                                    <Table.Th>Category</Table.Th>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Note</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                                    <Table.Th style={{ width: 40 }} />
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {expenses.map((exp) => (
                                    <Table.Tr key={exp._id}>
                                        <Table.Td fw={500}>{exp.title}</Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={CATEGORY_COLORS[exp.category] || 'gray'}
                                                variant="light"
                                                size="sm"
                                            >
                                                {CATEGORY_EMOJI[exp.category]} {exp.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td c="dimmed" size="sm">
                                            {new Date(exp.date).toLocaleDateString('en-MY', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </Table.Td>
                                        <Table.Td c="dimmed" size="xs" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {exp.note || '—'}
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={600}>
                                            {fmtRM(exp.amount)}
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label="Delete">
                                                <ActionIcon
                                                    color="red"
                                                    variant="subtle"
                                                    loading={deleting === exp._id}
                                                    onClick={() => handleDelete(exp._id)}
                                                >
                                                    <IconTrash size={15} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Paper>

        </Box>
    );
}
