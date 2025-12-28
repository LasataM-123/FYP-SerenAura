import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Keyboard,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpIcon, UserRound } from "lucide-react-native";

import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { ChatMessage, useChatMessaging } from "@/lib/useChatMessaging";
import { images } from "@/constants";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Overlay from "@/components/Overlay";
import { router } from "expo-router";
import { useChatStatus } from "@/lib/useChatSocket";
import { useFocusEffect } from "@react-navigation/native";

const NAVBAR_HEIGHT = 80;
const INPUT_HEIGHT = 56;
const MIN_BOTTOM = NAVBAR_HEIGHT + 8;

const CounselorChatScreen = () => {
  const chatId = useChatStore((state) => state.currentChatId) || "";
  const chatStatus = useChatStatus(chatId);

  const patientName = useChatStore((state) => state.patientName) || "Patient";
  const patientProfileUrl = useChatStore((state) => state.patientProfileUrl);
  const userRole = useAuthStore.getState().role || "counselor";

  const endedByCounselor = useChatStore((state) => state.endedByCounselor);
  const setEndedByCounselor = useChatStore((state) => state.setEndedByCounselor);

  const { messages, sendMessage, endChat } = useChatMessaging(chatId, userRole);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const bottomAnim = useRef(new Animated.Value(MIN_BOTTOM)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [showOverlay, setShowOverlay] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);

  const resetChat = useChatStore((state) => state.resetChat);

  // ---------------- AUTO SCROLL ON NEW MESSAGES ----------------
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 60);
    }
  }, [messages]);

  // ❌ REMOVED AUTO SCROLL WHEN KEYBOARD OPENS

  // ---------------- CHAT STATUS ENDED ----------------
  useEffect(() => {
    if (chatStatus === "ended") {
      setEndedByCounselor(true);
      setShowEndOverlay(true);
    }
  }, [chatStatus]);

  // ---------------- FOCUS HANDLER ----------------
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#FFFFFF");
    
      if (endedByCounselor) {
        setShowEndOverlay(true);
      }
    }, [endedByCounselor])
  );
  // ---------------- LOADING ----------------
  useEffect(() => {
    setShowEndOverlay(false);
    if (messages.length >= 0) {
      const timeout = setTimeout(() => setLoading(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  // ---------------- KEYBOARD HANDLER ----------------
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height + 8;
      setKeyboardHeight(height);

      Animated.timing(bottomAnim, {
        toValue: height,
        duration: e.duration || 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);

      Animated.timing(bottomAnim, {
        toValue: MIN_BOTTOM,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ---------------- SEND MESSAGE ----------------
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;
    try {
      await sendMessage(input);
      setInput("");
    } catch (err) {
      console.log("Send failed:", err);
    }
  };

  // ---------------- RENDER MESSAGE ----------------
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isPatient = item.senderRole === "patient";
    const safeContent =
      typeof item.content === "string"
        ? item.content
        : item.content == null
        ? ""
        : JSON.stringify(item.content);

    const nextMessage = messages[index + 1];
    const showProfile =
      isPatient &&
      (index === messages.length - 1 || nextMessage?.senderRole !== "patient");

    return (
      <View
        style={[
          styles.messageContainer,
          isPatient ? styles.patientMessage : styles.counselorMessage,
        ]}
      >
        {isPatient && showProfile ? (
          <Image
            source={patientProfileUrl ? { uri: patientProfileUrl } : images.Avatar}
            style={styles.profileImage}
          />
        ) : isPatient ? (
          <View style={{ width: 30, marginRight: 8 }} />
        ) : null}

        <View
          style={[
            styles.messageBox,
            isPatient ? styles.patientBox : styles.counselorBox,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isPatient ? styles.patientText : styles.counselorText,
            ]}
          >
            {safeContent}
          </Text>
        </View>
      </View>
    );
  };

  if (!chatId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
                barStyle="dark-content" 
                backgroundColor="#FFFFFF" 
                translucent={false} // Ensures it doesn't overlap on Android
              />
        <View style={styles.center}>
          <Text>No chat selected.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------- END SESSION ----------------
  const handleEndChat = async () => {
    try {
      const response = await endChat();
      if (response.success) {
        setEndedByCounselor(true);
        setShowOverlay(false);
        setShowEndOverlay(true);
      }
    } catch (err) {
      setShowOverlay(false);
      setShowEndOverlay(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
              barStyle="dark-content" 
              backgroundColor="#FFFFFF" 
              translucent={false} // Ensures it doesn't overlap on Android
            />
      <Header />

      <View style={styles.header}>
        <View style={{ flexDirection: "row" }}>
          <UserRound size={28} color="#553434" />
          <Text style={styles.headerText}>{patientName}</Text>
        </View>

        <Button
          label="End Chat"
          onPress={() => setShowOverlay(true)}
          width={100}
          height={40}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#553434" />
        </View>
      ) : (
        <View style={styles.chatArea}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderMessage}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      )}

      <Animated.View style={[styles.inputWrapper, { bottom: bottomAnim }]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor="#553434"
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <ArrowUpIcon size={24} color="#553434" />
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 20 }} />
      </Animated.View>

      {showOverlay && (
        <Overlay
          title="End Session?"
          description="You’re currently in an active counseling session. Would you like to continue your conversation or end the session?"
          label="End Session"
          onPress={handleEndChat}
          imageSource={images.Warning}
          crossIcon={true}
          onClose={() => setShowOverlay(false)}
          outlineLabel="Continue Session"
          includeOutlinedButton={true}
          onOutline={() => setShowOverlay(false)}
        />
      )}

      {showEndOverlay && (
        <Overlay
          title="Session Ended"
          description="Session has ended successfully."
          label="Go Back to Requests"
          onPress={() => {
            resetChat();
            setEndedByCounselor(false);
            setShowEndOverlay(false);
            router.push("/requests");
          }}
          imageSource={images.tick}
        />
      )}
    </SafeAreaView>
  );
};

export default CounselorChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 20,
    fontFamily: "KodchasanSemiBold",
    marginLeft: 8,
    color: "#553434",
  },

  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
    paddingHorizontal: 24,
  },
  patientMessage: { justifyContent: "flex-start" },
  counselorMessage: { justifyContent: "flex-end" },

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
  chatArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: NAVBAR_HEIGHT + INPUT_HEIGHT + 10,
  },

  counselorBox: { backgroundColor: "#58315A" },
  patientBox: {
    borderWidth: 3,
    borderColor: "#58315A",
    backgroundColor: "transparent",
    borderRadius: 10,
  },

  messageText: { fontSize: 16 },
  patientText: { color: "#58315A", fontFamily: "KodchasanMedium" },
  counselorText: { color: "#fff", fontFamily: "KodchasanMedium" },

  inputWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 3,
    borderColor: "#553434",
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 120,
    paddingRight: 10,
    fontFamily: "KodchasanMedium",
  },

  sendButton: { marginLeft: 8, padding: 10, borderRadius: 20 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
