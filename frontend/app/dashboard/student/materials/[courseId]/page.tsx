"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Title, Text, Stack, Group, Button } from "@mantine/core";
import { apiClient } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { MaterialsList } from "@/components/lecturer/MaterialsList";
import { GlassCard } from "@/components/ui/GlassCard";

export default function CourseMaterialsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const [materials, setMaterials] = useState<any[]>([]);
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await apiClient.courses.getMaterials(courseId);
      setCourse(res.data.course || null);
      setMaterials(res.data.materials || []);
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      setLoading(false);
    }
  };

  if (!courseId) return <div style={{ padding: 20 }}>No course selected</div>;

  if (loading) return <LoadingSkeleton type="card" />;

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="md">
        <Group justify="apart">
          <div>
            <Title order={2}>{course?.title || "Course Materials"}</Title>
            <Text c="dimmed">{course?.description}</Text>
          </div>
          <div>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </Group>

        {materials.length === 0 ? (
          <GlassCard padding="xl">
            <Text c="dimmed">No materials found for this course yet.</Text>
          </GlassCard>
        ) : (
          <MaterialsList materials={materials} onRefresh={fetchMaterials} />
        )}
      </Stack>
    </div>
  );
}
