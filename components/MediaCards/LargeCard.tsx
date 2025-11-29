import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { LockKeyhole, MoreVertical } from "lucide-react-native";

const { width, height } = Dimensions.get("window");
const scaleHeight = (size: number) => (size / 812) * height;

const LargeCard = ({
  item,
  isDot = true,
  onOpenMenu,
}: {
  item: any;
  isDot?: boolean;
  onOpenMenu?: (item: any) => void;
}) => {
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
    router.push(`/media/${item.media._id}`);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.cardRow}>
          <View style={styles.leftRow}>
            <View style={styles.imageContainer}>
              <View style={styles.shadowLayer} />

              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.media.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />

                {item.isLocked && (
                  <View style={styles.lockContainer}>
                    <LockKeyhole color="#fff" size={scaleHeight(16)} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.contentBox}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.songTitle}>
              {item.media.title}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.artist}>
              {item.media.by}
            </Text>


              {item.duration && (
                <Text style={styles.duration}>{item.duration}</Text>
              )}
            </View>
          </View>

          {isDot && (
            <TouchableOpacity
              style={styles.moreIcon}
              onPress={() => onOpenMenu?.(item)}
            >
              <MoreVertical color="#553434" size={scaleHeight(22)} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default LargeCard;

const styles = StyleSheet.create({
  cardRow: {
    width: width * 0.9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scaleHeight(24),
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    width: scaleHeight(120),
    height: scaleHeight(120),
    position: "relative",
    marginRight: scaleHeight(14),
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: scaleHeight(20),
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#553434",
    top: scaleHeight(3),
    left: scaleHeight(3),
  },
  imageWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: scaleHeight(20),
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  lockContainer: {
    position: "absolute",
    bottom: scaleHeight(8),
    left: scaleHeight(8),
    width: scaleHeight(28),
    height: scaleHeight(28),
    borderRadius: scaleHeight(14),
    backgroundColor: "#553434",
    justifyContent: "center",
    alignItems: "center",
  },
  contentBox: {
    flex: 1,
    justifyContent: "center",
  },
  songTitle: {
    fontWeight: "600",
    fontSize: scaleHeight(18),
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
    marginBottom: scaleHeight(4),
  },
  artist: {
    color: "#553434",
    fontSize: scaleHeight(15),
    fontFamily: "KodchasanMedium",
    marginBottom: scaleHeight(4),
  },
  duration: {
    color: "#553434",
    fontSize: scaleHeight(13),
    opacity: 0.8,
    fontFamily: "KodchasanMedium",
  },
  moreIcon: {
    padding: scaleHeight(6),
  },
});
