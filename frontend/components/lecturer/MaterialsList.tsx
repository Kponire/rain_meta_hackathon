"use client";

import { useState } from "react";
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Modal,
  Button,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  FaFilePdf,
  FaFileImage,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileAlt,
  FaEllipsisV,
  FaEye,
  FaDownload,
  FaEdit,
  FaTrash,
  FaRobot,
  FaClock,
} from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { notifications } from "@mantine/notifications";
interface Material {
  id: string;
  title: string;
  content: string;
  material_type: string;
  file_url?: string;
  is_ai_generated: boolean;
  created_at: string;
  metadata?: any;
}
interface MaterialsListProps {
  materials: Material[];
  onRefresh: () => void;
}
export function MaterialsList({ materials, onRefresh }: MaterialsListProps) {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FaFilePdf color="#E0245E" size={24} />;
      case "powerpoint":
        return <FaFilePowerpoint color="#FFAD1F" size={24} />;
      case "video":
        return <FaFileVideo color="#794BC4" size={24} />;
      case "image":
        return <FaFileImage color="#17BF63" size={24} />;
      default:
        return <FaFileAlt color="#1DA1F2" size={24} />;
    }
  };
  const handleView = (material: Material) => {
    setSelectedMaterial(material);
    setViewModalOpen(true);
  };
  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      // await apiClient.courses.deleteMaterial(materialId);
      notifications.show({
        title: "Material Deleted",
        message: "The material has been removed from your course",
        color: "green",
      });
      onRefresh();
    } catch (error) {
      notifications.show({
        title: "Delete Failed",
        message: "Failed to delete material",
        color: "red",
      });
    }
  };
  if (materials.length === 0) {
    return (
      <GlassCard padding="xl">
        <Stack align="center" gap="lg">
          <div style={{ fontSize: 80 }}>📭</div>
          <Text size="xl" fw={700} ta="center">
            No Materials Yet
          </Text>
          <Text c="dimmed" ta="center" maw={500}>
            Start by generating materials with AI or uploading your own files.
            Your materials will appear here for easy management.
          </Text>
        </Stack>
      </GlassCard>
    );
  }
  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Course Materials Library
          </Text>
          <Text size="sm" c="dimmed">
            {materials.length} material{materials.length !== 1 ? "s" : ""} in
            this course
          </Text>
        </div>
        <Badge
          size="lg"
          variant="gradient"
          gradient={{ from: "twitterBlue", to: "purple", deg: 135 }}
        >
          {materials.filter((m) => m.is_ai_generated).length} AI Generated
        </Badge>
      </Group>
      {/* Materials Grid */}
      <Stack gap="md">
        {materials.map((material, index) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card padding="lg" radius="lg" withBorder>
              <Group align="flex-start" wrap="nowrap">
                {/* Icon */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    background: "rgba(29, 161, 242, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {getMaterialIcon(material.material_type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb="xs">
                    <Text fw={700} size="lg" lineClamp={1}>
                      {material.title}
                    </Text>
                    {material.is_ai_generated && (
                      <Badge size="sm" leftSection={<FaRobot />} color="purple">
                        AI Generated
                      </Badge>
                    )}
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                    {material.content?.substring(0, 150)}...
                  </Text>

                  <Group gap="md">
                    <Group gap="xs">
                      <FaClock size={12} color="#657786" />
                      <Text size="xs" c="dimmed">
                        {new Date(material.created_at).toLocaleDateString()}
                      </Text>
                    </Group>
                    <Badge size="sm" variant="light">
                      {material.material_type}
                    </Badge>
                    {material.metadata?.key_concepts && (
                      <Badge size="sm" variant="light" color="green">
                        {material.metadata.key_concepts.length} Key Concepts
                      </Badge>
                    )}
                  </Group>
                </div>

                {/* Actions */}
                <Group gap="xs">
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<FaEye />}
                    onClick={() => handleView(material)}
                  >
                    View
                  </Button>

                  {material.file_url && (
                    <ActionIcon
                      variant="light"
                      size="lg"
                      component="a"
                      href={material.file_url}
                      download
                    >
                      <FaDownload />
                    </ActionIcon>
                  )}

                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="light" size="lg">
                        <FaEllipsisV />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<FaEdit />}>Edit</Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<FaTrash />}
                        color="red"
                        onClick={() => handleDelete(material.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>
            </Card>
          </motion.div>
        ))}
      </Stack>

      {/* View Material Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedMaterial?.title}
        size="xl"
        centered
      >
        {selectedMaterial && (
          <Stack gap="md">
            <Group>
              <Badge>{selectedMaterial.material_type}</Badge>
              {selectedMaterial.is_ai_generated && (
                <Badge color="purple" leftSection={<FaRobot />}>
                  AI Generated
                </Badge>
              )}
            </Group>

            {selectedMaterial.metadata?.key_concepts && (
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Key Concepts:
                </Text>
                <Group gap="xs">
                  {selectedMaterial.metadata.key_concepts.map(
                    (concept: string, i: number) => (
                      <Badge key={i} variant="light">
                        {concept}
                      </Badge>
                    )
                  )}
                </Group>
              </div>
            )}

            <div
              style={{
                maxHeight: 500,
                overflowY: "auto",
                padding: "1rem",
                background: "var(--bg-light)",
                borderRadius: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedMaterial.content}
            </div>

            {selectedMaterial.file_url && (
              <Button
                fullWidth
                leftSection={<FaDownload />}
                component="a"
                href={selectedMaterial.file_url}
                download
              >
                Download File
              </Button>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
