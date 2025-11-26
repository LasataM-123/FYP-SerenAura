import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { useBackend } from "@/lib/useBackend";
import { getChatHistory } from "@/lib/api/chat";
import { useAuthStore } from "@/store/authStore";
import { images } from "@/constants";
import Top from "@/components/top";

export default function ChatHistoryScreen() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const { role } = useAuthStore.getState();

  const {
    data: history,
    loading,
    refetch,
  } = useBackend({
    fn: getChatHistory,
  });

  useEffect(() => {
    refetch({ chatId: historyId });
  }, [historyId]);

  if (loading || !history) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#553434" />
      </SafeAreaView>
    );
  }

  const isPatient = role === "patient";
  const otherUser = isPatient ? history.counselor : history.patient;

  // ✅ FIXED: Correct image source logic
  const otherProfileSource =
    otherUser.profileUrl && otherUser.profileUrl !== ""
      ? { uri: otherUser.profileUrl }
      : images.Avatar;

  const renderMessage = (msg: any, index: number) => {
    const isFromCurrentUser =
      (role === "patient" && msg.senderRole === "patient") ||
      (role === "counselor" && msg.senderRole === "counselor");

    const next = history.messages[index + 1];
    const showProfile =
      !isFromCurrentUser &&
      (index === history.messages.length - 1 ||
        next?.senderRole === role);

    return (
      <View
        key={msg._id}
        style={[
          styles.messageContainer,
          isFromCurrentUser
            ? styles.currentUserMessage
            : styles.otherUserMessage,
        ]}
      >
        {!isFromCurrentUser && showProfile ? (
          <Image source={otherProfileSource} style={styles.profileImage} />
        ) : !isFromCurrentUser ? (
          <View style={{ width: 30, marginRight: 8 }} />
        ) : null}

        <View
          style={[
            styles.messageBox,
            isFromCurrentUser
              ? styles.currentUserBox
              : styles.otherUserBox,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isFromCurrentUser
                ? styles.currentUserText
                : styles.otherUserText,
            ]}
          >
            {msg.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 24, marginBottom: 22 }}>
        <Top label={`Chat with ${otherUser.name}`} onBack={()=>router.back()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
      >
        {history.messages.length === 0 ? (
          <View style={styles.noMessages}>
            <Text style={styles.noMessagesText}>No messages for this chat</Text>
          </View>
        ) : (
          history.messages.map((m, i) => renderMessage(m, i))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Session Ended: {history.sessionEnded?.timeAgo}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
  },
  currentUserMessage: { justifyContent: "flex-end" },
  otherUserMessage: { justifyContent: "flex-start" },

  noMessages: { flex: 1, justifyContent: "center", alignItems: "center" },
  noMessagesText: {
    fontSize: 16,
    color: "#553434",
    fontFamily: "KodchasanMedium",
  },

  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#58315A",
  },

  messageBox: {
    maxWidth: "75%",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  currentUserBox: { backgroundColor: "#58315A" },
  otherUserBox: {
    borderWidth: 3,
    borderColor: "#58315A",
    backgroundColor: "transparent",
    borderRadius: 10,
  },

  messageText: { fontSize: 16, fontFamily: "KodchasanMedium" },
  currentUserText: { color: "#fff" },
  otherUserText: { color: "#58315A" },

  footer: {
    marginTop: 16,
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    opacity: 0.6,
    fontSize: 14,
    fontFamily: "KodchasanMedium",
  },
});
