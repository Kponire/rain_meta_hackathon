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
import { FaRobot, FaList, FaInbox, FaInfoCircle } from "react-icons/fa";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useParams, useRouter } from "next/navigation";
import { AIGenerateAssignment } from "@/components/lecturer/AIGenerateAssignment";
import { AssignmentsList } from "@/components/lecturer/AssignmentsList";
import { AssignmentSubmissions } from "@/components/lecturer/AssignmentSubmissions";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
}

export default function CourseAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (courseId && user?.id) {
      fetchCourseData();
    }
  }, [courseId, user?.id]);

  const fetchCourseData = async () => {
    try {
      const coursesResponse = await apiClient.courses.getLecturerCourses(
        user!.id,
        true
      );
      const foundCourse = coursesResponse.data.courses?.find(
        (c: any) => c.id === courseId
      );

      if (!foundCourse) {
        router.push("/dashboard/lecturer/assignments");
        return;
      }

      setCourse(foundCourse);

      // Fetch assignments for this course
      const assignmentsResponse = await apiClient.assignments.getAll(courseId);
      console.log(assignmentsResponse);
      setAssignments(assignmentsResponse.data || []);
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentAdded = () => {
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
                  <Badge size="lg" color="purple">
                    {assignments.length} Assignment
                    {assignments.length !== 1 ? "s" : ""}
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
            style={{ background: "rgba(121, 75, 196, 0.05)" }}
          >
            <Group gap="sm">
              <FaInfoCircle size={20} color="#794BC4" />
              <Text size="sm" fw={600} c="purple">
                Create assignments, track submissions, and grade student work
                all in one place
              </Text>
            </Group>
          </Paper>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="generate" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="generate" leftSection={<FaRobot />}>
              <Text fw={600}>AI Generate</Text>
            </Tabs.Tab>
            <Tabs.Tab value="list" leftSection={<FaList />}>
              <Text fw={600}>My Assignments ({assignments.length})</Text>
            </Tabs.Tab>
            <Tabs.Tab value="submissions" leftSection={<FaInbox />}>
              <Text fw={600}>Student Submissions</Text>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="generate" pt="xl">
            <AIGenerateAssignment
              courseId={courseId}
              courseName={course.title}
              onAssignmentAdded={handleAssignmentAdded}
            />
          </Tabs.Panel>

          <Tabs.Panel value="list" pt="xl">
            <AssignmentsList
              assignments={assignments}
              courseId={courseId}
              onRefresh={handleAssignmentAdded}
            />
          </Tabs.Panel>

          <Tabs.Panel value="submissions" pt="xl">
            <AssignmentSubmissions
              assignments={assignments}
              courseId={courseId}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
}
