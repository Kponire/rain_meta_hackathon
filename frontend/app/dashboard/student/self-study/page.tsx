"use client";

import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Timeline,
} from "@mantine/core";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { FlashcardGenerator } from "@/components/FlashcardGenerator";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import { FaLightbulb, FaRobot, FaBook, FaBrain } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export default function SelfStudyPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.courses.getAll();
        const list = res.data.courses || res.data || [];
        setCourses(list);
        if (list.length > 0) setSelectedCourseId((prev) => prev || list[0].id);
      } catch (err) {
        console.error("Failed to load courses for self-study picker", err);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "10px 40px" }}>
      <GlassCard hoverEffect={false} padding="md" mb="md">
        <Group align="center" justify="apart">
          <div>
            <Text fw={700}>Select Course</Text>
            <Text size="xs" c="dimmed">
              Choose a course to scope generated flashcards, quizzes and study
              plans.
            </Text>
          </div>

          <Select
            data={courses.map((c) => ({
              value: c.id,
              label: `${c.code} — ${c.title}`,
            }))}
            placeholder={
              courses.length ? "Select course" : "No courses available"
            }
            value={selectedCourseId || undefined}
            onChange={(v) => setSelectedCourseId(v || null)}
            style={{ minWidth: 320 }}
          />
        </Group>
      </GlassCard>

      <Tabs defaultValue="flashcards">
        <Tabs.List>
          <Tabs.Tab value="flashcards" leftSection={<FaLightbulb />}>
            Flashcards
          </Tabs.Tab>
          <Tabs.Tab value="ai-assistant" leftSection={<FaRobot />}>
            AI Assistant
          </Tabs.Tab>
          <Tabs.Tab value="study-plan" leftSection={<FaBook />}>
            Study Plan
          </Tabs.Tab>
          <Tabs.Tab value="quiz" leftSection={<FaBrain />}>
            Practice Quiz
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="flashcards" pt="md">
          <FlashcardGenerator courseId={selectedCourseId || undefined} />
        </Tabs.Panel>

        <Tabs.Panel value="ai-assistant" pt="md">
          <AIChatAssistant courseId={selectedCourseId || undefined} />
        </Tabs.Panel>

        <Tabs.Panel value="study-plan" pt="md">
          <StudyPlanGenerator courseId={selectedCourseId || undefined} />
        </Tabs.Panel>

        <Tabs.Panel value="quiz" pt="md">
          <PracticeQuizGenerator courseId={selectedCourseId || undefined} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

