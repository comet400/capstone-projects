
export const Colors = {
    background: "#121212",
    surface: "#1E1E1E",
    surfaceHighlight: "#2A2A2A",
    primary: "#2AA8FF",
    secondary: "#BFFF5A",
    text: "#FFFFFF",
    textSecondary: "#9B9B9B",
    icon: "#FFFFFF",
    iconDark: "#0D0F10",
    success: "#4ADE80",
    warning: "#FACC15",
    danger: "#FF3B30",
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    screenPadding: 16,
};

export const Typography = {
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        display: 32,
    },
    weights: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
    } as const, // Cast to const to satisfy TextStyle types
};

export const IconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};
