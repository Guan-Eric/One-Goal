// context/PremiumContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as storage from "../storage";
import Purchases from "react-native-purchases";

export type ThemeId =
    | "default"
    | "midnight"
    | "forest"
    | "ocean"
    | "sunset"
    | "rose"
    | "gold"
    | "lavender";

export type Theme = {
    id: ThemeId;
    name: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    primary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    success: string;
    incomplete: string;
    accentLabel: string; // short label for display
};

export const THEMES: Theme[] = [
    {
        id: "default",
        name: "Default",
        accentLabel: "B&W",
        background: "#000000",
        surface: "#0a0a0a",
        surfaceElevated: "#151515",
        border: "#1f1f1f",
        primary: "#ffffff",
        textPrimary: "#ffffff",
        textSecondary: "#a0a0a0",
        textMuted: "#666666",
        success: "#00ff00",
        incomplete: "#ff0000",
    },
    {
        id: "midnight",
        name: "Midnight",
        accentLabel: "Blue",
        background: "#0a0e1a",
        surface: "#0d1220",
        surfaceElevated: "#141826",
        border: "#1e2535",
        primary: "#4a9eff",
        textPrimary: "#e8eeff",
        textSecondary: "#8899bb",
        textMuted: "#556688",
        success: "#00d4aa",
        incomplete: "#ff6b6b",
    },
    {
        id: "forest",
        name: "Forest",
        accentLabel: "Green",
        background: "#0a120a",
        surface: "#0d160d",
        surfaceElevated: "#141f14",
        border: "#1e2e1e",
        primary: "#4caf72",
        textPrimary: "#e8f5e8",
        textSecondary: "#88aa88",
        textMuted: "#557755",
        success: "#66dd66",
        incomplete: "#ff7777",
    },
    {
        id: "ocean",
        name: "Ocean",
        accentLabel: "Teal",
        background: "#030f12",
        surface: "#061318",
        surfaceElevated: "#0b1e24",
        border: "#122a32",
        primary: "#00bcd4",
        textPrimary: "#e0f7fa",
        textSecondary: "#80b8c4",
        textMuted: "#4d8892",
        success: "#00e5aa",
        incomplete: "#ff6b8a",
    },
    {
        id: "sunset",
        name: "Sunset",
        accentLabel: "Orange",
        background: "#120a00",
        surface: "#180e00",
        surfaceElevated: "#221500",
        border: "#332000",
        primary: "#ff8c42",
        textPrimary: "#fff3e0",
        textSecondary: "#cc9966",
        textMuted: "#996644",
        success: "#ffcc44",
        incomplete: "#ff4466",
    },
    {
        id: "rose",
        name: "Rose",
        accentLabel: "Pink",
        background: "#120008",
        surface: "#18000c",
        surfaceElevated: "#220010",
        border: "#330018",
        primary: "#ff4d8a",
        textPrimary: "#ffe0ee",
        textSecondary: "#cc6688",
        textMuted: "#994466",
        success: "#ff80aa",
        incomplete: "#ff4444",
    },
    {
        id: "gold",
        name: "Gold",
        accentLabel: "Gold",
        background: "#0f0a00",
        surface: "#150e00",
        surfaceElevated: "#1e1500",
        border: "#2e2000",
        primary: "#ffc107",
        textPrimary: "#fff8e1",
        textSecondary: "#ccaa44",
        textMuted: "#997722",
        success: "#aae000",
        incomplete: "#ff6b35",
    },
    {
        id: "lavender",
        name: "Lavender",
        accentLabel: "Purple",
        background: "#0a0812",
        surface: "#0e0c18",
        surfaceElevated: "#141020",
        border: "#1e1830",
        primary: "#9c6dff",
        textPrimary: "#ede8ff",
        textSecondary: "#8877bb",
        textMuted: "#665599",
        success: "#66ddbb",
        incomplete: "#ff6b88",
    },
];

type PremiumContextType = {
    isPremium: boolean;
    setIsPremium: (val: boolean) => void;
    activeTheme: Theme;
    selectedThemeId: ThemeId;
    setTheme: (id: ThemeId) => void;
    refreshPremiumStatus: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextType>({
    isPremium: false,
    setIsPremium: () => { },
    activeTheme: THEMES[0],
    selectedThemeId: "default",
    setTheme: () => { },
    refreshPremiumStatus: async () => { },
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
    const [isPremium, setIsPremium] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("default");

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const user = await storage.getUser();
        setIsPremium(user?.isPremium || false);
        const savedTheme = await storage.getTheme();
        if (savedTheme) setSelectedThemeId(savedTheme as ThemeId);
    }

    async function refreshPremiumStatus() {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const hasPremium = !!customerInfo.entitlements.active["premium"];
            setIsPremium(hasPremium);
            const user = await storage.getUser();
            if (user) await storage.saveUser({ ...user, isPremium: hasPremium });
        } catch {
            const user = await storage.getUser();
            setIsPremium(user?.isPremium || false);
        }
    }

    async function setTheme(id: ThemeId) {
        setSelectedThemeId(id);
        await storage.saveTheme(id);
    }

    const activeTheme = THEMES.find((t) => t.id === selectedThemeId) ?? THEMES[0];

    return (
        <PremiumContext.Provider
            value={{ isPremium, setIsPremium, activeTheme, selectedThemeId, setTheme, refreshPremiumStatus }}
        >
            {children}
        </PremiumContext.Provider>
    );
}

export function usePremium() {
    return useContext(PremiumContext);
}