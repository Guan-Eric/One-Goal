// app/(onboarding)/welcome.tsx
import { View, Text, Pressable, Dimensions, useColorScheme, ColorValue } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(onboarding)/philosophy");
  };

  // Determine button and icon color based on color scheme
  const buttonGradientColors =
    colorScheme === "dark"
      ? ["#202020", "#222222"]
      : ["#000000", "#080808"];
  const buttonTextColor = colorScheme === "dark" ? "#ffffff" : "#ffffff";

  return (
    <View className="flex-1 bg-background">
      {/* Ambient Background */}
      <View className="absolute inset-0 opacity-30">
      </View>

      {/* Content */}
      <View className="flex-1 px-8 justify-center">
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <View className="items-center mb-16">
            {/* Large Circle Icon */}
            <View className="w-32 h-32 rounded-full bg-primary items-center justify-center mb-8">
            </View>

            <Text className="text-text-primary text-7xl font-bold text-center mb-4">
              One Goal
            </Text>

            <Text className="text-text-secondary text-2xl text-center leading-relaxed">
              The simplest way to{"\n"}build discipline
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
          <View className="space-y-6">
            <FeatureItem
              icon="numeric-1-circle"
              title="One goal per day"
              description="No lists. No overwhelm. Just focus."
              iconColor={colorScheme === "dark" ? "#ffffff" : "#000000"}
            />

            <FeatureItem
              icon="gesture-tap"
              title="Tap to complete"
              description="Mark it done. Feel the satisfaction."
              iconColor={colorScheme === "dark" ? "#ffffff" : "#000000"}
            />

            <FeatureItem
              icon="fire"
              title="Build your streak"
              description="Consistency compounds into results."
              iconColor={colorScheme === "dark" ? "#ffffff" : "#000000"}
            />
          </View>
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(1000).duration(800)}
        className="px-8 pb-12"
      >
        <Pressable
          onPress={handleContinue}
          className="overflow-hidden rounded-full shadow-lg"
        >
          <LinearGradient
            colors={buttonGradientColors as [ColorValue, ColorValue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 20 }}
          >
            <Text
              style={{ color: buttonTextColor }}
              className="text-center text-xl font-semibold"
            >
              Continue
            </Text>
          </LinearGradient>
        </Pressable>

        <Text className="text-text-muted text-center text-sm mt-6">
          No account needed to start
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  iconColor
}: {
  icon: string;
  title: string;
  description: string;
  iconColor: string;
}) {
  return (
    <View className="flex-row items-start">
      <View className="w-12 h-12 rounded-2xl bg-surface-elevated items-center justify-center mr-4 mt-1">
        <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary text-xl font-semibold mb-1">
          {title}
        </Text>
        <Text className="text-text-secondary text-base leading-relaxed">
          {description}
        </Text>
      </View>
    </View>
  );
}
