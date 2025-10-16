import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <View style={styles.shadowLayer} />
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              {item.isLocked && (
                <View style={styles.lockContainer}>
                  <LockKeyhole color="#fff" size={14} />
                </View>
              )}
            </View>
          </View>

          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {item.by}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SmallCard;

const CARD_MARGIN = 12;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 2; // two per row with spacing

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  imageContainer: { width: '100%', height: 160, position: 'relative' },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#553434',
    top: 2,
    left: 2,
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  songTitle: {
    fontWeight: '600',
    marginTop: 6,
    fontSize: 14,
    color: '#553434',
    textAlign: 'left',
    fontFamily: 'KodchasanSemiBold',
  },
  artist: {
    color: '#553434',
    fontSize: 12,
    textAlign: 'left',
    fontFamily: 'KodchasanMedium',
  },
  lockContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#553434',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
