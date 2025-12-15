"use client";

import { useState, useRef, useEffect } from "react";
import {
  Stack,
  Group,
  TextInput,
  Paper,
  Text,
  Avatar,
  ActionIcon,
  Badge,
  Select,
  Textarea,
  Button,
} from "@mantine/core";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaRobot, FaUser, FaCopy, FaCheck } from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
interface AIChatAssistantProps {
  courseId?: string;
  context?: any;
}
export function AIChatAssistant({ courseId, context }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI learning assistant. How can I help you today? I can explain concepts, generate study materials, or answer questions about your courses.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistMode, setAssistMode] = useState<string>("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiClient.ai.chatAssist({
        message: input,
        context: {
          course_id: courseId,
          mode: assistMode,
          ...context,
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  const quickPrompts = [
    "Explain this concept in simple terms",
    "Generate a study plan for me",
    "Create practice questions",
    "Summarize this topic",
    "Help me understand this better",
  ];
  return (
    <Stack gap="md" style={{ height: "100%", maxHeight: "80vh" }}>
      {/* Header */}
      <GlassCard padding="md">
        <Group justify="space-between">
          <Group>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1DA1F2 0%, #794BC4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <FaRobot size={20} />
            </div>
            <div>
              <Text fw={600}>AI Learning Assistant</Text>
              <Text size="xs" c="dimmed">
                Always here to help
              </Text>
            </div>
          </Group>
          <Select
            size="xs"
            value={assistMode}
            onChange={(value) => setAssistMode(value || "general")}
            data={[
              { value: "general", label: "General Help" },
              { value: "explain", label: "Explain Concepts" },
              { value: "study", label: "Study Assistance" },
              { value: "practice", label: "Practice Questions" },
            ]}
            style={{ width: 150 }}
          />
        </Group>
      </GlassCard>

      {/* Messages */}
      <Paper
        withBorder
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          background: "var(--bg-light)",
        }}
      >
        <Stack gap="md">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Group
                  align="flex-start"
                  gap="md"
                  style={{
                    justifyContent:
                      message.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {message.role === "assistant" && (
                    <Avatar color="blue" radius="xl">
                      <FaRobot />
                    </Avatar>
                  )}

                  <Paper
                    p="md"
                    radius="lg"
                    style={{
                      maxWidth: "70%",
                      background:
                        message.role === "user"
                          ? "linear-gradient(135deg, #1DA1F2 0%, #794BC4 100%)"
                          : "white",
                      color: message.role === "user" ? "white" : "inherit",
                    }}
                  >
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </Text>
                    <Text
                      size="xs"
                      c={message.role === "user" ? "white" : "dimmed"}
                      mt="xs"
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </Paper>

                  {message.role === "user" && (
                    <Avatar color="twitterBlue" radius="xl">
                      <FaUser />
                    </Avatar>
                  )}
                </Group>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <Group align="flex-start" gap="md">
              <Avatar color="blue" radius="xl">
                <FaRobot />
              </Avatar>
              <Paper p="md" radius="lg" style={{ background: "white" }}>
                <Group gap="xs">
                  <div className="dot-flashing" />
                  <Text size="sm" c="dimmed">
                    AI is thinking...
                  </Text>
                </Group>
              </Paper>
            </Group>
          )}

          <div ref={messagesEndRef} />
        </Stack>
      </Paper>

      {/* Quick Prompts */}
      <Group gap="xs" style={{ flexWrap: "wrap" }}>
        {quickPrompts.map((prompt, index) => (
          <Badge
            key={index}
            variant="light"
            size="lg"
            style={{ cursor: "pointer" }}
            onClick={() => setInput(prompt)}
          >
            {prompt}
          </Badge>
        ))}
      </Group>

      {/* Input */}
      <Group gap="md" align="flex-end">
        <Textarea
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{ flex: 1 }}
          minRows={1}
          maxRows={4}
        />
        <Button
          onClick={handleSend}
          loading={loading}
          disabled={!input.trim()}
          variant="gradient"
          gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
          leftSection={<FaPaperPlane />}
        >
          Send
        </Button>
      </Group>
    </Stack>
  );
}
