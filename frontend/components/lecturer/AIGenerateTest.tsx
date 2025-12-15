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
  Button,
  Textarea,
  Card,
  Badge,
  List,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
import { FaRobot, FaSave } from "react-icons/fa";

interface Props {
  courseId: string;
  courseName: string;
  onTestSaved: () => void;
}

export function AIGenerateTest({ courseId, courseName, onTestSaved }: Props) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const form = useForm({
    initialValues: {
      topic: "",
      test_type: "text_based",
      num_questions: 10,
      difficulty: "medium",
    },
  });

  const saveForm = useForm({
    initialValues: {
      title: "",
      description: "",
      duration: 60,
      start_time: new Date(),
      end_time: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const handleGenerate = async (values: typeof form.values) => {
    setGenerating(true);
    setPreview(null);
    try {
      const response = await apiClient.tests.generate(courseId, {
        topic: values.topic,
        test_type: values.test_type as
          | "multiple_choice"
          | "text_based"
          | "mixed",
        num_questions: values.num_questions,
        difficulty: values.difficulty,
        course_context: `Course: ${courseName}`,
      });

      setPreview(response.data);
      console.log(response.data);
      notifications.show({
        title: "Preview Ready",
        message: "Review the test preview.",
        color: "blue",
      });
    } catch (e: any) {
      notifications.show({
        title: "Generation Failed",
        message: e.response?.data?.detail || "Failed to generate test",
        color: "red",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (values: typeof saveForm.values) => {
    if (!preview) return;
    setSaving(true);
    try {
      const toISO = (v: any) => {
        try {
          if (v instanceof Date) return v.toISOString();
          const d = new Date(v);
          if (!isNaN(d.getTime())) return d.toISOString();
        } catch (e) {}
        return new Date().toISOString();
      };

      const payload = {
        title: values.title || `AI Test: ${form.values.topic}`,
        description: values.description || preview.description || "",
        test_type: form.values.test_type as
          | "multiple_choice"
          | "text_based"
          | "mixed",
        duration: values.duration,
        start_time: toISO(values.start_time),
        end_time: toISO(values.end_time),
        questions: preview.questions || [],
        answers: preview.answers || {},
      };

      const res = await apiClient.tests.create(courseId, payload);
      notifications.show({
        title: "Saved",
        message: "Test saved successfully",
        color: "green",
      });
      setPreview(null);
      saveForm.reset();
      onTestSaved();
    } catch (e: any) {
      console.log(e);
      notifications.show({
        title: "Save Failed",
        message: e.response?.data?.detail || "Failed to save test",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Paper p="lg" withBorder>
        <form onSubmit={form.onSubmit(handleGenerate)}>
          <Stack>
            <TextInput
              label="Topic"
              required
              {...form.getInputProps("topic")}
            />
            <Group grow>
              <Select
                label="Test Type"
                data={[
                  { value: "multiple_choice", label: "Multiple Choice" },
                  { value: "text_based", label: "Text Based" },
                  { value: "mixed", label: "Mixed" },
                ]}
                {...form.getInputProps("test_type")}
              />
              <NumberInput
                label="Number of Questions"
                min={1}
                max={50}
                {...form.getInputProps("num_questions")}
              />
            </Group>

            <Select
              label="Difficulty"
              data={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
              {...form.getInputProps("difficulty")}
            />

            <Button
              type="submit"
              leftSection={<FaRobot />}
              loading={generating}
            >
              {generating ? "Generating..." : "Generate Test Preview"}
            </Button>
          </Stack>
        </form>
      </Paper>

      {preview && (
        <Paper p="lg" withBorder>
          <Stack>
            <Text fw={700}>Preview: {preview.title || form.values.topic}</Text>
            {preview.description && (
              <Text size="sm" c="dimmed">
                {preview.description}
              </Text>
            )}
            <ScrollArea offsetScrollbars>
              <Stack gap="md">
                {Array.isArray(preview.questions) &&
                preview.questions.length > 0 ? (
                  preview.questions.map((q: any, idx: number) => (
                    <Card key={idx} withBorder>
                      <Group align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Group justify="apart" align="flex-start">
                            <Text fw={600} style={{ lineHeight: 1.25 }}>
                              {idx + 1}. {q.question ?? q.prompt ?? q.text}
                            </Text>
                            {q.type && (
                              <Badge variant="light" color="blue">
                                {String(q.type)}
                              </Badge>
                            )}
                          </Group>

                          {q.options && Array.isArray(q.options) && (
                            <List withPadding spacing="xs" mt="sm">
                              {q.options.map((opt: any, i: number) => (
                                <List.Item key={i}>{opt}</List.Item>
                              ))}
                            </List>
                          )}

                          {(q.rubric || q.points || q.expected_answer) && (
                            <div style={{ marginTop: 8 }}>
                              {q.points && (
                                <Text size="sm" c="dimmed">
                                  <strong>Points:</strong> {q.points}
                                </Text>
                              )}
                              {q.rubric && (
                                <Text size="sm" c="dimmed">
                                  <strong>Rubric:</strong> {q.rubric}
                                </Text>
                              )}
                              {q.expected_answer && (
                                <Text size="sm" c="dimmed">
                                  <strong>Expected:</strong> {q.expected_answer}
                                </Text>
                              )}
                            </div>
                          )}
                        </div>
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Card withBorder>
                    <Text c="dimmed">No structured questions available.</Text>
                    <Divider my="sm" />
                    <Text
                      size="sm"
                      c="dimmed"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {String(preview.questions ?? preview)}
                    </Text>
                  </Card>
                )}
              </Stack>
            </ScrollArea>

            <form onSubmit={saveForm.onSubmit(handleSave)}>
              <Stack mt="md">
                <TextInput
                  label="Test Title"
                  {...saveForm.getInputProps("title")}
                />
                <Textarea
                  label="Description"
                  {...saveForm.getInputProps("description")}
                />
                <Group>
                  <DateTimePicker
                    label="Start Time"
                    {...saveForm.getInputProps("start_time")}
                  />
                  <DateTimePicker
                    label="End Time"
                    {...saveForm.getInputProps("end_time")}
                  />
                </Group>
                <NumberInput
                  label="Duration (minutes)"
                  {...saveForm.getInputProps("duration")}
                />

                <Group justify="right">
                  <Button
                    leftSection={<FaSave />}
                    loading={saving}
                    type="submit"
                  >
                    Save Test
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export default AIGenerateTest;
