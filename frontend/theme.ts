import { createTheme, MantineColorsTuple } from "@mantine/core";

const twitterBlue: MantineColorsTuple = [
  "#e1f5fe",
  "#b3e5fc",
  "#81d4fa",
  "#4fc3f7",
  "#29b6f6",
  "#1DA1F2",
  "#0288d1",
  "#0277bd",
  "#01579b",
  "#013b67",
];

const purple: MantineColorsTuple = [
  "#f3e5f5",
  "#e1bee7",
  "#ce93d8",
  "#ba68c8",
  "#ab47bc",
  "#794BC4",
  "#8e24aa",
  "#7b1fa2",
  "#6a1b9a",
  "#4a148c",
];

export const theme = createTheme({
  primaryColor: "twitterBlue",
  colors: {
    twitterBlue,
    purple,
  },
  fontFamily:
    "Nunito Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, Courier New, monospace",
  headings: {
    fontFamily:
      "Nunito Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: {
        fontSize: "2.5rem",
        lineHeight: "1.2" /*letterSpacing: '-0.02em'*/,
      },
      h2: { fontSize: "2rem", lineHeight: "1.3" /*letterSpacing: '-0.01em'*/ },
      h3: {
        fontSize: "1.5rem",
        lineHeight: "1.4" /*letterSpacing: '-0.01em'*/,
      },
      h4: { fontSize: "1.25rem", lineHeight: "1.5" },
      h5: { fontSize: "1.125rem", lineHeight: "1.5" },
      h6: { fontSize: "1rem", lineHeight: "1.5" },
    },
  },
  defaultRadius: "md",
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  shadows: {
    xs: "0 1px 3px rgba(29, 161, 242, 0.05)",
    sm: "0 2px 8px rgba(29, 161, 242, 0.08)",
    md: "0 4px 20px rgba(29, 161, 242, 0.1)",
    lg: "0 8px 30px rgba(29, 161, 242, 0.15)",
    xl: "0 12px 40px rgba(29, 161, 242, 0.2)",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: "all 0.2s ease",
        },
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
        withBorder: true,
      },
      styles: {
        root: {
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 30px rgba(29, 161, 242, 0.15)",
          },
        },
      },
    },
    Input: {
      styles: {
        input: {
          transition: "all 0.2s ease",
          "&:focus": {
            borderColor: "#1DA1F2",
            boxShadow: "0 0 0 2px rgba(29, 161, 242, 0.1)",
          },
        },
      },
    },
    Modal: {
      styles: {
        content: {
          backdropFilter: "blur(10px)",
        },
      },
    },
  },
});
