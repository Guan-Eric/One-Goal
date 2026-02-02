// app/(onboarding)/demo.tsx
import { View, Text, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function DemoScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [demoGoal, setDemoGoal] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step === 1 && demoGoal.trim()) {
      setStep(2);
    } else if (step === 2) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setStep(3), 1000);
    } else if (step === 3) {
      router.push("/(onboarding)/paywall");
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Progress Dots */}
      <View className="px-8 pt-16 flex-row justify-center space-x-2">
        <View className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-surface-elevated'}`} />
        <View className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-surface-elevated'}`} />
        <View className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-surface-elevated'}`} />
      </View>

      <View className="flex-1 px-8 justify-center">
        {/* Step 1: Set Goal */}
        {step === 1 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <Text className="text-text-secondary text-sm mb-4 text-center uppercase tracking-wider">
              Try it now
            </Text>
            
            <Text className="text-text-primary text-4xl font-bold mb-2 text-center">
              What's your goal{"\n"}for today?
            </Text>
            
            <Text className="text-text-secondary text-lg mb-12 text-center">
              Make it specific and achievable
            </Text>

            <View className="mb-8">
              <TextInput
                value={demoGoal}
                onChangeText={setDemoGoal}
                placeholder="Example: Write for 30 minutes"
                placeholderTextColor="#666666"
                maxLength={100}
                multiline
                autoFocus
                className="text-text-primary text-2xl text-center min-h-[80px] bg-surface-elevated rounded-2xl p-6"
                style={{ fontFamily: "System" }}
              />
            </View>

            <Pressable
              onPress={handleNext}
              disabled={!demoGoal.trim()}
              className={`py-5 rounded-full ${
                demoGoal.trim() ? 'bg-primary' : 'bg-surface-elevated'
              }`}
            >
              <Text className={`text-center text-xl font-semibold ${
                demoGoal.trim() ? 'text-background' : 'text-text-muted'
              }`}>
                Set Goal
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Step 2: Complete Goal */}
        {step === 2 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <Text className="text-text-secondary text-sm mb-4 text-center uppercase tracking-wider">
              Your goal for today
            </Text>
            
            <Pressable
              onPress={handleNext}
              disabled={isCompleted}
              className="mb-12"
            >
              <View className="flex-row items-start justify-center">
                <Animated.View
                  entering={ZoomIn.duration(300)}
                  className={`w-10 h-10 rounded-full mr-4 mt-2 items-center justify-center ${
                    isCompleted ? 'bg-success' : 'border-2 border-text-secondary'
                  }`}
                >
                  {isCompleted && (
                    <MaterialCommunityIcons name="check" size={24} color="#000000" />
                  )}
                </Animated.View>

                <View className="flex-1">
                  <Text
                    className={`text-3xl leading-tight text-center ${
                      isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
                    }`}
                    style={{ fontFamily: "System" }}
                  >
                    {demoGoal}
                  </Text>
                </View>
              </View>
            </Pressable>

            {!isCompleted && (
              <Animated.View entering={FadeIn.delay(500).duration(400)}>
                <Text className="text-text-muted text-center text-base mb-4">
                  👆 Tap to mark as complete
                </Text>
                
                <View className="bg-surface-elevated rounded-2xl p-4">
                  <Text className="text-text-secondary text-sm text-center">
                    In the real app, this is your main screen.{"\n"}
                    One tap. That's it.
                  </Text>
                </View>
              </Animated.View>
            )}

            {isCompleted && (
              <Animated.View entering={ZoomIn.delay(200).duration(600)}>
                <View className="items-center">
                  <Text className="text-5xl mb-4">🎉</Text>
                  <Text className="text-text-primary text-3xl font-bold text-center mb-2">
                    Goal Complete!
                  </Text>
                  <Text className="text-success text-xl text-center">
                    1 day streak
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View className="items-center mb-12">
              <View className="w-24 h-24 rounded-full bg-success/20 items-center justify-center mb-6">
                <MaterialCommunityIcons name="check-circle" size={64} color="#00ff00" />
              </View>
              
              <Text className="text-text-primary text-4xl font-bold text-center mb-4">
                You get it
              </Text>
              
              <Text className="text-text-secondary text-xl text-center leading-relaxed mb-8">
                That's the entire app.{"\n"}
                Simple. Focused. Effective.
              </Text>

              <View className="bg-surface-elevated rounded-2xl p-6 w-full">
                <Text className="text-text-primary text-lg font-semibold mb-4 text-center">
                  What you'll unlock:
                </Text>
                
                <BenefitItem icon="history" text="Full goal history" />
                <BenefitItem icon="cloud-sync" text="Sync across devices" />
                <BenefitItem icon="chart-line" text="Advanced statistics" />
                <BenefitItem icon="palette" text="Beautiful themes" />
              </View>
            </View>

            <Pressable
              onPress={handleNext}
              className="bg-primary py-5 rounded-full"
            >
              <Text className="text-background text-center text-xl font-semibold">
                Continue to Premium
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function BenefitItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <MaterialCommunityIcons name={icon as any} size={20} color="#ffffff" />
      <Text className="text-text-secondary ml-3 text-base">{text}</Text>
    </View>
  );
}
