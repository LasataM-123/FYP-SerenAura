import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import Button from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { router, useFocusEffect } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { getAllChatRequests } from "@/lib/api/chat";
import { useChatStatus } from "@/lib/useChatSocket";
import UserCard from "@/components/PatientCard";
import { jwtDecode } from "jwt-decode";
import { API_URL } from "@/config";

const getTokenExpiry = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

const Requests = () => {
  const { logout, userId, accessToken, refreshToken, updateToken } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const { refetch } = useBackend({ fn: getAllChatRequests });

  const showToastMessage = async (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    toastAnim.setValue(0);

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowToast(false));
  };
  

  // 🔐 Token validation and refresh
  useEffect(() => {
    if (!accessToken || !refreshToken) {
      logout();
      router.replace("/login");
      return;
    }

    const checkAndRefreshToken = async () => {
      const now = Date.now();
      const accessExpiry = getTokenExpiry(accessToken);
      const refreshExpiry = getTokenExpiry(refreshToken);

      if (!refreshExpiry || now > refreshExpiry) {
        logout();
        router.replace("/login");
        return;
      }

      if (!accessExpiry || accessExpiry - now < 2 * 60 * 1000) {
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (res.ok) {
            const data = await res.json();
            updateToken(data.accessToken);
            setIsTokenReady(true);
          } else {
            logout();
            router.replace("/login");
          }
        } catch {
          logout();
          router.replace("/login");
        }
      } else {
        setIsTokenReady(true);
      }
    };

    checkAndRefreshToken();
    const interval = setInterval(checkAndRefreshToken, 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken, refreshToken]);

  useEffect(() => {
    if (isTokenReady) setIsCheckingAuth(false);
  }, [isTokenReady]);

  // 🧠 Fetch chat requests
  const fetchRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const res = await refetch({ userId });
      if (res?.chats) setRequests(res.chats);
    } catch (error) {
      console.error("Failed to fetch chat requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      
      if (isTokenReady) fetchRequests();
    }, [isTokenReady])
  );

  const handleStatusChange = useCallback((chatId: string, newStatus: string) => {
    setRequests((prev) => {
      if (newStatus === "closed") {
        // permanently remove the closed chat
        return prev.filter((r) => r._id !== chatId);
      }

      // Prevent reopening closed ones
      const existing = prev.find((r) => r._id === chatId);
      if (existing && existing.status === "closed") return prev;

      // Update the status for "active" or "pending"
      return prev.map((r) =>
        r._id === chatId ? { ...r, status: newStatus } : r
      );
    });
  }, []); // Empty dependency array means this function never changes

  // ✨ Individual card component
  const RequestItem = ({ item }: { item: any }) => {
    const statusFromHook = useChatStatus(
      item._id,
      item.chatRequestSentDate,
      item.appointmentDate
    );
    
    // The status as known by the parent's list
    const statusFromParent = item.status;
    useEffect(() => {
      if (statusFromHook && statusFromHook !== statusFromParent) {
        handleStatusChange(item._id, statusFromHook);
      }
    }, [statusFromHook, statusFromParent, item._id, handleStatusChange]);

    // Always render using the real-time status from the hook
    return (
      <UserCard
        key={item._id}
        _id={item._id}
        name={item.patientId.name}
        appointmentDate={item.appointmentDate}
        profileUrl={item.patientId.profileUrl}
        status={statusFromHook || item.status} // Use hook's status, fallback to parent's
        showToast={showToastMessage}
      />
    );
  };

  if (isCheckingAuth || isLoadingRequests) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#553434" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  // 🧾 Separate by type
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const acceptedRequests = requests.filter((r) => r.status === "active");

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerText}>Manage Chat Requests</Text>

        <Text style={styles.subHeader}>PENDING REQUESTS</Text>
        {pendingRequests.length === 0 ? (
          <Text style={styles.emptyText}>No Pending Requests</Text>
        ) : (
          <FlatList
            data={pendingRequests}
            renderItem={({ item }) => <RequestItem item={item} />}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}

        <Text style={[styles.subHeader, { marginTop: 28 }]}>ACCEPTED REQUESTS</Text>
        {acceptedRequests.length === 0 ? (
          <Text style={styles.emptyText}>No Accepted Requests</Text>
        ) : (
          <FlatList
            data={acceptedRequests}
            renderItem={({ item }) => <RequestItem item={item} />}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}

       
      </ScrollView>

      {showToast && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: 100,
              zIndex: 9999,
              elevation: 9999,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderWidth: 3,
              borderColor: "#553434",
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "KodchasanMedium",
                color: "#553434",
                fontSize: 16,
              }}
            >
              {toastMessage}
            </Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default Requests;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  headerText: {
    marginTop: 4,
    marginBottom: 12,
    fontFamily: "KodchasanSemiBold",
    fontSize: 22,
    color: "#553434",
  },
  subHeader: {
    marginBottom: 12,
    fontFamily: "KodchasanMedium",
    fontSize: 18,
    color: "#553434",
  },
  emptyText: {
    fontFamily: "KodchasanRegular",
    fontSize: 14,
    color: "#7C6666",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "KodchasanMedium",
    fontSize: 16,
    color: "#553434",
  },
});