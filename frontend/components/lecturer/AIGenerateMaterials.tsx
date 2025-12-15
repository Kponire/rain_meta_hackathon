"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  Select,
  Checkbox,
  Group,
  Text,
  Paper,
  List,
  Divider,
  Badge,
  Card,
  CopyButton,
  ActionIcon,
  Button,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRobot,
  FaLightbulb,
  FaCheck,
  FaCopy,
  FaInfoCircle,
  FaFileAlt,
  FaFilePowerpoint,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface AIGenerateMaterialsProps {
  courseId: string;
  courseName: string;
  onMaterialAdded: () => void;
}

export function AIGenerateMaterials({
  courseId,
  courseName,
  onMaterialAdded,
}: AIGenerateMaterialsProps) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [showExamples, setShowExamples] = useState(true);

  const form = useForm({
    initialValues: {
      topic: "",
      level: "undergraduate",
      audience: "college students",
      generate_powerpoint: false,
    },
    validate: {
      topic: (value) => {
        if (!value) return "Topic is required";
        if (value.length < 5) return "Topic must be at least 5 characters";
        if (value.length > 500) return "Topic must be less than 200 characters";
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
      formData.append("level", values.level);
      formData.append("audience", values.audience);
      formData.append(
        "generate_powerpoint",
        values.generate_powerpoint.toString()
      );
      formData.append("save", "false");

      const response = await apiClient.courses.generateMaterials(
        courseId,
        formData
      );

      setPreview(response.data);
      setShowExamples(false);

      notifications.show({
        title: "Preview Ready!",
        message:
          'Review the generated content below. Click "Save Material" when satisfied.',
        color: "blue",
      });
    } catch (error: any) {
      notifications.show({
        title: "Generation Failed",
        message: error.response?.data?.detail || "Failed to generate material",
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
      formData.append("level", form.values.level);
      formData.append("audience", form.values.audience);
      formData.append(
        "generate_powerpoint",
        form.values.generate_powerpoint.toString()
      );
      formData.append("save", "true");

      await apiClient.courses.generateMaterials(courseId, formData);

      notifications.show({
        title: "Material Saved Successfully!",
        message: "Your AI-generated material has been added to the course",
        color: "green",
      });

      form.reset();
      setPreview(null);
      setShowExamples(true);
      onMaterialAdded();
    } catch (error: any) {
      notifications.show({
        title: "Save Failed",
        message: error.response?.data?.detail || "Failed to save material",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const exampleTopics = [
    {
      topic: "Introduction to Machine Learning",
      level: "undergraduate",
      audience: "computer science students",
      description:
        "Comprehensive overview of ML fundamentals, supervised and unsupervised learning",
    },
    {
      topic: "Data Structures: Binary Search Trees",
      level: "undergraduate",
      audience: "programming students",
      description:
        "In-depth explanation with code examples and complexity analysis",
    },
    {
      topic: "Advanced Calculus: Integration Techniques",
      level: "graduate",
      audience: "mathematics majors",
      description: "Advanced integration methods with proof demonstrations",
    },
  ];

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
              background: "rgba(29, 161, 242, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1DA1F2",
              fontSize: 24,
            }}
          >
            <FaRobot />
          </div>
          <Stack gap="sm" style={{ flex: 1 }}>
            <Text fw={700} size="lg">
              AI-Powered Content Generation
            </Text>
            <Text size="sm" c="dimmed">
              Our advanced AI will create comprehensive, structured course
              materials tailored to your specifications. You'll get a full
              preview before saving to your course.
            </Text>
            <List size="sm" spacing="xs" mt="xs">
              <List.Item>
                <strong>Instant Generation:</strong> Get complete lecture notes
                in seconds
              </List.Item>
              <List.Item>
                <strong>Customizable:</strong> Adjust level and audience for
                perfect content
              </List.Item>
              <List.Item>
                <strong>Preview First:</strong> Review and regenerate until it's
                perfect
              </List.Item>
              <List.Item>
                <strong>PowerPoint Ready:</strong> Optionally export as
                presentation slides
              </List.Item>
            </List>
          </Stack>
        </Group>
      </GlassCard>

      {/* Generation Form */}
      <form onSubmit={form.onSubmit(handleGenerate)}>
        <GlassCard padding="xl">
          <Stack gap="lg">
            <Group gap="xs">
              <div style={{ fontSize: 28 }}>✨</div>
              <Text fw={700} size="lg">
                Generate Course Material
              </Text>
            </Group>

            {/* Topic Input */}
            <Textarea
              label={
                <Group gap={4}>
                  <Text size="sm" fw={600}>
                    Topic / Subject
                  </Text>
                  <Badge size="xs" color="red">
                    Required
                  </Badge>
                </Group>
              }
              placeholder="e.g., Introduction to Neural Networks, Python Programming Basics, Quantum Mechanics"
              description="Be specific about what you want the AI to cover. More detail = better results!"
              required
              size="md"
              resize="vertical"
              leftSection={<FaLightbulb />}
              {...form.getInputProps("topic")}
            />

            {/* Level and Audience */}
            <Group grow>
              <Select
                label="Education Level"
                description="Select the academic level"
                data={[
                  { value: "high_school", label: "High School" },
                  { value: "undergraduate", label: "Undergraduate" },
                  { value: "graduate", label: "Graduate" },
                  { value: "phd", label: "PhD / Research" },
                  { value: "professional", label: "Professional Development" },
                ]}
                {...form.getInputProps("level")}
              />

              <Select
                label="Target Audience"
                description="Who will be reading this?"
                data={[
                  {
                    value: "beginners",
                    label: "Beginners (No prior knowledge)",
                  },
                  { value: "college students", label: "College Students" },
                  { value: "advanced students", label: "Advanced Students" },
                  { value: "professionals", label: "Working Professionals" },
                  { value: "researchers", label: "Researchers" },
                ]}
                {...form.getInputProps("audience")}
              />
            </Group>

            {/* PowerPoint Option */}
            <Paper
              p="md"
              withBorder
              style={{ background: "rgba(121, 75, 196, 0.05)" }}
            >
              <Checkbox
                label={
                  <Group gap="xs">
                    <FaFilePowerpoint color="#794BC4" />
                    <Text fw={600}>Generate PowerPoint Presentation</Text>
                  </Group>
                }
                description="Create a downloadable .pptx file alongside the text content (may take longer)"
                {...form.getInputProps("generate_powerpoint", {
                  type: "checkbox",
                })}
              />
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
              {generating ? "Generating Content..." : "Generate Material"}
            </Button>

            {generating && (
              <Paper
                p="md"
                withBorder
                style={{ background: "rgba(29, 161, 242, 0.05)" }}
              >
                <Group gap="xs">
                  <FaSpinner className="spin" color="#1DA1F2" />
                  <Text size="sm" c="twitterBlue">
                    AI is analyzing your topic and creating comprehensive
                    content. This may take 10-30 seconds...
                  </Text>
                </Group>
              </Paper>
            )}
          </Stack>
        </GlassCard>
      </form>

      {/* Example Topics */}
      {showExamples && !preview && (
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
                Click on any example to see how AI generates materials for
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
                        level: example.level,
                        audience: example.audience,
                        generate_powerpoint: false,
                      });
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Text fw={600} size="sm" c="twitterBlue">
                          {example.topic}
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>
                          {example.description}
                        </Text>
                        <Group gap="xs" mt="xs">
                          <Badge size="xs" variant="light">
                            {example.level}
                          </Badge>
                          <Badge size="xs" variant="light">
                            {example.audience}
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
        {preview && (
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
                      {preview.powerpoint_available && (
                        <Badge
                          size="lg"
                          color="purple"
                          leftSection={<FaFilePowerpoint />}
                        >
                          PowerPoint Available
                        </Badge>
                      )}
                    </Group>
                    <Text fw={700} size="lg">
                      AI Generated: {form.values.topic}
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      Review the content below. You can regenerate with
                      different parameters or save it to your course.
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
                      Save Material
                    </Button>
                  </Group>
                </Group>
              </GlassCard>

              {/* Key Concepts */}
              {preview.key_concepts && preview.key_concepts.length > 0 && (
                <GlassCard padding="lg">
                  <Stack gap="sm">
                    <Text fw={600} size="md">
                      🎯 Key Concepts Covered
                    </Text>
                    <Group gap="xs">
                      {preview.key_concepts.map(
                        (concept: string, index: number) => (
                          <Badge key={index} size="lg" variant="light">
                            {concept}
                          </Badge>
                        )
                      )}
                    </Group>
                  </Stack>
                </GlassCard>
              )}

              {/* Generated Content */}
              <GlassCard padding="xl">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <FaFileAlt color="#1DA1F2" size={20} />
                      <Text fw={600} size="lg">
                        Generated Content
                      </Text>
                    </Group>
                    <CopyButton value={preview.preview || ""}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          color={copied ? "green" : "gray"}
                          onClick={copy}
                          variant="subtle"
                          size="lg"
                        >
                          {copied ? <FaCheck /> : <FaCopy />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>

                  <Divider />

                  <Paper
                    p="xl"
                    withBorder
                    style={{
                      background: "white",
                      maxHeight: 600,
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      fontFamily: "Georgia, serif",
                      lineHeight: 1.8,
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: preview.preview?.replace(/\n/g, "<br />") || "",
                      }}
                    />
                  </Paper>
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
                    <strong>Satisfied with the content?</strong> Click "Save
                    Material" to add it to your course. Students will be able to
                    access it immediately. You can edit or delete it later.
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  );
}
