"use client";

import {
  Container,
  Grid,
  Title,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Progress,
  Badge,
  Card,
  Avatar,
  ActionIcon,
  Menu,
  Button,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBook,
  FaUserGraduate,
  FaClipboardList,
  FaFileAlt,
  FaChartLine,
  FaPlus,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

interface CourseStats {
  id: string;
  title: string;
  code: string;
  enrollmentCount: number;
  activeAssignments: number;
  avgPerformance: number;
  pendingSubmissions: number;
}

interface RecentActivity {
  id: string;
  type: "submission" | "enrollment" | "completion";
  student: string;
  course: string;
  timestamp: string;
  avatar?: string;
}

export default function LecturerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    avgCoursePerformance: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      /*const coursesRes = await apiClient.courses.getLecturerCourses();
      setCourses(coursesRes.data);

      setStats({
        totalCourses: coursesRes.data.length,
        totalStudents: coursesRes.data.reduce(
          (sum: number, c: any) => sum + c.enrollmentCount,
          0
        ),
        pendingGrading: 12,
        avgCoursePerformance: 84.5,
      });*/

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "submission",
          student: "John Doe",
          course: "CS101",
          timestamp: "5m ago",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        },
        {
          id: "2",
          type: "enrollment",
          student: "Jane Smith",
          course: "CS201",
          timestamp: "15m ago",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    router.push("/dashboard/lecturer/courses/create");
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await apiClient.courses.delete(courseId);
      notifications.show({
        title: "Success",
        message: "Course deleted successfully",
        color: "green",
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <LoadingSkeleton type="dashboard" />
      </Container>
    );
  }

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} size={36}>
                Welcome back, {/*user?.title*/} {user?.last_name}! 👋
              </Title>
              <Text c="dimmed" size="lg" mt="xs">
                Manage your courses and track student progress
              </Text>
            </div>
            <Group>
              <Button
                leftSection={<FaPlus />}
                variant="gradient"
                gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
                onClick={handleCreateCourse}
              >
                Create New Course
              </Button>
            </Group>
          </Group>
        </motion.div>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[
            {
              icon: <FaBook />,
              label: "Total Courses",
              value: stats.totalCourses,
              color: "#1DA1F2",
            },
            {
              icon: <FaUserGraduate />,
              label: "Total Students",
              value: stats.totalStudents,
              color: "#794BC4",
            },
            {
              icon: <FaClipboardList />,
              label: "Pending Grading",
              value: stats.pendingGrading,
              color: "#FFAD1F",
            },
            {
              icon: <FaChartLine />,
              label: "Avg Performance",
              value: `${stats.avgCoursePerformance}%`,
              color: "#17BF63",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard padding="lg">
                <Group>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      background: `${stat.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: stat.color,
                      fontSize: 20,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">
                      {stat.label}
                    </Text>
                    <Title order={2} size="h2">
                      {stat.value}
                    </Title>
                  </div>
                </Group>
              </GlassCard>
            </motion.div>
          ))}
        </SimpleGrid>

        <Grid gutter="lg">
          {/* My Courses */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>My Courses</Title>
                <Button
                  variant="subtle"
                  onClick={() => router.push("/dashboard/lecturer/courses")}
                >
                  View All
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard padding="lg" style={{ height: "100%" }}>
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Badge size="sm" variant="light" mb="xs">
                              {course.code}
                            </Badge>
                            <Text fw={600} size="lg" lineClamp={2}>
                              {course.title}
                            </Text>
                          </div>
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <FaEllipsisV />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<FaEdit />}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/lecturer/courses/${course.id}/edit`
                                  )
                                }
                              >
                                Edit Course
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<FaChartLine />}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/lecturer/analytics?course=${course.id}`
                                  )
                                }
                              >
                                View Analytics
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<FaTrash />}
                                color="red"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                Delete Course
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>

                        <Group grow>
                          <div>
                            <Text size="xl" fw={700} c="twitterBlue">
                              {course.enrollmentCount}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Students
                            </Text>
                          </div>
                          <div>
                            <Text size="xl" fw={700} c="purple">
                              {course.activeAssignments}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Assignments
                            </Text>
                          </div>
                          <div>
                            <Text size="xl" fw={700} c="green">
                              {course.avgPerformance}%
                            </Text>
                            <Text size="xs" c="dimmed">
                              Avg Score
                            </Text>
                          </div>
                        </Group>

                        {course.pendingSubmissions > 0 && (
                          <Badge
                            color="orange"
                            variant="light"
                            leftSection={<FaClock />}
                          >
                            {course.pendingSubmissions} pending submissions
                          </Badge>
                        )}

                        <Group>
                          <Button
                            size="sm"
                            variant="light"
                            onClick={() =>
                              router.push(
                                `/dashboard/lecturer/courses/${course.id}`
                              )
                            }
                          >
                            Manage Course
                          </Button>
                        </Group>
                      </Stack>
                    </GlassCard>
                  </motion.div>
                ))}

                {/* Create Course Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: courses.length * 0.1 }}
                >
                  <GlassCard
                    padding="lg"
                    style={{
                      height: "100%",
                      cursor: "pointer",
                      border: "2px dashed rgba(29, 161, 242, 0.3)",
                    }}
                    //onClick={handleCreateCourse}
                  >
                    <Stack align="center" justify="center" h="100%" gap="md">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            background: "rgba(29, 161, 242, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            color: "#1DA1F2",
                          }}
                        >
                          <FaPlus />
                        </div>
                      </motion.div>
                      <Text fw={600} c="twitterBlue">
                        Create New Course
                      </Text>
                    </Stack>
                  </GlassCard>
                </motion.div>
              </SimpleGrid>
            </Stack>
          </Grid.Col>

          {/* Recent Activity */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Title order={3}>Recent Activity</Title>

              <Stack gap="sm">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card padding="md" radius="md" withBorder>
                      <Group>
                        <Avatar src={activity.avatar} radius="xl" />
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={600}>
                            {activity.student}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {activity.type === "submission" &&
                              "Submitted assignment in"}
                            {activity.type === "enrollment" && "Enrolled in"}
                            {activity.type === "completion" && "Completed"}{" "}
                            {activity.course}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {activity.timestamp}
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  </motion.div>
                ))}
              </Stack>

              {/* Quick Actions */}
              <Stack gap="xs" mt="xl">
                <Text fw={600} size="sm" c="dimmed">
                  Quick Actions
                </Text>
                <Button
                  fullWidth
                  variant="light"
                  leftSection={<FaFileAlt />}
                  onClick={() =>
                    router.push("/dashboard/lecturer/assignments/create")
                  }
                >
                  Generate Assignment
                </Button>
                <Button
                  fullWidth
                  variant="light"
                  leftSection={<FaClipboardList />}
                  onClick={() =>
                    router.push("/dashboard/lecturer/tests/create")
                  }
                >
                  Create Test
                </Button>
                <Button
                  fullWidth
                  variant="light"
                  leftSection={<FaBook />}
                  onClick={() =>
                    router.push("/dashboard/lecturer/materials/generate")
                  }
                >
                  Generate Materials
                </Button>
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* AI Content Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard
            padding="xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(29, 161, 242, 0.1) 0%, rgba(121, 75, 196, 0.1) 100%)",
            }}
          >
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Title order={3} mb="xs">
                  AI-Powered Content Generation
                </Title>
                <Text c="dimmed" mb="md">
                  Create course materials, assignments, and tests with AI
                  assistance
                </Text>
                <Group>
                  <Button
                    variant="gradient"
                    gradient={{
                      from: "twitterBlue",
                      to: "purple",
                      deg: 135,
                    }}
                    onClick={() =>
                      router.push("/dashboard/lecturer/ai-generator")
                    }
                  >
                    Open AI Generator
                  </Button>
                </Group>
              </div>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ fontSize: 60 }}
              >
                🤖
              </motion.div>
            </Group>
          </GlassCard>
        </motion.div>
      </Stack>
    </div>
  );
}
