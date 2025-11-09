import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
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
    return decoded.exp * 1000; // milliseconds
  } catch {
    return null;
  }
};

const Requests = () => {
  const { logout, userId, accessToken, refreshToken, updateToken } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { refetch } = useBackend({ fn: getAllChatRequests });

  // --- 🔐 Check and Refresh Tokens ---
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
            console.error("Token refresh failed, logging out");
            logout();
            router.replace("/login");
          }
        } catch (error) {
          console.error("Auto-refresh failed:", error);
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

  // --- Fetch chat requests ---
  const fetchRequests = async () => {
    try {
      setRefreshing(true);
      const res = await refetch({ userId });
      if (res?.chats) setRequests(res.chats);
    } catch (error) {
      console.error("Failed to fetch chat requests:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // --- Refetch when screen focuses ---
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#ffffff");

      if (isTokenReady) fetchRequests();
    }, [isTokenReady])
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // --- Split requests ---
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const acceptedRequests = requests.filter((r) => r.status === "active");

  // --- Component that correctly uses the hook ---
  const RequestItem = ({ item }: { item: any }) => {
    const status = useChatStatus(
      item._id,
      item.chatRequestSentDate,
      item.appointmentDate
    );
    return (
      <UserCard
        key={item._id}
        _id={item._id}
        name={item.patientId.name}
        appointmentDate={item.appointmentDate}
        profileUrl={item.patientId.profileUrl}
        status={status}
      />
    );
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#553434" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerText}>Manage Chat Requests</Text>

        {/* Pending */}
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

        {/* Accepted */}
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

        <View style={{ marginTop: 40 }}>
          <Button label="Logout" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Requests;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
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
