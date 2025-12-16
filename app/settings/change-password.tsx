import { View, Text, StyleSheet, StatusBar } from "react-native";
import React, { useCallback, useState } from "react";
import Top from "@/components/top";
import CustomInput from "@/components/CustomInput";
import Button from "@/components/Button";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Overlay from "@/components/Overlay";
import { images } from "@/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { changePassword } from "@/lib/api/auth";
import { useBackend } from "@/lib/useBackend";

const ChangePassword = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [form, setForm] = useState({oldPassword:"", newPassword: "", confirmPassword: "" });
  const {refetch, loading, error} = useBackend({
    fn:changePassword
  })
  const handleSubmit = async() => {
    try{
      const res = await refetch({oldPassword:form.oldPassword,newPassword:form.newPassword,confirmPassword:form.confirmPassword});
      if(res?.success){
        setShowOverlay(true);
      }
    }catch(err:any){
      alert(err.message || "Failed to reset password. Please try again.");
    }
  }
  useFocusEffect(
      useCallback(() => {
            StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#ffffff");
        
      }, [])
    );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Top label="Change Password" onBack={() => router.back()} />

        <View style={styles.content}>

          <CustomInput
            placeholder="Old password"
            value={form.oldPassword}
            secureTextEntry={true}
            onChangeText={(text) => setForm({ ...form, oldPassword: text })}
          />
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
          title="Password Updated!"
          description="Your password has been updated successfully!"
          label="Continue"
          imageSource={images.passwordUpdated}
          onPress={() => {
            setShowOverlay(false);
            router.back();
          }}
        />
      )}
    </>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  content: {
    marginTop: 40,
    gap: 16,
  },
 
  buttonWrapper: {
    marginTop: 32,
  },
  errorText: {
    color: "red",
    fontFamily: "KodchasanMedium",
  },
});
