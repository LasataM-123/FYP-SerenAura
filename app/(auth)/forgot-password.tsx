import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import Top from "@/components/top";
import CustomInput from "@/components/CustomInput";
import Button from "@/components/Button";
import { Link, router } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { forgotPassword } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPassword = () => {
  const { setOtpToken } = useAuthStore();
  const { refetch, loading, error } = useBackend({
    fn: forgotPassword,
  });

  const [form, setForm] = useState({ email: "" });

  const handleSubmit = async () => {
    try {
      const res = await refetch(form);
      if (res?.otpToken) {
        setOtpToken(res.otpToken);
        router.push({
          pathname: "/verification-code",
          params: { mode: "reset" },
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to send code. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Top label="Forgot your Password?" onBack={() => router.push("/login")} />

      <View style={styles.content}>
        <Text style={styles.instruction}>
          Enter your registered email below, we’ll send 4 digit code to your email.
        </Text>

        <CustomInput
          placeholder="Email"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonWrapper}>
          <Button
            label={loading ? "Sending Code..." : "Send Code"}
            onPress={handleSubmit}
            variant="solid"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 16,
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
