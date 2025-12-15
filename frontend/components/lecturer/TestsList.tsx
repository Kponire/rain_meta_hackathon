"use client";

import { useEffect, useState } from "react";
import {
  SimpleGrid,
  Card,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Title,
  Modal,
  Divider,
  ScrollArea,
  Grid,
  ActionIcon,
  List,
} from "@mantine/core";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
import { FaUpload, FaEye, FaDownload } from "react-icons/fa";

interface Props {
  courseId: string;
  onRefresh?: () => void;
}

export function TestsList({ courseId, onRefresh }: Props) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTest, setPreviewTest] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await apiClient.tests.getAll(courseId);
      setTests(res.data || []);
    } catch (e) {
      console.error(e);
      notifications.show({
        title: "Error",
        message: "Failed to load tests",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetch();
  }, [courseId]);

  const publish = async (testId: string) => {
    try {
      await apiClient.tests.publish(testId);
      notifications.show({
        title: "Published",
        message: "Test published",
        color: "green",
      });
      fetch();
      onRefresh?.();
    } catch (e: any) {
      notifications.show({
        title: "Publish Failed",
        message: e.response?.data?.detail || "Failed to publish",
        color: "red",
      });
    }
  };

  const openPreview = (t: any) => {
    setPreviewTest(t);
    setModalOpen(true);
  };

  const downloadJSON = (t: any) => {
    try {
      const blob = new Blob([JSON.stringify(t, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(t.title || "test").replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notifications.show({
        title: "Error",
        message: "Failed to download JSON",
        color: "red",
      });
    }
  };

  return (
    <Stack>
      <Group justify="apart">
        <Title order={3}>Tests</Title>
      </Group>

      <SimpleGrid cols={2} spacing="lg">
        {tests.map((t) => (
          <Card key={t.id} withBorder shadow="sm" radius="md">
            <Grid>
              <Grid.Col span={9}>
                <Stack gap={6}>
                  <Group justify="apart">
                    <Text fw={700}>{t.title || "Untitled Test"}</Text>
                    <Badge color={t.is_published ? "green" : "gray"}>
                      {t.is_published ? "Published" : "Draft"}
                    </Badge>
                  </Group>

                  <Text size="sm" c="dimmed">
                    {t.description || "No description provided."}
                  </Text>

                  <Group gap="xs" mt="6">
                    <Text size="xs" c="dimmed">
                      Type:
                    </Text>
                    <Badge variant="light">{t.test_type}</Badge>
                    <Text size="xs" c="dimmed">
                      •
                    </Text>
                    <Text size="xs" c="dimmed">
                      Duration:
                    </Text>
                    <Text size="xs">{t.duration} mins</Text>
                    <Text size="xs" c="dimmed">
                      •
                    </Text>
                    <Text size="xs" c="dimmed">
                      Questions:
                    </Text>
                    <Text size="xs">
                      {Array.isArray(t.questions) ? t.questions.length : "—"}
                    </Text>
                  </Group>
                </Stack>
              </Grid.Col>

              <Grid.Col
                span={3}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Stack align="end">
                  <Group style={{ display: "flex", flexDirection: "column" }}>
                    <ActionIcon
                      variant="light"
                      onClick={() => openPreview(t)}
                      title="Preview"
                    >
                      <FaEye />
                    </ActionIcon>
                    {!t.is_published && (
                      <Button
                        size="xs"
                        onClick={() => publish(t.id)}
                        leftSection={<FaUpload />}
                      >
                        Publish
                      </Button>
                    )}
                    <ActionIcon
                      variant="light"
                      onClick={() => downloadJSON(t)}
                      title="Download JSON"
                    >
                      <FaDownload />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        ))}
      </SimpleGrid>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={previewTest?.title || "Test Preview"}
        size="xl"
      >
        {previewTest ? (
          <Stack>
            <Group justify="apart">
              <div>
                <Text fw={700}>{previewTest.title}</Text>
                <Text size="sm" c="dimmed">
                  {previewTest.description}
                </Text>
              </div>
              <div>
                <Badge color={previewTest.is_published ? "green" : "gray"}>
                  {previewTest.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </Group>

            <Divider />

            <Group grow>
              <div>
                <Text size="sm" c="dimmed">
                  Start
                </Text>
                <Text>{new Date(previewTest.start_time).toLocaleString()}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  End
                </Text>
                <Text>{new Date(previewTest.end_time).toLocaleString()}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Duration
                </Text>
                <Text>{previewTest.duration} mins</Text>
              </div>
            </Group>

            <Divider />

            <ScrollArea>
              <Stack gap="sm">
                {Array.isArray(previewTest.questions) &&
                previewTest.questions.length > 0 ? (
                  previewTest.questions.map((q: any, i: number) => (
                    <Card key={i} withBorder>
                      <Text fw={600}>
                        {i + 1}. {q.question ?? q.prompt ?? q.text}
                      </Text>
                      {q.options && Array.isArray(q.options) && (
                        <List withPadding mt="sm">
                          {q.options.map((o: any, oi: number) => (
                            <List.Item key={oi}>{o}</List.Item>
                          ))}
                        </List>
                      )}
                      {q.rubric && (
                        <Text size="sm" c="dimmed" mt="sm">
                          Rubric: {q.rubric}
                        </Text>
                      )}
                    </Card>
                  ))
                ) : (
                  <Text c="dimmed">No structured questions available.</Text>
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}

export default TestsList;
