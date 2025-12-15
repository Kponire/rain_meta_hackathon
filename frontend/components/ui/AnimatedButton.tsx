"use client";

import { Button, ButtonProps } from "@mantine/core";
import { motion } from "framer-motion";
import { useState } from "react";

interface AnimatedButtonProps extends ButtonProps {
  glowing?: boolean;
}

export function AnimatedButton({ glowing, ...restProps }: AnimatedButtonProps) {
  const { children, style, styles, ...buttonProps } = restProps;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Button
        {...buttonProps}
        style={{
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
        styles={{
          ...styles,
          root: {
            "&::before": glowing
              ? {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(135deg, rgba(29, 161, 242, 0.5), rgba(121, 75, 196, 0.5))",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  borderRadius: "inherit",
                  zIndex: -1,
                  filter: "blur(10px)",
                }
              : {},
          },
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
}
