"use client";

import { useState } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Select,
  FileInput,
  Tabs,
  Badge,
  Paper,
  CopyButton,
  ActionIcon,
  Text,
  Button,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { motion } from "framer-motion";
import {
  FaCalculator,
  FaUpload,
  FaCheck,
  FaCopy,
  FaDownload,
  FaEye,
} from "react-icons/fa";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { apiClient } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
//import { Prism } from '@mantine/prism';
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface LatexResult {
  input: string;
  output: string;
  preview_url?: string;
  explanation?: string;
}

export function LatexGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LatexResult | null>(null);
  const [latexFile, setLatexFile] = useState<File | null>(null);
  const [activeAction, setActiveAction] = useState<
    "format" | "solve" | "explain" | "generate"
  >("format");

  const form = useForm({
    initialValues: {
      content: "",
      description: "",
      type: "equation",
    },
    validate: {
      content: (value) => {
        if (activeAction !== "generate" && !value && !latexFile) {
          return "Content or file is required";
        }
        return null;
      },
      description: (value) => {
        if (activeAction === "generate" && !value) {
          return "Description is required for generation";
        }
        return null;
      },
    },
  });

  const handleProcess = async (action: "format" | "solve" | "explain") => {
    setLoading(true);
    setActiveAction(action);

    try {
      let content = form.values.content;

      // If file is uploaded, read its content
      if (latexFile) {
        content = await latexFile.text();
      }

      let response;
      switch (action) {
        case "format":
          response = await apiClient.latex.format({
            content,
            action: "format",
          });
          break;
        case "solve":
          response = await apiClient.latex.solve({ content, action: "solve" });
          break;
        case "explain":
          response = await apiClient.latex.explain({
            content,
            action: "explain",
          });
          break;
      }

      setResult(response.data);
      notifications.show({
        title: "Success",
        message: `LaTeX ${action}ed successfully`,
        color: "green",
      });
    } catch (error) {
      console.error("Error processing LaTeX:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setActiveAction("generate");

    try {
      const response = await apiClient.latex.generate({
        description: form.values.description,
        type: form.values.type,
      });

      setResult(response.data);
      notifications.show({
        title: "Success",
        message: "LaTeX generated successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error generating LaTeX:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderLatexPreview = (latex: string) => {
    try {
      return <BlockMath math={latex} />;
    } catch (error) {
      return (
        <Paper p="md" withBorder>
          Error rendering LaTeX preview
        </Paper>
      );
    }
  };

  return (
    <Stack gap="xl">
      {/* Input Section */}
      <Box p="xl">
        <Stack gap="md">
          <Group align="flex-start">
            <div style={{ fontSize: 40 }}>📐</div>
            <div style={{ flex: 1 }}>
              <Text size="xl" fw={700} mb="xs">
                LaTeX Generator & Processor
              </Text>
              <Text c="dimmed">
                Format, solve, explain mathematical expressions or generate
                LaTeX from descriptions
              </Text>
            </div>
          </Group>

          <Tabs defaultValue="process">
            <Tabs.List>
              <Tabs.Tab value="process">Process LaTeX</Tabs.Tab>
              <Tabs.Tab value="generate">Generate LaTeX</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="process" pt="md">
              <Stack gap="md">
                <Textarea
                  label="LaTeX Content"
                  placeholder="Enter your LaTeX code here... e.g., \frac{x^2 + 2x + 1}{x + 1}"
                  minRows={6}
                  {...form.getInputProps("content")}
                />

                <Text size="sm" c="dimmed">
                  Or upload a file:
                </Text>

                <FileInput
                  placeholder="Upload .tex or .txt file"
                  accept=".tex,.txt"
                  leftSection={<FaUpload />}
                  value={latexFile}
                  onChange={setLatexFile}
                />

                <Group grow>
                  <Button
                    loading={loading && activeAction === "format"}
                    onClick={() => handleProcess("format")}
                    variant="light"
                    leftSection={<FaCalculator />}
                  >
                    Format
                  </Button>
                  <Button
                    loading={loading && activeAction === "solve"}
                    onClick={() => handleProcess("solve")}
                    variant="light"
                    leftSection={<FaCalculator />}
                  >
                    Solve
                  </Button>
                  <Button
                    loading={loading && activeAction === "explain"}
                    onClick={() => handleProcess("explain")}
                    variant="light"
                    leftSection={<FaCalculator />}
                  >
                    Explain
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="generate" pt="md">
              <Stack gap="md">
                <Textarea
                  label="Description"
                  placeholder="Describe the mathematical expression you want to generate... e.g., 'quadratic formula' or 'integral of x squared'"
                  minRows={4}
                  required
                  {...form.getInputProps("description")}
                />

                <Select
                  label="Type"
                  data={[
                    { value: "equation", label: "Equation" },
                    { value: "matrix", label: "Matrix" },
                    { value: "integral", label: "Integral" },
                    { value: "derivative", label: "Derivative" },
                    { value: "summation", label: "Summation" },
                    { value: "limit", label: "Limit" },
                  ]}
                  {...form.getInputProps("type")}
                />

                <Button
                  fullWidth
                  size="lg"
                  loading={loading && activeAction === "generate"}
                  onClick={handleGenerate}
                  variant="gradient"
                  gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
                >
                  Generate LaTeX
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Box>

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xl" fw={700}>
                Result
              </Text>
              <Group>
                <CopyButton value={result.output}>
                  {({ copied, copy }) => (
                    <Button
                      leftSection={copied ? <FaCheck /> : <FaCopy />}
                      color={copied ? "green" : "blue"}
                      variant="light"
                      onClick={copy}
                    >
                      {copied ? "Copied" : "Copy LaTeX"}
                    </Button>
                  )}
                </CopyButton>
                <AnimatedButton variant="light" leftSection={<FaDownload />}>
                  Download
                </AnimatedButton>
              </Group>
            </Group>

            <Tabs defaultValue="preview">
              <Tabs.List>
                <Tabs.Tab value="preview" leftSection={<FaEye />}>
                  Preview
                </Tabs.Tab>
                <Tabs.Tab value="code">LaTeX Code</Tabs.Tab>
                {result.explanation && (
                  <Tabs.Tab value="explanation">Explanation</Tabs.Tab>
                )}
              </Tabs.List>

              <Tabs.Panel value="preview" pt="md">
                <GlassCard padding="xl">
                  <Stack gap="md">
                    <Badge size="lg">Rendered Output</Badge>
                    <Paper
                      p="xl"
                      withBorder
                      style={{
                        background: "white",
                        minHeight: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {renderLatexPreview(result.output)}
                    </Paper>
                  </Stack>
                </GlassCard>
              </Tabs.Panel>

              <Tabs.Panel value="code" pt="md">
                <GlassCard padding="lg">
                  <Stack gap="md">
                    <Badge size="lg">LaTeX Source</Badge>
                    {/* <Prism language="latex" copyLabel="Copy code" copiedLabel="Copied!">
                      {result.output}
                    </Prism> */}
                  </Stack>
                </GlassCard>
              </Tabs.Panel>

              {result.explanation && (
                <Tabs.Panel value="explanation" pt="md">
                  <GlassCard padding="lg">
                    <Stack gap="md">
                      <Badge size="lg">Explanation</Badge>
                      <Paper p="md" withBorder>
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {result.explanation}
                        </Text>
                      </Paper>
                    </Stack>
                  </GlassCard>
                </Tabs.Panel>
              )}
            </Tabs>

            {/* Quick Examples */}
            <GlassCard padding="md">
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Quick Examples:
                </Text>
                <Group gap="xs">
                  {[
                    "\\frac{a}{b}",
                    "\\int_{0}^{\\infty} x^2 dx",
                    "\\sum_{i=1}^{n} i",
                    "\\sqrt{x^2 + y^2}",
                    "\\begin{matrix} a & b \\\\ c & d \\end{matrix}",
                  ].map((example, index) => (
                    <Badge
                      key={index}
                      variant="light"
                      style={{ cursor: "pointer" }}
                      onClick={() => form.setFieldValue("content", example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </GlassCard>
          </Stack>
        </motion.div>
      )}
    </Stack>
  );
}
