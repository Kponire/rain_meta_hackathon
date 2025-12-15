"use client";

import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  TextInput,
  Textarea,
  Modal,
  Card,
  Text,
  Badge,
  ActionIcon,
  Menu,
  NumberInput,
  Select,
  Radio,
  Button,
  Divider,
  Paper,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaRobot,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaUsers,
  FaChartBar,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface TestQuestion {
  id?: string;
  question_text: string;
  question_type: "multiple_choice" | "short_answer" | "essay";
  options?: string[];
  correct_answer?: string | string[];
  points: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  instructions: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  questions: TestQuestion[];
  published: boolean;
  attempt_count: number;
  created_at: string;
}

interface TestsLecturerProps {
  courseId: string;
}

export function TestsLecturer({ courseId }: TestsLecturerProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<TestQuestion[]>(
    []
  );

  const generateForm = useForm({
    initialValues: {
      topic: "",
      question_type: "mixed" as "multiple_choice" | "short_answer" | "mixed",
      question_count: 10,
      difficulty: "medium",
      time_limit: 60,
    },
    validate: {
      topic: (value) => (!value ? "Topic is required" : null),
      question_count: (value) =>
        value < 1 || value > 50
          ? "Question count must be between 1 and 50"
          : null,
      time_limit: (value) =>
        value < 5 ? "Time limit must be at least 5 minutes" : null,
    },
  });

  const createForm = useForm({
    initialValues: {
      title: "",
      description: "",
      instructions: "",
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      duration_minutes: 60,
      questions: [] as TestQuestion[],
    },
    validate: {
      title: (value) => (!value ? "Title is required" : null),
      description: (value) => (!value ? "Description is required" : null),
      duration_minutes: (value) =>
        value < 5 ? "Duration must be at least 5 minutes" : null,
    },
  });

  useEffect(() => {
    fetchTests();
  }, [courseId]);

  const fetchTests = async () => {
    try {
      const response = await apiClient.tests.getAll(courseId);
      setTests(response.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (values: typeof generateForm.values) => {
    setGeneratingAI(true);
    try {
      //const response = await apiClient.tests.generate(courseId, values);

      //setGeneratedQuestions(response.data.questions);

      // Pre-fill create form
      /*createForm.setValues({
        title: response.data.title || `${values.topic} Test`,
        description: response.data.description || `Test on ${values.topic}`,
        instructions:
          response.data.instructions ||
          "Answer all questions to the best of your ability.",
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration_minutes: values.time_limit,
        questions: response.data.questions,
      });*/

      /*notifications.show({
        title: "Success",
        message: `Generated ${response.data.questions.length} questions. Review and save.`,
        color: "green",
      });*/

      setGenerateModalOpen(false);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error("Error generating test:", error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreate = async () => {
    try {
      /*await apiClient.tests.create(courseId, {
        ...createForm.values,
        start_time: createForm.values.start_time.toISOString(),
        end_time: createForm.values.end_time.toISOString(),
      });*/

      notifications.show({
        title: "Success",
        message: "Test created successfully",
        color: "green",
      });

      setPreviewModalOpen(false);
      setCreateModalOpen(false);
      createForm.reset();
      fetchTests();
    } catch (error) {
      console.error("Error creating test:", error);
    }
  };

  const handlePublish = async (testId: string) => {
    try {
      await apiClient.tests.publish(testId);

      notifications.show({
        title: "Success",
        message: "Test published successfully",
        color: "green",
      });

      fetchTests();
    } catch (error) {
      console.error("Error publishing test:", error);
    }
  };

  const handleDelete = async (testId: string) => {
    try {
      await apiClient.tests.delete(testId);

      notifications.show({
        title: "Success",
        message: "Test deleted successfully",
        color: "green",
      });

      fetchTests();
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="list" count={5} />;
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Tests
          </Text>
          <Text size="sm" c="dimmed">
            {tests.length} test{tests.length !== 1 ? "s" : ""}
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<FaPlus />}
            variant="light"
            onClick={() => setCreateModalOpen(true)}
          >
            Create Test
          </Button>
          <Button
            leftSection={<FaRobot />}
            variant="gradient"
            gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
            onClick={() => setGenerateModalOpen(true)}
          >
            Generate with AI
          </Button>
        </Group>
      </Group>

      {/* Tests List */}
      {tests.length === 0 ? (
        <GlassCard padding="xl">
          <Stack align="center" gap="md">
            <div style={{ fontSize: 60 }}>📋</div>
            <Text size="lg" fw={600}>
              No tests yet
            </Text>
            <Text c="dimmed" ta="center">
              Create tests or generate them with AI to get started
            </Text>
          </Stack>
        </GlassCard>
      ) : (
        <Stack gap="md">
          {tests.map((test, index) => {
            const startTime = new Date(test.start_time);
            const endTime = new Date(test.end_time);
            const now = new Date();
            const isActive = now >= startTime && now <= endTime;

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
                          {!test.published && <Badge color="gray">Draft</Badge>}
                          {test.published && isActive && (
                            <Badge
                              color="green"
                              leftSection={<FaCheckCircle />}
                            >
                              Active
                            </Badge>
                          )}
                          {test.published && now > endTime && (
                            <Badge color="red">Closed</Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {test.description}
                        </Text>
                      </div>

                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="lg">
                            <FaEllipsisV />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {!test.published && (
                            <Menu.Item
                              leftSection={<FaCheckCircle />}
                              onClick={() => handlePublish(test.id)}
                            >
                              Publish
                            </Menu.Item>
                          )}
                          <Menu.Item
                            leftSection={<FaEye />}
                            onClick={() => {
                              setSelectedTest(test);
                              setPreviewModalOpen(true);
                            }}
                          >
                            Preview
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<FaUsers />}
                            onClick={() =>
                              (window.location.href = `/dashboard/lecturer/tests/${test.id}/attempts`)
                            }
                          >
                            View Attempts ({test.attempt_count})
                          </Menu.Item>
                          <Menu.Item leftSection={<FaEdit />}>Edit</Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<FaTrash />}
                            color="red"
                            onClick={() => handleDelete(test.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Group>
                      <Group gap="xs">
                        <FaClock size={14} />
                        <Text size="sm" c="dimmed">
                          {startTime.toLocaleDateString()} -{" "}
                          {endTime.toLocaleDateString()}
                        </Text>
                      </Group>
                      <Badge variant="light">
                        {test.duration_minutes} minutes
                      </Badge>
                      <Badge variant="light">
                        {test.questions.length} questions
                      </Badge>
                      {test.attempt_count > 0 && (
                        <Badge color="blue">
                          {test.attempt_count} attempt
                          {test.attempt_count !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </Group>
                  </Stack>
                </Card>
              </motion.div>
            );
          })}
        </Stack>
      )}

      {/* Generate Modal */}
      <Modal
        opened={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Test with AI"
        size="lg"
      >
        <form onSubmit={generateForm.onSubmit(handleGenerate)}>
          <Stack gap="md">
            <Group align="flex-start">
              <div style={{ fontSize: 40 }}>🤖</div>
              <Text size="sm" c="dimmed">
                AI will generate test questions with answers based on your
                course topic
              </Text>
            </Group>

            <TextInput
              label="Topic"
              placeholder="e.g., Introduction to Algorithms"
              required
              {...generateForm.getInputProps("topic")}
            />

            <Group grow>
              <Select
                label="Question Type"
                data={[
                  { value: "multiple_choice", label: "Multiple Choice Only" },
                  { value: "short_answer", label: "Short Answer Only" },
                  { value: "mixed", label: "Mixed (Both Types)" },
                ]}
                {...generateForm.getInputProps("question_type")}
              />

              <Select
                label="Difficulty"
                data={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
                {...generateForm.getInputProps("difficulty")}
              />
            </Group>

            <Group grow>
              <NumberInput
                label="Number of Questions"
                placeholder="10"
                min={1}
                max={50}
                {...generateForm.getInputProps("question_count")}
              />

              <NumberInput
                label="Time Limit (minutes)"
                placeholder="60"
                min={5}
                {...generateForm.getInputProps("time_limit")}
              />
            </Group>

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setGenerateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={generatingAI}
                leftSection={<FaRobot />}
                variant="gradient"
                gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
              >
                Generate Test
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Preview/Create Modal */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={
          selectedTest
            ? `Preview: ${selectedTest.title}`
            : "Review Generated Test"
        }
        size="xl"
      >
        <Stack gap="md">
          {!selectedTest && (
            <>
              <TextInput
                label="Test Title"
                required
                {...createForm.getInputProps("title")}
              />

              <Textarea
                label="Description"
                minRows={2}
                required
                {...createForm.getInputProps("description")}
              />

              <Textarea
                label="Instructions"
                minRows={3}
                {...createForm.getInputProps("instructions")}
              />

              <Group grow>
                <DateTimePicker
                  label="Start Time"
                  required
                  {...createForm.getInputProps("start_time")}
                />

                <DateTimePicker
                  label="End Time"
                  required
                  {...createForm.getInputProps("end_time")}
                />
              </Group>

              <NumberInput
                label="Duration (minutes)"
                required
                {...createForm.getInputProps("duration_minutes")}
              />

              <Divider />
            </>
          )}

          <Text fw={600} size="lg">
            Questions
          </Text>

          <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            <Stack gap="md">
              {(selectedTest?.questions || createForm.values.questions).map(
                (question, index) => (
                  <Paper key={index} p="md" withBorder>
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text fw={600}>Question {index + 1}</Text>
                        <Badge>{question.points} points</Badge>
                      </Group>

                      <Text>{question.question_text}</Text>

                      {question.question_type === "multiple_choice" &&
                        question.options && (
                          <Stack gap="xs" ml="md">
                            {question.options.map((option, optIndex) => (
                              <Group key={optIndex}>
                                <Radio
                                  checked={option === question.correct_answer}
                                  readOnly
                                />
                                <Text size="sm">{option}</Text>
                                {option === question.correct_answer && (
                                  <Badge color="green" size="xs">
                                    Correct
                                  </Badge>
                                )}
                              </Group>
                            ))}
                          </Stack>
                        )}

                      {question.question_type === "short_answer" && (
                        <Paper p="sm" withBorder bg="gray.0">
                          <Text size="sm" c="dimmed">
                            Expected Answer: {question.correct_answer}
                          </Text>
                        </Paper>
                      )}
                    </Stack>
                  </Paper>
                )
              )}
            </Stack>
          </div>

          {!selectedTest && (
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setPreviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Save Test</Button>
            </Group>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}
