"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Modal,
  SimpleGrid,
  Card,
} from "@mantine/core";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  code: string;
  description?: string;
  lecturer?: string;
}

export default function StudentMaterialsPage() {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState<Course[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // enrolled courses ( student's own )
      const enrolledRes = await apiClient.courses.getStudentCourses();
      setEnrolled(enrolledRes.data.courses || enrolledRes.data || []);

      // fetch published courses using api client
      try {
        const allRes = await apiClient.courses.getAll();
        setAvailable(allRes.data.courses || allRes.data || []);
      } catch (err) {
        setAvailable([]);
      }
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to load courses",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const openConfirmEnroll = (course: Course) => {
    setSelectedCourse(course);
    setConfirmOpen(true);
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    try {
      await apiClient.courses.enroll(selectedCourse.id);
      notifications.show({
        title: "Enrolled",
        message: `You are now enrolled in ${selectedCourse.title}`,
        color: "green",
      });
      setConfirmOpen(false);
      fetchCourses();
    } catch (err: any) {
      notifications.show({
        title: "Enrollment Failed",
        message: err?.response?.data?.detail || "Could not enroll",
        color: "red",
      });
    }
  };

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Group justify="apart">
            <div>
              <Title order={2}>Course Materials</Title>
              <Text c="dimmed">
                Browse available courses and access your enrolled course
                materials.
              </Text>
            </div>
            <Badge size="lg" color="twitterBlue">
              Student View
            </Badge>
          </Group>
        </motion.div>

        {/* Available Courses */}
        <div>
          <Group justify="apart" mb="md">
            <Title order={4}>Available Courses</Title>
            <Button variant="subtle" onClick={fetchCourses}>
              Refresh
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {available.length === 0 && (
              <GlassCard padding="xl">
                <Text c="dimmed">No public courses available right now.</Text>
              </GlassCard>
            )}

            {available.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard padding="lg" style={{ cursor: "default" }}>
                  <Stack>
                    <Group justify="apart" align="flex-start">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group>
                          <Badge size="sm" variant="light">
                            {course.code}
                          </Badge>
                          <Text fw={700} size="lg" lineClamp={2}>
                            {course.title}
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {course.description}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <Button
                          size="sm"
                          variant="filled"
                          onClick={() => openConfirmEnroll(course)}
                        >
                          Enroll
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={() =>
                            router.push(
                              `/dashboard/student/materials/${course.id}`
                            )
                          }
                        >
                          View
                        </Button>
                      </div>
                    </Group>
                  </Stack>
                </GlassCard>
              </motion.div>
            ))}
          </SimpleGrid>
        </div>

        {/* Enrolled Courses */}
        <div>
          <Group justify="apart" mb="md">
            <Title order={4}>My Enrolled Courses</Title>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/student")}
            >
              Back to Dashboard
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {enrolled.length === 0 && (
              <GlassCard padding="xl">
                <Text c="dimmed">
                  You have not enrolled in any courses yet. Use the enroll
                  buttons above to join courses.
                </Text>
              </GlassCard>
            )}

            {enrolled.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  withBorder
                  radius="md"
                  padding="lg"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    router.push(`/dashboard/student/materials/${course.id}`)
                  }
                >
                  <Group justify="apart">
                    <div style={{ minWidth: 0 }}>
                      <Text fw={700}>{course.title}</Text>
                      <Text size="xs" c="dimmed">
                        {course.code}{" "}
                        {course.lecturer ? `• ${course.lecturer}` : ""}
                      </Text>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/student/materials/${course.id}`
                        );
                      }}
                    >
                      Open
                    </Button>
                  </Group>
                </Card>
              </motion.div>
            ))}
          </SimpleGrid>
        </div>

        <Modal
          opened={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirm Enrollment"
        >
          <Stack>
            <Text>
              Are you sure you want to enroll in{" "}
              <Text fw={700} component="span">
                {selectedCourse?.title}
              </Text>
              ?
            </Text>
            <Group justify="right">
              <Button variant="default" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button color="green" onClick={handleEnroll}>
                Yes, Enroll
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </div>
  );
}
