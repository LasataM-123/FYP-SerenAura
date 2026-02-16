import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { Link, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- IMPORTS ---
import Button from "@/components/Button";
import CustomInput from "@/components/CustomInput";
import Top from "@/components/top";
import { API_URL, GOOGLE_CLIENT_ID, WEB_CLIENT_ID } from "@/config";
import { images } from "@/constants";
import { login } from "@/lib/api/auth";
import { useBackend } from "@/lib/useBackend";
import { useAuthStore } from "@/store/authStore";

// --- AUTH IMPORTS ---
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

// 1. Initialize Browser
WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const { setAuth, loggedIn } = useAuthStore();
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { refetch, loading, error } = useBackend({ fn: login });
  const [rememberMe, setRememberMe] = useState(false);

  // Fade animation setup
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

  // --- 4. CHECK FOR SAVED EMAIL ON LOAD ---
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("remembered_email");
        if (savedEmail) {
          setForm((prev) => ({ ...prev, email: savedEmail }));
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Failed to load email", e);
      }
    };
    loadRememberedEmail();
  }, []);

  // --- 5. HANDLE GOOGLE RESPONSE ---
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

  // --- NORMAL LOGIN HANDLER ---
  const handleLogin = async () => {
    Keyboard.dismiss(); // <--- ADDED THIS LINE

    try {
      // Handle Remember Me Logic BEFORE logging in
      if (rememberMe) {
        await AsyncStorage.setItem("remembered_email", form.email);
      } else {
        await AsyncStorage.removeItem("remembered_email");
      }

      const res = await refetch(form);
      if (res?.accessToken) {
        setAuth({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          userId: res.userId,
          role: res.role,
          name: res.name,
        });
        loggedIn();
        if (res.role === "counselor") {
          router.replace("/(counselor)/requests");
        } else {
          router.replace("/(tabs)/home");
        }
      }
    } catch (err) {
      console.log("Login execution error", err);
    }
  };

  // UI Helpers
  useEffect(() => {
    const isVisible = loading || isGoogleLoading;
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [loading, isGoogleLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <Top label="Welcome Back" onBack={() => router.push("/welcome")} />

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
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkedBox]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.smallDarkText}>Remember Me</Text>
          </TouchableOpacity>

          <Text
            style={styles.smallDarkText}
            onPress={() => router.push("./forgot-password")}
          >
            Forgot Password?
          </Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <Button label="Login" onPress={handleLogin} variant="solid" />

        <View style={styles.signupRow}>
          <Text style={styles.textDarkMedium}>Don’t have an account? </Text>
          <Link href="/signup" asChild>
            <Text style={styles.textDarkBold}>Sign Up</Text>
          </Link>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
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

      <Animated.View
        pointerEvents={loading || isGoogleLoading ? "auto" : "none"}
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <View style={styles.cardWrapper}>
          <View style={styles.cardShadowLayer} />
          <View style={styles.cardMain}>
            <ActivityIndicator size="large" color="#8B4B4B" />
            <Text style={styles.loggingText}>Logging In...</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
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
    marginTop: 2,
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#555",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "1px 1px 0px rgb(85, 52, 52)",
  },
  checkedBox: {
    backgroundColor: "#553434",
    borderColor: "#553434",
    boxShadow: "1px 1px 0px rgb(85, 52, 52)",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});