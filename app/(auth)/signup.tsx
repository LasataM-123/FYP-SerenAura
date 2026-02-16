import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import * as AuthSession from "expo-auth-session";
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
import Constants from "expo-constants";


// --- AUTH IMPORTS ---
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { API_URL, GOOGLE_CLIENT_ID, WEB_CLIENT_ID } from "@/config";

// 1. Initialize Browser
WebBrowser.maybeCompleteAuthSession();

const Signup = () => {
  const { setOtpToken, setAuth, loggedIn } = useAuthStore();
  const { refetch, loading, error } = useBackend({
    fn: signup,
  });
   const [isGoogleLoading, setGoogleLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    password: "",
  });
    const fadeAnim = useRef(new Animated.Value(0)).current;
   const isExpoGo = Constants.appOwnership === "expo";
  const expoProxyRedirectUri = "https://auth.expo.io/@lasatam/frontendui";
   // --- 3. GOOGLE HOOK ---
    const [request, response, promptAsync] = Google.useAuthRequest({
      ...(isExpoGo
        ? {
          clientId: WEB_CLIENT_ID,
          webClientId: WEB_CLIENT_ID,
          androidClientId: WEB_CLIENT_ID,
          iosClientId: WEB_CLIENT_ID,
          redirectUri: expoProxyRedirectUri,
          responseType: "token",
          shouldAutoExchangeCode: false,
        }
        : {
          webClientId: WEB_CLIENT_ID,
          androidClientId: GOOGLE_CLIENT_ID || WEB_CLIENT_ID,
          iosClientId: GOOGLE_CLIENT_ID || WEB_CLIENT_ID,
        }),
      scopes: ["openid", "profile", "email"],
    });

     useEffect(() => {
        const isVisible = loading || isGoogleLoading;
        Animated.timing(fadeAnim, {
          toValue: isVisible ? 1 : 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, [loading, isGoogleLoading]);

    useEffect(() => {
        if (isExpoGo) return;
    
        if (response?.type === "success") {
          const { authentication } = response;
          const idToken = authentication?.idToken || response.params?.id_token;
          const accessToken = authentication?.accessToken || response.params?.access_token;
    
          if (idToken || accessToken) {
            handleGoogleLogin(idToken, accessToken);
          } else {
            alert("Login Failed: No token received");
            setGoogleLoading(false);
          }
        } else if (response?.type === "error") {
          alert("Google Auth Error: " + response.error?.message);
          setGoogleLoading(false);
        } else if (response) {
          setGoogleLoading(false);
        }
      }, [response, isExpoGo]);
    
      // --- BACKEND HANDLER ---
      const handleGoogleLogin = async (idToken: string | undefined, accessToken: string | undefined) => {
        setGoogleLoading(true);
    
        try {
          const res = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, accessToken }),
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
            name: data.name,
          });
          loggedIn();
          if (data.role === "counselor") {
            router.replace("/(counselor)/requests");
          } else {
            router.replace("/(tabs)/home");
          }
        
        } catch (err: any) {
          alert(err.message || "Google Login Failed");
        } finally {
          setGoogleLoading(false);
        }
      };



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
          onPress={async () => {
            if (!request) return;
            setGoogleLoading(true);
            try {
              if (isExpoGo) {
                if (!request.url) {
                  throw new Error("Google request URL is not ready. Please try again.");
                }

                const appReturnUrl = AuthSession.makeRedirectUri({
                  path: "auth-callback",
                });

                const proxyStartUrl = `${expoProxyRedirectUri}/start?${new URLSearchParams({
                  authUrl: request.url,
                  returnUrl: appReturnUrl,
                }).toString()}`;

                const rawResult = await WebBrowser.openAuthSessionAsync(
                  proxyStartUrl,
                  appReturnUrl
                );

                if (rawResult.type === "success") {
                  const parsed = request.parseReturnUrl(rawResult.url);

                  if (parsed.type === "success") {
                    const idToken = parsed.authentication?.idToken || parsed.params?.id_token;
                    const accessToken =
                      parsed.authentication?.accessToken || parsed.params?.access_token;

                    if (idToken || accessToken) {
                      await handleGoogleLogin(idToken, accessToken);
                    } else {
                      alert("Login Failed: No token received");
                      setGoogleLoading(false);
                    }
                  } else if (parsed.type === "error") {
                    alert(parsed.error?.message || "Google Auth Error");
                    setGoogleLoading(false);
                  } else {
                    setGoogleLoading(false);
                    alert("Google Auth Error");
                  }
                } else if (rawResult.type === "cancel" || rawResult.type === "dismiss") {
                  setGoogleLoading(false);
                } else {
                  setGoogleLoading(false);
                  alert("Google sign-in was interrupted");
                }
              } else {
                await promptAsync();
              }
            } catch (err: any) {
              alert(err?.message || "Google sign-in failed");
              setGoogleLoading(false);
            }
          }}
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
