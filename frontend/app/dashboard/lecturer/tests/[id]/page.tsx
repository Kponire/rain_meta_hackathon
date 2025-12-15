"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, Paper, Group, Title, Text, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api/client";
import AIGenerateTest from "@/components/lecturer/AIGenerateTest";
import TestsList from "@/components/lecturer/TestsList";
import TestAttempts from "@/components/lecturer/TestAttempts";

export default function CourseTestsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && user?.id) fetchCourse();
  }, [courseId, user?.id]);

  const fetchCourse = async () => {
    try {
      const res = await apiClient.courses.getLecturerCourses(user!.id, true);
      const found = res.data.courses?.find((c: any) => c.id === courseId);
      setCourse(found || null);
      const testsRes = await apiClient.tests.getAll(courseId);
      setTests(testsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchCourse();

  if (loading) return <Text c="dimmed">Loading...</Text>;
  if (!course) return <Text c="dimmed">Course not found.</Text>;

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        <GlassCard padding="lg">
          <Group justify="apart">
            <div>
              <Title order={1}>{course.title}</Title>
              {course.description && (
                <Text c="dimmed">{course.description}</Text>
              )}
            </div>
          </Group>
        </GlassCard>

        <Tabs defaultValue="generate">
          <Tabs.List>
            <Tabs.Tab value="generate">AI Generate</Tabs.Tab>
            <Tabs.Tab value="list">My Tests ({tests.length})</Tabs.Tab>
            <Tabs.Tab value="attempts">Attempts</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="generate" pt="xl">
            <AIGenerateTest
              courseId={courseId}
              courseName={course.title}
              onTestSaved={handleRefresh}
            />
          </Tabs.Panel>

          <Tabs.Panel value="list" pt="xl">
            <TestsList courseId={courseId} onRefresh={handleRefresh} />
          </Tabs.Panel>

          <Tabs.Panel value="attempts" pt="xl">
            <Text c="dimmed">
              Select a test from the list tab, then come here to view attempts.
            </Text>
            <TestAttempts testId={selectedTestId} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
}
