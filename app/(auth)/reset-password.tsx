import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import Top from "@/components/top";
import CustomInput from "@/components/CustomInput";
import Button from "@/components/Button";
import { router, useLocalSearchParams } from "expo-router";
import Overlay from "@/components/Overlay";
import { images } from "@/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { resetPassword } from "@/lib/api/auth";
import { useBackend } from "@/lib/useBackend";

const ResetPassword = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [showOverlay, setShowOverlay] = useState(false);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const {refetch, loading, error} = useBackend({
    fn:resetPassword
  })
  const handleSubmit = async() => {
    try{
      const res = await refetch({email:email,newPassword:form.newPassword,confirmPassword:form.confirmPassword});
      if(res?.success){
        setShowOverlay(true);
      }
    }catch(err:any){
      alert(err.message || "Failed to reset password. Please try again.");
    }
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Top label="Reset Password" onBack={() => router.push("/login")} />

        <View style={styles.content}>
          <Text style={styles.instruction}>
            Enter your new password and do remember this!
          </Text>

          <CustomInput
            placeholder="New password"
            value={form.newPassword}
            secureTextEntry={true}
            onChangeText={(text) => setForm({ ...form, newPassword: text })}
          />

          <CustomInput
            placeholder="Retype New Password"
            secureTextEntry={true}
            value={form.confirmPassword}
            onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.buttonWrapper}>
          <Button
            label={loading ? "Saving Changes..." : "Save Changes"}
            onPress={handleSubmit}
            variant="solid"
          />
        </View>
      </SafeAreaView>

      {showOverlay && (
        <Overlay
          title="Password Changed!"
          description="Your password has been updated successfully!"
          label="Back to Login"
          imageSource={images.passwordUpdated}
          onPress={() => {
            setShowOverlay(false);
            router.push("/login");
          }}
        />
      )}
    </>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  content: {
    marginTop: 24,
    gap: 16,
  },
  instruction: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Kodchasan-SemiBold",
    color: "#553434",
    marginBottom: 20,
  },
  buttonWrapper: {
    marginTop: 32,
  },
  errorText: {
    color: "red",
    fontFamily: "KodchasanMedium",
  },
});
