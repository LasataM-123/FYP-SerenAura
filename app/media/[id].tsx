import { 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import React, { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useBackend } from '@/lib/useBackend';
import { getIndividualMedia } from '@/lib/api/media';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { Timer } from 'lucide-react-native';
import Button from '@/components/Button';

const { width } = Dimensions.get('window');

const Media = () => {
  const { id } = useLocalSearchParams();
  const { refetch, error, loading, data } = useBackend({
    fn: getIndividualMedia
  });
  const mediaId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    refetch({ id: mediaId });
  }, []);

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
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={images.arrowBack} style={styles.backImage} />
      </TouchableOpacity>

      {/* Content */}
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
            {/* Shadow Layer */}
            <View style={styles.shadowLayer} />

            {/* Image Card */}
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: data?.media?.imageUrl }}  
                style={styles.image}
                resizeMode='cover'
              />
            </View>

            {/* Title and Timer */}
            <View style={styles.titleContainer}>
              <Text style={styles.mediaTitle}>{data?.media?.title}</Text>
              <View style={{flexDirection:"row", gap:4, alignItems: "center"}}>
                <Timer color="#553434"/>
                <Text style={styles.timeText}>{data?.media?.duration}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.descriptionText}>{data?.media?.description}</Text>

            {/* Button */}
            <View style={styles.buttonContainer}>
              {data?.media?.isLocked ? (
                <Button label='Go Premium' onPress={()=>{}} />
              ) : (
                <Button label='Play' imageSource={images.play} onPress={handlePlay} />
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  backButton: {
    paddingTop: 4,
    marginBottom: 16,
  },

  backImage: {
    width: 30,
    height: 30,
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
    marginVertical: 16,
  },

  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: 230,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#553434',
    top: 3,
    left: 3,
    zIndex: 0,
  },

  imageWrapper: {
    width: '100%',
    height: 230,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#fff',
    overflow: 'hidden',
    zIndex: 1,
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  titleContainer: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mediaTitle: {
    fontSize: 22,
    fontFamily: 'KodchasanSemiBold',
    color: '#553434',
  },

  timeText: {
    fontFamily: 'KodchasanMedium',
    color: '#553434',
    fontSize: 14,
  },

  descriptionText: {
    fontSize: 16,
    fontFamily: 'KodchasanMedium',
    color: '#553434',
    marginTop: 12,
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },

  errorText: {
    color: 'red',
    fontFamily: 'KodchasanMedium',
    textAlign: 'center',
  },

  content: {
    paddingBottom: 30,
  },
});
