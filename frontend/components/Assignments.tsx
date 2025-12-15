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
  Progress,
  FileInput,
  Button,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaRobot,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaUpload,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  published: boolean;
  submission_count: number;
  created_at: string;
}

interface AssignmentsProps {
  courseId: string;
  isLecturer: boolean;
}

export function Assignments({ courseId, isLecturer }: AssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const createForm = useForm({
    initialValues: {
      title: "",
      description: "",
      instructions: "",
      due_date: new Date(),
      max_score: 100,
    },
    validate: {
      title: (value) => (!value ? "Title is required" : null),
      description: (value) => (!value ? "Description is required" : null),
      max_score: (value) =>
        value <= 0 ? "Max score must be greater than 0" : null,
    },
  });

  const generateForm = useForm({
    initialValues: {
      topic: "",
      difficulty: "medium",
      question_count: 5,
      instructions: "",
      limit_to_materials: false,
    },
    validate: {
      topic: (value) => (!value ? "Topic is required" : null),
      question_count: (value) =>
        value < 1 || value > 20
          ? "Question count must be between 1 and 20"
          : null,
    },
  });

  const submitForm = useForm({
    initialValues: {
      file: null as File | null,
    },
    validate: {
      file: (value) => (!value ? "File is required" : null),
    },
  });

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const response = isLecturer
        ? await apiClient.assignments.getAll(courseId)
        : await apiClient.assignments.getStudentAssignments();
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: typeof createForm.values) => {
    try {
      await apiClient.assignments.create(courseId, {
        ...values,
        due_date: values.due_date.toISOString(),
        rubric: {},
      });
      notifications.show({
        title: "Success",
        message: "Assignment created successfully",
        color: "green",
      });

      setCreateModalOpen(false);
      createForm.reset();
      fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };
  const handleGenerate = async (values: typeof generateForm.values) => {
    setGeneratingAI(true);
    try {
      const response = await apiClient.assignments.generate(courseId, values);
      createForm.setValues({
        title: response.data.title,
        description: response.data.description,
        instructions: response.data.instructions,
        due_date: new Date(),
        max_score: response.data.max_score || 100,
      });

      notifications.show({
        title: "Success",
        message: "Assignment generated successfully. Review and save.",
        color: "green",
      });

      setGenerateModalOpen(false);
      setCreateModalOpen(true);
    } catch (error) {
      console.error("Error generating assignment:", error);
    } finally {
      setGeneratingAI(false);
    }
  };
  const handleSubmit = async (
    assignmentId: string,
    values: typeof submitForm.values
  ) => {
    if (!values.file) return;
    try {
      const formData = new FormData();
      formData.append("file", values.file);

      await apiClient.assignments.submit(assignmentId, formData);

      notifications.show({
        title: "Success",
        message: "Assignment submitted successfully",
        color: "green",
      });

      setSubmitModalOpen(false);
      submitForm.reset();
      fetchAssignments();
    } catch (error) {
      console.error("Error submitting assignment:", error);
    }
  };
  const handlePublish = async (assignmentId: string) => {
    try {
      await apiClient.assignments.publish(assignmentId);
      notifications.show({
        title: "Success",
        message: "Assignment published successfully",
        color: "green",
      });

      fetchAssignments();
    } catch (error) {
      console.error("Error publishing assignment:", error);
    }
  };
  const handleDelete = async (assignmentId: string) => {
    try {
      await apiClient.assignments.delete(assignmentId);
      notifications.show({
        title: "Success",
        message: "Assignment deleted successfully",
        color: "green",
      });

      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };
  const getStatusBadge = (assignment: Assignment) => {
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    if (!isLecturer) {
      return (
        <Badge color="yellow" leftSection={<FaClock />}>
          Pending
        </Badge>
      );
    }

    if (!assignment.published) {
      return <Badge color="gray">Draft</Badge>;
    }

    if (now > dueDate) {
      return (
        <Badge color="red" leftSection={<FaExclamationCircle />}>
          Overdue
        </Badge>
      );
    }

    return (
      <Badge color="green" leftSection={<FaCheckCircle />}>
        Active
      </Badge>
    );
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
            Assignments
          </Text>
          <Text size="sm" c="dimmed">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </Text>
        </div>
        {isLecturer && (
          <Group>
            <Button
              leftSection={<FaPlus />}
              variant="light"
              onClick={() => setCreateModalOpen(true)}
            >
              Create Assignment
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
        )}
      </Group>
      {/* Assignments List */}
      {assignments.length === 0 ? (
        <GlassCard padding="xl">
          <Stack align="center" gap="md">
            <div style={{ fontSize: 60 }}>📝</div>
            <Text size="lg" fw={600}>
              No assignments yet
            </Text>
            <Text c="dimmed" ta="center">
              {isLecturer
                ? "Create assignments or generate them with AI to get started"
                : "Check back later for assignments"}
            </Text>
          </Stack>
        </GlassCard>
      ) : (
        <Stack gap="md">
          {assignments.map((assignment, index) => {
            const dueDate = new Date(assignment.due_date);
            const now = new Date();
            const daysUntilDue = Math.ceil(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{
                    borderLeft: `4px solid ${
                      daysUntilDue < 0
                        ? "#E0245E"
                        : daysUntilDue < 3
                        ? "#FFAD1F"
                        : "#1DA1F2"
                    }`,
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb={4}>
                          <Text fw={600} size="lg">
                            {assignment.title}
                          </Text>
                          {getStatusBadge(assignment)}
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {assignment.description}
                        </Text>
                      </div>

                      <Group>
                        {!isLecturer && (
                          <Button
                            size="sm"
                            variant="light"
                            leftSection={<FaUpload />}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSubmitModalOpen(true);
                            }}
                          >
                            Submit
                          </Button>
                        )}

                        {isLecturer && (
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" size="lg">
                                <FaEllipsisV />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {!assignment.published && (
                                <Menu.Item
                                  leftSection={<FaCheckCircle />}
                                  onClick={() => handlePublish(assignment.id)}
                                >
                                  Publish
                                </Menu.Item>
                              )}
                              <Menu.Item leftSection={<FaEye />}>
                                View Submissions ({assignment.submission_count})
                              </Menu.Item>
                              <Menu.Item leftSection={<FaEdit />}>
                                Edit
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<FaTrash />}
                                color="red"
                                onClick={() => handleDelete(assignment.id)}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </Group>
                    </Group>

                    <Group>
                      <Group gap="xs">
                        <FaClock size={14} />
                        <Text size="sm" c="dimmed">
                          Due: {dueDate.toLocaleDateString()} at{" "}
                          {dueDate.toLocaleTimeString()}
                        </Text>
                      </Group>
                      <Badge variant="light">
                        {assignment.max_score} points
                      </Badge>
                      {isLecturer && assignment.submission_count > 0 && (
                        <Badge color="blue">
                          {assignment.submission_count} submission
                          {assignment.submission_count !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </Group>

                    {!isLecturer && daysUntilDue >= 0 && (
                      <div>
                        <Group justify="space-between" mb={4}>
                          <Text size="xs" c="dimmed">
                            Time remaining
                          </Text>
                          <Text size="xs" fw={600}>
                            {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""}
                          </Text>
                        </Group>
                        <Progress
                          value={Math.max(0, 100 - (daysUntilDue / 7) * 100)}
                          size="sm"
                          color={
                            daysUntilDue < 3
                              ? "red"
                              : daysUntilDue < 7
                              ? "yellow"
                              : "blue"
                          }
                        />
                      </div>
                    )}
                  </Stack>
                </Card>
              </motion.div>
            );
          })}
        </Stack>
      )}

      {/* Create Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Assignment"
        size="lg"
      >
        <form onSubmit={createForm.onSubmit(handleCreate)}>
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Enter assignment title"
              required
              {...createForm.getInputProps("title")}
            />

            <Textarea
              label="Description"
              placeholder="Brief description of the assignment"
              minRows={2}
              required
              {...createForm.getInputProps("description")}
            />

            <Textarea
              label="Instructions"
              placeholder="Detailed instructions for students"
              minRows={4}
              required
              {...createForm.getInputProps("instructions")}
            />

            <Group grow>
              <DateTimePicker
                label="Due Date"
                placeholder="Select due date and time"
                required
                {...createForm.getInputProps("due_date")}
              />

              <NumberInput
                label="Max Score"
                placeholder="100"
                min={1}
                required
                {...createForm.getInputProps("max_score")}
              />
            </Group>

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Assignment</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Generate Modal */}
      <Modal
        opened={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Assignment with AI"
        size="lg"
      >
        <form onSubmit={generateForm.onSubmit(handleGenerate)}>
          <Stack gap="md">
            <Group align="flex-start">
              <div style={{ fontSize: 40 }}>🤖</div>
              <Text size="sm" c="dimmed">
                AI will generate questions, rubric, and instructions based on
                your specifications
              </Text>
            </Group>

            <TextInput
              label="Topic"
              placeholder="e.g., Data Structures and Algorithms"
              required
              {...generateForm.getInputProps("topic")}
            />

            <Group grow>
              <Select
                label="Difficulty"
                data={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
                {...generateForm.getInputProps("difficulty")}
              />

              <NumberInput
                label="Number of Questions"
                placeholder="5"
                min={1}
                max={20}
                {...generateForm.getInputProps("question_count")}
              />
            </Group>

            <Textarea
              label="Additional Instructions (Optional)"
              placeholder="Any specific requirements or focus areas..."
              minRows={3}
              {...generateForm.getInputProps("instructions")}
            />

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
                Generate Assignment
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Submit Modal */}
      <Modal
        opened={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={`Submit: ${selectedAssignment?.title}`}
        size="md"
      >
        {/* <form onSubmit={submitForm.onSubmit((values) => 
      selectedAssignment && handleSubmit(selectedAssignment.id, values)
    )}> */}
        <form>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {selectedAssignment?.description}
            </Text>

            <FileInput
              label="Upload Your Work"
              placeholder="Choose PDF file"
              accept="application/pdf"
              required
              leftSection={<FaUpload />}
              {...submitForm.getInputProps("file")}
            />

            <Text size="xs" c="dimmed">
              Note: Your submission will be automatically graded by AI and
              reviewed by your instructor
            </Text>

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setSubmitModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Assignment</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
