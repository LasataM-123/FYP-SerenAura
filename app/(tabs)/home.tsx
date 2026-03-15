import { 
  ActivityIndicator, 
  Animated, 
  FlatList, 
  Image, 
  Pressable, 
  ScrollView, 
  StatusBar, 
  StyleSheet, 
  Text, 
  View 
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import FeatureCard from '@/components/FeatureCard';
import { useBackend } from '@/lib/useBackend';
import { getRecommendations } from '@/lib/api/media';
import { jwtDecode } from "jwt-decode";
import { API_URL } from "@/config";
import MusicSection from '@/components/MusicSection';
import { useFocusEffect } from '@react-navigation/native';

const getTokenExpiry = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000; // milliseconds
  } catch {
    return null;
  }
};

const AnimatedFeatureCard = ({ item }: { item: any }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { accessToken, logout } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!accessToken) {
      logout();
      router.replace("/login");
    } else {
      setIsCheckingAuth(false);
    }
  }, [accessToken]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#553434" />
      </View>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => router.push(item.route as any)}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <FeatureCard
          color={item.color}
          image={item.image}
          text={item.text}
          description={item.description}
        />
      </Animated.View>
    </Pressable>
  );
};

const Home = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const today = new Date();
  const [isTokenReady, setIsTokenReady] = useState(false);


  const { accessToken, refreshToken, updateToken, logout, setTokenReady } = useAuthStore();
  const name = useAuthStore((state) => state.name);

  const features = [
    { id: '1', color: "#CB9DF0", image: images.mood, text: "Mood Tracker", description: "How's your mood today?", route: '../media/moodTracker' },
    { id: '2', color: "#74CEE2", image: images.media, text:"Media",description: "Meditations and music", route: '/media' },
    { id: '3', color: "#FFE37A", image: images.breathe, text: "Breathe", description: "Guided Breathing Exercises", route: '/breathe' },
    { id: '4', color: "#CFDAED", image: images.chat, text: "Counselor Chat", description: "Talk to someone", route: '/chat' },
  ];

  const hours = today.getHours();
  const greeting =
    hours >= 5 && hours < 12 ? 'GOOD MORNING' :
    hours >= 12 && hours < 17 ? 'GOOD AFTERNOON' :
    hours >= 17 && hours < 21 ? 'GOOD EVENING' :
    'GOOD NIGHT';

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const { data, refetch } = useBackend({
    fn: () => getRecommendations(),
  });

 useEffect(() => {
  if (!accessToken || !refreshToken) {
    logout();
    return;
  }

  const checkAndRefreshToken = async () => {
    const now = Date.now();
    const accessExpiry = getTokenExpiry(accessToken);
    const refreshExpiry = getTokenExpiry(refreshToken);

    if (!refreshExpiry || now > refreshExpiry) {
      logout();
      return;
    }

    // Refresh access token if expired or about to expire
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
          setTokenReady(true);
        
        } else {
          console.error("Token refresh failed, logging out");
          logout();
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        logout();
      }
    } else {
      setIsTokenReady(true); // Access token still valid
    }
  };

  checkAndRefreshToken();
  const interval = setInterval(checkAndRefreshToken, 60 * 1000);
  return () => clearInterval(interval);
}, [accessToken, refreshToken]);


useFocusEffect(
  useCallback(() => {
    // Set initial bar style when screen is focused
    StatusBar.setBarStyle("dark-content");
    StatusBar.setBackgroundColor("#FFFFFF");

    const refresh = async () => {
      if (!isTokenReady) return;
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 600);
    };
    refresh();

    return () => {
      // reset bar style when unfocused
      StatusBar.setBarStyle("light-content");
    };
  }, [isTokenReady])
);

useEffect(() => {
  if (isRefreshing) {
    StatusBar.setBarStyle("light-content"); 
  } else {
    StatusBar.setBarStyle("dark-content"); 
    StatusBar.setBackgroundColor("#FFFFFF");
  }
}, [isRefreshing]);


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isRefreshing ? 1 : 0,
      duration: isRefreshing ? 250 : 200,
      useNativeDriver: true,
    }).start();
  }, [isRefreshing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
    setIsRefreshing(false);
  }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
        <View style={styles.heroContainer}>
          <Image source={images.homeImage} style={{ height: 298, width: 308 }} />
          <View style={styles.mainTextContainer}>
            <Text style={styles.mainWelcomeText}>
              {greeting}, {name?.toUpperCase()}!
            </Text>
            <Text style={styles.timeText}>{formattedDate}</Text>
            <Image source={images.sunMoon} style={{ width: 80, height: 80 }} />
          </View>
          <Text style={styles.subtitle}>
            Take a deep breath — peace begins with you today.
          </Text>
        </View>
        <View style={styles.wellnessContainer}>
          <Text style={styles.featureText}>Your Wellness Tools</Text>
          <FlatList
            scrollEnabled={false}
            data={features}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }) => <AnimatedFeatureCard item={item} />}
            columnWrapperStyle={{ marginBottom: 16, gap: 16 }}
          />
        </View>
        <View style={styles.recommendationContainer}>
          <Text style={styles.recommendationText}>Recommendations</Text>
        </View>
        <View>
          {Object.entries(data?.recommendations ?? {}).map(([key, value]) => (
            <MusicSection key={key} title={value.title} data={value.data} />
          ))}
        </View>
        <View style={{ marginBottom: 30, marginTop: 30 }}>
          <Button label="Refresh Recommendations" onPress={handleRefresh} />
        </View>
        <View style={{ marginBottom: 100 }} />
      </ScrollView>
      <Animated.View
        pointerEvents={isRefreshing ? "auto" : "none"}
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <View style={styles.cardWrapper}>
          <View style={styles.cardShadowLayer} />
          <View style={styles.cardMain}>
            <ActivityIndicator size="large" color="#8B4B4B" />
            <Text style={styles.loggingText}>Refreshing Recommendations...</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { 
    flex:1,
    backgroundColor: "#FFFFFF"
  },
  heroContainer: { 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mainTextContainer: { 
    marginTop: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 2 
  },
  mainWelcomeText: { 
    fontSize: 22, 
    fontFamily: 'KodchasanSemiBold', 
    color: '#553434',
    textAlign:'center'
  },
  timeText: { 
    fontFamily: "KodchasanMedium", 
    fontSize: 18, 
    color: "#553434" 
  },
  subtitle: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#553434', 
    fontFamily: "KodchasanMedium" 
  },
  wellnessContainer: { 
    marginTop: 20 
  },
  featureText: { 
    fontFamily: "KodchasanSemiBold", 
    fontSize: 20, 
    color: "#553434", 
    marginBottom: 16 
  },
  recommendationContainer: { 
    marginTop: 20 
  },
  recommendationText: { 
    fontSize: 20, 
    fontFamily: "KodchasanSemiBold", 
    color: "#553434" 
  },
  overlay: { 
    position: "absolute", 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 9999 
  },
  cardWrapper: { 
    position: "relative", 
    width: 255, 
    height: 180, 
    justifyContent: "center", 
    alignItems: "center" 
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
    left: 3 
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
    padding: 20 
  },
  loggingText: { 
    marginTop: 20, 
    fontFamily: "Schoolbell", 
    fontSize: 20, 
    color: "#553434", 
    textAlign: "center" 
  },
});
