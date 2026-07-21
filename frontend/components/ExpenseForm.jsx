import { useState } from 'react';
import {
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import '@mantine/dates/styles.css';

const CATEGORIES = [
  { value: 'Food', label: '🍔 Food' },
  { value: 'Transport', label: '🚗 Transport' },
  { value: 'Entertainment', label: '🎬 Entertainment' },
  { value: 'Health', label: '💊 Health' },
  { value: 'Shopping', label: '🛍️ Shopping' },
  { value: 'Bills', label: '📄 Bills' },
  { value: 'Education', label: '📚 Education' },
  { value: 'Other', label: '📦 Other' },
];

const initialForm = {
  title: '',
  amount: '',
  category: null,
  date: new Date(),
  note: '',
};

export default function ExpenseForm({ onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.amount || form.amount <= 0) newErrors.amount = 'Enter a valid amount';
    if (!form.category) newErrors.category = 'Please select a category';
    if (!form.date) newErrors.date = 'Date is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date.toISOString().split('T')[0],
        note: form.note.trim(),
      };
      if (onSubmit) await onSubmit(payload);
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm(initialForm);
    setErrors({});
  };

  return (
    <Paper shadow="sm" radius="xl" p="xl" withBorder component="form" onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* Error notice */}
        {Object.keys(errors).length > 0 && (
          <Text c="red" size="sm" fw={500}>
            Please fill in all required fields corrected.
          </Text>
        )}

        <Group grow>
          <TextInput
            label="Title"
            placeholder="e.g. Lunch, Grab ride"
            required
            radius="md"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={!!errors.title}
          />
          <Select
            label="Category"
            placeholder="Select a category"
            data={CATEGORIES}
            required
            searchable
            radius="md"
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val || '' })}
            error={!!errors.category}
          />
        </Group>

        <Textarea
          label="Note"
          placeholder="Optional note (e.g. Chicken Rice at Kanna)"
          radius="md"
          autosize
          minRows={2}
          maxRows={4}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <Group grow>
          <NumberInput
            label="Amount (RM)"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            fixedDecimalScale
            required
            radius="md"
            value={form.amount}
            onChange={(val) => setForm({ ...form, amount: val })}
            error={!!errors.amount}
          />
          <DateInput
            label="Date"
            placeholder="Select date"
            required
            radius="md"
            value={form.date}
            onChange={(val) => setForm({ ...form, date: val })}
            error={!!errors.date}
            valueFormat="DD MMM YYYY"
          />
        </Group>

        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" color="dark" radius="xl" onClick={handleClear}>
            Clear
          </Button>
          <Button type="submit" variant="filled" color="dark" radius="xl" loading={loading}>
            Save Expense
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
