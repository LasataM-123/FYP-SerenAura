import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const scaleHeight = (size: number) => (size / 812) * height;

const SmallCard = ({ item }: { item: any }) => {
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

  const handlePress = () => {
    router.push(`../media/${item._id}`);
  };

  const CARD_MARGIN = scaleHeight(12);
  const CARD_WIDTH = (width - CARD_MARGIN * 6) / 2; // two per row with spacing
  const IMAGE_HEIGHT = scaleHeight(154);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={[styles.card, { width: CARD_WIDTH, marginBottom: scaleHeight(16) }]}>
          <View style={[styles.imageContainer, { height: IMAGE_HEIGHT }]}>
            <View style={[styles.shadowLayer, { borderRadius: scaleHeight(16), top: scaleHeight(2), left: scaleHeight(2) }]} />
            <View style={[styles.imageWrapper, { borderRadius: scaleHeight(16) }]}>
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.image, { borderRadius: scaleHeight(12) }]}
                resizeMode="cover"
              />
              {item.isLockedForUser && (
                <View style={[styles.lockContainer, { width: scaleHeight(24), height: scaleHeight(24), borderRadius: scaleHeight(12), bottom: scaleHeight(6), left: scaleHeight(6) }]}>
                  <LockKeyhole color="#fff" size={scaleHeight(14)} />
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.songTitle, { marginTop: scaleHeight(6), fontSize: scaleHeight(14) }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.artist, { fontSize: scaleHeight(12) }]} numberOfLines={1}>
            {item.by}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SmallCard;

const styles = StyleSheet.create({
  card: {},
  imageContainer: { width: '100%', position: 'relative' },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#553434',
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  songTitle: {
    fontWeight: '600',
    color: '#553434',
    textAlign: 'left',
    fontFamily: 'KodchasanSemiBold',
  },
  artist: {
    color: '#553434',
    textAlign: 'left',
    fontFamily: 'KodchasanMedium',
  },
  lockContainer: {
    position: 'absolute',
    backgroundColor: '#553434',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
