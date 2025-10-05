import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Top from "@/components/top";
import Button from "@/components/Button";
import { router, useLocalSearchParams } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { resendOTP, verifyOTP, verifyOTPAndCreate } from "@/lib/api/auth";
import OtpExpiredOverlay from "@/components/OtpExpiredOverlay";
import { useAuthStore } from "@/store/authStore";

const Verification = () => {
  const { otpToken, clearOtp, isOtpExpired, setAuth , setOtpToken} = useAuthStore();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!otpToken) return;

    const intervalId = setInterval(() => {
      if (isOtpExpired()) {
        clearOtp();
        setShowOverlay(true);
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [otpToken]);

  const {refetch:refetchResend,error:errorResend} = useBackend({fn:resendOTP});
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { refetch, loading, error } = useBackend({ fn: verifyOTP });
  const { refetch: refetchCreate, loading: loadingCreate, error: errorCreate } =
  useBackend({ fn: verifyOTPAndCreate });

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputsRef = useRef<(TextInput | null)[]>([]);

  const otpValue = otp.join("");
  const handleContinue = async () => {
    try {
      if (!otpToken) return;

      if (mode === "reset") {
        const res = await refetch({ otp: otpValue, otpToken });
        if (res?.email) {
          router.push({
            pathname: "/reset-password",
            params: { email: res.email },
          });
        } 
      } else {
        const res = await refetchCreate({ otp: otpValue, otpToken });
        if (res?.accessToken && res?.refreshToken && res?.userId && res?.role) {
          setAuth({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            userId: res.userId,
            role: res.role,
          });
          router.push("/onboarding");
        } 
      }
    } catch (err: any) {
      alert(err.message || "Failed to verify OTP.");
    }
  };

  const handleOverlay = () => {
    if (mode === "reset") {
      router.replace("/forgot-password");
    } else {
      router.replace("/signup");
    }
  };

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < otp.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleResend = async() => {
    try{
        setTimer(30);
        setCanResend(false);
        const res = await refetchResend({otpToken: otpToken ?? ""});
        if (res?.otpToken) {
            setOtpToken(res.otpToken);
        }
    }catch(err:any){
      alert(err.message || "Failed to resend OTP. Please try again.");
    }
    
  };

  return (
    <>
      <OtpExpiredOverlay visible={showOverlay} onPress={handleOverlay} />

      <SafeAreaView style={styles.container}>
        <Top
          label="Enter your Verification Code"
          onBack={() => router.push("/forgot-password")}
        />

        <View style={styles.content}>
          <Text style={styles.instruction}>
            Please input the 4 digit verification code sent to your email
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpBoxWrapper}>
                <View style={styles.otpBoxShadow} />
                <TextInput
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  style={styles.otpBox}
                />
              </View>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {errorCreate && <Text style={styles.errorText}>{errorCreate}</Text>}
          {errorResend && <Text style={styles.errorText}>{errorResend}</Text>}

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>You didn't receive any code?</Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendButton}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendCountdown}>Resend in {timer}s</Text>
            )}
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            label={loading || loadingCreate ? "Verifying OTP..." : "Continue"}
            onPress={handleContinue}
            variant="solid"
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Verification;

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
    fontFamily: "KodchasanSemiBold",
  },
  instruction: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  otpBoxWrapper: {
    width: 68,
    height: 68,
    position: "relative",
  },
  otpBoxShadow: {
    position: "absolute",
    top: 2,
    left: 2,
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#ffffff",
    zIndex: -1,
  },
  otpBox: {
    position: "absolute",
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 20,
    borderWidth: 3,
    borderColor: "#553434",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontFamily: "KodchasanMedium",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    fontFamily: "KodchasanMedium",
    color: "#553434",
  },
  resendButton: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
  resendCountdown: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: "KodchasanSemiBold",
    color: "#888888",
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
