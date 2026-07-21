import { useState } from 'react';
import {
  Alert,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import ExpenseForm from '@/components/ExpenseForm';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save');
      }
      setSuccess(`${data.title} — RM ${data.amount.toFixed(2)} added successfully!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Stack gap="lg" maw={600} mx="auto" mt="xl">
      <div>
        <Title order={2} style={{ letterSpacing: '-0.5px' }}>
          Register New Expense
        </Title>
        <Text size="sm" c="dimmed">
          Add a new expense transaction to the system database.
        </Text>
      </div>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
          {error}
        </Alert>
      )}
      {success && (
        <Alert icon={<IconCheck size={16} />} color="teal" radius="md">
          {success}
        </Alert>
      )}

      <ExpenseForm onSubmit={handleSubmit} />
    </Stack>
  );
}
