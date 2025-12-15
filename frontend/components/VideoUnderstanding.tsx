"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Card,
  Text,
  FileInput,
  Tabs,
  Badge,
  Loader,
  Paper,
  Timeline,
  ActionIcon,
  CopyButton,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { motion } from "framer-motion";
import {
  FaYoutube,
  FaUpload,
  FaVideo,
  FaFileAlt,
  FaClock,
  FaDownload,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

type AnalysisType = "summarize" | "transcribe" | "explain";
interface VideoAnalysis {
  id: string;
  title: string;
  summary?: string;
  transcription?: string;
  key_points?: string[];
  timestamps?: Array<{ time: string; description: string }>;
}
export function VideoUnderstanding() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("youtube");

  const youtubeForm = useForm({
    initialValues: {
      url: "",
    },
    validate: {
      url: (value) => {
        if (!value) return "URL is required";
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;
        return youtubeRegex.test(value) ? null : "Invalid YouTube URL";
      },
    },
  });

  const handleYoutubeProcess = async (analysisType: AnalysisType) => {
    const validationResult = youtubeForm.validate();
    if (validationResult.hasErrors) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.video.processYoutube({
        url: youtubeForm.values.url,
        analysis_type: analysisType,
      });
      setAnalysis(response.data);
      notifications.show({
        title: "Success",
        message: "Video processed successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error processing video:", error);
      notifications.show({
        title: "Error",
        message: "Failed to process video. Check the URL and try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleVideoUpload = async () => {
    if (!videoFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("analysis_type", "summarize");

      const response = await apiClient.video.uploadAndProcess(formData);

      setAnalysis(response.data);
      notifications.show({
        title: "Success",
        message: "Video uploaded and processed",
        color: "green",
      });
    } catch (error) {
      console.error("Error uploading video:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFirstActiveTab = () => {
    if (analysis?.summary) return "summary";
    if (analysis?.transcription) return "transcription";
    if (analysis?.key_points) return "keypoints";
    if (analysis?.timestamps) return "timestamps";
    return "summary";
  };

  return (
    <Stack gap="xl">
      {/* Input Section */}
      <GlassCard padding="xl">
        <Stack gap="md">
          <Group align="flex-start">
            <div style={{ fontSize: 40 }}>🎥</div>
            <div style={{ flex: 1 }}>
              <Text size="xl" fw={700} mb="xs">
                Video Understanding
              </Text>
              <Text c="dimmed">
                Extract insights, transcriptions, and summaries from videos
                using AI
              </Text>
            </div>
          </Group>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="youtube" leftSection={<FaYoutube />}>
                YouTube URL
              </Tabs.Tab>
              <Tabs.Tab value="upload" leftSection={<FaUpload />}>
                Upload Video
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="youtube" pt="md">
              <form onSubmit={(e) => e.preventDefault()}>
                <Stack gap="md">
                  <TextInput
                    label="YouTube URL"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    leftSection={<FaYoutube />}
                    {...youtubeForm.getInputProps("url")}
                  />

                  <Group grow>
                    <Button
                      loading={loading}
                      variant="light"
                      onClick={() => handleYoutubeProcess("summarize")}
                    >
                      Summarize
                    </Button>
                    <Button
                      loading={loading}
                      variant="light"
                      onClick={() => handleYoutubeProcess("transcribe")}
                    >
                      Transcribe
                    </Button>
                    <Button
                      loading={loading}
                      variant="light"
                      onClick={() => handleYoutubeProcess("explain")}
                    >
                      Explain
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="upload" pt="md">
              <Stack gap="md">
                <FileInput
                  label="Upload Video File"
                  placeholder="Choose video file"
                  accept="video/*"
                  leftSection={<FaVideo />}
                  value={videoFile}
                  onChange={setVideoFile}
                />

                <Button
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={!videoFile}
                  onClick={handleVideoUpload}
                  variant="gradient"
                  gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
                >
                  Process Video
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard padding="xl">
          <Stack align="center" gap="md">
            <Loader size="xl" variant="dots" />
            <Text fw={600}>Processing video...</Text>
            <Text size="sm" c="dimmed" ta="center">
              This may take a few moments depending on video length
            </Text>
          </Stack>
        </GlassCard>
      )}

      {/* Results Section */}
      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xl" fw={700}>
                Analysis Results
              </Text>
              <Group>
                <AnimatedButton variant="light" leftSection={<FaDownload />}>
                  Export
                </AnimatedButton>
              </Group>
            </Group>

            <Tabs defaultValue={getFirstActiveTab()}>
              <Tabs.List>
                {analysis.summary && (
                  <Tabs.Tab value="summary">Summary</Tabs.Tab>
                )}
                {analysis.transcription && (
                  <Tabs.Tab value="transcription">Transcription</Tabs.Tab>
                )}
                {analysis.key_points && (
                  <Tabs.Tab value="keypoints">Key Points</Tabs.Tab>
                )}
                {analysis.timestamps && (
                  <Tabs.Tab value="timestamps">Timestamps</Tabs.Tab>
                )}
              </Tabs.List>

              {analysis.summary && (
                <Tabs.Panel value="summary" pt="md">
                  <GlassCard padding="lg">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Badge size="lg" leftSection={<FaFileAlt />}>
                          Summary
                        </Badge>
                        <CopyButton value={analysis.summary}>
                          {({ copied, copy }) => (
                            <ActionIcon
                              color={copied ? "green" : "gray"}
                              onClick={copy}
                              variant="subtle"
                            >
                              {copied ? <FaCheck /> : <FaCopy />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                      </Group>
                      <Text>{analysis.summary}</Text>
                    </Stack>
                  </GlassCard>
                </Tabs.Panel>
              )}

              {analysis.transcription && (
                <Tabs.Panel value="transcription" pt="md">
                  <GlassCard padding="lg">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Badge size="lg" leftSection={<FaFileAlt />}>
                          Full Transcription
                        </Badge>
                        <CopyButton value={analysis.transcription}>
                          {({ copied, copy }) => (
                            <ActionIcon
                              color={copied ? "green" : "gray"}
                              onClick={copy}
                              variant="subtle"
                            >
                              {copied ? <FaCheck /> : <FaCopy />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                      </Group>
                      <Paper
                        p="md"
                        withBorder
                        style={{ maxHeight: 500, overflowY: "auto" }}
                      >
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                          {analysis.transcription}
                        </Text>
                      </Paper>
                    </Stack>
                  </GlassCard>
                </Tabs.Panel>
              )}

              {analysis.key_points && (
                <Tabs.Panel value="keypoints" pt="md">
                  <GlassCard padding="lg">
                    <Stack gap="md">
                      <Badge size="lg">Key Points</Badge>
                      <Stack gap="sm">
                        {analysis.key_points.map((point, index) => (
                          <Card key={index} padding="md" withBorder>
                            <Group align="flex-start">
                              <Badge
                                size="lg"
                                variant="filled"
                                color="twitterBlue"
                              >
                                {index + 1}
                              </Badge>
                              <Text size="sm" style={{ flex: 1 }}>
                                {point}
                              </Text>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Stack>
                  </GlassCard>
                </Tabs.Panel>
              )}

              {analysis.timestamps && (
                <Tabs.Panel value="timestamps" pt="md">
                  <GlassCard padding="lg">
                    <Stack gap="md">
                      <Badge size="lg" leftSection={<FaClock />}>
                        Timeline
                      </Badge>
                      <Timeline active={-1} bulletSize={24} lineWidth={2}>
                        {analysis.timestamps.map((timestamp, index) => (
                          <Timeline.Item
                            key={index}
                            title={timestamp.time}
                            bullet={<FaClock size={12} />}
                          >
                            <Text size="sm" c="dimmed">
                              {timestamp.description}
                            </Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </Stack>
                  </GlassCard>
                </Tabs.Panel>
              )}
            </Tabs>
          </Stack>
        </motion.div>
      )}
    </Stack>
  );
}
