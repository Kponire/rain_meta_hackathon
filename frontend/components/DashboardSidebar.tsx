"use client";

import {
  Stack,
  Text,
  UnstyledButton,
  Group,
  Avatar,
  Menu,
  Badge,
  Divider,
  ActionIcon,
} from "@mantine/core";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaBook,
  FaClipboardList,
  FaFileAlt,
  FaVideo,
  FaCalculator,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaLightbulb,
  FaPlus,
} from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface DashboardSidebarProps {
  role: "student" | "lecturer";
  currentCourse?: {
    id: string;
    title: string;
    code: string;
  };
  courses?: Array<{
    id: string;
    title: string;
    code: string;
  }>;
}

export function DashboardSidebar({
  role,
  currentCourse,
  courses = [],
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const studentNavItems: NavItem[] = [
    { icon: <FaHome />, label: "Dashboard", path: `/dashboard/student` },
    {
      icon: <FaBook />,
      label: "Course Materials",
      path: `/dashboard/student/materials`,
    },
    {
      icon: <FaLightbulb />,
      label: "Self Study",
      path: `/dashboard/student/self-study`,
    },
    {
      icon: <FaClipboardList />,
      label: "Assignments",
      path: `/dashboard/student/assignments`,
      badge: 3,
    },
    {
      icon: <FaFileAlt />,
      label: "Tests",
      path: `/dashboard/student/tests`,
      badge: 1,
    },
    {
      icon: <FaVideo />,
      label: "Video Understanding",
      path: `/dashboard/student/video`,
    },
    {
      icon: <FaCalculator />,
      label: "LaTeX Generator",
      path: `/dashboard/student/latex`,
    },
  ];

  const lecturerNavItems: NavItem[] = [
    { icon: <FaHome />, label: "Dashboard", path: `/dashboard/lecturer` },
    {
      icon: <FaBook />,
      label: "Course Materials",
      path: `/dashboard/lecturer/materials`,
    },
    {
      icon: <FaClipboardList />,
      label: "Assignments",
      path: `/dashboard/lecturer/assignments`,
    },
    { icon: <FaFileAlt />, label: "Tests", path: `/dashboard/lecturer/tests` },
    {
      icon: <FaVideo />,
      label: "Video Understanding",
      path: `/dashboard/lecturer/video`,
    },
    {
      icon: <FaCalculator />,
      label: "LaTeX Generator",
      path: `/dashboard/lecturer/latex`,
    },
    {
      icon: <FaChartBar />,
      label: "Analytics",
      path: `/dashboard/lecturer/analytics`,
    },
  ];

  const navItems = role === "student" ? studentNavItems : lecturerNavItems;

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      style={{
        height: "100vh",
        background: "var(--surface-light)",
        borderRight: "1px solid #e9ecef",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 70,
          width: "100%",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Text
              size="xl"
              fw={700}
              style={{
                background: "linear-gradient(135deg, #1DA1F2 0%, #794BC4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MyClassAgent
            </Text>
          </motion.div>
        )}
        <ActionIcon
          variant="subtle"
          onClick={() => setCollapsed(!collapsed)}
          size="lg"
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </ActionIcon>
      </div>

      <Divider />

      {/* Course Selector (for students) */}
      {role === "student" && !collapsed && currentCourse && (
        <div style={{ padding: "16px" }}>
          <Menu shadow="md" width={250}>
            <Menu.Target>
              <UnstyledButton
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(29, 161, 242, 0.1)",
                  border: "1px solid rgba(29, 161, 242, 0.2)",
                }}
              >
                <Group justify="space-between">
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">
                      Current Course
                    </Text>
                    <Text size="sm" fw={600} truncate>
                      {currentCourse.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {currentCourse.code}
                    </Text>
                  </div>
                  <FaChevronDown size={12} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Switch Course</Menu.Label>
              {courses.map((course) => (
                <Menu.Item
                  key={course.id}
                  onClick={() =>
                    router.push(`/dashboard/student?course=${course.id}`)
                  }
                >
                  <div>
                    <Text size="sm" fw={500}>
                      {course.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {course.code}
                    </Text>
                  </div>
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item
                leftSection={<FaPlus />}
                onClick={() => router.push("/courses/enroll")}
              >
                Enroll in New Course
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {/* Navigation Items */}
      <Stack gap={4} style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
        {navItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <UnstyledButton
                onClick={() => router.push(item.path)}
                style={{
                  width: "100%",
                  padding: collapsed ? "12px" : "12px 16px",
                  borderRadius: 8,
                  background: isActive ? "#1DA1F2" : "transparent",
                  color: isActive ? "white" : "#1DA1F2",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
              >
                <Group gap="md" style={{ width: "100%" }}>
                  <div
                    style={{
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <>
                      <Text size="sm " fw={500} style={{ flex: 1 }}>
                        {item.label}
                      </Text>
                      {item.badge && (
                        <Badge size="sm" color="red" variant="filled">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Group>
              </UnstyledButton>
            </motion.div>
          );
        })}
      </Stack>
      <Divider />

      {/* User Profile */}
      <div style={{ padding: "16px" }}>
        <Menu shadow="md" width={250}>
          <Menu.Target>
            <UnstyledButton
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
              }}
            >
              <Group>
                <Avatar
                  name={user?.first_name + " " + user?.last_name}
                  radius="xl"
                  color="initials"
                >
                  {role === "student" ? (
                    <FaUserGraduate />
                  ) : (
                    <FaChalkboardTeacher />
                  )}
                </Avatar>
                {!collapsed && (
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={600} truncate>
                      {user?.first_name} {user?.last_name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {user?.email}
                    </Text>
                  </div>
                )}
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item
              leftSection={<FaCog />}
              onClick={() => router.push("/settings")}
            >
              Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<FaSignOutAlt />}
              color="red"
              onClick={logout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </motion.div>
  );
}
