import { 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import React, { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useBackend } from '@/lib/useBackend';
import { getIndividualMedia } from '@/lib/api/media';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { Timer } from 'lucide-react-native';
import Button from '@/components/Button';
// No need to import useAuthStore for subscription checks anymore

const { width, height } = Dimensions.get('window');
const scaleHeight = (size: number) => (size / 812) * height; 

const Media = () => {
  const { id } = useLocalSearchParams();
  const mediaId = Array.isArray(id) ? id[0] : id;

  const { refetch, error, loading, data } = useBackend({
    fn: getIndividualMedia
  });

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (mediaId) {
        refetch({ id: mediaId });
    }
  }, [mediaId]);

  const handlePlay = () => {
    if (!data) return;
    router.push({
      pathname: "./now-playing",
      params: {
        id: data.media._id,
        title: data.media.title,
        by: data.media.by,
        imageUrl: data.media.imageUrl,
        audioUrl: data.media.audioUrl,
        mediaType: data.media.mediaType
      },
    });
  };

  const handleGoPremium = () => {
     router.push("/settings/subscription"); 
  };

  const showLockScreen = data?.media?.isLockedForUser;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={images.arrowBack} style={styles.backImage} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#553434" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.cardWrapper}>
            <View style={styles.shadowLayer} />
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: data?.media?.imageUrl }}
                style={styles.image}
                resizeMode='cover'
              />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.mediaTitle}>{data?.media?.title}</Text>
              <View style={{flexDirection:"row", gap:scaleHeight(4), alignItems: "center"}}>
                <Timer color="#553434" size={20} />
                <Text style={styles.timeText}>{data?.media?.duration || "N/A"}</Text>
              </View>
            </View>

            <Text style={styles.descriptionText}>{data?.media?.description}</Text>

            <View style={styles.buttonContainer}>
              {showLockScreen ? (
                <Button 
                    label='Go Premium' 
                    onPress={handleGoPremium} 
                    imageSource={images.Crown}
                />
              ) : (
                <Button 
                    label='Play' 
                    imageSource={images.play} 
                    onPress={handlePlay} 
                />
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Media;

const styles = StyleSheet.create({
  // ... (Keep your existing styles, they are fine)
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: scaleHeight(16),
  },
  backButton: {
    paddingTop: scaleHeight(4),
    marginBottom: scaleHeight(16),
  },
  backImage: {
    width: scaleHeight(30),
    height: scaleHeight(30),
    resizeMode: 'contain',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: width - 52,
    marginVertical: scaleHeight(16),
  },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: scaleHeight(230),
    borderRadius: scaleHeight(20),
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#553434',
    top: scaleHeight(3),
    left: scaleHeight(3),
    zIndex: 0,
  },
  imageWrapper: {
    width: '100%',
    height: scaleHeight(230),
    borderRadius: scaleHeight(20),
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#fff',
    overflow: 'hidden',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: scaleHeight(10),
  },
  titleContainer: {
    marginTop: scaleHeight(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaTitle: {
    fontSize: scaleHeight(22),
    fontFamily: 'KodchasanSemiBold',
    color: '#553434',
    flex: 1, 
    marginRight: 10,
  },
  timeText: {
    fontFamily: 'KodchasanMedium',
    color: '#553434',
    fontSize: scaleHeight(14),
  },
  descriptionText: {
    fontSize: scaleHeight(16),
    fontFamily: 'KodchasanMedium',
    color: '#553434',
    marginTop: scaleHeight(12),
    lineHeight: scaleHeight(22),
  },
  buttonContainer: {
    marginTop: scaleHeight(30),
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontFamily: 'KodchasanMedium',
    textAlign: 'center',
  },
  content: {
    paddingBottom: scaleHeight(30),
  },
});