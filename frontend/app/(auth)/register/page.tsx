"use client";

import { Container, Title, Text, Stack, Grid, Paper } from "@mantine/core";
import { motion } from "framer-motion";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";

export default function RoleSelectionPage() {
  const router = useRouter();

  const roles = [
    {
      type: "student",
      icon: <FaUserGraduate size={60} />,
      title: "I'm a Student",
      description:
        "Access courses, complete assignments, and enhance your learning with AI-powered tools",
      color: "#1DA1F2",
      route: "/register/student",
    },
    {
      type: "lecturer",
      icon: <FaChalkboardTeacher size={60} />,
      title: "I'm a Lecturer",
      description:
        "Create courses, manage students, and leverage AI to generate educational content",
      color: "#794BC4",
      route: "/register/lecturer",
    },
  ];
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at 30% 50%, rgba(29, 161, 242, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(121, 75, 196, 0.1) 0%, transparent 50%)",
      }}
    >
      <Container size="lg" py={80}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack align="center" mb={60}>
            <Title order={1} size={48} ta="center">
              Join Our Platform
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              Select your role to get started with personalized AI-powered
              education
            </Text>
          </Stack>
          <Grid gutter="xl">
            {roles.map((role, index) => (
              <Grid.Col key={role.type} span={{ base: 12, md: 6 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => router.push(role.route)}
                  style={{ cursor: "pointer" }}
                >
                  <GlassCard
                    padding="xl"
                    style={{
                      height: "100%",
                      minHeight: 300,
                      border: `2px solid transparent`,
                      transition: "all 0.3s ease",
                    }}
                    styles={{
                      root: {
                        "&:hover": {
                          borderColor: role.color,
                          boxShadow: `0 12px 40px ${role.color}30`,
                        },
                      },
                    }}
                  >
                    <Stack align="center" justify="center" h="100%">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        style={{ color: role.color }}
                      >
                        {role.icon}
                      </motion.div>
                      <Title order={2} size="h3" ta="center">
                        {role.title}
                      </Title>
                      <Text size="md" c="dimmed" ta="center">
                        {role.description}
                      </Text>
                    </Stack>
                  </GlassCard>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>

          <Text size="sm" ta="center" mt="xl" c="dimmed">
            Already have an account?{" "}
            <Text
              component="span"
              c="twitterBlue"
              style={{ cursor: "pointer", fontWeight: 600 }}
              onClick={() => router.push("/login")}
            >
              Sign in
            </Text>
          </Text>
        </motion.div>
      </Container>
    </div>
  );
}
