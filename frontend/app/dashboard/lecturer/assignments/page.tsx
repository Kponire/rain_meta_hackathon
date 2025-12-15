"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Card,
  Badge,
  Button,
  Paper,
  List,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaClipboardList,
  FaPlus,
  FaArrowRight,
  FaInfoCircle,
  FaRobot,
  FaCheckCircle,
} from "react-icons/fa";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  created_at: string;
  assignments_count?: number;
}

export default function LecturerAssignmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    if (!user?.id) return;

    try {
      const response = await apiClient.courses.getLecturerCourses(
        user.id,
        true
      );
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <LoadingSkeleton type="list" count={3} />
      </Container>
    );
  }

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} size={36}>
                📝 Assignment Management
              </Title>
              <Text c="dimmed" size="lg" mt="xs">
                Create, manage, and grade AI-powered assignments for your
                courses
              </Text>
            </div>
            <Button
              leftSection={<FaCheckCircle />}
              size="lg"
              variant="light"
              onClick={() =>
                router.push("/dashboard/lecturer/assignments/my-assignments")
              }
            >
              View All My Assignments
            </Button>
          </Group>
        </motion.div>

        {/* Information Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper
            p="lg"
            withBorder
            style={{
              background:
                "linear-gradient(135deg, rgba(29, 161, 242, 0.05) 0%, rgba(121, 75, 196, 0.05) 100%)",
            }}
          >
            <Group gap="md" align="flex-start">
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: "rgba(29, 161, 242, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1DA1F2",
                  fontSize: 24,
                }}
              >
                <FaInfoCircle />
              </div>
              <Stack gap="sm" style={{ flex: 1 }}>
                <Text fw={700} size="lg">
                  How Assignment Management Works
                </Text>
                <List spacing="sm">
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 1:</strong> Select a course from the list
                      below to create assignments
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 2:</strong> Use AI to generate assignment
                      questions or create manually
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 3:</strong> Preview and edit AI-generated
                      content before saving
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 4:</strong> Publish assignments with due
                      dates for students to complete
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 5:</strong> Review submissions and provide
                      grades with AI assistance
                    </Text>
                  </List.Item>
                </List>
              </Stack>
            </Group>
          </Paper>
        </motion.div>

        {/* Features Overview */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <GlassCard padding="lg">
            <Stack gap="sm">
              <Group gap="xs">
                <div style={{ fontSize: 32 }}>🤖</div>
                <Text fw={700} size="lg">
                  AI Generation
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Let AI create diverse questions based on your topic, difficulty
                level, and question types
              </Text>
              <List size="sm" spacing="xs">
                <List.Item>Essay questions</List.Item>
                <List.Item>Short answer questions</List.Item>
                <List.Item>Multiple choice options</List.Item>
                <List.Item>Customizable difficulty</List.Item>
              </List>
            </Stack>
          </GlassCard>

          <GlassCard padding="lg">
            <Stack gap="sm">
              <Group gap="xs">
                <div style={{ fontSize: 32 }}>📊</div>
                <Text fw={700} size="lg">
                  Smart Grading
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                AI-assisted grading helps you evaluate submissions faster and
                more consistently
              </Text>
              <List size="sm" spacing="xs">
                <List.Item>Automatic scoring</List.Item>
                <List.Item>Detailed feedback</List.Item>
                <List.Item>Rubric-based evaluation</List.Item>
                <List.Item>Batch processing</List.Item>
              </List>
            </Stack>
          </GlassCard>

          <GlassCard padding="lg">
            <Stack gap="sm">
              <Group gap="xs">
                <div style={{ fontSize: 32 }}>📈</div>
                <Text fw={700} size="lg">
                  Analytics
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Track student performance and identify areas where students need
                help
              </Text>
              <List size="sm" spacing="xs">
                <List.Item>Submission tracking</List.Item>
                <List.Item>Grade distribution</List.Item>
                <List.Item>Performance insights</List.Item>
                <List.Item>Time to completion</List.Item>
              </List>
            </Stack>
          </GlassCard>
        </SimpleGrid>

        {/* Courses List */}
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard padding="xl">
              <Stack align="center" gap="lg">
                <div style={{ fontSize: 80 }}>📚</div>
                <Title order={2} ta="center">
                  No Courses Available
                </Title>
                <Text c="dimmed" ta="center" maw={600}>
                  You need to create a course before you can create assignments.
                  Go to the course management section to create your first
                  course.
                </Text>
                <Button
                  size="lg"
                  leftSection={<FaPlus />}
                  variant="gradient"
                  gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
                  onClick={() => router.push("/dashboard/lecturer/materials")}
                >
                  Create Your First Course
                </Button>
              </Stack>
            </GlassCard>
          </motion.div>
        ) : (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={2} size={24}>
                  Select a Course
                </Title>
                <Text size="sm" c="dimmed">
                  Click on any course to manage its assignments
                </Text>
              </div>
              <Badge size="lg" variant="light">
                {courses.length} Course{courses.length !== 1 ? "s" : ""}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    padding="lg"
                    radius="lg"
                    withBorder
                    style={{
                      cursor: "pointer",
                      height: "100%",
                      transition: "all 0.3s ease",
                      borderLeft: "4px solid #794BC4",
                    }}
                    onClick={() =>
                      router.push(
                        `/dashboard/lecturer/assignments/${course.id}`
                      )
                    }
                  >
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            background:
                              "linear-gradient(135deg, #794BC4 0%, #1DA1F2 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 18,
                            fontWeight: 700,
                          }}
                        >
                          {course.code.substring(0, 3).toUpperCase()}
                        </div>
                        <Badge color="purple" variant="light">
                          {course.assignments_count || 0} Assignments
                        </Badge>
                      </Group>

                      <div>
                        <Text fw={700} size="lg" lineClamp={2}>
                          {course.title}
                        </Text>
                        <Text size="sm" c="dimmed" mt={4}>
                          {course.code}
                        </Text>
                        {course.description && (
                          <Text size="sm" c="dimmed" mt="xs" lineClamp={2}>
                            {course.description}
                          </Text>
                        )}
                      </div>

                      <Button
                        variant="light"
                        fullWidth
                        rightSection={<FaArrowRight />}
                      >
                        Manage Assignments
                      </Button>
                    </Stack>
                  </Card>
                </motion.div>
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Paper p="lg" withBorder>
            <Group gap="md" align="flex-start">
              <div style={{ fontSize: 32 }}>💡</div>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text fw={700} size="lg">
                  Best Practices for Assignments
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <strong>Clear Instructions:</strong> Provide detailed
                    instructions so students know exactly what's expected
                  </List.Item>
                  <List.Item>
                    <strong>Realistic Due Dates:</strong> Give students adequate
                    time to complete quality work
                  </List.Item>
                  <List.Item>
                    <strong>Varied Question Types:</strong> Mix essay and short
                    answer questions for comprehensive assessment
                  </List.Item>
                  <List.Item>
                    <strong>Preview Before Publishing:</strong> Always review
                    AI-generated content before making it available
                  </List.Item>
                  <List.Item>
                    <strong>Timely Feedback:</strong> Grade and provide feedback
                    promptly to help students learn
                  </List.Item>
                </List>
              </Stack>
            </Group>
          </Paper>
        </motion.div>
      </Stack>
    </div>
  );
}
