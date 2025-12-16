"use client";

import {
  Container,
  Grid,
  Title,
  Text,
  Stack,
  Group,
  Card,
  Progress,
  Badge,
  Avatar,
  SimpleGrid,
  Button,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBook,
  FaClipboardList,
  FaFileAlt,
  FaTrophy,
  FaChartLine,
  FaClock,
  FaFire,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { GrScorecard } from "react-icons/gr";
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
  progress: number;
  lecturer: string;
  nextClass?: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  priority: "high" | "medium" | "low";
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    pendingAssignments: 0,
    upcomingTests: 0,
    averageGrade: 0,
    learningStreak: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        apiClient.courses.getStudentCourses(),
        apiClient.assignments.getStudentAssignments(),
      ]);

      setCourses(Array.isArray(coursesRes.data.courses)
      ? coursesRes.data.courses
      : []);
      //setAssignments(assignmentsRes.data);

      setStats({
        enrolledCourses: coursesRes.data.length,
        pendingAssignments: assignmentsRes.data.filter(
          (a: any) => a.status === "pending"
        ).length,
        upcomingTests: 2,
        averageGrade: 87.5,
        learningStreak: 15,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} size={30}>
                Welcome back, {user?.first_name}!
              </Title>
              <Text c="dimmed" size="lg" mt="xs">
                Ready to continue your learning journey?
              </Text>
            </div>
            <Badge size="xl" color="twitterBlue">
              {stats.learningStreak} day streak
            </Badge>
          </Group>
        </motion.div>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[
            {
              icon: <FaBook />,
              label: "Enrolled Courses",
              value: stats.enrolledCourses,
              color: "#1DA1F2",
            },
            {
              icon: <FaClipboardList />,
              label: "Pending Assignments",
              value: stats.pendingAssignments,
              color: "#FFAD1F",
            },
            {
              icon: <FaFileAlt />,
              label: "Upcoming Tests",
              value: stats.upcomingTests,
              color: "#E0245E",
            },
            {
              icon: <GrScorecard />,
              label: "Average Grade",
              value: `${stats.averageGrade}%`,
              color: "#17BF63",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* <div
                    style={{
                      display: "flex",
                      height: "fit-content",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        width: 70,
                        height: "80px",
                        background: `${stat.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: `white`,
                        fontSize: 20,
                      }}
                    >
                      {stat.icon}
                    </div>
                    <div style={{ flex: 1, padding: "15px 15px 15px 20px" }}>
                      <Text size="xs" c="dimmed">
                        {stat.label}
                      </Text>
                      <Title order={2} size="h3">
                        {stat.value}
                      </Title>
                    </div>
                  </div> */}
              <GlassCard px={"lg"} py={"md"}>
                <Group>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
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
                    <Title order={2} size="h3">
                      {stat.value}
                    </Title>
                  </div>
                </Group>
              </GlassCard>
            </motion.div>
          ))}
        </SimpleGrid>

        <Grid gutter="lg">
          {/* Enrolled Courses */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>My Courses</Title>
                <Button
                  variant="subtle"
                  onClick={() => router.push("/courses")}
                >
                  View All
                </Button>
              </Group>

              <Stack gap="md">
                {courses.slice(0, 3).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard
                      padding="lg"
                      style={{ cursor: "pointer" }}
                      //onClick={() => router.push(`/dashboard/student/courses/${course.id}`)}
                    >
                      <Stack gap="md">
                        <Group justify="space-between">
                          <div style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Badge size="sm" variant="light">
                                {course.code}
                              </Badge>
                              <Text fw={600} size="lg">
                                {course.title}
                              </Text>
                            </Group>
                            <Text size="sm" c="dimmed" mt={4}>
                              {course.lecturer}
                            </Text>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <Text size="sm" fw={600} c="twitterBlue">
                              {course.progress}%
                            </Text>
                            <Text size="xs" c="dimmed">
                              Complete
                            </Text>
                          </div>
                        </Group>

                        <Progress
                          value={course.progress}
                          size="sm"
                          radius="xl"
                          color="twitterBlue"
                        />

                        <Group justify="space-between">
                          <AnimatedButton size="sm" variant="light">
                            Continue Learning
                          </AnimatedButton>
                          {course.nextClass && (
                            <Group gap="xs">
                              <FaClock size={12} />
                              <Text size="xs" c="dimmed">
                                {course.nextClass}
                              </Text>
                            </Group>
                          )}
                        </Group>
                      </Stack>
                    </GlassCard>
                  </motion.div>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Upcoming Assignments */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>Upcoming Assignments</Title>
              </Group>

              <Stack gap="sm">
                {assignments.slice(0, 5).map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      padding="md"
                      radius="md"
                      withBorder
                      style={{
                        cursor: "pointer",
                        borderLeft: `3px solid ${
                          assignment.priority === "high"
                            ? "#E0245E"
                            : assignment.priority === "medium"
                            ? "#FFAD1F"
                            : "#17BF63"
                        }`,
                      }}
                      onClick={() =>
                        router.push(
                          `/dashboard/student/assignments/${assignment.id}`
                        )
                      }
                    >
                      <Stack gap="xs">
                        <Text size="sm" fw={600} lineClamp={2}>
                          {assignment.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {assignment.course}
                        </Text>
                        <Group justify="space-between">
                          <Badge
                            size="xs"
                            color={
                              assignment.status === "pending"
                                ? "yellow"
                                : assignment.status === "submitted"
                                ? "blue"
                                : "green"
                            }
                          >
                            {assignment.status}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            Due {assignment.dueDate}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* AI Study Assistant Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard
            padding="xl"
            style={{
              background: "rgba(29, 161, 242, 0.1)",
            }}
          >
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Title order={3} mb="xs">
                  Need Help? Ask AI Assistant
                </Title>
                <Text c="dimmed" mb="md">
                  Get instant answers, generate flashcards, or create study
                  plans with our AI-powered assistant
                </Text>
                <Group>
                  <Button
                    variant="filled"
                    color="twitterBlue"
                    onClick={() =>
                      router.push("/dashboard/student/ai-assistant")
                    }
                  >
                    Start Chat
                  </Button>
                  <Button
                    variant="light"
                    onClick={() => router.push("/dashboard/student/self-study")}
                  >
                    Generate Flashcards
                  </Button>
                </Group>
              </div>
              <motion.div
                animate={{
                  y: [60, -20, 60],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ fontSize: 60 }}
              >
                <FaChalkboardTeacher color="var(--twitter-blue)" />
              </motion.div>
            </Group>
          </GlassCard>
        </motion.div>
      </Stack>
    </div>
  );
}
