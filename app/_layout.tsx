import { router, SplashScreen, Stack, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Platform, View } from "react-native";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/config";

// Import Flash Message components
import FlashMessage, { showMessage } from "react-native-flash-message";

export default function RootLayout() {
  const { role, isLoggedIn, hasCompletedOnboarding, userId } = useAuthStore();
  const segments = useSegments();
  
  const socketRef = useRef<any>(null);

  const ready = isLoggedIn !== undefined && hasCompletedOnboarding !== undefined;
  
  const [fontsLoaded] = useFonts({
    KodchasanBold: require("../assets/fonts/Kodchasan-Bold.ttf"),
    KodchasanLight: require("../assets/fonts/Kodchasan-Light.ttf"),
    KodchasanMedium: require("../assets/fonts/Kodchasan-Medium.ttf"),
    KodchasanSemiBold: require("../assets/fonts/Kodchasan-SemiBold.ttf"),
    KodchasanRegular: require("../assets/fonts/Kodchasan-Regular.ttf"),
    Pacifico: require("../assets/fonts/Pacifico-Regular.ttf"),
    Schoolbell: require("../assets/fonts/Schoolbell-Regular.ttf"),
  });

  // ---------------- NOTIFICATION LOGIC ----------------
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socketRef.current = socket;

    const register = () => {
      socket.emit("registerNotifications", userId);
    };

    if (socket.connected) register();

    socket.on("connect", () => {
      register();
    });

    socket.on("new_notification", (data: any) => {
      console.log("🎁 Notification Received:", data.title);
      
      showMessage({
        message: data.title,
        description: data.message,
        backgroundColor: "#FFFFFF", 
        floating: true,              
        duration: 4000,             // Auto-hide
        hideOnPress: true,
        
        // Main Container Style (Border)
        style: {
          width: "88%",         
        alignSelf: "center", 
          borderWidth: 4,
          borderColor: "#553434",
          borderRadius: 15,
          paddingVertical: 15,
          paddingHorizontal: 20,

          // ELEVATION/SHADOW
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        // Title Font Styling
        titleStyle: {
          fontFamily: "KodchasanSemiBold",
          color: "#553434",
          fontSize: 16,
        },
        // Description Font Styling
        textStyle: {
          fontFamily: "KodchasanRegular",
          color: "#553434",
          fontSize: 14,
        },
        onPress: () => {
          if(role==="patient"){
            if (data.type === "REQUEST_ACCEPTED" || data.type==="REQUEST_CANCELLED" || data.type==="REQUEST_EXPIRED") {
                router.push("/chat");
            }
            if(data.type === "MOOD_REMINDER"){
                router.push("/media/moodTracker");
            }
            if(data.type ==="NEW_CHAT_MESSAGE"){
                router.push("/chat");
            }
          } else {
            if(data.type ==="NEW_CHAT_MESSAGE"){
                router.push("/user-chat");
            }
            if (data.type === "REQUEST_ACCEPTED" || data.type==="REQUEST_CANCELLED" || data.type==="REQUEST_EXPIRED") {
                router.push("/requests");
            }
          }
        }
      });
    });

    socket.on("reconnect", register);

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("new_notification");
        socket.off("reconnect");
        socket.disconnect();
      }
    };
  }, [isLoggedIn, userId]); 

  // ---------------- NAVIGATION LOGIC ----------------
  useEffect(() => {
    if (!ready) return; 
    const currentSegment = segments[0];

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inWelcome = currentSegment === "welcome"; 

    if (
      (isLoggedIn || hasCompletedOnboarding) &&
      (inAuthGroup || inOnboarding || inWelcome)
    ) {
      if(role === "patient"){
        router.replace("/home");
      } else {
        router.replace("/requests");
      }
    }
  }, [segments, isLoggedIn, hasCompletedOnboarding, ready, role]);

  // ---------------- SPLASH SCREEN LOGIC ----------------
  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.preventAutoHideAsync();
    };
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Native Stack */}
      <Stack screenOptions={{ headerShown: false, statusBarStyle: "dark" }} />
      
      {/* Floating Notification Component */}
      <FlashMessage position="top" statusBarHeight={40} />
    </View>
  );
}