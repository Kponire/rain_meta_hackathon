"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  FileInput,
  Group,
  Text,
  Paper,
  List,
  Badge,
  Progress,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  Dropzone,
  FileWithPath,
  PDF_MIME_TYPE,
  MS_POWERPOINT_MIME_TYPE,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import { motion } from "framer-motion";
import {
  FaUpload,
  FaFilePdf,
  FaFileImage,
  FaFilePowerpoint,
  FaFileVideo,
  FaCheck,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface UploadMaterialsProps {
  courseId: string;
  courseName: string;
  onMaterialAdded: () => void;
}

export function UploadMaterials({
  courseId,
  courseName,
  onMaterialAdded,
}: UploadMaterialsProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);

  const form = useForm({
    initialValues: {
      title: "",
    },
    validate: {
      title: (value) => {
        if (!value) return "Material title is required";
        if (value.length < 3) return "Title must be at least 3 characters";
        if (value.length > 100) return "Title must be less than 100 characters";
        return null;
      },
    },
  });

  const handleFileDrop = (files: FileWithPath[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);

      if (!form.values.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        form.setFieldValue("title", fileName);
      }
    }
  };

  const handleUpload = async (values: typeof form.values) => {
    if (!selectedFile) {
      notifications.show({
        title: "No File Selected",
        message: "Please select a file to upload",
        color: "orange",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("file", selectedFile);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await apiClient.courses.uploadMaterials(courseId, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      notifications.show({
        title: "Upload Successful!",
        message: "Your material has been uploaded and processed",
        color: "green",
      });

      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
      onMaterialAdded();
    } catch (error: any) {
      notifications.show({
        title: "Upload Failed",
        message: error.response?.data?.detail || "Failed to upload material",
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf"))
      return <FaFilePdf color="#E0245E" size={40} />;
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/))
      return <FaFileImage color="#17BF63" size={40} />;
    if (fileName.match(/\.(ppt|pptx)$/))
      return <FaFilePowerpoint color="#FFAD1F" size={40} />;
    if (fileName.match(/\.(mp4|avi|mov)$/))
      return <FaFileVideo color="#794BC4" size={40} />;
    return <FaUpload color="#1DA1F2" size={40} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
              background: "rgba(29, 161, 242, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1DA1F2",
              fontSize: 24,
            }}
          >
            <FaUpload />
          </div>
          <Stack gap="sm" style={{ flex: 1 }}>
            <Text fw={700} size="lg">
              Manual File Upload
            </Text>
            <Text size="sm" c="dimmed">
              Upload your existing course materials including PDFs,
              presentations, videos, and images. All files are securely stored
              and automatically processed.
            </Text>
            <List size="sm" spacing="xs" mt="xs">
              <List.Item>
                <strong>PDF Documents:</strong> Text is automatically extracted
                for searchability
              </List.Item>
              <List.Item>
                <strong>PowerPoint Files:</strong> Presentations are stored with
                full metadata
              </List.Item>
              <List.Item>
                <strong>Videos:</strong> MP4, AVI, MOV formats supported (max
                500MB)
              </List.Item>
              <List.Item>
                <strong>Images:</strong> JPG, PNG, GIF for diagrams and
                illustrations
              </List.Item>
            </List>
          </Stack>
        </Group>
      </GlassCard>

      {/* Upload Form */}
      <form onSubmit={form.onSubmit(handleUpload)}>
        <GlassCard padding="xl">
          <Stack gap="lg">
            <Group gap="xs">
              <div style={{ fontSize: 28 }}>📤</div>
              <Text fw={700} size="lg">
                Upload Course Material
              </Text>
            </Group>

            {/* Title Input */}
            <TextInput
              label={
                <Group gap={4}>
                  <Text size="sm" fw={600}>
                    Material Title
                  </Text>
                  <Badge size="xs" color="red">
                    Required
                  </Badge>
                </Group>
              }
              placeholder="e.g., Week 1 Lecture Notes, Chapter 3 Slides, Introduction Video"
              description="Give your material a descriptive name that students will easily understand"
              required
              size="md"
              {...form.getInputProps("title")}
            />

            {/* File Dropzone */}
            <div>
              <Text size="sm" fw={600} mb="xs">
                Select File to Upload
              </Text>
              <Dropzone
                onDrop={handleFileDrop}
                onReject={(files) => {
                  notifications.show({
                    title: "Invalid File",
                    message: "Please upload a supported file type",
                    color: "red",
                  });
                }}
                maxSize={500 * 1024 * 1024} // 500MB
                accept={{
                  "application/pdf": [".pdf"],
                  "application/vnd.ms-powerpoint": [".ppt"],
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                    [".pptx"],
                  "image/*": [".jpg", ".jpeg", ".png", ".gif"],
                  "video/*": [".mp4", ".avi", ".mov"],
                }}
                disabled={uploading}
              >
                <Group
                  justify="center"
                  gap="xl"
                  style={{ minHeight: 220, pointerEvents: "none" }}
                >
                  <Dropzone.Accept>
                    <FaCheck size={50} color="#17BF63" />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <FaTimes size={50} color="#E0245E" />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <FaUpload size={50} color="#1DA1F2" />
                  </Dropzone.Idle>

                  <div>
                    <Text size="xl" inline fw={600}>
                      Drag file here or click to select
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      Upload PDF, PowerPoint, Video, or Image files (max 500MB)
                    </Text>
                  </div>
                </Group>
              </Dropzone>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Paper
                  p="md"
                  withBorder
                  style={{ background: "rgba(29, 161, 242, 0.05)" }}
                >
                  <Group>
                    {getFileIcon(selectedFile.name)}
                    <div style={{ flex: 1 }}>
                      <Text fw={600}>{selectedFile.name}</Text>
                      <Text size="sm" c="dimmed">
                        {formatFileSize(selectedFile.size)} •{" "}
                        {selectedFile.type || "Unknown type"}
                      </Text>
                    </div>
                    <Badge color="green" leftSection={<FaCheck />}>
                      Selected
                    </Badge>
                  </Group>
                </Paper>
              </motion.div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      Uploading and Processing...
                    </Text>
                    <Text size="sm" c="dimmed">
                      {uploadProgress}%
                    </Text>
                  </Group>
                  <Progress
                    value={uploadProgress}
                    size="lg"
                    radius="md"
                    animated
                  />
                  <Text size="xs" c="dimmed">
                    {uploadProgress < 50
                      ? "Uploading file..."
                      : uploadProgress < 90
                      ? "Processing content..."
                      : "Finalizing..."}
                  </Text>
                </Stack>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={uploading}
              disabled={!selectedFile}
              leftSection={<FaUpload />}
              color="twitterBlue"
            >
              {uploading ? "Uploading..." : "Upload Material"}
            </Button>
          </Stack>
        </GlassCard>
      </form>

      {/* Supported Formats Guide */}
      <GlassCard padding="lg">
        <Stack gap="md">
          <Group gap="xs">
            <FaInfoCircle color="#1DA1F2" size={20} />
            <Text fw={600} size="md">
              Supported File Formats
            </Text>
          </Group>

          <Stack gap="sm">
            {[
              {
                icon: <FaFilePdf color="#E0245E" />,
                format: "PDF Documents",
                types: ".pdf",
                features:
                  "Automatic text extraction, searchable content, preview available",
              },
              {
                icon: <FaFilePowerpoint color="#FFAD1F" />,
                format: "PowerPoint",
                types: ".ppt, .pptx",
                features: "Slide-by-slide viewing, downloadable for students",
              },
              {
                icon: <FaFileVideo color="#794BC4" />,
                format: "Videos",
                types: ".mp4, .avi, .mov",
                features: "Streaming playback, up to 500MB file size",
              },
              {
                icon: <FaFileImage color="#17BF63" />,
                format: "Images",
                types: ".jpg, .jpeg, .png, .gif",
                features: "High-resolution support, automatic optimization",
              },
            ].map((item, index) => (
              <Paper key={index} p="md" withBorder>
                <Group align="flex-start">
                  <div style={{ fontSize: 24 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb={4}>
                      <Text fw={600} size="sm">
                        {item.format}
                      </Text>
                      <Badge size="xs" variant="light">
                        {item.types}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {item.features}
                    </Text>
                  </div>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </GlassCard>
    </Stack>
  );
}
