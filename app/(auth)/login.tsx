import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Keyboard
} from "react-native";
import { Link, router } from "expo-router";

import Top from "@/components/top";
import CustomInput from "@/components/CustomInput";
import Button from "@/components/Button";
import { images } from "@/constants";
import { useBackend } from "@/lib/useBackend";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { API_URL, GOOGLE_CLIENT_ID, WEB_CLIENT_ID } from "@/config";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const { setAuth, loggedIn } = useAuthStore();
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { refetch, loading, error } = useBackend({
    fn: login,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });
  useEffect(() => {
    if (response) {
      if (response.type === "success") {
        const { id_token } = response.params;
        handleGoogleLogin(id_token);
      } else {
        // Handle error or cancel
        console.log("Google Auth Response Error:", response);
      }
    }
  }, [response]);
  useEffect(() => {
    if (loading || isGoogleLoading) {
      Keyboard.dismiss();
    }
  }, [loading, isGoogleLoading]);

  const handleGoogleLogin = async (idToken:string) => {
    setGoogleLoading(true);
    try {
     
      const res = await fetch(`${API_URL}/users/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to sign in with Google");
      }
      setAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          userId: data.userId,
          role: data.role,
          name:data.name,
        });
      if(data?.isNewUser){
        router.push('/dob');
      }  
    } catch (err:any) {
      console.error("Error logging in:", err.message);
    }finally{
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await refetch(form);
      if (res?.accessToken && res?.refreshToken && res?.userId && res?.role) {
        setAuth({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          userId: res.userId,
          role: res.role,
          name:res.name
        });
        loggedIn();
        if(res.role==='counselor'){
          router.replace('/requests');
        }else{
         router.replace('/home')
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to login. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Top label="Welcome Back" onBack={() => router.push("/welcome")} />

      {/* Form Section */}
      <View style={styles.formSection}>
        <View style={styles.inputsContainer}>
          <CustomInput
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
          />
          <CustomInput
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.forgotRow}>
          <Text style={styles.smallDarkText}>Remember Me</Text>
          <Text
            style={styles.smallDarkText}
            onPress={() => router.push("./forgot-password")}
          >
            Forgot Password?
          </Text>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonSection}>
        <Button label="Login" onPress={handleLogin} variant="solid" />

        <View style={styles.signupRow}>
          <Text style={styles.textDarkMedium}>Don’t have an account? </Text>
          <Link href="/signup" asChild>
            <Text style={styles.textDarkBold}>Sign Up</Text>
          </Link>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <Button
          label="Sign In with Google"
          onPress={() => promptAsync()}
          variant="outline"
          imageSource={images.google}
        />
      </View>

      {/* Loading Overlay */}
    {(loading || isGoogleLoading) && (
  <View style={styles.overlay}>
    <View style={styles.cardWrapper}>
      {/* Shadow Layer */}
      <View style={styles.cardShadowLayer} />

      {/* Main Card */}
      <View style={styles.cardMain}>
        <ActivityIndicator size="large" color="#8B4B4B" />
        <Text style={styles.loggingText}>Logging In...</Text>
      </View>
    </View>
  </View>
)}

    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  formSection: {
    marginTop: 64,
    flexDirection: "column",
    gap: 16,
  },

  inputsContainer: {
    flexDirection: "column",
    gap: 24,
  },

  errorText: {
    color: "red",
    fontFamily: "KodchasanMedium",
  },

  forgotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  smallDarkText: {
    color: "#553434",
    fontSize: 14,
    fontFamily: "KodchasanSemiBold",
  },

  buttonSection: {
    flexDirection: "column",
    gap: 8,
    marginTop: 32,
  },

  signupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop:8,
  },

  textDarkMedium: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 16,
  },

  textDarkBold: {
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    fontSize: 18,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#553434",
  },

  dividerText: {
    marginHorizontal: 12,
    color: "#553434",
    fontFamily: "KodchasanMedium",
  },

 overlay: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
},

cardWrapper: {
  position: "relative",
  width: 255,
  height: 180,
  justifyContent: "center",
  alignItems: "center",
},

cardShadowLayer: {
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: 20,
  borderWidth: 3,
  borderColor: "#553434",
  backgroundColor: "#553434",
  top: 3,
  left: 3,
},

cardMain: {
  width: "100%",
  height: "100%",
  borderRadius: 20,
  borderWidth: 3,
  borderColor: "#553434",
  backgroundColor: "#FFF",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
},

loggingText: {
  marginTop: 20,
  fontFamily: "Schoolbell",
  fontSize: 20,
  color: "#553434",
  textAlign: "center",
},

});
