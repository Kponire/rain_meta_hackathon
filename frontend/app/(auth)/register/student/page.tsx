"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  Stepper,
  TextInput,
  PasswordInput,
  Button,
  Select,
  NumberInput,
  FileInput,
  Avatar,
  Group,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaGraduationCap, FaCog, FaUpload } from "react-icons/fa";
import { useAuth } from "@/components/AuthContext";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function StudentRegistrationPage() {
  const [active, setActive] = useState(0);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      student_id: "",
      major: "",
      year: 1,
      institution: "",
    },
    validate: (values) => {
      if (active === 0) {
        return {
          first_name:
            values.first_name.length < 2
              ? "First name must be at least 2 characters"
              : null,
          last_name:
            values.last_name.length < 2
              ? "Last name must be at least 2 characters"
              : null,
          email: !/^\S+@\S+$/.test(values.email) ? "Invalid email" : null,
          password:
            values.password.length < 6
              ? "Password must be at least 6 characters"
              : null,
          phone:
            values.phone.length < 6
              ? "Phone number must be at least 6 digits"
              : null,
          confirm_password:
            values.password !== values.confirm_password
              ? "Passwords do not match"
              : null,
        };
      }
      if (active === 1) {
        return {
          major: !values.major ? "Major is required" : null,
          year: values.year < 1 || values.year > 6 ? "Invalid year" : null,
        };
      }
      return {};
    },
  });

  const nextStep = () => {
    const validation = form.validate();
    if (!validation.hasErrors) {
      setActive((current) => (current < 2 ? current + 1 : current));
    }
  };

  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { confirm_password, ...formData } = form.values;
      await register(formData, "student");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^a-zA-Z\d]/.test(password)) strength += 25;
    return strength;
  };

  const strength = passwordStrength(form.values.password);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "var(--bg-light)",
        paddingTop: 40,
        paddingBottom: 40,
      }}
    >
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack gap="xl">
            <Stack align="center" gap="xs">
              <Title order={1} size={30}>
                Student Registration
              </Title>
              <Text size="lg" c="dimmed">
                Create your account to start learning
              </Text>
            </Stack>

            <GlassCard hoverEffect={false} w={{ base: "100%", sm: "55vw" }} padding="xl">
              <Stepper active={active} onStepClick={setActive}>
                <Stepper.Step
                  label="Personal Info"
                  description="Basic details"
                  icon={<FaUser />}
                >
                  <Stack gap="md" mt="xl">
                    <Group grow>
                      <TextInput
                        label="First Name"
                        placeholder="John"
                        required
                        {...form.getInputProps("first_name")}
                      />
                      <TextInput
                        label="Last Name"
                        placeholder="Doe"
                        required
                        {...form.getInputProps("last_name")}
                      />
                    </Group>

                    <TextInput
                      label="Email"
                      placeholder="john.doe@university.edu"
                      type="email"
                      required
                      {...form.getInputProps("email")}
                    />

                    <TextInput
                      label="Phone Number"
                      placeholder="+234 800 000 0000"
                      {...form.getInputProps("phone")}
                    />

                    <PasswordInput
                      label="Password"
                      placeholder="Enter password"
                      required
                      {...form.getInputProps("password")}
                    />

                    {form.values.password && (
                      <div>
                        <Text size="xs" mb={5}>
                          Password Strength
                        </Text>
                        <div
                          style={{
                            height: 8,
                            background: "#e9ecef",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${strength}%` }}
                            style={{
                              height: "100%",
                              background:
                                strength < 50
                                  ? "#E0245E"
                                  : strength < 75
                                  ? "#FFAD1F"
                                  : "#17BF63",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <PasswordInput
                      label="Confirm Password"
                      placeholder="Confirm password"
                      required
                      {...form.getInputProps("confirm_password")}
                    />
                  </Stack>
                </Stepper.Step>

                <Stepper.Step
                  label="Academic Info"
                  description="Education details"
                  icon={<FaGraduationCap />}
                >
                  <Stack gap="md" mt="xl">
                    <TextInput
                      label="Student ID"
                      placeholder="ST12345"
                      {...form.getInputProps("student_id")}
                    />

                    <TextInput
                      label="Major"
                      placeholder="Computer Science"
                      required
                      {...form.getInputProps("major")}
                    />

                    <NumberInput
                      label="Year of Study"
                      placeholder="1"
                      min={1}
                      max={6}
                      required
                      {...form.getInputProps("year")}
                    />

                    <TextInput
                      label="Institution"
                      placeholder="University of Lagos"
                      {...form.getInputProps("institution")}
                    />
                  </Stack>
                </Stepper.Step>

                <Stepper.Completed>
                  <Stack gap="md" mt="xl" align="center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          background: "#1DA1F2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 48,
                        }}
                      >
                        ✓
                      </div>
                    </motion.div>
                    <Title order={3}>Ready to Start!</Title>
                    <Text ta="center" c="dimmed">
                      Click the button below to create your account and begin
                      your learning journey
                    </Text>
                  </Stack>
                </Stepper.Completed>
              </Stepper>

              <Group justify="space-between" mt="xl">
                {active > 0 && active < 2 && (
                  <Button variant="default" onClick={prevStep}>
                    Back
                  </Button>
                )}
                {active < 2 && (
                  <Button onClick={nextStep} ml="auto">
                    Next
                  </Button>
                )}
                {active === 2 && (
                  <Button
                    onClick={handleSubmit}
                    loading={loading}
                    fullWidth
                    ml="auto"
                    color="twitterBlue"
                  >
                    Create Account
                  </Button>
                )}
              </Group>
            </GlassCard>
          </Stack>
        </motion.div>
      </Container>
    </div>
  );
}
