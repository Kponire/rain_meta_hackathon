"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Group,
  Text,
  Paper,
  List,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FaBook, FaCode, FaInfoCircle } from "react-icons/fa";
import { GrTooltip } from "react-icons/gr";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface CreateCourseModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCourseModal({
  opened,
  onClose,
  onSuccess,
}: CreateCourseModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      title: "",
      code: "",
      description: "",
    },
    validate: {
      title: (value) => {
        if (!value) return "Course title is required";
        if (value.length < 3) return "Title must be at least 3 characters";
        if (value.length > 100) return "Title must be less than 100 characters";
        return null;
      },
      code: (value) => {
        if (!value) return "Course code is required";
        if (!/^[A-Z0-9]{3,10}$/.test(value)) {
          return "Code must be 3-10 uppercase letters/numbers (e.g., CS101)";
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 500)
          return "Description must be less than 500 characters";
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("code", values.code.toUpperCase());
      if (values.description) {
        formData.append("description", values.description);
      }

      await apiClient.courses.create(formData);

      notifications.show({
        title: "Course Created Successfully!",
        message: `${values.code} - ${values.title} is ready for content`,
        color: "green",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      notifications.show({
        title: "Error Creating Course",
        message: error.response?.data?.detail || "Please try again",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#1DA1F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <FaBook />
          </div>
          <div>
            <Text fw={700} size="lg">
              Create New Course
            </Text>
            <Text size="xs" c="dimmed">
              Set up your course foundation
            </Text>
          </div>
        </Group>
      }
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Information Panel */}
          <Paper
            p="md"
            withBorder
            style={{ background: "rgba(29, 161, 242, 0.05)" }}
          >
            <Group gap="sm" align="flex-start">
              <FaInfoCircle size={20} color="#1DA1F2" />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="sm" fw={600} c="twitterBlue">
                  Quick Setup Guide
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <Text size="sm">
                      <strong>Course Title:</strong> Use a clear, descriptive
                      name (e.g., "Introduction to Machine Learning")
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Course Code:</strong> Create a unique identifier
                      with 3-10 characters (e.g., CS101, DATA301)
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Description:</strong> Briefly explain what
                      students will learn (optional but recommended)
                    </Text>
                  </List.Item>
                </List>
              </Stack>
            </Group>
          </Paper>

          {/* Course Title */}
          <TextInput
            label="Course Title"
            placeholder="e.g., Introduction to Artificial Intelligence"
            description="This will be displayed to students when browsing courses"
            required
            leftSection={<FaBook />}
            {...form.getInputProps("title")}
          />

          {/* Course Code */}
          <TextInput
            label="Course Code"
            placeholder="e.g., CS101, AI301, DATA450"
            description="Must be unique, 3-10 uppercase letters/numbers only"
            required
            leftSection={<FaCode />}
            {...form.getInputProps("code")}
            onChange={(e) =>
              form.setFieldValue("code", e.currentTarget.value.toUpperCase())
            }
          />

          {/* Description */}
          <Textarea
            label="Course Description"
            placeholder="Describe what students will learn, prerequisites, and course objectives..."
            description="Help students understand what to expect from your course"
            minRows={4}
            maxRows={8}
            {...form.getInputProps("description")}
          />

          {/* Examples Section */}
          <Paper p="md" withBorder>
            <Stack gap="xs">
              <Group align="center" gap="xs">
                <GrTooltip color="#1DA1F2" size={18} />
                <Text size="sm" fw={600}>
                  Example Courses
                </Text>
              </Group>
              <Stack gap="xs">
                {[
                  {
                    code: "CS101",
                    title: "Introduction to Computer Science",
                    desc: "Learn programming fundamentals, algorithms, and problem-solving",
                  },
                  {
                    code: "ML201",
                    title: "Machine Learning Basics",
                    desc: "Explore supervised and unsupervised learning techniques",
                  },
                  {
                    code: "WEB301",
                    title: "Advanced Web Development",
                    desc: "Build modern web applications with React and Node.js",
                  },
                ].map((example, index) => (
                  <Paper
                    key={index}
                    p="xs"
                    withBorder
                    style={{ background: "var(--bg-light)" }}
                  >
                    <Text size="xs" fw={600} c="twitterBlue">
                      {example.code}
                    </Text>
                    <Text size="xs" fw={500}>
                      {example.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {example.desc}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* Action Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} color="twitterBlue">
              Create Course
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
