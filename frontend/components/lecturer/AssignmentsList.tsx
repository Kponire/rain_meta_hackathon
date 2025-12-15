"use client";

import { useState } from "react";
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Modal,
  Button,
  Paper,
  List,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  FaClipboardList,
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaTrash,
  FaRobot,
  FaClock,
  FaCheckCircle,
  FaEyeSlash,
  FaUsers,
} from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  status: string;
  due_date?: string;
  max_score: number;
  is_ai_generated: boolean;
  created_at: string;
  questions?: any[];
  metadata?: any;
  submission_count?: number;
}

interface AssignmentsListProps {
  assignments: Assignment[];
  courseId: string;
  onRefresh: () => void;
}

export function AssignmentsList({
  assignments,
  courseId,
  onRefresh,
}: AssignmentsListProps) {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [unpublishing, setUnpublishing] = useState(false);

  const handleView = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setViewModalOpen(true);
  };

  const handleUnpublish = async (assignmentId: string) => {
    if (
      !confirm(
        "Are you sure you want to unpublish this assignment? Students will no longer be able to submit."
      )
    )
      return;

    setUnpublishing(true);
    try {
      // await apiClient.assignments.unpublish(assignmentId);
      notifications.show({
        title: "Assignment Unpublished",
        message: "Students can no longer view or submit this assignment",
        color: "green",
      });
      onRefresh();
    } catch (error) {
      notifications.show({
        title: "Unpublish Failed",
        message: "Failed to unpublish assignment",
        color: "red",
      });
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone."
      )
    )
      return;

    try {
      await apiClient.assignments.delete(assignmentId);
      notifications.show({
        title: "Assignment Deleted",
        message: "The assignment has been permanently removed",
        color: "green",
      });
      onRefresh();
    } catch (error) {
      notifications.show({
        title: "Delete Failed",
        message: "Failed to delete assignment",
        color: "red",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "green";
      case "draft":
        return "gray";
      case "closed":
        return "red";
      default:
        return "blue";
    }
  };

  if (assignments.length === 0) {
    return (
      <GlassCard hoverEffect={false} padding="xl">
        <Stack align="center" gap="lg">
          <div style={{ fontSize: 80 }}>📋</div>
          <Text size="xl" fw={700} ta="center">
            No Assignments Created Yet
          </Text>
          <Text c="dimmed" ta="center" maw={500}>
            Use the "AI Generate" tab to create your first assignment. AI will
            help you create comprehensive questions in seconds.
          </Text>
        </Stack>
      </GlassCard>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Course Assignments
          </Text>
          <Text size="sm" c="dimmed">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}{" "}
            created
          </Text>
        </div>
        <Group>
          <Badge size="lg" color="green">
            {assignments.filter((a) => a.status === "published").length}{" "}
            Published
          </Badge>
          <Badge size="lg" variant="light">
            {assignments.filter((a) => a.is_ai_generated).length} AI Generated
          </Badge>
        </Group>
      </Group>

      {/* Filter/Sort Options */}
      <Paper
        p="md"
        withBorder
        style={{ background: "rgba(29, 161, 242, 0.05)" }}
      >
        <Group gap="xs">
          <FaClipboardList color="#1DA1F2" />
          <Text size="sm">
            <strong>Quick Tip:</strong> Click on any assignment to view details
            and submissions. Published assignments are visible to students.
          </Text>
        </Group>
      </Paper>

      {/* Assignments Grid */}
      <Stack gap="md">
        {assignments.map((assignment, index) => {
          const dueDate = assignment.due_date
            ? new Date(assignment.due_date)
            : null;
          const isPastDue = dueDate && dueDate < new Date();
          const isPublished = assignment.status === "published";

          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                padding="lg"
                radius="lg"
                withBorder
                style={{
                  borderLeft: `4px solid ${
                    isPublished ? "#17BF63" : "#657786"
                  }`,
                }}
              >
                <Group align="flex-start" wrap="nowrap">
                  {/* Icon */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: isPublished
                        ? "rgba(23, 191, 99, 0.1)"
                        : "rgba(101, 119, 134, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isPublished ? (
                      <FaCheckCircle color="#17BF63" size={28} />
                    ) : (
                      <FaClipboardList color="#657786" size={28} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mb="xs">
                      <Text fw={700} size="lg" lineClamp={1}>
                        {assignment.title}
                      </Text>
                      {assignment.is_ai_generated && (
                        <Badge
                          size="sm"
                          leftSection={<FaRobot />}
                          color="purple"
                        >
                          AI Generated
                        </Badge>
                      )}
                      <Badge
                        size="sm"
                        color={getStatusColor(assignment.status)}
                        variant="light"
                      >
                        {assignment.status}
                      </Badge>
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                      {assignment.description}
                    </Text>

                    <Group gap="md">
                      <Group gap="xs">
                        <FaClock size={12} color="#657786" />
                        <Text size="xs" c="dimmed">
                          Created{" "}
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </Text>
                      </Group>

                      {dueDate && (
                        <Group gap="xs">
                          <Text size="xs" c={isPastDue ? "red" : "dimmed"}>
                            Due: {dueDate.toLocaleString()}
                          </Text>
                        </Group>
                      )}

                      <Badge size="sm" variant="light">
                        {assignment.questions?.length || 0} Questions
                      </Badge>

                      <Badge size="sm" variant="light" color="blue">
                        {assignment.max_score} Points
                      </Badge>

                      {assignment.submission_count !== undefined && (
                        <Badge size="sm" variant="light" color="green">
                          <Group gap={4}>
                            <FaUsers size={10} />
                            <span>
                              {assignment.submission_count} Submissions
                            </span>
                          </Group>
                        </Badge>
                      )}
                    </Group>
                  </div>

                  {/* Actions */}
                  <Group gap="xs">
                    <Button
                      size="sm"
                      variant="light"
                      leftSection={<FaEye />}
                      onClick={() => handleView(assignment)}
                    >
                      View
                    </Button>

                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="light" size="lg">
                          <FaEllipsisV />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {isPublished && (
                          <>
                            <Menu.Item
                              leftSection={<FaUsers />}
                              onClick={() =>
                                (window.location.href = `/dashboard/lecturer/assignments/submissions/${assignment.id}`)
                              }
                            >
                              View Submissions (
                              {assignment.submission_count || 0})
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<FaEyeSlash />}
                              onClick={() => handleUnpublish(assignment.id)}
                            >
                              Unpublish
                            </Menu.Item>
                            <Menu.Divider />
                          </>
                        )}
                        <Menu.Item leftSection={<FaEdit />}>Edit</Menu.Item>
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
                  </Group>
                </Group>
              </Card>
            </motion.div>
          );
        })}
      </Stack>

      {/* View Assignment Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={
          <Group gap="xs">
            <FaClipboardList color="#794BC4" />
            <Text fw={700}>Assignment Details</Text>
          </Group>
        }
        size="xl"
        centered
      >
        {selectedAssignment && (
          <Stack gap="lg">
            {/* Header Info */}
            <Group>
              <Badge
                size="lg"
                color={getStatusColor(selectedAssignment.status)}
              >
                {selectedAssignment.status}
              </Badge>
              {selectedAssignment.is_ai_generated && (
                <Badge size="lg" color="purple" leftSection={<FaRobot />}>
                  AI Generated
                </Badge>
              )}
              <Badge size="lg" variant="light">
                {selectedAssignment.max_score} Points
              </Badge>
            </Group>

            {/* Title & Description */}
            <div>
              <Text fw={700} size="xl" mb="xs">
                {selectedAssignment.title}
              </Text>
              <Text size="sm" c="dimmed">
                {selectedAssignment.description}
              </Text>
            </div>

            {/* Instructions */}
            {selectedAssignment.instructions && (
              <Paper p="md" withBorder>
                <Text fw={600} size="sm" mb="xs">
                  📝 Instructions:
                </Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {selectedAssignment.instructions}
                </Text>
              </Paper>
            )}

            {/* Generation Metadata */}
            {selectedAssignment.metadata?.generation_metadata && (
              <Paper
                p="md"
                withBorder
                style={{ background: "rgba(121, 75, 196, 0.05)" }}
              >
                <Text fw={600} size="sm" mb="xs">
                  🤖 AI Generation Settings:
                </Text>
                <Group gap="md">
                  <Badge>
                    Difficulty:{" "}
                    {selectedAssignment.metadata.generation_metadata.difficulty}
                  </Badge>
                  <Badge>
                    Questions:{" "}
                    {
                      selectedAssignment.metadata.generation_metadata
                        .num_questions
                    }
                  </Badge>
                  <Badge>
                    Types:{" "}
                    {
                      selectedAssignment.metadata.generation_metadata
                        .question_types
                    }
                  </Badge>
                </Group>
              </Paper>
            )}

            {/* Questions Preview */}
            {selectedAssignment.questions &&
              selectedAssignment.questions.length > 0 && (
                <div>
                  <Text fw={600} size="md" mb="md">
                    Questions ({selectedAssignment.questions.length})
                  </Text>
                  <Stack gap="md">
                    {selectedAssignment.questions.map(
                      (question: any, index: number) => (
                        <Card key={index} padding="md" withBorder>
                          <Stack gap="xs">
                            <Group>
                              <Badge size="sm">Q{index + 1}</Badge>
                              {question.question_type && (
                                <Badge size="sm" variant="light">
                                  {question.question_type}
                                </Badge>
                              )}
                            </Group>
                            <Text size="sm" fw={600}>
                              {question.question || question.text}
                            </Text>
                            {question?.options && (
                              <Text size="xs" c="dimmed">
                                {question.options.length} options available
                              </Text>
                            )}
                          </Stack>
                        </Card>
                      )
                    )}
                  </Stack>
                </div>
              )}

            {/* Action Buttons */}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
              {selectedAssignment.status === "published" && (
                <Button
                  leftSection={<FaUsers />}
                  onClick={() => {
                    setViewModalOpen(false);
                    window.location.href = `/dashboard/lecturer/assignments/submissions/${selectedAssignment.id}`;
                  }}
                >
                  View Submissions
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
