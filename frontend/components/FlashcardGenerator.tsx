"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Group,
  Card,
  Text,
  Button,
  Progress,
  Badge,
  ActionIcon,
  Tabs,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaCheck, FaTimes, FaStar, FaBookmark } from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty?: "easy" | "medium" | "hard";
  mastery_level: number;
}

interface FlashcardGeneratorProps {
  courseId?: string;
}

export function FlashcardGenerator({ courseId }: FlashcardGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const form = useForm({
    initialValues: {
      topic: "",
      count: 10,
      difficulty: "medium",
      description: "",
    },
    validate: {
      topic: (value) => (!value ? "Topic is required" : null),
      count: (value) =>
        value < 1 || value > 50 ? "Count must be between 1 and 50" : null,
    },
  });

  const handleGenerate = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await apiClient.flashcards.generate({
        topic: values.topic,
        count: values.count,
        difficulty: values.difficulty,
        course_id: courseId,
      });
      console.log(response.data);
      setFlashcards(response.data?.flashcards || []);
      notifications.show({
        title: "Success",
        message: `Generated ${
          response.data?.flashcards?.length || 0
        } flashcards`,
        color: "green",
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentCardIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    );
  };

  const handleReview = async (difficulty: "easy" | "medium" | "hard") => {
    try {
      await apiClient.flashcards.review(flashcards[currentCardIndex].id, {
        card_id: flashcards[currentCardIndex].id,
        difficulty,
      });
      handleNext();
    } catch (error) {
      console.error("Error reviewing card:", error);
    }
  };

  return (
    <Stack gap="xl">
      {/* Generation Form */}
      {!studyMode && (
        <GlassCard padding="xl">
          <form onSubmit={form.onSubmit(handleGenerate)}>
            <Stack gap="md">
              <Group align="flex-start">
                <div style={{ fontSize: 40 }}>🎴</div>
                <div style={{ flex: 1 }}>
                  <Text size="xl" fw={700} mb="xs">
                    Generate Flashcards
                  </Text>
                  <Text c="dimmed">
                    Create AI-powered flashcards to enhance your learning
                  </Text>
                </div>
              </Group>

              <TextInput
                label="Topic"
                placeholder="e.g., Machine Learning Algorithms"
                required
                {...form.getInputProps("topic")}
              />

              <Textarea
                label="Additional Details (Optional)"
                placeholder="Provide more context or specific areas to focus on..."
                minRows={3}
                {...form.getInputProps("description")}
              />

              <Group grow>
                <NumberInput
                  label="Number of Cards"
                  placeholder="10"
                  min={1}
                  max={50}
                  {...form.getInputProps("count")}
                />

                <Select
                  label="Difficulty Level"
                  data={[
                    { value: "easy", label: "Easy" },
                    { value: "medium", label: "Medium" },
                    { value: "hard", label: "Hard" },
                  ]}
                  {...form.getInputProps("difficulty")}
                />
              </Group>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                leftSection={<FaRobot />}
                color="twitterBlue"
              >
                Generate Flashcards
              </Button>
            </Stack>
          </form>
        </GlassCard>
      )}

      {/* Flashcards Display */}
      {flashcards?.length > 0 && (
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="lg" fw={600}>
                Generated Flashcards
              </Text>
              <Text size="sm" c="dimmed">
                Card {currentCardIndex + 1} of {flashcards.length}
              </Text>
            </div>
            <Group>
              <Button
                variant={studyMode ? "light" : "filled"}
                onClick={() => setStudyMode(!studyMode)}
              >
                {studyMode ? "Exit Study Mode" : "Study Mode"}
              </Button>
            </Group>
          </Group>

          <Progress
            value={((currentCardIndex + 1) / flashcards.length) * 100}
            size="sm"
          />

          {/* Flashcard */}
          <motion.div
            key={currentCardIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div
              style={{
                perspective: "1000px",
                minHeight: 400,
              }}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                  cursor: "pointer",
                  position: "relative",
                  width: "100%",
                  minHeight: 400,
                }}
                onClick={handleFlip}
              >
                {/* Front of card */}
                <GlassCard
                  padding="xl"
                  style={{
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    minHeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: "rotateY(0deg)",
                  }}
                >
                  <Stack align="center" gap="xl">
                    <Badge size="lg" variant="light">
                      Question
                    </Badge>
                    <Text size="xl" fw={600} ta="center">
                      {flashcards[currentCardIndex].front}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Click to reveal answer
                    </Text>
                  </Stack>
                </GlassCard>

                {/* Back of card */}
                <GlassCard
                  padding="xl"
                  style={{
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    minHeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <Stack align="center" gap="xl">
                    <Badge size="lg" color="green" variant="light">
                      Answer
                    </Badge>
                    <Text size="xl" fw={600} ta="center">
                      {flashcards[currentCardIndex].back}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Click to flip back
                    </Text>
                  </Stack>
                </GlassCard>
              </motion.div>
            </div>
          </motion.div>

          {/* Navigation Controls */}
          <Group justify="center" gap="md">
            <Button onClick={handlePrevious} disabled={currentCardIndex === 0}>
              Previous
            </Button>

            {studyMode && isFlipped && (
              <>
                <Button
                  color="green"
                  leftSection={<FaCheck />}
                  onClick={() => handleReview("easy")}
                >
                  Easy
                </Button>
                <Button color="yellow" onClick={() => handleReview("medium")}>
                  Medium
                </Button>
                <Button
                  color="red"
                  leftSection={<FaTimes />}
                  onClick={() => handleReview("hard")}
                >
                  Hard
                </Button>
              </>
            )}

            <Button
              onClick={handleNext}
              disabled={currentCardIndex === flashcards.length - 1}
            >
              Next
            </Button>
          </Group>

          {/* All Cards Grid View */}
          {!studyMode && (
            <Tabs defaultValue="grid">
              <Tabs.List>
                <Tabs.Tab value="grid">Grid View</Tabs.Tab>
                <Tabs.Tab value="list">List View</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="grid" pt="md">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {flashcards.map((card, index) => (
                    <Card
                      key={index}
                      padding="md"
                      radius="md"
                      withBorder
                      style={{
                        cursor: "pointer",
                        border:
                          index === currentCardIndex
                            ? "2px solid #1DA1F2"
                            : undefined,
                      }}
                      onClick={() => {
                        setCurrentCardIndex(index);
                        setIsFlipped(false);
                      }}
                    >
                      <Stack gap="xs">
                        <Text size="sm" fw={600} lineClamp={2}>
                          {card.front}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {card.back}
                        </Text>
                        {card.mastery_level > 0 && (
                          <Progress
                            value={card.mastery_level}
                            size="xs"
                            color="green"
                          />
                        )}
                      </Stack>
                    </Card>
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="list" pt="md">
                <Stack gap="sm">
                  {flashcards.map((card, index) => (
                    <Card
                      key={index}
                      padding="md"
                      radius="md"
                      withBorder
                      style={{
                        cursor: "pointer",
                        border:
                          index === currentCardIndex
                            ? "2px solid #1DA1F2"
                            : undefined,
                      }}
                      onClick={() => {
                        setCurrentCardIndex(index);
                        setIsFlipped(false);
                      }}
                    >
                      <Group justify="space-between">
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={600} mb={4}>
                            Q: {card.front}
                          </Text>
                          <Text size="sm" c="dimmed">
                            A: {card.back}
                          </Text>
                        </div>
                        <ActionIcon variant="subtle">
                          <FaBookmark />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}
        </Stack>
      )}
    </Stack>
  );
}
