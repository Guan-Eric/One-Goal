// app/(onboarding)/philosophy.tsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function PhilosophyScreen() {
  const router = useRouter();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(onboarding)/demo");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pt-20">
          {/* Header */}
          <Animated.View entering={FadeInRight.delay(100).duration(600)}>
            <Text className="text-text-primary text-5xl font-bold mb-4">
              Why one goal?
            </Text>
            <Text className="text-text-secondary text-xl leading-relaxed mb-12">
              Because constraints create clarity
            </Text>
          </Animated.View>

          {/* Philosophy Points */}
          <Animated.View entering={FadeInRight.delay(300).duration(600)}>
            <PhilosophyCard
              number="1"
              title="Too many goals = zero goals"
              description="When everything is important, nothing is. One goal forces you to choose what truly matters today."
              icon="filter-remove"
            />
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(450).duration(600)}>
            <PhilosophyCard
              number="2"
              title="Small daily wins compound"
              description="Grand visions fail. Tiny consistent actions succeed. One goal per day = 365 goals per year."
              icon="trending-up"
            />
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(600).duration(600)}>
            <PhilosophyCard
              number="3"
              title="Completion builds momentum"
              description="Checking off your goal releases dopamine. Daily wins create a positive feedback loop."
              icon="lightning-bolt"
            />
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(750).duration(600)}>
            <PhilosophyCard
              number="4"
              title="Simplicity reduces friction"
              description="No categories. No priorities. No overwhelm. Just: What's the one thing today?"
              icon="circle-slice-8"
            />
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-8 pb-12 bg-background">
        <Pressable
          onPress={handleContinue}
          className="bg-primary py-5 rounded-full shadow-lg"
        >
          <Text className="text-background text-center text-xl font-semibold">
            I'm ready
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PhilosophyCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <View className="mb-8 bg-surface-elevated rounded-3xl p-6 border border-border">
      <View className="flex-row items-start mb-4">
        <View className="w-14 h-14 rounded-full bg-primary items-center justify-center mr-4">
          <Text className="text-background text-2xl font-bold">{number}</Text>
        </View>
        <View className="flex-1 pt-2">
          <MaterialCommunityIcons 
            name={icon as any} 
            size={32} 
            color="#ffffff" 
            style={{ position: 'absolute', right: 0, top: 0, opacity: 0.1 }}
          />
        </View>
      </View>
      
      <Text className="text-text-primary text-2xl font-bold mb-3">
        {title}
      </Text>
      
      <Text className="text-text-secondary text-lg leading-relaxed">
        {description}
      </Text>
    </View>
  );
}
