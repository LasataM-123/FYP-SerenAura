import { ActivityIndicator, Animated, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import FeatureCard from '@/components/FeatureCard';
import { useBackend } from '@/lib/useBackend';
import { getRecommendations } from '@/lib/api/media';
import MusicSection from '@/components/MusicSection';


// Reusable component for each card with bounce animation
const AnimatedFeatureCard = ({ item }: { item: any }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
  const today = new Date();
  const { logout } = useAuthStore();
  const name = useAuthStore((state) => state.name);

  const features = [
    { id: '1', color: "#CB9DF0", image: images.mood, text: "Mood Tracker", description: "How's your mood today?", route: '/media' },
    { id: '2', color: "#74CEE2", image: images.media, text: "Media Library", description: "Meditations and music", route: '/media' },
    { id: '3', color: "#FFE37A", image: images.breathe, text: "Breathe", description: "Guided breathing exercises", route: '/breathe' },
    { id: '4', color: "#CFDAED", image: images.chat, text: "Counselor Chat", description: "Talk to someone", route: '/chat' },
  ];

  const handle = () => {
    logout();
    router.replace('/login');
  };

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
  const { data, refetch, error, loading } = useBackend({
  fn: () => getRecommendations(),
});
useEffect(() => {
    refetch();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
        <View style={styles.heroContainer}>
          <Image source={images.homeImage} style={{ height: 300, width: 316 }} />
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
            columnWrapperStyle={{ marginBottom: 16, gap: 16}}
            
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
        <Button label="Logout" onPress={handle} />
        <View style={{ marginBottom: 200 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;


const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heroContainer:{
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTextContainer: {
    marginTop:12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap:2,
  },
  mainWelcomeText: {
    fontSize: 22,
    fontFamily: 'KodchasanSemiBold',
    color: '#553434',
  },
  timeText:{
    fontFamily:"KodchasanMedium",
    fontSize:18,
    color:"#553434"
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#553434',
    fontFamily:"KodchasanMedium"
  },
  wellnessContainer:{
    marginTop:20,
  },
  featureText:{
    fontFamily:"KodchasanSemiBold",
    fontSize:20,
    color:"#553434",
    marginBottom:16
  },
  recommendationContainer:{
    marginTop:20
  },
  recommendationText:{
    fontSize:20,
    fontFamily:"KodchasanSemiBold",
    color:"#553434"
  },

});
