import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const onboardingData = [
  {
    id: 1,
    question: "How did you hear about us?",
    answers: ["Friend", "Social Media", "Search Engine", "Other"],
  },
  {
    id: 2,
    question: "What’s your main goal?",
    answers: ["Reduce stress", "Sleep better", "Track mood", "Meditation"],
  },
  {
    id: 3,
    question: "How often do you practice relaxation?",
    answers: ["Never", "Sometimes", "Often", "Daily"],
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const nextStep = () => {
    if (step < onboardingData.length - 1) {
      setStep(step + 1);
      setSelectedAnswer(null);
    } else {
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <View style={styles.topBar}>
        <Text style={styles.invisibleText}>.</Text>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[styles.progressDot, index === step && styles.activeDot]}
          />
        ))}
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {onboardingData[step].question}
        </Text>

        {/* Answers */}
        <FlatList
          data={onboardingData[step].answers}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedAnswer(item)}
              style={[
                styles.answerButton,
                selectedAnswer === item && styles.selectedAnswerButton,
              ]}
            >
              <Text style={styles.answerText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        disabled={!selectedAnswer}
        onPress={nextStep}
        style={[
          styles.continueButton,
          selectedAnswer ? styles.continueButtonActive : styles.continueButtonDisabled,
        ]}
      >
        <Text style={styles.continueButtonText}>
          {step === onboardingData.length - 1 ? "Get Started" : "Continue"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  invisibleText: {
    color: "transparent",
  },
  skipText: {
    color: "#6B7280", // gray-500
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 8,
  },
  progressDot: {
    height: 6, // 1.5 * 4
    width: 40, // 10 * 4
    borderRadius: 3,
    backgroundColor: "#D1D5DB", // gray-300
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#5C3A21", // brown-800
  },
  questionContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: 32,
  },
  questionText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937", // gray-800
    marginBottom: 32,
  },
  answerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9CA3AF", // gray-400
    backgroundColor: "#F3F4F6", // gray-100
  },
  selectedAnswerButton: {
    backgroundColor: "#BBF7D0", // green-200
    borderColor: "#15803D", // green-700
  },
  answerText: {
    textAlign: "center",
    color: "#1F2937", // gray-800
    fontSize: 16,
  },
  continueButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  continueButtonActive: {
    backgroundColor: "#BBF7D0", // green-200
    borderColor: "#000000",
  },
  continueButtonDisabled: {
    backgroundColor: "#D1D5DB", // gray-300
    borderColor: "#9CA3AF", // gray-400
  },
  continueButtonText: {
    textAlign: "center",
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
  },
});
