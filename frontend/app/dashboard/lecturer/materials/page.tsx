"use client";

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
  List,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBook,
  FaPlus,
  FaArrowRight,
  FaLightbulb,
  FaInfoCircle,
  FaRobot,
  FaCloudUploadAlt,
} from "react-icons/fa";
import { PiBookFill, PiNotebookFill } from "react-icons/pi";
import { MdTipsAndUpdates } from "react-icons/md";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouter } from "next/navigation";
import { CreateCourseModal } from "@/components/CreateCourseModal";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  created_at: string;
  is_published: boolean;
  materials_count?: number;
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    if (!user?.id) return;

    try {
      const response = await apiClient.courses.getLecturerCourses(
        user.id,
        true
      );
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
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
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} size={25}>
                <Group gap="xs" align="center">
                  <PiNotebookFill size={30} color="#1DA1F2" />
                  <span>Course Materials</span>
                </Group>
              </Title>
              <Text c="dimmed" size="md" mt="xs">
                Create, manage, and organize learning materials for your courses
              </Text>
            </div>
            <Button
              leftSection={<FaPlus />}
              size="md"
              color="twitterBlue"
              onClick={() => setCreateModalOpen(true)}
            >
              Create New Course
            </Button>
          </Group>
        </motion.div>

        {/* Information Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper
            p="lg"
            withBorder
            style={{
              background:
                "linear-gradient(135deg, rgba(29, 161, 242, 0.05) 0%, rgba(121, 75, 196, 0.05) 100%)",
            }}
          >
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
                <FaInfoCircle />
              </div>
              <Stack gap="sm" style={{ flex: 1 }}>
                <Text fw={700} size="lg">
                  How to Use Materials Management
                </Text>
                <List spacing="sm">
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 1:</strong> Select a course from the list
                      below to manage its materials
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 2:</strong> Choose between AI-generated
                      content or manual uploads
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 3:</strong> Preview AI-generated materials
                      before saving
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Step 4:</strong> Organize and manage all materials
                      in one place
                    </Text>
                  </List.Item>
                </List>
              </Stack>
            </Group>
          </Paper>
        </motion.div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard hoverEffect={false} padding="xl">
              <Stack align="center" gap="sm">
                <div style={{ fontSize: 80 }}>
                  <PiBookFill size={60} color="#1DA1F2" />
                </div>
                <Title order={4} ta="center">
                  No Courses Created Yet
                </Title>
                <Text c="dimmed" ta="center" maw={600}>
                  Get started by creating your first course. Once created,
                  you'll be able to add materials, generate AI content, and
                  upload your existing resources.
                </Text>
                <Button size="md" leftSection={<FaPlus />} color="twitterBlue">
                  Create Your First Course
                </Button>
              </Stack>
            </GlassCard>
          </motion.div>
        ) : (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={2} size={24}>
                  Your Courses
                </Title>
                <Text size="sm" c="dimmed">
                  Click on any course to manage its materials
                </Text>
              </div>
              <Badge size="lg" variant="light">
                {courses.length} Course{courses.length !== 1 ? "s" : ""}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    padding="lg"
                    radius="lg"
                    withBorder
                    style={{
                      cursor: "pointer",
                      height: "100%",
                      transition: "all 0.3s ease",
                      borderLeft: "4px solid #1DA1F2",
                    }}
                    onClick={() =>
                      router.push(`/dashboard/lecturer/materials/${course.id}`)
                    }
                  >
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            background: "#1DA1F2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 18,
                            fontWeight: 700,
                          }}
                        >
                          {course.code.substring(0, 3).toUpperCase()}
                        </div>
                        <Badge
                          color={course.is_published ? "green" : "gray"}
                          variant="light"
                        >
                          {course.is_published ? "Published" : "Draft"}
                        </Badge>
                      </Group>

                      <div>
                        <Text fw={700} size="lg" lineClamp={2}>
                          {course.title}
                        </Text>
                        <Text size="sm" c="dimmed" mt={4}>
                          {course.code}
                        </Text>
                        {course.description && (
                          <Text size="sm" c="dimmed" mt="xs" lineClamp={2}>
                            {course.description}
                          </Text>
                        )}
                      </div>

                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          {course.materials_count || 0} Materials
                        </Text>
                        <Text size="xs" c="dimmed">
                          Created{" "}
                          {new Date(course.created_at).toLocaleDateString()}
                        </Text>
                      </Group>

                      <Button
                        variant="light"
                        fullWidth
                        rightSection={<FaArrowRight />}
                      >
                        Manage Materials
                      </Button>
                    </Stack>
                  </Card>
                </motion.div>
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {/* Features Overview */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <GlassCard hoverEffect={false} padding="lg">
            <Stack gap="sm">
              <Group gap="xs">
                <div style={{ fontSize: 32 }}>
                  <FaRobot color="#1DA1F2" />
                </div>
                <Text fw={700} size="lg">
                  AI-Generated Materials
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Let our advanced AI create comprehensive course materials
                tailored to your topic and audience level
              </Text>
              <List size="sm" spacing="xs">
                <List.Item>Generate lecture notes and presentations</List.Item>
                <List.Item>Create structured learning content</List.Item>
                <List.Item>Include key concepts and summaries</List.Item>
                <List.Item>Export as PowerPoint presentations</List.Item>
              </List>
            </Stack>
          </GlassCard>

          <GlassCard hoverEffect={false} padding="lg">
            <Stack gap="sm">
              <Group gap="xs">
                <div style={{ fontSize: 32 }}>
                  <FaCloudUploadAlt color="#1DA1F2" />
                </div>
                <Text fw={700} size="lg">
                  Manual Uploads
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Upload your existing materials including PDFs, presentations,
                videos, and images
              </Text>
              <List size="sm" spacing="xs">
                <List.Item>Support for PDF, PowerPoint, Videos</List.Item>
                <List.Item>Automatic text extraction from PDFs</List.Item>
                <List.Item>Image uploads with metadata</List.Item>
                <List.Item>Secure cloud storage with Supabase</List.Item>
              </List>
            </Stack>
          </GlassCard>
        </SimpleGrid>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Paper p="lg" withBorder>
            <Group gap="md" align="flex-start">
              <div style={{ fontSize: 32 }}>
                <MdTipsAndUpdates size={32} color="#1DA1F2" />
              </div>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text fw={700} size="lg">
                  Pro Tips for Material Management
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <strong>Use AI Generation:</strong> Start with AI-generated
                    content and customize it to match your teaching style
                  </List.Item>
                  <List.Item>
                    <strong>Organize by Topics:</strong> Create materials for
                    each major topic or module in your course
                  </List.Item>
                  <List.Item>
                    <strong>Mix Content Types:</strong> Combine text,
                    presentations, and videos for better engagement
                  </List.Item>
                  <List.Item>
                    <strong>Review & Edit:</strong> Always preview AI-generated
                    content before saving to ensure accuracy
                  </List.Item>
                  <List.Item>
                    <strong>Update Regularly:</strong> Keep materials fresh by
                    adding new examples and updating outdated information
                  </List.Item>
                </List>
              </Stack>
            </Group>
          </Paper>
        </motion.div>
      </Stack>
      {/* Create Course Modal */}
      <CreateCourseModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchCourses();
        }}
      />
    </div>
  );
}
