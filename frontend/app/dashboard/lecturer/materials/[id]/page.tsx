"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  Tabs,
  Paper,
  Group,
  Badge,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaRobot, FaUpload, FaList, FaInfoCircle } from "react-icons/fa";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useParams, useRouter } from "next/navigation";
import { AIGenerateMaterials } from "@/components/lecturer/AIGenerateMaterials";
import { UploadMaterials } from "@/components/lecturer/UploadMaterials";
import { MaterialsList } from "@/components/lecturer/MaterialsList";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
}

export default function CourseMaterialsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (courseId && user?.id) {
      fetchCourseData();
    }
  }, [courseId, user?.id]);

  const fetchCourseData = async () => {
    try {
      const [coursesResponse, materialsResponse] = await Promise.all([
        apiClient.courses.getLecturerCourses(user!.id, true),
        apiClient.courses.getMaterials(courseId),
      ]);

      const foundCourse = coursesResponse.data.courses?.find(
        (c: any) => c.id === courseId
      );
      if (!foundCourse) {
        router.push("/dashboard/lecturer/materials");
        return;
      }

      setCourse(foundCourse);
      setMaterials(materialsResponse.data.materials || []);
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialAdded = () => {
    fetchCourseData();
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <LoadingSkeleton type="form" />
      </Container>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard padding="lg">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Group gap="sm" mb="xs">
                  <Badge size="lg" variant="light">
                    {course.code}
                  </Badge>
                  <Badge size="lg" color="green">
                    {materials.length} Material
                    {materials.length !== 1 ? "s" : ""}
                  </Badge>
                </Group>
                <Title order={1} size={32}>
                  {course.title}
                </Title>
                {course.description && (
                  <Text c="dimmed" mt="xs">
                    {course.description}
                  </Text>
                )}
              </div>
            </Group>
          </GlassCard>
        </motion.div>

        {/* Instructions Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper
            p="md"
            withBorder
            style={{ background: "rgba(29, 161, 242, 0.05)" }}
          >
            <Group gap="sm">
              <FaInfoCircle size={20} color="#1DA1F2" />
              <Text size="sm" fw={600} c="twitterBlue">
                Choose how you want to add materials to this course
              </Text>
            </Group>
          </Paper>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="ai-generate" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="ai-generate" leftSection={<FaRobot />}>
              <Text fw={600}>AI Generate</Text>
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<FaUpload />}>
              <Text fw={600}>Manual Upload</Text>
            </Tabs.Tab>
            <Tabs.Tab value="list" leftSection={<FaList />}>
              <Text fw={600}>All Materials ({materials.length})</Text>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ai-generate" pt="xl">
            <AIGenerateMaterials
              courseId={courseId}
              courseName={course.title}
              onMaterialAdded={handleMaterialAdded}
            />
          </Tabs.Panel>

          <Tabs.Panel value="upload" pt="xl">
            <UploadMaterials
              courseId={courseId}
              courseName={course.title}
              onMaterialAdded={handleMaterialAdded}
            />
          </Tabs.Panel>

          <Tabs.Panel value="list" pt="xl">
            <MaterialsList
              materials={materials}
              onRefresh={handleMaterialAdded}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
}
