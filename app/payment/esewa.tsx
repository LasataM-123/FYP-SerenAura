import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  Text,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";

// API Imports
import { subscribePatient } from "@/lib/api/subscription";
import { getProfile } from "@/lib/api/auth";

// UI Imports
import Button from "@/components/Button";

// eSewa Config
const ESEWA_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

const normalize = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v ?? "";

export default function PaymentGatewayScreen() {
  const params = useLocalSearchParams();

  const amount = normalize(params.amount);
  const uuid = normalize(params.uuid);
  const signature = normalize(params.signature);
  const product_code = normalize(params.product_code);
  const planType = normalize(params.planType);

  // State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoiceUri, setInvoiceUri] = useState<string | null>(null);

  const hasHandled = useRef(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const res = await getProfile();
        if (res?.success && res?.profile?.email) {
          setUserEmail(res.profile.email);
        }
      } catch (error) {
        console.log("Could not fetch user email", error);
      }
    };
    fetchUserEmail();
  }, []);
  const handleSuccess = async () => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    setIsProcessing(true);

    try {
      await subscribePatient({
        pid: uuid,
        subscriptionType: planType,
      });

      const html = `
        <html>
          <body style="padding: 40px; font-family: Helvetica; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #553434; margin: 0;">SerenAura</h1>
              <p style="color: #666; margin: 5px 0;">Subscription Invoice</p>
            </div>

            <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <p><strong>Billed To:</strong> ${userEmail || "Valued Customer"}</p>
              <p><strong>Plan:</strong> ${planType} Subscription</p>
              <hr style="border-top: 1px solid #eee; margin: 20px 0;" />

              <p style="display: flex; justify-content: space-between;">
                <span>Transaction ID:</span>
                <strong>${uuid}</strong>
              </p>
              <p style="display: flex; justify-content: space-between;">
                <span>Date:</span>
                <strong>${new Date().toLocaleDateString()}</strong>
              </p>
              <p style="display: flex; justify-content: space-between; font-size: 1.2em; margin-top: 20px;">
                <span>Total Paid:</span>
                <strong style="color: #553434;">NPR ${amount}</strong>
              </p>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
              <p>Thank you for choosing SerenAura.</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setInvoiceUri(uri);

      setPaymentSuccess(true);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Notice",
        error?.message || "Payment processed, but activation failed."
      );
      router.replace("/home");
    } finally {
      setIsProcessing(false);
    }
  };


  const handleDownload = async () => {
    if (invoiceUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(invoiceUri);
    } else {
      Alert.alert("Error", "Sharing not available on this device");
    }
  };

  const esewaHTML = `
    <html>
      <body onload="document.f1.submit()">
        <form name="f1" action="${ESEWA_URL}" method="POST">
          <input type="hidden" name="amount" value="${amount}" />
          <input type="hidden" name="tax_amount" value="0" />
          <input type="hidden" name="total_amount" value="${amount}" />
          <input type="hidden" name="transaction_uuid" value="${uuid}" />
          <input type="hidden" name="product_code" value="${product_code}" />
          <input type="hidden" name="product_service_charge" value="0" />
          <input type="hidden" name="product_delivery_charge" value="0" />
          <input type="hidden" name="success_url" value="https://google.com/payment/success" />
          <input type="hidden" name="failure_url" value="https://google.com/payment/failure" />
          <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
          <input type="hidden" name="signature" value="${signature}" />
        </form>
      </body>
    </html>
  `;


  if (isProcessing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#553434" />
        <Text style={{ marginTop: 20, color: "#666" }}>
          Confirming Payment...
        </Text>
      </View>
    );
  }

  if (paymentSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.invoiceContainer}>
          <View style={styles.successIcon}>
            <Text style={{ fontSize: 50 }}>🎉</Text>
          </View>

          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>
            You are now a premium member.
          </Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{uuid}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plan</Text>
              <Text style={styles.value}>{planType}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Amount Paid</Text>
              <Text
                style={[
                  styles.value,
                  { color: "#2E7D32", fontWeight: "bold" },
                ]}
              >
                NPR {amount}
              </Text>
            </View>
          </View>

          <Text style={styles.emailNote}>
            {userEmail
              ? `A confirmation email has been sent to ${userEmail}`
              : "Invoice generated successfully."}
          </Text>

          <View style={styles.buttonGroup}>
            <Button
              label="Download Invoice"
              variant="outline"
              onPress={handleDownload}
            />

            <View style={{ height: 12 }} />

            <Button
              label="Go to Home"
              onPress={() => router.replace("/(tabs)/home")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: esewaHTML }}
        onNavigationStateChange={(navState) => {
          if (navState.url.includes("payment/success")) handleSuccess();
          else if (navState.url.includes("payment/failure")) {
            Alert.alert("Failed", "Transaction Failed or Cancelled");
            router.back();
          }
        }}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  invoiceContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  successIcon: { marginBottom: 20 },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#553434",
    marginBottom: 8,
  },
  successSub: { fontSize: 16, color: "#666", marginBottom: 30 },

  card: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 14, color: "#888" },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    maxWidth: "60%",
  },

  emailNote: {
    fontSize: 12,
    color: "#888",
    marginBottom: 30,
    textAlign: "center",
  },

  buttonGroup: { width: "100%", marginTop: 10 },
});
