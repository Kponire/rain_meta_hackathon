"use client";

import { useEffect, useState } from "react";
import { Stack, Card, Text, Group, Badge } from "@mantine/core";
import { apiClient } from "@/lib/api/client";

interface Props {
  testId?: string | null;
}

export function TestAttempts({ testId }: Props) {
  const [attempts, setAttempts] = useState<any[]>([]);

  const fetch = async (id?: string | null) => {
    if (!id) return setAttempts([]);
    try {
      const res = await apiClient.tests.getAttempts(id);
      setAttempts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch(testId);
  }, [testId]);

  if (!testId) return <Text c="dimmed">Select a test to view attempts.</Text>;

  return (
    <Stack>
      {attempts.map((a) => (
        <Card key={a.id} withBorder>
          <Group justify="apart">
            <div>
              <Text fw={700}>{a.student_name ?? a.student_id}</Text>
              <Text size="sm" c="dimmed">
                Score: {a.score ?? "—"}
              </Text>
            </div>
            <div>
              <Badge>{a.is_completed ? "Completed" : "In Progress"}</Badge>
            </div>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

export default TestAttempts;
