"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  Select,
  NumberInput,
  Group,
  Text,
  Paper,
  List,
  Divider,
  Badge,
  Card,
  MultiSelect,
  Textarea,
  Button,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRobot,
  FaLightbulb,
  FaCheck,
  FaInfoCircle,
  FaClipboardList,
  FaSave,
  FaSpinner,
  FaEye,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface AIGenerateAssignmentProps {
  courseId: string;
  courseName: string;
  onAssignmentAdded: () => void;
}

export function AIGenerateAssignment({
  courseId,
  courseName,
  onAssignmentAdded,
}: AIGenerateAssignmentProps) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [generatedAssignmentId, setGeneratedAssignmentId] = useState<
    string | null
  >(null);

  const form = useForm({
    initialValues: {
      topic: "",
      difficulty: "medium",
      question_types: ["essay", "short_answer"],
      num_questions: 5,
    },
    validate: {
      topic: (value) => {
        if (!value) return "Topic is required";
        if (value.length < 5) return "Topic must be at least 5 characters";
        return null;
      },
      num_questions: (value) => {
        if (value < 1) return "Must have at least 1 question";
        if (value > 20) return "Maximum 20 questions allowed";
        return null;
      },
    },
  });

  const publishForm = useForm({
    initialValues: {
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      max_score: 100,
    },
    validate: {
      due_date: (value) => {
        if (!value) return "Due date is required";
        if (value < new Date()) return "Due date must be in the future";
        return null;
      },
      max_score: (value) => {
        if (value <= 0) return "Max score must be greater than 0";
        return null;
      },
    },
  });

  const handleGenerate = async (values: typeof form.values) => {
    setGenerating(true);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("topic", values.topic);
      formData.append("difficulty", values.difficulty);
      formData.append("question_types", values.question_types.join(","));
      formData.append("num_questions", values.num_questions.toString());
      formData.append("save", "false"); // Preview only

      const response = await apiClient.assignments.generate(courseId, formData);
      console.log(response.data.preview);

      const previewPayload =
        response.data.preview?.assignment ?? response.data.preview;
      setPreview(previewPayload);

      notifications.show({
        title: "Preview Ready!",
        message:
          'Review the generated assignment below. Click "Save Assignment" when satisfied.',
        color: "blue",
      });
    } catch (error: any) {
      notifications.show({
        title: "Generation Failed",
        message:
          error.response?.data?.detail || "Failed to generate assignment",
        color: "red",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("topic", form.values.topic);
      formData.append("difficulty", form.values.difficulty);
      formData.append("question_types", form.values.question_types.join(","));
      formData.append("num_questions", form.values.num_questions.toString());
      formData.append("save", "true");
      try {
        formData.append("preview", JSON.stringify(preview));
      } catch (e) {
        console.error("Failed to stringify preview for save:", e);
      }

      const response = await apiClient.assignments.generate(courseId, formData);

      setGeneratedAssignmentId(response.data.assignment.id);
      setShowPublishForm(true);

      notifications.show({
        title: "Assignment Saved!",
        message: "Now set a due date and publish it for students",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Save Failed",
        message: error.response?.data?.detail || "Failed to save assignment",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (values: typeof publishForm.values) => {
    if (!generatedAssignmentId) return;

    try {
      const formData = new FormData();
      formData.append("due_date", values.due_date.toISOString());
      formData.append("max_score", values.max_score.toString());

      await apiClient.assignments.publish(generatedAssignmentId, formData);

      notifications.show({
        title: "Assignment Published!",
        message: "Students can now view and submit this assignment",
        color: "green",
      });

      form.reset();
      setPreview(null);
      setShowPublishForm(false);
      setGeneratedAssignmentId(null);
      onAssignmentAdded();
    } catch (error: any) {
      notifications.show({
        title: "Publish Failed",
        message: error.response?.data?.detail || "Failed to publish assignment",
        color: "red",
      });
    }
  };

  const exampleTopics = [
    {
      topic: "Object-Oriented Programming Principles",
      difficulty: "medium",
      types: ["essay", "short_answer"],
      questions: 5,
      description:
        "Covers inheritance, polymorphism, encapsulation, and abstraction",
    },
    {
      topic: "Data Structures: Trees and Graphs",
      difficulty: "hard",
      types: ["short_answer", "problem_solving"],
      questions: 7,
      description: "Implementation and traversal algorithms",
    },
    {
      topic: "Introduction to Machine Learning",
      difficulty: "easy",
      types: ["essay", "multiple_choice"],
      questions: 8,
      description: "Basic ML concepts and supervised learning",
    },
  ];

  const normalizeQuestions = (previewData: any) => {
    if (!previewData) return [] as any[];

    const raw = previewData.questions ?? previewData;

    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") {
      // Try to split numbered list (e.g., "1. Question...\n2. Question...")
      const parts = raw
        .split(/\n\s*(?=\d+\.|\d+\))/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        return parts.map((p) => {
          // remove leading number and dot/paren
          const text = p.replace(/^\d+[\.)]\s*/, "").trim();
          return { question: text };
        });
      }

      // Fallback: split by double-newline paragraphs
      const paras = raw
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (paras.length > 1) return paras.map((p) => ({ question: p }));

      // Single long string -> return as single question object
      return [{ question: raw }];
    }

    return [] as any[];
  };

  return (
    <Stack gap="xl">
      {/* Information Banner */}
      <GlassCard padding="lg">
        <Group gap="md" align="flex-start">
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: "rgba(121, 75, 196, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#794BC4",
              fontSize: 24,
            }}
          >
            <FaRobot />
          </div>
          <Stack gap="sm" style={{ flex: 1 }}>
            <Text fw={700} size="lg">
              AI-Powered Assignment Generation
            </Text>
            <Text size="sm" c="dimmed">
              Generate comprehensive assignments with diverse question types
              tailored to your course content. Our AI creates questions that
              test understanding at multiple cognitive levels.
            </Text>
            <List size="sm" spacing="xs" mt="xs">
              <List.Item>
                <strong>Customizable Difficulty:</strong> Choose from easy,
                medium, or hard complexity
              </List.Item>
              <List.Item>
                <strong>Mixed Question Types:</strong> Essay, short answer,
                multiple choice, and problem-solving
              </List.Item>
              <List.Item>
                <strong>Preview & Edit:</strong> Review all questions before
                publishing to students
              </List.Item>
              <List.Item>
                <strong>Auto-Grading Ready:</strong> Questions formatted for
                AI-assisted grading
              </List.Item>
            </List>
          </Stack>
        </Group>
      </GlassCard>

      {/* Generation Form */}
      {!showPublishForm && (
        <form onSubmit={form.onSubmit(handleGenerate)}>
          <GlassCard padding="xl">
            <Stack gap="lg">
              <Group gap="xs">
                <div style={{ fontSize: 28 }}>✨</div>
                <Text fw={700} size="lg">
                  Generate Assignment
                </Text>
              </Group>

              {/* Topic Input */}
              <TextInput
                label={
                  <Group gap={4}>
                    <Text size="sm" fw={600}>
                      Assignment Topic
                    </Text>
                    <Badge size="xs" color="red">
                      Required
                    </Badge>
                  </Group>
                }
                placeholder="e.g., Recursion in Programming, Linear Algebra Applications, Database Normalization"
                description="Be specific about what you want students to demonstrate understanding of"
                required
                size="md"
                leftSection={<FaLightbulb />}
                {...form.getInputProps("topic")}
              />

              {/* Configuration Options */}
              <Group grow>
                <Select
                  label="Difficulty Level"
                  description="Adjust complexity of questions"
                  data={[
                    {
                      value: "easy",
                      label: "Easy - Basic recall and understanding",
                    },
                    {
                      value: "medium",
                      label: "Medium - Application and analysis",
                    },
                    { value: "hard", label: "Hard - Synthesis and evaluation" },
                  ]}
                  {...form.getInputProps("difficulty")}
                />

                <NumberInput
                  label="Number of Questions"
                  description="1-20 questions"
                  min={1}
                  max={20}
                  {...form.getInputProps("num_questions")}
                />
              </Group>

              {/* Question Types */}
              <MultiSelect
                label="Question Types"
                description="Select one or more question formats (mix recommended)"
                data={[
                  {
                    value: "essay",
                    label: "📝 Essay - Long-form written responses",
                  },
                  {
                    value: "short_answer",
                    label: "✍️ Short Answer - Brief explanations",
                  },
                  {
                    value: "multiple_choice",
                    label: "☑️ Multiple Choice - Select correct option",
                  },
                  {
                    value: "problem_solving",
                    label: "🧮 Problem Solving - Step-by-step solutions",
                  },
                ]}
                {...form.getInputProps("question_types")}
              />

              {/* Course Context */}
              <Paper
                p="md"
                withBorder
                style={{ background: "rgba(29, 161, 242, 0.05)" }}
              >
                <Group gap="xs" mb="xs">
                  <FaInfoCircle color="#1DA1F2" />
                  <Text size="sm" fw={600}>
                    Course Context
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Questions will be generated specifically for{" "}
                  <strong>{courseName}</strong>. The AI will consider your
                  course level and typical student knowledge.
                </Text>
              </Paper>

              {/* Action Button */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={generating}
                leftSection={
                  generating ? <FaSpinner className="spin" /> : <FaRobot />
                }
                color="twitterBlue"
              >
                {generating ? "Generating Questions..." : "Generate Assignment"}
              </Button>

              {generating && (
                <Paper
                  p="md"
                  withBorder
                  style={{ background: "rgba(121, 75, 196, 0.05)" }}
                >
                  <Group gap="xs">
                    <FaSpinner className="spin" color="#794BC4" />
                    <Text size="sm" c="purple">
                      AI is creating {form.values.num_questions}{" "}
                      {form.values.difficulty} questions on {form.values.topic}
                      ...
                    </Text>
                  </Group>
                </Paper>
              )}
            </Stack>
          </GlassCard>
        </form>
      )}

      {/* Example Topics */}
      {!preview && !showPublishForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard padding="lg">
            <Stack gap="md">
              <Group gap="xs">
                <div style={{ fontSize: 24 }}>💡</div>
                <Text fw={700} size="lg">
                  Example Topics to Try
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Click any example to see how AI generates assignments for
                different subjects
              </Text>

              <Stack gap="sm">
                {exampleTopics.map((example, index) => (
                  <Card
                    key={index}
                    padding="md"
                    withBorder
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                    onClick={() => {
                      form.setValues({
                        topic: example.topic,
                        difficulty: example.difficulty as any,
                        question_types: example.types,
                        num_questions: example.questions,
                      });
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Text fw={600} size="sm" c="purple">
                          {example.topic}
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>
                          {example.description}
                        </Text>
                        <Group gap="xs" mt="xs">
                          <Badge size="xs" variant="light">
                            {example.difficulty}
                          </Badge>
                          <Badge size="xs" variant="light">
                            {example.questions} questions
                          </Badge>
                          <Badge size="xs" variant="light">
                            {example.types.join(", ")}
                          </Badge>
                        </Group>
                      </div>
                      <Text size="xs" c="dimmed">
                        Click to use
                      </Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </GlassCard>
        </motion.div>
      )}

      {/* Preview Section */}
      <AnimatePresence>
        {preview && !showPublishForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Stack gap="md">
              {/* Preview Header */}
              <GlassCard padding="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge size="lg" color="blue" leftSection={<FaCheck />}>
                        Preview Generated
                      </Badge>
                      <Badge size="lg" color="purple">
                        {preview.questions?.length || 0} Questions
                      </Badge>
                    </Group>
                    <Text fw={700} size="lg">
                      AI Generated: {form.values.topic}
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      Review all questions carefully. You can regenerate with
                      different parameters or save and publish.
                    </Text>
                  </div>
                  <Group>
                    <Button variant="default" onClick={() => setPreview(null)}>
                      Regenerate
                    </Button>
                    <Button
                      leftSection={<FaSave />}
                      loading={saving}
                      onClick={handleSave}
                      variant="gradient"
                      gradient={{ from: "green", to: "teal", deg: 135 }}
                    >
                      Save Assignment
                    </Button>
                  </Group>
                </Group>
              </GlassCard>

              {/* Assignment Details */}
              {preview.description && (
                <GlassCard padding="lg">
                  <Stack gap="xs">
                    <Text fw={600} size="md">
                      📋 Assignment Description
                    </Text>
                    <Text size="sm">{preview.description}</Text>
                  </Stack>
                </GlassCard>
              )}

              {preview.instructions && (
                <GlassCard padding="lg">
                  <Stack gap="xs">
                    <Text fw={600} size="md">
                      📝 Instructions for Students
                    </Text>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {preview.instructions}
                    </Text>
                  </Stack>
                </GlassCard>
              )}

              {/* Questions List */}
              <GlassCard padding="xl">
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <FaClipboardList color="#794BC4" size={20} />
                      <Text fw={600} size="lg">
                        Generated Questions
                      </Text>
                    </Group>
                    <Badge size="lg">
                      {normalizeQuestions(preview).length || 0} Total
                    </Badge>
                  </Group>

                  <Divider />

                  <Stack gap="xl">
                    {normalizeQuestions(preview).map(
                      (question: any, index: number) => (
                        <Card key={index} padding="lg" withBorder>
                          <Stack gap="md">
                            <Group justify="space-between">
                              <Badge
                                size="lg"
                                variant="gradient"
                                gradient={{ from: "purple", to: "blue" }}
                              >
                                Question {index + 1}
                              </Badge>
                              <Group gap="xs">
                                <Badge size="sm" variant="light">
                                  {question.type || "essay"}
                                </Badge>
                                {question.points && (
                                  <Badge size="sm" color="green">
                                    {question.points} points
                                  </Badge>
                                )}
                              </Group>
                            </Group>

                            <Text fw={600} size="md">
                              {question.question || question.text}
                            </Text>

                            {question.options && (
                              <Stack gap="xs" ml="md">
                                <Text size="sm" fw={600} c="dimmed">
                                  Options:
                                </Text>
                                {question.options.map(
                                  (option: string, optIndex: number) => (
                                    <Group key={optIndex} gap="xs">
                                      <Text size="sm" fw={600} c="dimmed">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </Text>
                                      <Text size="sm">{option}</Text>
                                      {question.correct_answer === option && (
                                        <Badge size="xs" color="green">
                                          Correct
                                        </Badge>
                                      )}
                                    </Group>
                                  )
                                )}
                              </Stack>
                            )}

                            {question.rubric && (
                              <Paper p="sm" withBorder bg="gray.0">
                                <Text size="xs" fw={600} mb="xs">
                                  Grading Rubric:
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {question.rubric}
                                </Text>
                              </Paper>
                            )}
                          </Stack>
                        </Card>
                      )
                    )}
                  </Stack>
                </Stack>
              </GlassCard>

              {/* Info Footer */}
              <Paper
                p="md"
                withBorder
                style={{ background: "rgba(23, 191, 99, 0.05)" }}
              >
                <Group gap="xs">
                  <FaInfoCircle color="#17BF63" />
                  <Text size="sm">
                    <strong>Satisfied with the questions?</strong> Click "Save
                    Assignment" to continue. You'll then set a due date and
                    publish it for students.
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Form */}
      <AnimatePresence>
        {showPublishForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={publishForm.onSubmit(handlePublish)}>
              <GlassCard padding="xl">
                <Stack gap="lg">
                  <Group gap="xs">
                    <div style={{ fontSize: 28 }}>🚀</div>
                    <Text fw={700} size="lg">
                      Publish Assignment
                    </Text>
                  </Group>

                  <Paper
                    p="md"
                    withBorder
                    style={{ background: "rgba(121, 75, 196, 0.05)" }}
                  >
                    <Group gap="xs">
                      <FaCheck color="#17BF63" size={20} />
                      <Text size="sm" fw={600} c="green">
                        Assignment saved successfully! Set publication details
                        below.
                      </Text>
                    </Group>
                  </Paper>

                  <DateTimePicker
                    label={
                      <Group gap={4}>
                        <Text size="sm" fw={600}>
                          Due Date & Time
                        </Text>
                        <Badge size="xs" color="red">
                          Required
                        </Badge>
                      </Group>
                    }
                    description="Students must submit before this deadline"
                    placeholder="Select date and time"
                    required
                    minDate={new Date()}
                    {...publishForm.getInputProps("due_date")}
                  />

                  <NumberInput
                    label="Maximum Score"
                    description="Total points students can earn"
                    min={1}
                    max={1000}
                    required
                    {...publishForm.getInputProps("max_score")}
                  />

                  <Paper p="md" withBorder>
                    <Stack gap="xs">
                      <Text fw={600} size="sm">
                        📢 Publishing Notes
                      </Text>
                      <List size="sm" spacing="xs">
                        <List.Item>
                          Students will be notified immediately
                        </List.Item>
                        <List.Item>
                          Assignment will appear in their dashboard
                        </List.Item>
                        <List.Item>
                          You can unpublish or edit before the due date
                        </List.Item>
                        <List.Item>
                          AI grading will be available for submissions
                        </List.Item>
                      </List>
                    </Stack>
                  </Paper>

                  <Group justify="flex-end">
                    <Button
                      variant="default"
                      onClick={() => {
                        setShowPublishForm(false);
                        setPreview(null);
                        setGeneratedAssignmentId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" leftSection={<FaEye />}>
                      Publish to Students
                    </Button>
                  </Group>
                </Stack>
              </GlassCard>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  );
}
