"use client";

import {
  Container,
  Grid,
  Stack,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaRobot, FaChartLine, FaGraduationCap } from "react-icons/fa";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      remember_me: false,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length >= 6 ? null : "Password must be at least 6 characters",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FaRobot />, text: "AI-Powered Learning" },
    { icon: <FaGraduationCap />, text: "Comprehensive Courses" },
    { icon: <FaChartLine />, text: "Performance Analytics" },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Container p={0} m={0} size="xl" style={{ width: "100%" }}>
        <Grid gutter={0}>
          {/* Left Side - Brand Showcase */}
          <Grid.Col
            span={{ base: 12, md: 6 }}
            style={{
              background: "var(--twitter-blue)",
              padding: 60,
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Stack gap="xl">
                  <div>
                    <Title order={1} c="white" size={48}>
                      Welcome Back
                    </Title>
                    <Text size="xl" c="white" mt="md">
                      Continue your learning journey with AI-powered education
                    </Text>
                  </div>

                  <Stack gap="lg" mt="xl">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.2 }}
                      >
                        <Group gap="md">
                          <div
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: "50%",
                              background: "rgba(255, 255, 255, 0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: 20,
                            }}
                          >
                            {feature.icon}
                          </div>
                          <Text size="lg" c="white" fw={600}>
                            {feature.text}
                          </Text>
                        </Group>
                      </motion.div>
                    ))}
                  </Stack>
                </Stack>
              </motion.div>

              {/* Floating elements animation */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                    top: `${20 + i * 30}%`,
                    right: `${-20 + i * 10}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    x: [0, 20, 0],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </Grid.Col>

          {/* Right Side - Login Form */}
          <Grid.Col
            span={{ base: 12, md: 6 }}
            style={{
              padding: 60,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Stack gap="xl">
                <div>
                  <Title order={2} size={36}>
                    Sign In
                  </Title>
                  <Text c="dimmed" mt="sm">
                    Enter your credentials to access your account
                  </Text>
                </div>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <Stack gap="md">
                    <TextInput
                      label="Email"
                      placeholder="your.email@university.edu"
                      size="md"
                      required
                      {...form.getInputProps("email")}
                    />

                    <PasswordInput
                      label="Password"
                      placeholder="Enter your password"
                      size="md"
                      required
                      visible={showPassword}
                      onVisibilityChange={setShowPassword}
                      {...form.getInputProps("password")}
                    />

                    <Group justify="space-between">
                      <Checkbox
                        label="Remember me"
                        {...form.getInputProps("remember_me", {
                          type: "checkbox",
                        })}
                      />
                      <Anchor
                        size="sm"
                        c="twitterBlue"
                        style={{ cursor: "pointer" }}
                        href="/forgot-password"
                      >
                        Forgot password?
                      </Anchor>
                    </Group>

                    <Button
                      type="submit"
                      fullWidth
                      size="md"
                      loading={loading}
                      color="twitterBlue"
                    >
                      Sign In
                    </Button>
                  </Stack>
                  <Text pt={"sm"} size="sm" ta="center" c="dimmed">
                    Don't have an account?{" "}
                    <Anchor
                      c="twitterBlue"
                      fw={600}
                      style={{ cursor: "pointer" }}
                      href="/register"
                    >
                      Sign up
                    </Anchor>
                  </Text>
                </form>
              </Stack>
            </motion.div>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}
