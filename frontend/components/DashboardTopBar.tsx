"use client";

import {
  Group,
  TextInput,
  ActionIcon,
  Indicator,
  Menu,
  Text,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { FaSearch, FaBell, FaMoon, FaSun } from "react-icons/fa";
import { useState } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

interface DashboardTopBarProps {
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

export function DashboardTopBar({ breadcrumbs = [] }: DashboardTopBarProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Assignment",
      message: "Data Structures assignment has been posted",
      time: "5m ago",
      read: false,
      type: "info",
    },
    {
      id: "2",
      title: "Grade Posted",
      message: "Your Algorithm test has been graded: 95/100",
      time: "1h ago",
      read: false,
      type: "success",
    },
    {
      id: "3",
      title: "Deadline Reminder",
      message: "Machine Learning project due in 2 days",
      time: "3h ago",
      read: true,
      type: "warning",
    },
  ]);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div
      style={{
        height: 70,
        borderBottom: "0.01px solid #e9ecef",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        background: "var(--surface-light)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Group justify="space-between" style={{ width: "100%" }}>
        {/* Breadcrumbs */}
        <div>
          {breadcrumbs.length > 0 && (
            <Breadcrumbs>
              {breadcrumbs.map((item, index) => (
                <Anchor
                  key={index}
                  href={`${item.href}`}
                  style={{ cursor: item.href ? "pointer" : "default" }}
                >
                  {item.title}
                </Anchor>
              ))}
            </Breadcrumbs>
          )}
        </div>

        <Group gap="md">
          {/* Search */}
          <TextInput
            placeholder="Search..."
            leftSection={<FaSearch size={14} />}
            styles={{
              input: {
                width: 250,
              },
            }}
          />

          {/* Theme Toggle */}
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() =>
              setColorScheme(colorScheme === "dark" ? "light" : "dark")
            }
          >
            {colorScheme === "dark" ? (
              <FaSun size={18} />
            ) : (
              <FaMoon size={18} />
            )}
          </ActionIcon>

          {/* Notifications */}
          <Menu shadow="md" width={350} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <Indicator
                  color="red"
                  label={unreadCount}
                  disabled={unreadCount === 0}
                  size={16}
                >
                  <FaBell size={18} />
                </Indicator>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Group justify="space-between" p="sm">
                <Text fw={600}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text
                    size="xs"
                    c="twitterBlue"
                    style={{ cursor: "pointer" }}
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Text>
                )}
              </Group>
              <Menu.Divider />

              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Text size="sm" c="dimmed">
                    No notifications
                  </Text>
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {notifications.map((notification) => (
                    <Menu.Item
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        background: notification.read
                          ? "transparent"
                          : "rgba(29, 161, 242, 0.05)",
                        padding: "12px 16px",
                      }}
                    >
                      <Group align="flex-start" gap="xs">
                        <div style={{ flex: 1 }}>
                          <Group justify="space-between" mb={4}>
                            <Text size="sm" fw={600}>
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "#1DA1F2",
                                }}
                              />
                            )}
                          </Group>
                          <Text size="xs" c="dimmed" mb={4}>
                            {notification.message}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {notification.time}
                          </Text>
                        </div>
                      </Group>
                    </Menu.Item>
                  ))}
                </div>
              )}

              <Menu.Divider />
              <Menu.Item
                style={{ textAlign: "center" }}
                onClick={() => router.push("/notifications")}
              >
                <Text size="sm" c="twitterBlue">
                  View all notifications
                </Text>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </div>
  );
}
