"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Card,
  Badge,
  Button,
  Paper,
  Tabs,
  Modal,
  Textarea,
  FileInput,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaClock,
  FaUpload,
  FaFileAlt,
  FaSpinner,
  FaExclamationCircle,
} from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/components/AuthContext";
import { notifications } from "@mantine/notifications";

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_title: string;
  due_date: string;
  max_score: number;
  status: string;
  submission_status: "pending" | "submitted" | "graded";
  score?: number;
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  
  // Submission State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [user?.id]);

  const fetchAssignments = async () => {
    if (!user?.id) return;
    try {
      const response = await apiClient.assignments.getStudentAssignments();
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionContent) formData.append("content", submissionContent);
      if (submissionFile) formData.append("file", submissionFile);
      
      await apiClient.assignments.submit(selectedAssignment.id, formData);
      
      notifications.show({
        title: "Success",
        message: "Assignment submitted successfully",
        color: "green",
      });
      
      setSubmissionModalOpen(false);
      setSubmissionContent("");
      setSubmissionFile(null);
      fetchAssignments();
    } catch (error) {
        console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to submit assignment",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredAssignments = () => {
    if (activeTab === "all") return assignments;
    if (activeTab === "pending") return assignments.filter(a => a.submission_status === "pending");
    if (activeTab === "submitted") return assignments.filter(a => a.submission_status === "submitted");
    if (activeTab === "graded") return assignments.filter(a => a.submission_status === "graded");
    return assignments;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded": return "green";
      case "submitted": return "blue";
      case "pending": return "yellow";
      default: return "gray";
    }
  };
  
  const getDaysRemaining = (dueDate: string) => {
      const remaining = new Date(dueDate).getTime() - new Date().getTime();
      const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
      return days;
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <LoadingSkeleton type="list" count={3} />
      </Container>
    );
  }

  return (
    <div style={{ padding: "10px 40px" }}>
      <Stack gap="xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Title order={1}>My Assignments</Title>
          <Text c="dimmed">View and submit assignments for your enrolled courses</Text>
        </motion.div>

        {/* Filters */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">All Assignments</Tabs.Tab>
            <Tabs.Tab value="pending">Pending</Tabs.Tab>
            <Tabs.Tab value="submitted">Submitted</Tabs.Tab>
            <Tabs.Tab value="graded">Graded</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Assignments List */}
        {getFilteredAssignments().length === 0 ? (
           <GlassCard padding="xl">
              <Stack align="center" gap="md" style={{ opacity: 0.7 }}>
                  <FaFileAlt size={40} />
                  <Text size="lg">No assignments found</Text>
              </Stack>
           </GlassCard>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {getFilteredAssignments().map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  padding="lg" 
                  radius="lg" 
                  withBorder
                  style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${assignment.submission_status === 'graded' ? '#40C057' : assignment.submission_status === 'submitted' ? '#228BE6' : '#FAB005'}`
                  }}
                >
                  <Stack gap="md">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Badge size="sm" variant="light">{assignment.course_title}</Badge>
                        <Badge color={getStatusColor(assignment.submission_status)}>
                          {assignment.submission_status.toUpperCase()}
                        </Badge>
                      </Group>
                      <Title order={3} size="h4" lineClamp={2} mb={5}>{assignment.title}</Title>
                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {assignment.description}
                      </Text>
                    </div>

                    <Group gap="xs">
                        <FaClock size={14} style={{ opacity: 0.5 }} />
                        <Text size="sm" c={getDaysRemaining(assignment.due_date) < 3 && assignment.submission_status === 'pending' ? "red" : "dimmed"}>
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                            {assignment.submission_status === 'pending' && ` (${getDaysRemaining(assignment.due_date)} days left)`}
                        </Text>
                    </Group>
                  </Stack>
                  
                  <Group mt="xl" justify="space-between" align="end">
                       <div>
                           {assignment.score !== null && (
                               <div>
                                   <Text size="xs" c="dimmed">Score</Text>
                                   <Text fw={700} size="xl" c={assignment.score! >= 50 ? "green" : "red"}>{assignment.score}/{assignment.max_score}</Text>
                               </div>
                           )}
                           {assignment.score === null && (
                               <div>
                                   <Text size="xs" c="dimmed">Max Score</Text>
                                   <Text fw={500}>{assignment.max_score} pts</Text>
                               </div>
                           )}
                       </div>
                       
                       {assignment.submission_status === 'pending' && (
                           <Button 
                               variant="gradient" 
                               gradient={{ from: 'twitterBlue', to: 'purple', deg: 135 }}
                               onClick={() => {
                                   setSelectedAssignment(assignment);
                                   setSubmissionModalOpen(true);
                               }}
                           >
                               Submit
                           </Button>
                       )}
                        {assignment.submission_status !== 'pending' && (
                            <Button variant="light" disabled>
                                Completed
                            </Button>
                        )}
                  </Group>
                </Card>
              </motion.div>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Submission Modal */}
      <Modal
        opened={submissionModalOpen}
        onClose={() => setSubmissionModalOpen(false)}
        title={<Title order={3}>Submit Assignment</Title>}
        size="lg"
        centered
      >
          {selectedAssignment && (
              <Stack gap="md">
                  <Paper p="md" withBorder bg="gray.0">
                      <Text fw={600} mb="xs">{selectedAssignment.title}</Text>
                      <Text size="sm">{selectedAssignment.description}</Text>
                  </Paper>
                  
                  <Textarea
                    label="Text Submission"
                    placeholder="Type your answer or comments here..."
                    minRows={6}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.currentTarget.value)}
                  />
                  
                  <FileInput
                    label="Attach File"
                    placeholder="Click to upload file"
                    leftSection={<FaUpload />}
                    value={submissionFile}
                    onChange={setSubmissionFile}
                    clearable
                  />
                  
                  <Group justify="flex-end" mt="md">
                      <Button variant="subtle" onClick={() => setSubmissionModalOpen(false)}>Cancel</Button>
                      <Button 
                        loading={submitting} 
                        onClick={handleSubmit}
                        disabled={!submissionContent && !submissionFile}
                        variant="gradient" 
                        gradient={{ from: 'twitterBlue', to: 'purple', deg: 135 }}
                      >
                          Submit Assignment
                      </Button>
                  </Group>
              </Stack>
          )}
      </Modal>
    </div>
  );
}
