import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

import { LockKeyhole } from 'lucide-react-native'; // import the lock icon

const MediumCard = ({ item }: { item: any }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isLocked = true; 
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
                resizeMode='stretch'
              />

              {/* LOCK ICON OVERLAY */}
              {isLocked && (
                <View style={styles.lockContainer}>
                  <LockKeyhole color="#fff" size={16} />
                </View>
              )}

            </View>
          </View>

          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.artist}>{item.by}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
export default MediumCard;

const styles = StyleSheet.create({
  card: { width: width * 0.7, marginRight: 16 },
  imageContainer: { width: '100%', height: 180, position: 'relative' },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#553434',
    top: 3,
    left: 3,
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  songTitle: { fontWeight: '600', marginTop: 10, fontSize: 16, color: '#553434', textAlign: 'left', fontFamily:'KodchasanSemiBold' },
  artist: { color: '#553434', fontSize: 14, textAlign: 'left', fontFamily:"KodchasanMedium" },
  lockContainer: {
  position: 'absolute',
  bottom: 8,
  left: 8,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#553434',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},

});
