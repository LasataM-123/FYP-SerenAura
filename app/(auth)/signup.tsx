import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import Top from "@/components/top";
import CustomInput from "@/components/CustomInput";
import Button from "@/components/Button";
import { Link, router } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { signup } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "@/constants";
import { ScrollView } from "react-native";

const Signup = () => {
  const { setOtpToken } = useAuthStore();
  const { refetch, loading, error } = useBackend({
    fn: signup,
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    password: "",
  });

  const handleSignUp = async () => {
    try {
      const res = await refetch(form);
      if (res?.otpToken) {
        setOtpToken(res.otpToken);
        router.push({
          pathname: "/verification-code",
          params: { mode: "signUp" },
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to sign up. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 30, paddingHorizontal: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      
        <Top
          label="Create your Relaxation Account"
          onBack={() => router.push("/welcome")}
        />

        {/* Form Section */}
        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Full Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
          <CustomInput
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
          />
          <CustomInput
            placeholder="Date of Birth (yyyy-mm-dd)"
            value={form.dateOfBirth}
            onChangeText={(text) => setForm({ ...form, dateOfBirth: text })}
            keyboardType="numeric"
          />
          <CustomInput
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <Button
            label={loading ? "Signing up..." : "Sign Up"}
            onPress={handleSignUp}
            variant="solid"
          />

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Text style={styles.signInLink}>Sign In</Text>
            </Link>
          </View>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <Button
            label="Sign In with Google"
            onPress={() => {}}
            variant="outline"
            imageSource={images.google}
          />
        </View>
    </ScrollView>
  </KeyboardAvoidingView>
  </SafeAreaView>
);

};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  formContainer: {
    marginTop: 30,
    gap: 16,
  },
  
  errorText: {
    color: "red",
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 8,
  },
  signInContainer: {
    flexDirection: "row",
    marginTop: 2,
    alignItems: "center",
  },
  signInText: {
    fontSize: 16,
    color: "#553434",
    fontFamily: "KodchasanMedium",
  },
  signInLink: {
    fontSize: 18,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#553434",
  },
  orText: {
    marginHorizontal: 12,
    color: "#553434",
    fontFamily: "KodchasanMedium",
  },
});
