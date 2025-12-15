"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Card,
  Button,
  Group,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/components/AuthContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { FaArrowRight } from "react-icons/fa";

export default function LecturerTestsIndex() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchCourses();
  }, [user?.id]);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.courses.getLecturerCourses(user!.id, true);
      setCourses(res.data.courses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Container size="xl" py="xl">
        <LoadingSkeleton type="list" count={3} />
      </Container>
    );

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        <div>
          <Title order={1}>Test Management</Title>
          <Text c="dimmed">
            Generate, publish and review tests for your courses.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {courses.map((c) => (
            <Card
              key={c.id}
              withBorder
              onClick={() => router.push(`/dashboard/lecturer/tests/${c.id}`)}
              style={{ cursor: "pointer" }}
            >
              <Group justify="apart">
                <div>
                  <Text fw={700}>{c.title}</Text>
                  <Text size="sm" c="dimmed">
                    {c.code}
                  </Text>
                </div>
                <Button variant="light" rightSection={<FaArrowRight />}>
                  Manage
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </div>
  );
}
