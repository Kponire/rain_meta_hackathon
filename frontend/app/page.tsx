"use client";

import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Grid,
  Card,
  Button,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  FaRobot,
  FaGraduationCap,
  FaChartLine,
  FaArrowRight,
} from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      icon: <FaRobot size={40} />,
      title: "AI-Powered Assistance",
      description:
        "Intelligent AI assistants that help students understand course materials and provide instant support.",
    },
    {
      icon: <FaGraduationCap size={40} />,
      title: "Course Management",
      description:
        "Lecturers can easily create and manage courses while students access all their learning materials in one place.",
    },
    {
      icon: <FaChartLine size={40} />,
      title: "Progress Tracking",
      description:
        "Monitor student performance and engagement with straightforward analytics and reports.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          backgroundImage: "url('/hero_image_1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 50, 0.5)",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <Container size="lg" style={{ position: "relative", zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Stack align="center" gap="xl" py={80}>
              <Title order={1} size={56} ta="center" c="white">
                AI-Enhanced Learning Platform
              </Title>

              <Text size="xl" c="white" ta="center" maw={700}>
                A smart learning management system for universities,
                polytechnics, and training centers. Empowering lecturers and
                students with AI assistance.
              </Text>

              <Group gap="md" mt="xl">
                <Button
                  component={Link}
                  href="/register"
                  size="lg"
                  color="twitterBlue"
                >
                  Get Started
                </Button>
              </Group>
            </Stack>
          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 0" }}>
        <Container size="lg">
          <Stack align="center" mb={60}>
            <Title order={2} size={42} ta="center">
              Key Features
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              Built specifically for educational institutions
            </Text>
          </Stack>

          <Grid gutter="xl">
            {features.map((feature, index) => (
              <Grid.Col key={index} span={{ base: 12, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card padding="xl" h="100%" withBorder>
                    <Stack align="center" gap="md">
                      <div style={{ color: "#1DA1F2" }}>{feature.icon}</div>
                      <Title order={3} size="h4" ta="center">
                        {feature.title}
                      </Title>
                      <Text size="sm" c="dimmed" ta="center">
                        {feature.description}
                      </Text>
                    </Stack>
                  </Card>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: "80px 0", backgroundColor: "#f8f9fa" }}>
        <Container size="lg">
          <Stack align="center" mb={60}>
            <Title order={2} size={42} ta="center">
              How It Works
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              Simple steps to get started
            </Text>
          </Stack>

          <Stack gap={40}>
            {[
              {
                step: 1,
                title: "Create Your Account",
                description:
                  "Sign up as a lecturer or student with your institutional credentials",
              },
              {
                step: 2,
                title: "Set Up Your Courses",
                description:
                  "Lecturers create courses and add materials. Students enroll in their courses.",
              },
              {
                step: 3,
                title: "Learn with AI Support",
                description:
                  "Access course content, interact with AI assistants, and track your learning progress",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card padding="xl" radius="lg" withBorder>
                  <Group>
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#1DA1F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      {item.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Title order={4}>{item.title}</Title>
                      <Text c="dimmed">{item.description}</Text>
                    </div>
                  </Group>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </Container>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 0",
          backgroundColor: "#1DA1F2",
        }}
      >
        <Container size="md">
          <Stack align="center" gap="xl">
            <Title order={2} size={42} c="white" ta="center">
              Ready to Get Started?
            </Title>
            <Text size="lg" c="white" ta="center">
              Join your institution's learning platform today
            </Text>
            <Button
              component={Link}
              href="/register"
              size="lg"
              variant="white"
              color="dark"
              rightSection={<FaArrowRight />}
            >
              Create Account
            </Button>
          </Stack>
        </Container>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "30px 0",
          backgroundColor: "#14171A",
          color: "white",
        }}
      >
        <Container size="lg">
          <Text size="sm" ta="center">
            © 2024 AI Learning Platform - Hackathon Project
          </Text>
        </Container>
      </footer>
    </div>
  );
}
