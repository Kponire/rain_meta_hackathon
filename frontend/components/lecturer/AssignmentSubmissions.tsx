"use client";

import { useState, useEffect } from "react";
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Select,
  Paper,
  Avatar,
  Button,
  Modal,
  Textarea,
  NumberInput,
  Divider,
  Progress,
  Tabs,
  SimpleGrid,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  FaInbox,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaRobot,
  FaUser,
  FaCalendar,
  FaFileAlt,
  FaStar,
  FaChartBar,
  FaGraduationCap,
} from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Submission {
  id: string;
  assignment_id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
  };
  file_url?: string;
  submitted_at: string;
  is_graded: boolean;
  score?: number;
  feedback?: string;
  content?: string;
}

interface AssignmentSubmissionsProps {
  assignments: any[];
  courseId: string;
}

export function AssignmentSubmissions({
  assignments,
  courseId,
}: AssignmentSubmissionsProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  const publishedAssignments = assignments.filter(
    (a) => a.status === "published"
  );

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  const fetchSubmissions = async (assignmentId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.assignments.getSubmissions(assignmentId);
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore(submission.score || 0);
    setFeedback(submission.feedback || "");
    setGradeModalOpen(true);
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;

    setGrading(true);
    try {
      await apiClient.assignments.grade(selectedSubmission.id, {
        score,
        feedback,
      });

      notifications.show({
        title: "Graded Successfully!",
        message: "Student has been notified of their grade",
        color: "green",
      });

      setGradeModalOpen(false);
      fetchSubmissions(selectedAssignment);
    } catch (error) {
      notifications.show({
        title: "Grading Failed",
        message: "Failed to submit grade",
        color: "red",
      });
    } finally {
      setGrading(false);
    }
  };

  const handleAIGrade = async () => {
    if (!selectedSubmission) return;

    setGrading(true);
    try {
      // Call AI grading endpoint
      const response = await apiClient.ai.intelligentGrade({
        submission_id: selectedSubmission.id,
        use_rubric: true,
      });

      setScore(response.data.score);
      setFeedback(response.data.feedback);

      notifications.show({
        title: "AI Grading Complete!",
        message: "Review the suggested grade and feedback",
        color: "blue",
      });
    } catch (error) {
      notifications.show({
        title: "AI Grading Failed",
        message: "Failed to generate AI grade",
        color: "red",
      });
    } finally {
      setGrading(false);
    }
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.is_graded).length;
    const pending = total - graded;
    const avgScore =
      graded > 0
        ? submissions
            .filter((s) => s.is_graded)
            .reduce((sum, s) => sum + (s.score || 0), 0) / graded
        : 0;

    return { total, graded, pending, avgScore };
  };

  if (publishedAssignments.length === 0) {
    return (
      <GlassCard padding="xl">
        <Stack align="center" gap="lg">
          <div style={{ fontSize: 80 }}>📮</div>
          <Text size="xl" fw={700} ta="center">
            No Published Assignments
          </Text>
          <Text c="dimmed" ta="center" maw={500}>
            Publish an assignment first to start receiving student submissions.
            Go to the "AI Generate" tab to create and publish assignments.
          </Text>
        </Stack>
      </GlassCard>
    );
  }

  const stats = selectedAssignment ? getSubmissionStats() : null;

  return (
    <Stack gap="xl">
      {/* Header with Assignment Selector */}
      <GlassCard padding="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700}>
                Student Submissions
              </Text>
              <Text size="sm" c="dimmed">
                Select an assignment to view and grade submissions
              </Text>
            </div>
          </Group>

          <Select
            placeholder="Select an assignment to view submissions"
            data={publishedAssignments.map((a) => ({
              value: a.id,
              label: `${a.title} (${a.submission_count || 0} submissions)`,
            }))}
            value={selectedAssignment}
            onChange={(value) => setSelectedAssignment(value || "")}
            size="md"
            leftSection={<FaInbox />}
          />
        </Stack>
      </GlassCard>

      {/* Statistics */}
      {selectedAssignment && stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {[
              {
                icon: <FaInbox />,
                label: "Total Submissions",
                value: stats.total,
                color: "#1DA1F2",
              },
              {
                icon: <FaCheckCircle />,
                label: "Graded",
                value: stats.graded,
                color: "#17BF63",
              },
              {
                icon: <FaClock />,
                label: "Pending",
                value: stats.pending,
                color: "#FFAD1F",
              },
              {
                icon: <FaStar />,
                label: "Average Score",
                value: `${stats.avgScore.toFixed(1)}%`,
                color: "#794BC4",
              },
            ].map((stat, index) => (
              <GlassCard key={index} padding="md">
                <Group>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${stat.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: stat.color,
                      fontSize: 18,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      {stat.label}
                    </Text>
                    <Text size="lg" fw={700}>
                      {stat.value}
                    </Text>
                  </div>
                </Group>
              </GlassCard>
            ))}
          </SimpleGrid>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton type="list" count={3} />}

      {/* Submissions List */}
      {!loading && selectedAssignment && submissions.length === 0 && (
        <GlassCard padding="xl">
          <Stack align="center" gap="lg">
            <div style={{ fontSize: 80 }}>📭</div>
            <Text size="xl" fw={700} ta="center">
              No Submissions Yet
            </Text>
            <Text c="dimmed" ta="center" maw={500}>
              Students haven't submitted their work yet. Check back later or
              send a reminder to students about the upcoming deadline.
            </Text>
          </Stack>
        </GlassCard>
      )}

      {!loading && selectedAssignment && submissions.length > 0 && (
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>
              {submissions.length} Submission
              {submissions.length !== 1 ? "s" : ""}
            </Text>
            {stats && stats.pending > 0 && (
              <AnimatedButton
                size="sm"
                variant="light"
                leftSection={<FaRobot />}
              >
                Auto-Grade All Pending ({stats.pending})
              </AnimatedButton>
            )}
          </Group>

          <Stack gap="md">
            {submissions.map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card padding="lg" withBorder>
                  <Group align="flex-start" wrap="nowrap">
                    {/* Student Avatar */}
                    <Avatar
                      src={submission.student.profile_picture}
                      radius="xl"
                      size="lg"
                      color="twitterBlue"
                    >
                      <FaUser />
                    </Avatar>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between" mb="xs">
                        <div>
                          <Text fw={700} size="lg">
                            {submission.student.first_name}{" "}
                            {submission.student.last_name}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {submission.student.email}
                          </Text>
                        </div>
                        <Badge
                          size="lg"
                          color={submission.is_graded ? "green" : "orange"}
                          leftSection={
                            submission.is_graded ? (
                              <FaCheckCircle />
                            ) : (
                              <FaClock />
                            )
                          }
                        >
                          {submission.is_graded ? "Graded" : "Pending"}
                        </Badge>
                      </Group>

                      <Group gap="md" mb="sm">
                        <Group gap="xs">
                          <FaCalendar size={12} color="#657786" />
                          <Text size="xs" c="dimmed">
                            Submitted{" "}
                            {new Date(submission.submitted_at).toLocaleString()}
                          </Text>
                        </Group>

                        {submission.is_graded &&
                          submission.score !== undefined && (
                            <Badge size="sm" color="green">
                              Score: {submission.score}%
                            </Badge>
                          )}
                      </Group>

                      {submission.is_graded && submission.feedback && (
                        <Paper p="sm" withBorder bg="gray.0" mb="sm">
                          <Text size="xs" fw={600} mb="xs">
                            Feedback:
                          </Text>
                          <Text size="xs" lineClamp={2}>
                            {submission.feedback}
                          </Text>
                        </Paper>
                      )}

                      <Group>
                        {submission.file_url && (
                          <Button
                            size="sm"
                            variant="light"
                            leftSection={<FaDownload />}
                            component="a"
                            href={submission.file_url}
                            download
                          >
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="light"
                          leftSection={
                            submission.is_graded ? (
                              <FaGraduationCap />
                            ) : (
                              <FaStar />
                            )
                          }
                          onClick={() => handleGradeClick(submission)}
                        >
                          {submission.is_graded ? "Edit Grade" : "Grade Now"}
                        </Button>
                      </Group>
                    </div>
                  </Group>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Grading Modal */}
      <Modal
        opened={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        title={
          <Group gap="xs">
            <FaStar color="#FFAD1F" />
            <Text fw={700}>Grade Submission</Text>
          </Group>
        }
        size="lg"
        centered
      >
        {selectedSubmission && (
          <Stack gap="md">
            {/* Student Info */}
            <Paper p="md" withBorder>
              <Group>
                <Avatar
                  src={selectedSubmission.student.profile_picture}
                  radius="xl"
                  size="md"
                >
                  <FaUser />
                </Avatar>
                <div>
                  <Text fw={600}>
                    {selectedSubmission.student.first_name}{" "}
                    {selectedSubmission.student.last_name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Submitted{" "}
                    {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </Text>
                </div>
              </Group>
            </Paper>

            {/* AI Grade Button */}
            <Paper
              p="md"
              withBorder
              style={{ background: "rgba(121, 75, 196, 0.05)" }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={600} size="sm" mb={4}>
                    🤖 AI-Assisted Grading
                  </Text>
                  <Text size="xs" c="dimmed">
                    Let AI analyze the submission and suggest a grade with
                    feedback
                  </Text>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<FaRobot />}
                  loading={grading}
                  onClick={handleAIGrade}
                >
                  Generate Grade
                </Button>
              </Group>
            </Paper>

            <Divider label="Grade Details" />

            {/* Score Input */}
            <NumberInput
              label="Score (%)"
              description="Enter the score as a percentage (0-100)"
              placeholder="85"
              min={0}
              max={100}
              value={score}
              onChange={(value) => setScore(Number(value))}
              size="md"
              leftSection={<FaStar />}
            />

            {/* Feedback */}
            <Textarea
              label="Feedback for Student"
              description="Provide constructive feedback to help the student improve"
              placeholder="Great work! Your analysis was thorough. Consider..."
              minRows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.currentTarget.value)}
            />

            {/* Submission Preview */}
            {selectedSubmission.file_url && (
              <Paper p="md" withBorder>
                <Group justify="space-between">
                  <Group gap="xs">
                    <FaFileAlt color="#1DA1F2" />
                    <Text size="sm" fw={600}>
                      Student's Submission
                    </Text>
                  </Group>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<FaDownload />}
                    component="a"
                    href={selectedSubmission.file_url}
                    download
                  >
                    Download
                  </Button>
                </Group>
              </Paper>
            )}
            {/* Action Buttons */}
            <Group justify="flex-end" mt="md">
              <Button
                variant="default"
                onClick={() => setGradeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                leftSection={<FaCheckCircle />}
                loading={grading}
                onClick={handleGradeSubmit}
                variant="gradient"
                gradient={{ from: "green", to: "teal", deg: 135 }}
              >
                Submit Grade
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
