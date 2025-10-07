import React, { use, useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AnswerCard from "@/components/AnswerCard";
import Button from "@/components/Button";
import { images } from "@/constants";
import { useBackend } from "@/lib/useBackend";
import { createOnboarding } from "@/lib/api/onboarding";
import { useAuthStore } from "@/store/authStore";

const onboardingData = [
  {
    id: 1,
    question: "What brings you here today?",
    answers: [
      { label: "To reduce stress", image: images.onboarding1Image1 },
      { label: "To sleep better", image: images.onboarding1Image2 },
      { label: "To improve focus", image: images.onboarding1Image3 },
      { label: "To feel happier", image: images.onboarding1Image4 },
    ],
  },
  {
    id: 2,
    question: "How do you prefer to relax?",
    answers: [
      { label: "Listening music", image: images.onboarding2Image1 },
      { label: "Guided Meditation", image: images.onboarding2Image2 },
      { label: "Breathing exercises", image: images.onboarding2Image3 },
      { label: "Journaling thoughts", image: images.onboarding2Image4 },
    ],
  },
  {
    id: 3,
    question: "When do you need relaxation the most?",
    answers: [
      { label: "Anxious Moments", image: images.onboarding3Image1 },
      { label: "After stress", image: images.onboarding3Image2 },
      { label: "During work/study", image: images.onboarding3Image3 },
      { label: "Before Bed", image: images.onboarding3Image4 },
    ],
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const {refetch, loading} = useBackend({
    fn: createOnboarding
  })

  // go to next step
  const nextStep = async () => {
    if (!selectedAnswer) return;

    // store answer
    const updatedAnswers = [...answers];
    updatedAnswers[step] = selectedAnswer;
    setAnswers(updatedAnswers);

    // if not last step → move to next
    if (step < onboardingData.length - 1) {
      setStep(step + 1);
      setSelectedAnswer(null);
    } else {
      // last step → submit answers to backend
      await handleSubmit(updatedAnswers);
    }
  };
   const backStep = () => {
    if (step === 0) {
      router.replace("/onboarding"); 
    } else {
      setStep(step - 1);
      setSelectedAnswer(null);
    }
  };

  const skipStep = () => {
    if (step < onboardingData.length - 1) {
      setStep(step + 1);
      setSelectedAnswer(null);
    } else {
      router.replace("/final-onboarding");
    }
  };

  const handleSubmit = async (finalAnswers: string[]) => {
    try {
      const payload = onboardingData.map((q, i) => ({
        question: q.question,
        answer: finalAnswers[i] || "Skipped",
      }));

    const res = await refetch({ responses: payload , accessToken}); //send to backend
    if(res?.onboarding){
      router.push("/final-onboarding");
    }
    } catch (err:any) {
      alert(err.message || "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableWithoutFeedback onPress={backStep}>
          <Image source={images.arrowBack} style={styles.backImage}/>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={skipStep}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableWithoutFeedback>
      </View>

      {/* Progress Bar */}
     <View style={styles.progressContainer}>
  {[...Array(5)].map((_, index) => (
    <View
      key={index}
      style={[
        styles.progressDot,
        index <= step + 1 && styles.activeDot, // fill all previous + current
      ]}
    />
  ))}
</View>


      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {onboardingData[step].question}
        </Text>

        <FlatList
          data={onboardingData[step].answers}
          keyExtractor={(item) => item.label}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", gap:12 }}
          contentContainerStyle={styles.answersGrid}
          renderItem={({ item }) => (
            <AnswerCard
              item={item}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          )}
        />
      </View>

      {/* Continue Button */}
      <TouchableWithoutFeedback
  disabled={!selectedAnswer || loading} // disable press
  onPress={nextStep}
>
  <View style={{ opacity: !selectedAnswer || loading ? 0.6 : 1 }}>
  <View style={styles.buttonContaner}>
    <Button
      label="Continue"
      onPress={nextStep}
    />
  </View>
  </View>
</TouchableWithoutFeedback>
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
  backImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  skipText: { color: "#553434", fontWeight: "600", fontFamily: "KodchasanSemiBold" },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 8,
  },
  progressDot: {
  height: 6,
  width: 55,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#553434",
  marginHorizontal: 4,
  shadowColor: "#553434",
  shadowOffset: { width: 2, height: 0 }, 
  shadowOpacity: 1, 
  shadowRadius: 0, 
  elevation: 2, 
},
  activeDot: { backgroundColor: "#553434", borderRadius: 3 },
  questionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  questionText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#553434",
    marginBottom: 48,
    fontFamily: "KodchasanSemiBold",
  },
  answersGrid: { alignItems: "center", justifyContent: "center" },
  buttonContaner:{
    marginBottom :32,
  }
});