// Study Plan Generator Component
function StudyPlanGenerator({ courseId }: { courseId?: string }) {
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any>(null);

  const form = useForm({
    initialValues: {
      topics: "",
      duration_days: 30,
      daily_time_minutes: 60,
      difficulty: "medium",
    },
  });

  const handleGenerate = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const topics = values.topics.split(",").map((t) => t.trim());
      const payload: any = {
        topics,
        duration_days: values.duration_days,
        daily_time_minutes: values.daily_time_minutes,
      };
      if (courseId) payload.course_id = courseId;

      const response = await apiClient.flashcards.createStudyPlan(payload);
      console.log(response.data);

      setStudyPlan(response.data);
      notifications.show({
        title: "Success",
        message: "Study plan generated successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error generating study plan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      <GlassCard padding="xl">
        <form onSubmit={form.onSubmit(handleGenerate)}>
          <Stack gap="md">
            <Group align="flex-start">
              <div style={{ fontSize: 40 }}>📅</div>
              <div style={{ flex: 1 }}>
                <Text size="xl" fw={700} mb="xs">
                  AI Study Plan Generator
                </Text>
                <Text c="dimmed">
                  Create a personalized study schedule tailored to your goals
                </Text>
              </div>
            </Group>

            <Textarea
              label="Topics to Study"
              placeholder="Enter topics separated by commas (e.g., Algorithms, Data Structures, Machine Learning)"
              minRows={3}
              required
              {...form.getInputProps("topics")}
            />

            <Group grow>
              <NumberInput
                label="Study Duration (days)"
                placeholder="30"
                min={1}
                max={365}
                {...form.getInputProps("duration_days")}
              />

              <NumberInput
                label="Daily Study Time (minutes)"
                placeholder="60"
                min={15}
                max={480}
                {...form.getInputProps("daily_time_minutes")}
              />
            </Group>

            <Select
              label="Difficulty Level"
              data={[
                { value: "beginner", label: "Beginner" },
                { value: "medium", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
              {...form.getInputProps("difficulty")}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              color="twitterBlue"
            >
              Generate Study Plan
            </Button>
          </Stack>
        </form>
      </GlassCard>

      {studyPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard padding="lg">
            <Stack gap="md">
              <Text fw={600} size="lg">
                Your Personalized Study Plan
              </Text>
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {studyPlan.sessions?.map((session: any, index: number) => (
                  <Timeline.Item
                    key={index}
                    title={
                      session?.week
                        ? `Week ${session.week}`
                        : `Session ${index + 1}`
                    }
                    bullet={<FaBook size={12} />}
                  >
                    <Text size="sm" fw={600}>
                      {session?.focus ||
                        session?.title ||
                        `Session ${index + 1}`}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {session?.activities?.join?.(", ") || session?.activities}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Estimated time:{" "}
                      {session?.duration ?? studyPlan?.total_duration}{" "}
                      {session?.duration ? "hours" : "hours"}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>

              {studyPlan.resources && studyPlan.resources.length > 0 && (
                <GlassCard padding="lg" mt="md">
                  <Text fw={600} size="md" mb="sm">
                    Recommended Resources
                  </Text>
                  <Stack gap="xs">
                    {studyPlan.resources.map((res: any, i: number) => (
                      <Text key={i} size="sm">
                        - {res}
                      </Text>
                    ))}
                  </Stack>
                </GlassCard>
              )}

              {studyPlan.milestones && studyPlan.milestones.length > 0 && (
                <GlassCard padding="lg" mt="md">
                  <Text fw={600} size="md" mb="sm">
                    Milestones
                  </Text>
                  <Stack gap="xs">
                    {studyPlan.milestones.map((m: any, i: number) => (
                      <Text key={i} size="sm">
                        {i + 1}. {m}
                      </Text>
                    ))}
                  </Stack>
                </GlassCard>
              )}
            </Stack>
          </GlassCard>
        </motion.div>
      )}
    </Stack>
  );
}

// Practice Quiz Generator Component
function PracticeQuizGenerator({ courseId }: { courseId?: string }) {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const form = useForm({
    initialValues: {
      topic: "",
      question_count: 10,
      difficulty: "medium",
    },
  });
  const handleGenerate = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload: any = {
        topic: values.topic,
        count: values.question_count,
        difficulty: values.difficulty,
      };
      if (courseId) payload.course_id = courseId;

      const response = await apiClient.flashcards.generate(payload);
      console.log(response.data);
      const data = response.data || {};
      const cards = data.cards || data.flashcards || [];
      setQuiz({ ...data, cards });
      setAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitQuiz = () => {
    setShowResults(true);
    notifications.show({
      title: "Quiz Completed",
      message: "Check your results below",
      color: "blue",
    });
  };
  return (
    <Stack gap="xl">
      {!quiz && (
        <GlassCard padding="xl">
          <form onSubmit={form.onSubmit(handleGenerate)}>
            <Stack gap="md">
              <Group align="flex-start">
                <div style={{ fontSize: 40 }}>🧠</div>
                <div style={{ flex: 1 }}>
                  <Text size="xl" fw={700} mb="xs">
                    Practice Quiz Generator
                  </Text>
                  <Text c="dimmed">
                    Test your knowledge with AI-generated practice questions
                  </Text>
                </div>
              </Group>
              <TextInput
                label="Topic"
                placeholder="e.g., Object-Oriented Programming"
                required
                {...form.getInputProps("topic")}
              />

              <Group grow>
                <NumberInput
                  label="Number of Questions"
                  placeholder="10"
                  min={5}
                  max={50}
                  {...form.getInputProps("question_count")}
                />

                <Select
                  label="Difficulty"
                  data={[
                    { value: "easy", label: "Easy" },
                    { value: "medium", label: "Medium" },
                    { value: "hard", label: "Hard" },
                  ]}
                  {...form.getInputProps("difficulty")}
                />
              </Group>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                color="twitterBlue"
              >
                Generate Quiz
              </Button>
            </Stack>
          </form>
        </GlassCard>
      )}

      {quiz && (
        <Stack gap="md">
          {quiz.cards?.map((question: any, index: number) => (
            <Card key={index} padding="lg" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600}>Question {index + 1}</Text>
                  {showResults && (
                    <Badge
                      color={answers[index] === question.back ? "green" : "red"}
                    >
                      {answers[index] === question.back
                        ? "Correct"
                        : "Incorrect"}
                    </Badge>
                  )}
                </Group>

                <Text>{question.front}</Text>

                <Textarea
                  placeholder="Your answer..."
                  value={answers[index] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [index]: e.currentTarget.value })
                  }
                  disabled={showResults}
                />

                {showResults && (
                  <Paper p="md" withBorder bg="green.0">
                    <Text size="sm" fw={600}>
                      Correct Answer:
                    </Text>
                    <Text size="sm">{question.back}</Text>
                  </Paper>
                )}
              </Stack>
            </Card>
          ))}

          {!showResults && (
            <Button fullWidth size="lg" onClick={handleSubmitQuiz}>
              Submit Quiz
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
