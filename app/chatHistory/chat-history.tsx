import { 
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  ScrollView
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { EndedChat, getEndedChats } from "@/lib/api/chat";
import { useBackend } from "@/lib/useBackend";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Top from "@/components/top";
import ChatHistoryCard from "@/components/ChatHistoryCard";

const ChatHistoryScreen = () => {
  const role = useAuthStore((state) => state.role);
  const [chats, setChats] = useState<EndedChat[]>([]);

  const { refetch, loading } = useBackend({
    fn: getEndedChats,
  });

  // Fetch ended chats
  useEffect(() => {
    const fetchResults = async () => {
      const res = await refetch({ role });
      if (res?.success) {
        setChats(res.chats);
      }
    };

    fetchResults();
  }, [role]);

  // Status bar styling
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#fff");
      StatusBar.setTranslucent(false);
    }
  }, []);
    if (loading) {
      return (
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#553434" />
        </SafeAreaView>
      );
    }

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}
     >
        <View style={{paddingHorizontal:24}}>

            <Top
        label="Chat History"
        onBack={() => {
          router.back();
        }}
      />
        </View>
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id}
          scrollEnabled = {false}
          ItemSeparatorComponent={() => <View style={{ height: 22 }} />}
          contentContainerStyle={{
            paddingHorizontal:24,
            paddingTop: 24,
            paddingBottom: 40,
          }}
          renderItem={({ item }) => {
            const isCounselor = role === "counselor";

            const patient =
              typeof item.patientId === "object" ? item.patientId : undefined;

            const counselor =
              typeof item.counselorId === "object"
                ? item.counselorId
                : undefined;

            return (
              <ChatHistoryCard
                chatId={item._id}
                patientName={isCounselor ? patient?.name || "" : ""}
                counselorName={!isCounselor ? counselor?.name || "" : ""}
                profileUrl={
                  isCounselor ? patient?.profileUrl : counselor?.profileUrl
                }
                speciality={!isCounselor ? counselor?.speciality : ""}
                experience={!isCounselor ? counselor?.experience || 0 : 0}
                appointmentDate={item.appointmentDate}
                endTime={item.endTime}
              />
            );
          }}
        />
    
        </ScrollView>
      
    </SafeAreaView>
  );
};

export default ChatHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
