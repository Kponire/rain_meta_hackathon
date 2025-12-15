"use client";

import { Card, CardProps } from "@mantine/core";
import { motion } from "framer-motion";

interface GlassCardProps extends CardProps {
  hoverEffect?: boolean;
}

export function GlassCard({
  hoverEffect = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card
        {...props}
        className={`glass ${props.className || ""}`}
        style={{
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          ...props.style,
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
}
