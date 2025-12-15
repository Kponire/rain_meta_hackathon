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
  FileInput,
  NumberInput,
  Select,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaRobot,
  FaUpload,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFilePdf,
  FaLink,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface Material {
  id: string;
  title: string;
  content: string;
  type: "document" | "presentation" | "link";
  file_url?: string;
  created_at: string;
  updated_at: string;
}

interface CourseMaterialsProps {
  courseId: string;
  isLecturer: boolean;
}

export function CourseMaterials({
  courseId,
  isLecturer,
}: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [generatingAI, setGeneratingAI] = useState(false);

  const uploadForm = useForm({
    initialValues: {
      title: "",
      content: "",
      file: null as File | null,
      type: "document",
    },
    validate: {
      title: (value) => (!value ? "Title is required" : null),
    },
  });

  const generateForm = useForm({
    initialValues: {
      topic: "",
      n_slides: 10,
      language: "English",
      include_images: true,
      difficulty_level: "intermediate",
    },
    validate: {
      topic: (value) => (!value ? "Topic is required" : null),
      n_slides: (value) =>
        value < 1 || value > 50 ? "Slides must be between 1 and 50" : null,
    },
  });

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      //const response = await apiClient.courses.getMaterials(courseId);
      //setMaterials(response.data);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values: typeof uploadForm.values) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      if (values.file) {
        formData.append("file", values.file);
      }
      formData.append("type", values.type);

      await apiClient.courses.uploadMaterials(courseId, formData);

      notifications.show({
        title: "Success",
        message: "Material uploaded successfully",
        color: "green",
      });

      setCreateModalOpen(false);
      uploadForm.reset();
      fetchMaterials();
    } catch (error) {
      console.error("Error uploading material:", error);
    }
  };

  const handleGenerate = async (values: typeof generateForm.values) => {
    setGeneratingAI(true);
    try {
      const response = await apiClient.courses.generateMaterials(courseId, {
        topic: values.topic,
        n_slides: values.n_slides,
        language: values.language,
        include_images: values.include_images,
        difficulty_level: values.difficulty_level,
      });

      notifications.show({
        title: "Success",
        message: "Materials generated successfully",
        color: "green",
      });

      setGenerateModalOpen(false);
      generateForm.reset();
      fetchMaterials();
    } catch (error) {
      console.error("Error generating materials:", error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      // Assuming delete endpoint exists
      //await apiClient.courses.deleteMaterial(courseId, materialId);

      notifications.show({
        title: "Success",
        message: "Material deleted successfully",
        color: "green",
      });

      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const handleView = (material: Material) => {
    setSelectedMaterial(material);
    setViewModalOpen(true);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "presentation":
        return <FaFileAlt />;
      case "document":
        return <FaFilePdf />;
      case "link":
        return <FaLink />;
      default:
        return <FaFileAlt />;
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
            Course Materials
          </Text>
          <Text size="sm" c="dimmed">
            {materials.length} material{materials.length !== 1 ? "s" : ""}{" "}
            available
          </Text>
        </div>
        {isLecturer && (
          <Group>
            <Button
              leftSection={<FaUpload />}
              variant="light"
              onClick={() => setCreateModalOpen(true)}
            >
              Upload Material
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

      {/* Materials List */}
      {materials.length === 0 ? (
        <GlassCard padding="xl">
          <Stack align="center" gap="md">
            <div style={{ fontSize: 60 }}>📚</div>
            <Text size="lg" fw={600}>
              No materials yet
            </Text>
            <Text c="dimmed" ta="center">
              {isLecturer
                ? "Upload materials or generate them with AI to get started"
                : "Check back later for course materials"}
            </Text>
          </Stack>
        </GlassCard>
      ) : (
        <Stack gap="md">
          {materials.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="lg" radius="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start" style={{ flex: 1 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: "rgba(29, 161, 242, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1DA1F2",
                        fontSize: 20,
                      }}
                    >
                      {getMaterialIcon(material.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb={4}>
                        <Text fw={600} size="lg">
                          {material.title}
                        </Text>
                        <Badge size="sm" variant="light">
                          {material.type}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {material.content.substring(0, 150)}...
                      </Text>
                      <Text size="xs" c="dimmed" mt={8}>
                        Added{" "}
                        {new Date(material.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </Group>

                  <Group>
                    <Button
                      size="sm"
                      variant="light"
                      leftSection={<FaEye />}
                      onClick={() => handleView(material)}
                    >
                      View
                    </Button>

                    {material.file_url && (
                      <ActionIcon
                        variant="subtle"
                        size="lg"
                        component="a"
                        href={material.file_url}
                        download
                      >
                        <FaDownload />
                      </ActionIcon>
                    )}

                    {isLecturer && (
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="lg">
                            <FaEllipsisV />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<FaEdit />}>Edit</Menu.Item>
                          <Menu.Item
                            leftSection={<FaTrash />}
                            color="red"
                            onClick={() => handleDelete(material.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                </Group>
              </Card>
            </motion.div>
          ))}
        </Stack>
      )}

      {/* Upload Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Upload Course Material"
        size="lg"
      >
        <form onSubmit={uploadForm.onSubmit(handleUpload)}>
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Enter material title"
              required
              {...uploadForm.getInputProps("title")}
            />

            <Select
              label="Type"
              data={[
                { value: "document", label: "Document" },
                { value: "presentation", label: "Presentation" },
                { value: "link", label: "External Link" },
              ]}
              {...uploadForm.getInputProps("type")}
            />

            <Textarea
              label="Content/Description"
              placeholder="Enter material content or description"
              minRows={4}
              {...uploadForm.getInputProps("content")}
            />

            <FileInput
              label="Upload File (Optional)"
              placeholder="Choose file"
              accept="application/pdf,.doc,.docx,.ppt,.pptx"
              leftSection={<FaUpload />}
              onChange={(file) => uploadForm.setFieldValue("file", file)}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Upload Material</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Generate Modal */}
      <Modal
        opened={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Materials with AI"
        size="lg"
      >
        <form onSubmit={generateForm.onSubmit(handleGenerate)}>
          <Stack gap="md">
            <Group align="flex-start">
              <div style={{ fontSize: 40 }}>🤖</div>
              <Text size="sm" c="dimmed">
                Our AI will generate comprehensive course materials including
                presentations with slides
              </Text>
            </Group>

            <TextInput
              label="Topic"
              placeholder="e.g., Introduction to Machine Learning"
              required
              {...generateForm.getInputProps("topic")}
            />

            <Group grow>
              <NumberInput
                label="Number of Slides"
                placeholder="10"
                min={1}
                max={50}
                {...generateForm.getInputProps("n_slides")}
              />

              <Select
                label="Language"
                data={[
                  { value: "English", label: "English" },
                  { value: "Spanish", label: "Spanish" },
                  { value: "French", label: "French" },
                  { value: "German", label: "German" },
                ]}
                {...generateForm.getInputProps("language")}
              />
            </Group>

            <Select
              label="Difficulty Level"
              data={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
              {...generateForm.getInputProps("difficulty_level")}
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
                Generate Materials
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedMaterial?.title}
        size="xl"
      >
        {selectedMaterial && (
          <Stack gap="md">
            <Group>
              <Badge>{selectedMaterial.type}</Badge>
              <Text size="sm" c="dimmed">
                {new Date(selectedMaterial.created_at).toLocaleDateString()}
              </Text>
            </Group>

            <div
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                padding: "1rem",
                background: "var(--bg-light)",
                borderRadius: 8,
              }}
            >
              <Text style={{ whiteSpace: "pre-wrap" }}>
                {selectedMaterial.content}
              </Text>
            </div>

            {selectedMaterial.file_url && (
              <Button
                fullWidth
                leftSection={<FaDownload />}
                component="a"
                href={selectedMaterial.file_url}
                download
              >
                Download File
              </Button>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
