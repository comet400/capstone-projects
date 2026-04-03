import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, IconSizes } from "@/constants/design";

interface ScreenHeaderProps {
    subtitle?: string;
    title?: string;
    showAvatar?: boolean;
    style?: ViewStyle;
}

const DEFAULT_AVATAR = require("@/assets/images/home/featured.jpg");

export function ScreenHeader({
    subtitle = "Welcome back",
    title = "MORGAN MAXWELL",
    showAvatar = true,
    style
}: ScreenHeaderProps) {
    return (
        <View style={[styles.container, style]}>
            {/* Menu Button */}
            <Pressable style={styles.menuBtn}>
                <Ionicons name="menu" size={IconSizes.lg} color={Colors.icon} />
            </Pressable>

            {/* Center Content */}
            <View style={styles.centerContent}>
                {showAvatar && (
                    <Image source={DEFAULT_AVATAR} style={styles.avatar} />
                )}
                <View style={styles.textContainer}>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                    <Text style={styles.title}>{title}</Text>
                </View>
            </View>

            {/* Action Button (Crown) */}
            <Pressable style={styles.actionBtn}>
                <Ionicons name="ribbon-outline" size={IconSizes.md} color={Colors.iconDark} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.screenPadding,
        marginTop: Spacing.md,
        marginBottom: Spacing.md,
    },
    menuBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    centerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    textContainer: {
        alignItems: "flex-start",
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: Typography.sizes.xs,
        fontWeight: Typography.weights.medium,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.bold,
        letterSpacing: 0.5,
    },
});
