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
  FileInput,
  Group,
  Badge,
  Paper,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaBriefcase, FaCheckCircle, FaIdCard } from "react-icons/fa";
import { useAuth } from "@/components/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LecturerRegistrationPage() {
  const [active, setActive] = useState(0);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | null
  >(null);

  const form = useForm({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      department: "",
      institution: "",
      phone: "",
      title: "",
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
          confirm_password:
            values.password !== values.confirm_password
              ? "Passwords do not match"
              : null,
          institution: !values.institution ? "Institution is required" : null,
          department: !values.department ? "Department is required" : null,
          title: !values.title ? "Title is required" : null,
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
      await register(formData, "lecturer");
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
              <Title order={1} size={35}>
                Lecturer Registration
              </Title>
              <Text size="lg" c="dimmed">
                Join our community of educators
              </Text>
              {verificationStatus && (
                <Badge
                  size="lg"
                  color={verificationStatus === "verified" ? "green" : "yellow"}
                  leftSection={
                    verificationStatus === "verified" ? <FaCheckCircle /> : null
                  }
                >
                  {verificationStatus === "verified"
                    ? "Verified"
                    : "Pending Verification"}
                </Badge>
              )}
            </Stack>

            <GlassCard hoverEffect={false} w={"55vw"} padding="xl">
              <Stepper
                active={active}
                onStepClick={setActive} /*breakpoint="sm"*/
              >
                <Stepper.Step
                  label="Professional Info"
                  description="Your details"
                  icon={<FaUser />}
                >
                  <Stack gap="md" mt="xl">
                    <Group grow>
                      <Select
                        label="Academic Title"
                        placeholder="Select title"
                        required
                        data={[
                          { value: "mr", label: "Mr." },
                          { value: "mrs", label: "Mrs." },
                          { value: "ms", label: "Ms." },
                          { value: "dr", label: "Dr." },
                          { value: "prof", label: "Prof." },
                        ]}
                        {...form.getInputProps("title")}
                      />
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

                    <TextInput
                      label="Institution"
                      placeholder="University of Lagos"
                      required
                      {...form.getInputProps("institution")}
                    />

                    <TextInput
                      label="Department"
                      placeholder="Computer Science"
                      required
                      {...form.getInputProps("department")}
                    />
                  </Stack>
                </Stepper.Step>

                <Stepper.Step
                  label="Verification"
                  description="Confirm identity"
                  icon={<FaIdCard />}
                >
                  <Stack gap="md" mt="xl">
                    <Paper
                      p="md"
                      withBorder
                      style={{ background: "rgba(29, 161, 242, 0.05)" }}
                    >
                      <Stack gap="xs">
                        <Text fw={600} c="twitterBlue">
                          Identity Verification Required
                        </Text>
                        <Text size="sm" c="dimmed">
                          To ensure the integrity of our platform, we require
                          verification of your academic credentials. Please
                          upload your institutional ID or faculty card.
                        </Text>
                      </Stack>
                    </Paper>

                    <FileInput
                      label="Institutional ID / Faculty Card"
                      description="Upload a clear photo or scan of your ID"
                      placeholder="Choose file"
                      accept="image/*,application/pdf"
                      required
                      onChange={setIdDocument}
                      leftSection={<FaIdCard />}
                    />

                    {idDocument && (
                      <Paper p="sm" withBorder>
                        <Group>
                          <FaCheckCircle color="#17BF63" />
                          <div>
                            <Text size="sm" fw={600}>
                              {idDocument.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {(idDocument.size / 1024).toFixed(2)} KB
                            </Text>
                          </div>
                        </Group>
                      </Paper>
                    )}

                    <Paper p="md" withBorder>
                      <Stack gap="xs">
                        <Text fw={600}>Verification Status</Text>
                        <Badge color="yellow" size="lg">
                          Pending Review
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Your documents will be reviewed within 24-48 hours.
                          You'll receive an email notification once verified.
                        </Text>
                      </Stack>
                    </Paper>
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
                    <Title order={3}>Ready to Inspire!</Title>
                    <Text ta="center" c="dimmed" maw={500}>
                      Your account will be created and your verification
                      documents will be reviewed. You can start creating courses
                      immediately, but some features will be unlocked after
                      verification.
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
                  <Button
                    style={{ paddingInline: "70px" }}
                    color="twitterBlue"
                    onClick={nextStep}
                    ml="auto"
                  >
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
