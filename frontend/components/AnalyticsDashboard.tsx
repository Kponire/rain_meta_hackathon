"use client";

import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Text,
  SimpleGrid,
  Select,
  Paper,
  Card,
  Progress,
  Avatar,
  Table,
  Badge,
  Tabs,
} from "@mantine/core";
import { LineChart, BarChart, PieChart, DonutChart } from "@mantine/charts";
import { motion } from "framer-motion";
import {
  FaUserGraduate,
  FaChartLine,
  FaTrophy,
  FaClipboardList,
  FaClock,
  FaFire,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
} from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiClient } from "@/lib/api/client";

interface AnalyticsDashboardProps {
  courseId?: string;
  studentId?: string;
  role: "lecturer" | "student";
}

export function AnalyticsDashboard({
  courseId,
  studentId,
  role,
}: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [coursePerformance, setCoursePerformance] = useState<any>(true);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [courseId, studentId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      if (role === "lecturer" && courseId) {
        const [perfResponse, engagementResponse] = await Promise.all([
          apiClient.analytics.getCoursePerformance(courseId),
          apiClient.analytics.getCourseEngagement(courseId),
        ]);
        setCoursePerformance(perfResponse.data);
        setEngagementData(engagementResponse.data);
      } else if (role === "student" && studentId) {
        const [progressResponse, activityResponse] = await Promise.all([
          apiClient.analytics.getStudentProgress(studentId),
          apiClient.analytics.getStudentActivity(studentId),
        ]);
        setStudentProgress(progressResponse.data);
        setEngagementData(activityResponse.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  // Lecturer Analytics View
  if (role === "lecturer" && coursePerformance) {
    const performanceData = [
      { name: "Week 1", average: 75, median: 78, submissions: 45 },
      { name: "Week 2", average: 78, median: 80, submissions: 48 },
      { name: "Week 3", average: 82, median: 85, submissions: 50 },
      { name: "Week 4", average: 85, median: 87, submissions: 52 },
    ];

    const gradeDistribution = [
      { name: "A", value: 15, color: "#17BF63" },
      { name: "B", value: 20, color: "#1DA1F2" },
      { name: "C", value: 10, color: "#FFAD1F" },
      { name: "D", value: 3, color: "#E0245E" },
      { name: "F", value: 2, color: "#657786" },
    ];

    const gradeBreakdown = [
      { grade: "A", count: 15, percentage: 30, color: "#17BF63" },
      { grade: "B", count: 20, percentage: 40, color: "#1DA1F2" },
      { grade: "C", count: 10, percentage: 20, color: "#FFAD1F" },
      { grade: "D", count: 3, percentage: 6, color: "#E0245E" },
      { grade: "F", count: 2, percentage: 4, color: "#657786" },
    ];

    return (
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={700}>
              Course Analytics
            </Text>
            <Text size="sm" c="dimmed">
              Comprehensive performance insights
            </Text>
          </div>
          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value || "30")}
            data={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
              { value: "all", label: "All time" },
            ]}
            style={{ width: 150 }}
          />
        </Group>

        {/* Key Metrics */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[
            {
              icon: <FaUserGraduate />,
              label: "Total Students",
              value: coursePerformance.total_students || 50,
              change: "+5%",
              positive: true,
              color: "#1DA1F2",
            },
            {
              icon: <FaChartLine />,
              label: "Average Score",
              value: `${coursePerformance.average_score || 84.5}%`,
              change: "+3.2%",
              positive: true,
              color: "#17BF63",
            },
            {
              icon: <FaClipboardList />,
              label: "Completion Rate",
              value: `${coursePerformance.completion_rate || 92}%`,
              change: "+2.1%",
              positive: true,
              color: "#794BC4",
            },
            {
              icon: <FaClock />,
              label: "Avg. Study Time",
              value: "4.2h",
              change: "-0.5h",
              positive: false,
              color: "#FFAD1F",
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard padding="lg">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: `${metric.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: metric.color,
                        fontSize: 18,
                      }}
                    >
                      {metric.icon}
                    </div>
                    <Badge
                      color={metric.positive ? "green" : "red"}
                      leftSection={
                        metric.positive ? <FaArrowUp /> : <FaArrowDown />
                      }
                    >
                      {metric.change}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {metric.label}
                  </Text>
                  <Text size="xl" fw={700}>
                    {metric.value}
                  </Text>
                </Stack>
              </GlassCard>
            </motion.div>
          ))}
        </SimpleGrid>

        <Tabs defaultValue="performance">
          <Tabs.List>
            <Tabs.Tab value="performance">Performance Trends</Tabs.Tab>
            <Tabs.Tab value="distribution">Grade Distribution</Tabs.Tab>
            <Tabs.Tab value="engagement">Student Engagement</Tabs.Tab>
            <Tabs.Tab value="topPerformers">Top Performers</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="performance" pt="md">
            <GlassCard padding="lg">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Performance Over Time
                </Text>
                <LineChart
                  h={350}
                  data={performanceData}
                  dataKey="name"
                  series={[
                    {
                      name: "average",
                      label: "Average Score",
                      color: "#1DA1F2",
                    },
                    { name: "median", label: "Median Score", color: "#794BC4" },
                  ]}
                  curveType="linear"
                  withLegend
                  withTooltip
                  withDots
                  gridAxis="xy"
                  tickLine="xy"
                  tooltipAnimationDuration={200}
                  valueFormatter={(value) => `${value}%`}
                />
              </Stack>
            </GlassCard>
          </Tabs.Panel>

          <Tabs.Panel value="distribution" pt="md">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <GlassCard padding="lg">
                <Stack gap="md">
                  <Text fw={600} size="lg">
                    Grade Distribution
                  </Text>
                  <DonutChart
                    data={gradeDistribution}
                    thickness={30}
                    size={280}
                    chartLabel="Grades"
                    withLabels
                    withLabelsLine
                    tooltipDataSource="segment"
                  />
                </Stack>
              </GlassCard>

              <GlassCard padding="lg">
                <Stack gap="md">
                  <Text fw={600} size="lg">
                    Grade Breakdown
                  </Text>
                  <Stack gap="sm">
                    {gradeBreakdown.map((item) => (
                      <div key={item.grade}>
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            <Badge
                              style={{
                                backgroundColor: item.color,
                                color: "white",
                              }}
                            >
                              {item.grade}
                            </Badge>
                            <Text size="sm">{item.count} students</Text>
                          </Group>
                          <Text size="sm" fw={600}>
                            {item.percentage}%
                          </Text>
                        </Group>
                        <Progress
                          value={item.percentage}
                          color={item.color}
                          size="md"
                          radius="md"
                        />
                      </div>
                    ))}
                  </Stack>
                </Stack>
              </GlassCard>
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="engagement" pt="md">
            <GlassCard padding="lg">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Student Engagement Metrics
                </Text>
                <BarChart
                  h={350}
                  data={performanceData}
                  dataKey="name"
                  series={[
                    {
                      name: "submissions",
                      label: "Submissions",
                      color: "#1DA1F2",
                    },
                  ]}
                  withLegend
                  withTooltip
                  gridAxis="xy"
                  tickLine="xy"
                  tooltipAnimationDuration={200}
                />
              </Stack>
            </GlassCard>
          </Tabs.Panel>

          <Tabs.Panel value="topPerformers" pt="md">
            <GlassCard padding="lg">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Top Performing Students
                </Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Rank</Table.Th>
                      <Table.Th>Student</Table.Th>
                      <Table.Th>Average Score</Table.Th>
                      <Table.Th>Assignments</Table.Th>
                      <Table.Th>Tests</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[
                      {
                        rank: 1,
                        name: "Sarah Johnson",
                        avatar:
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                        score: 98,
                        assignments: 15,
                        tests: 5,
                      },
                      {
                        rank: 2,
                        name: "Michael Chen",
                        avatar:
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
                        score: 96,
                        assignments: 15,
                        tests: 5,
                      },
                      {
                        rank: 3,
                        name: "Emily Rodriguez",
                        avatar:
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
                        score: 94,
                        assignments: 14,
                        tests: 5,
                      },
                      {
                        rank: 4,
                        name: "David Kim",
                        avatar:
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
                        score: 92,
                        assignments: 15,
                        tests: 4,
                      },
                      {
                        rank: 5,
                        name: "Lisa Wang",
                        avatar:
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
                        score: 90,
                        assignments: 13,
                        tests: 5,
                      },
                    ].map((student) => (
                      <Table.Tr key={student.rank}>
                        <Table.Td>
                          <Badge
                            size="lg"
                            variant="gradient"
                            gradient={
                              student.rank === 1
                                ? { from: "yellow", to: "orange" }
                                : student.rank === 2
                                ? { from: "gray", to: "blue" }
                                : student.rank === 3
                                ? { from: "orange", to: "red" }
                                : { from: "blue", to: "cyan" }
                            }
                          >
                            #{student.rank}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar src={student.avatar} radius="xl" />
                            <Text fw={600}>{student.name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={600} c="green">
                            {student.score}%
                          </Text>
                        </Table.Td>
                        <Table.Td>{student.assignments}/15</Table.Td>
                        <Table.Td>{student.tests}/5</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </GlassCard>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    );
  }

  // Student Analytics View
  if (role === "student" && studentProgress) {
    const progressData = [
      { week: "Week 1", score: 75, studyTime: 3.5 },
      { week: "Week 2", score: 78, studyTime: 4.0 },
      { week: "Week 3", score: 82, studyTime: 4.5 },
      { week: "Week 4", score: 85, studyTime: 5.0 },
      { week: "Week 5", score: 88, studyTime: 4.8 },
    ];

    const courseProgress = [
      { course: "Algorithms", progress: 85, grade: "A" },
      { course: "Data Structures", progress: 78, grade: "B+" },
      { course: "Machine Learning", progress: 92, grade: "A" },
      { course: "Web Development", progress: 70, grade: "B" },
    ];

    return (
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={700}>
              My Progress
            </Text>
            <Text size="sm" c="dimmed">
              Track your learning journey
            </Text>
          </div>
          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value || "30")}
            data={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
              { value: "all", label: "All time" },
            ]}
            style={{ width: 150 }}
          />
        </Group>

        {/* Key Metrics */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[
            {
              icon: <FaTrophy />,
              label: "Average Grade",
              value: `${studentProgress.average_grade || 87.5}%`,
              change: "+5.2%",
              positive: true,
              color: "#17BF63",
            },
            {
              icon: <FaClipboardList />,
              label: "Completed",
              value: `${studentProgress.completed_assignments || 12}/15`,
              change: "80%",
              positive: true,
              color: "#1DA1F2",
            },
            {
              icon: <FaFire />,
              label: "Study Streak",
              value: `${studentProgress.learning_streak || 15} days`,
              change: "Record!",
              positive: true,
              color: "#E0245E",
            },
            {
              icon: <FaClock />,
              label: "Study Time",
              value: "4.5h/week",
              change: "+30min",
              positive: true,
              color: "#FFAD1F",
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard padding="lg">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: `${metric.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: metric.color,
                        fontSize: 18,
                      }}
                    >
                      {metric.icon}
                    </div>
                    <Badge color={metric.positive ? "green" : "gray"}>
                      {metric.change}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {metric.label}
                  </Text>
                  <Text size="xl" fw={700}>
                    {metric.value}
                  </Text>
                </Stack>
              </GlassCard>
            </motion.div>
          ))}
        </SimpleGrid>

        <Tabs defaultValue="progress">
          <Tabs.List>
            <Tabs.Tab value="progress">Progress Trends</Tabs.Tab>
            <Tabs.Tab value="courses">Course Overview</Tabs.Tab>
            <Tabs.Tab value="achievements">Achievements</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="progress" pt="md">
            <GlassCard padding="lg">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Your Progress Over Time
                </Text>
                <LineChart
                  h={350}
                  data={progressData}
                  dataKey="week"
                  series={[
                    {
                      name: "score",
                      label: "Score %",
                      color: "#1DA1F2",
                      yAxisId: "left",
                    },
                    {
                      name: "studyTime",
                      label: "Study Hours",
                      color: "#794BC4",
                      yAxisId: "right",
                    },
                  ]}
                  curveType="linear"
                  withLegend
                  withTooltip
                  withDots
                  gridAxis="xy"
                  tickLine="xy"
                  tooltipAnimationDuration={200}
                  yAxisProps={{
                    domain: [0, 100],
                  }}
                  referenceLines={[
                    { y: 80, label: "Target", color: "green.6" },
                  ]}
                />
              </Stack>
            </GlassCard>
          </Tabs.Panel>

          <Tabs.Panel value="courses" pt="md">
            <GlassCard padding="lg">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Course Progress
                </Text>
                <Stack gap="md">
                  {courseProgress.map((course, index) => (
                    <Card key={index} padding="md" withBorder>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={600}>{course.course}</Text>
                          <Badge color="green">{course.grade}</Badge>
                        </Group>
                        <Group justify="space-between" mb={4}>
                          <Text size="sm" c="dimmed">
                            Progress
                          </Text>
                          <Text size="sm" fw={600}>
                            {course.progress}%
                          </Text>
                        </Group>
                        <Progress
                          value={course.progress}
                          color="twitterBlue"
                          size="lg"
                          radius="md"
                          animated
                        />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </GlassCard>
          </Tabs.Panel>

          <Tabs.Panel value="achievements" pt="md">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {[
                {
                  icon: "🏆",
                  title: "Top Performer",
                  description: "Ranked in top 10%",
                  unlocked: true,
                },
                {
                  icon: "🔥",
                  title: "15 Day Streak",
                  description: "Study every day",
                  unlocked: true,
                },
                {
                  icon: "📚",
                  title: "Bookworm",
                  description: "Complete 50 assignments",
                  unlocked: false,
                },
                {
                  icon: "⚡",
                  title: "Quick Learner",
                  description: "Perfect score on 5 tests",
                  unlocked: true,
                },
                {
                  icon: "🎯",
                  title: "Perfectionist",
                  description: "100% on an assignment",
                  unlocked: true,
                },
                {
                  icon: "🌟",
                  title: "Rising Star",
                  description: "Improve grade by 10%",
                  unlocked: false,
                },
              ].map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    padding="lg"
                    withBorder
                    style={{
                      opacity: achievement.unlocked ? 1 : 0.5,
                      background: achievement.unlocked
                        ? "linear-gradient(135deg, rgba(29, 161, 242, 0.1) 0%, rgba(121, 75, 196, 0.1) 100%)"
                        : undefined,
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <Text style={{ fontSize: 40 }}>{achievement.icon}</Text>
                      <Text fw={600} ta="center">
                        {achievement.title}
                      </Text>
                      <Text size="sm" c="dimmed" ta="center">
                        {achievement.description}
                      </Text>
                      {achievement.unlocked && (
                        <Badge color="green" leftSection={<FaCheckCircle />}>
                          Unlocked
                        </Badge>
                      )}
                    </Stack>
                  </Card>
                </motion.div>
              ))}
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    );
  }

  return null;
}
