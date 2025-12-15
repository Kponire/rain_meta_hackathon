"use client";

import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Progress,
  Radio,
  Textarea,
  Button,
  Modal,
  Paper,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlay,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface TestQuestion {
  id: string;
  question: string;
  question_type: "multiple_choice" | "short_answer" | "essay";
  options?: string[];
  points: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  instructions: string;
  start_time: string;
  end_time: string;
  duration: number;
  questions: TestQuestion[];
  test_type?: string;
  attempt?: {
    id: string;
    status: "in_progress" | "submitted" | "graded";
    score?: number;
  };
}

interface TestsStudentProps {
  courseId?: string;
}

export function TestsStudent({ courseId }: TestsStudentProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [courseId]);

  useEffect(() => {
    if (activeTest && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeTest, timeRemaining]);

  const fetchTests = async () => {
    try {
      const response = await apiClient.tests.getStudentTests();
      console.log(response.data);
      setTests(response.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (test: Test) => {
    try {
      const response = await apiClient.tests.start(test.id);
      setAttemptId(response.data.attempt_id);
      setActiveTest(test);
      setTimeRemaining(test.duration * 60);
      setAnswers({});

      notifications.show({
        title: "Test Started",
        message: `You have ${test.duration} minutes to complete this test`,
        color: "blue",
      });
    } catch (error) {
      console.error("Error starting test:", error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId || !activeTest) return;

    setSubmitting(true);
    try {
      const formattedAnswers = activeTest.questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));

      const response = await apiClient.tests.submit(attemptId, {
        answers: formattedAnswers,
      });

      notifications.show({
        title: "Test Submitted",
        message: "Your test has been submitted successfully",
        color: "green",
      });

      setActiveTest(null);
      setAttemptId(null);
      setAnswers({});
      fetchTests();
    } catch (error) {
      console.error("Error submitting test:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <LoadingSkeleton type="list" count={5} />;
  }

  // Active Test View
  if (activeTest) {
    const progress =
      ((activeTest.questions.length -
        Object.keys(answers).filter((k) => answers[k]).length) /
        activeTest.questions.length) *
      100;
    const timeProgress = (timeRemaining / (activeTest.duration * 60)) * 100;

    return (
      <Stack gap="xl">
        {/* Timer Header */}
        <GlassCard padding="lg">
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700}>
                {activeTest.title}
              </Text>
              <Text size="sm" c="dimmed">
                {Object.keys(answers).filter((k) => answers[k]).length} of{" "}
                {activeTest.questions.length} answered
              </Text>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text
                size="xl"
                fw={700}
                c={timeRemaining < 300 ? "red" : "twitterBlue"}
              >
                {formatTime(timeRemaining)}
              </Text>
              <Text size="sm" c="dimmed">
                Time Remaining
              </Text>
            </div>
          </Group>
          <Progress
            value={100 - timeProgress}
            size="sm"
            mt="md"
            color={timeRemaining < 300 ? "red" : "blue"}
          />
        </GlassCard>

        {/* Questions */}
        <Stack gap="md">
          {activeTest.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper p="lg" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Question {index + 1}</Text>
                    <Badge>{question.points} points</Badge>
                  </Group>

                  <Text>{question.question}</Text>

                  {question.question_type === "multiple_choice" &&
                    question.options && (
                      <Radio.Group
                        value={answers[question.id] || ""}
                        onChange={(value) =>
                          handleAnswerChange(question.id, value)
                        }
                      >
                        <Stack gap="sm">
                          {question.options.map((option, optIndex) => (
                            <Radio
                              key={optIndex}
                              value={option}
                              label={option}
                            />
                          ))}
                        </Stack>
                      </Radio.Group>
                    )}

                  {(activeTest.test_type === "short_answer" ||
                    activeTest.test_type === "text_based") && (
                    <Textarea
                      placeholder="Enter your answer..."
                      minRows={activeTest.test_type === "text_based" ? 6 : 3}
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.currentTarget.value)
                      }
                    />
                  )}

                  {answers[question.id] && (
                    <Badge color="green" leftSection={<FaCheckCircle />}>
                      Answered
                    </Badge>
                  )}
                </Stack>
              </Paper>
            </motion.div>
          ))}
        </Stack>

        {/* Submit Button */}
        <GlassCard padding="lg">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Make sure you've answered all questions before submitting
            </Text>
            <Button
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              variant="gradient"
              gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
            >
              Submit Test
            </Button>
          </Group>
        </GlassCard>
      </Stack>
    );
  }

  // Tests List View
  return (
    <Stack gap="xl">
      {/* Header */}
      <div>
        <Text size="xl" fw={700}>
          Tests
        </Text>
        <Text size="sm" c="dimmed">
          {tests.length} test{tests.length !== 1 ? "s" : ""} available
        </Text>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <GlassCard padding="xl">
          <Stack align="center" gap="md">
            <div style={{ fontSize: 60 }}>📋</div>
            <Text size="lg" fw={600}>
              No tests available
            </Text>
            <Text c="dimmed" ta="center">
              Check back later for tests
            </Text>
          </Stack>
        </GlassCard>
      ) : (
        <Stack gap="md">
          {tests.map((test, index) => {
            // Ensure dates are treated as UTC if they don't define a timezone
            const startStr = test.start_time.endsWith("Z")
              ? test.start_time
              : test.start_time + "Z";
            const endStr = test.end_time.endsWith("Z")
              ? test.end_time
              : test.end_time + "Z";

            const startTime = new Date(startStr);
            const endTime = new Date(endStr);
            const now = new Date();
            const canAttempt = now >= startTime && now <= endTime;
            console.log(canAttempt);
            const hasAttempt = !canAttempt;

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb={4}>
                          <Text fw={600} size="lg">
                            {test.title}
                          </Text>
                          {hasAttempt && test.attempt?.status === "graded" && (
                            <Badge
                              color="green"
                              leftSection={<FaCheckCircle />}
                            >
                              Graded: {test.attempt.score}%
                            </Badge>
                          )}
                          {hasAttempt &&
                            test.attempt?.status === "submitted" && (
                              <Badge color="blue">Submitted</Badge>
                            )}
                          {!hasAttempt && canAttempt && (
                            <Badge color="green">Available</Badge>
                          )}
                          {!hasAttempt && now < startTime && (
                            <Badge color="yellow">Upcoming</Badge>
                          )}
                          {!hasAttempt && now > endTime && (
                            <Badge color="red">Closed</Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {test.description}
                        </Text>
                      </div>

                      {canAttempt && (
                        <Button
                          leftSection={<FaPlay />}
                          onClick={() => handleStartTest(test)}
                          variant="gradient"
                          gradient={{
                            from: "twitterBlue",
                            to: "purple",
                            deg: 135,
                          }}
                        >
                          Start Test
                        </Button>
                      )}
                    </Group>

                    <Group>
                      <Group gap="xs">
                        <FaClock size={14} />
                        <Text size="sm" c="dimmed">
                          {startTime.toLocaleDateString()} -{" "}
                          {endTime.toLocaleDateString()}
                        </Text>
                      </Group>
                      <Badge variant="light">{test.duration} minutes</Badge>
                      <Badge variant="light">
                        {test.questions.length} questions
                      </Badge>
                    </Group>

                    {!canAttempt && now < startTime && (
                      <Paper p="sm" withBorder bg="yellow.0">
                        <Group gap="xs">
                          <FaClock />
                          <Text size="sm">
                            Starts {startTime.toLocaleString()}
                          </Text>
                        </Group>
                      </Paper>
                    )}
                  </Stack>
                </Card>
              </motion.div>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
