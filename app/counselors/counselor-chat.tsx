import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Animated,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpIcon } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { ChatMessage, useChatMessaging } from "@/lib/useChatMessaging";
import { images } from "@/constants";
import Overlay from "@/components/Overlay";
import { router } from "expo-router";

const INPUT_HEIGHT = 56;
const MIN_BOTTOM = 8;

const ChatScreen = () => {
  const chatId = useSessionStore((state) => state.chatId) || "";
  const userRole = useAuthStore.getState().role || "patient";
  const counselorName = useSessionStore((state) => state.counselorName) || "Counselor";
  const counselorProfileUrl = useSessionStore((state) => state.profileUrl);

  const { messages, sendMessage } = useChatMessaging(chatId, userRole);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const bottomAnim = useRef(new Animated.Value(MIN_BOTTOM)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  
  const { endChat } = useChatMessaging(chatId, userRole);

  // ---------------- LOADING HANDLER ----------------
  useEffect(() => {
    if (messages.length > 0 || messages.length === 0) {
      const timeout = setTimeout(() => setLoading(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  // ---------------- Keyboard Handling (NO AUTOSCROLL HERE) ----------------
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

  // ---------------- AUTO SCROLL ON NEW MESSAGES (KEPT) ----------------
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 60);
    }
  }, [messages]);

  // ---------------- Send Message ----------------
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    // Save the current input value to send
    const messageToSend = input;
    
    // Clear the input field immediately for a snappy UI
    setInput(""); 

    try {
      await sendMessage(messageToSend);
    } catch (err) {
      console.log("Send failed:", err);
      // Optional: If it fails, you could put the text back into the input box
      // setInput(messageToSend);
    }
  };
  const handleEndChat = async () => {
    try {
      const response = await endChat();
      if (response.success) {
        router.back();
      }
    } catch (err) {
      setShowOverlay(false);
    }
  };

  // ---------------- Render Messages ----------------
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCounselor = item.senderRole === "counselor";
    const safeContent =
      typeof item.content === "string"
        ? item.content
        : item.content == null
        ? ""
        : JSON.stringify(item.content);

    const nextMessage = messages[index + 1];
    const showProfile =
      isCounselor &&
      (index === messages.length - 1 || nextMessage?.senderRole !== "counselor");

    return (
      <View
        style={[
          styles.messageContainer,
          isCounselor ? styles.counselorMessage : styles.patientMessage,
        ]}
      >
        {showProfile ? (
          <Image
            source={
              counselorProfileUrl
                ? { uri: counselorProfileUrl }
                : images.Avatar
            }
            style={styles.profileImage}
          />
        ) : (
          <View style={{ width: 30, marginRight: 8 }} />
        )}

        <View
          style={[
            styles.messageBox,
            isCounselor ? styles.counselorBox : styles.patientBox,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCounselor ? styles.counselorText : styles.patientText,
            ]}
          >
            {safeContent}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setShowOverlay(true); }}>
          <Image source={images.arrowBack} style={styles.backImage} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Dr. {counselorName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* LOADING INDICATOR */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#553434" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderMessage}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{
              paddingBottom: INPUT_HEIGHT + MIN_BOTTOM + keyboardHeight + 30,
            }}
          />
        </>
      )}

      {/* Input Box */}
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
          onClose={() => { setShowOverlay(false); }}
          outlineLabel="Continue Session"
          includeOutlinedButton={true}
          onOutline={() => { setShowOverlay(false); }}
        />
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  backImage: { width: 30, height: 30, resizeMode: "contain" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerText: { fontSize: 20, fontFamily:"KodchasanSemiBold", marginLeft: 8 , color:"#553434"},

  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
    paddingHorizontal: 24,
  },
  counselorMessage: { justifyContent: "flex-start" },
  patientMessage: { justifyContent: "flex-end" },

  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#58315A",
    boxShadow: "1px 1px 0px rgb(88, 49, 90)",
  },

  messageBox: {
    maxWidth: "75%",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  patientBox: { backgroundColor: "#58315A" },
  counselorBox: {
    borderWidth: 3,
    borderColor: "#58315A",
    backgroundColor: "transparent",
    boxShadow: "2px 2px 0px rgb(88, 49, 90)",
    borderRadius: 10,
  },

  messageText: { fontSize: 16 },
  counselorText: { color: "#58315A", fontFamily:"KodchasanMedium" },
  patientText: { color: "#fff", fontFamily:"KodchasanMedium" },

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
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 120,
    paddingRight: 10,
    fontFamily:"KodchasanMedium",
  },

  sendButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 20,
  },
});
