import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import Top from "@/components/top";
import CustomInput from "@/components/CustomInput";
import Button from "@/components/Button";
import { Link, router } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { addDOB, forgotPassword } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";

const Dob = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [dob, setDob] = useState("");
  const {refetch, loading, error } = useBackend({
    fn:addDOB
  });

  const handleSubmit = async () => {
    try {
      const res = await refetch({dateOfBirth: dob, accessToken});
      if (res?.success) {
        router.push("/onboarding");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send code. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Top label="When’s Your Birthday?" onBack={() => router.push("/login")} />

      <View style={styles.content}>
        <Text style={styles.instruction}>
          Your date of birth helps us create a more tailored experience just for you.
        </Text>

        <CustomInput
          placeholder="Date of Birth (yyyy-mm-dd)"
          value={dob}
          onChangeText={(text) => setDob(text)}
          keyboardType="numeric"
        />

        {/* {error && <Text style={styles.errorText}>{error}</Text>} */}

        <View style={styles.buttonWrapper}>
          <Button
            label="Continue"
            onPress={handleSubmit}
            variant="solid"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dob;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  content: {
    marginTop: 24,
    gap: 16
    ,
  },
  instruction: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    marginBottom:20,
  },
  errorText: {
    color: "red",
    fontFamily: "KodchasanMedium",
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
