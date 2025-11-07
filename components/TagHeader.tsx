import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from "react-native";

interface TagHeaderProps {
  tags: string[];
  selectedTag: string;
  onSelect: (tag: string) => void;
}

interface TagButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TagButton: React.FC<TagButtonProps> = ({ label, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
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
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          { position: "relative", marginRight: 14, overflow: "visible" },
        ]}
      >
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Actual Tag */}
        <View style={[styles.tag, isActive && styles.activeTag]}>
          <Text style={[styles.tagText, isActive && styles.activeTagText]}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const TagHeader: React.FC<TagHeaderProps> = ({ tags, selectedTag, onSelect }) => {
  const flatListRef = useRef<FlatList>(null);

  const hasMounted = useRef(false);

useEffect(() => {
  const index = tags.findIndex((tag) => tag === selectedTag);
  if (!hasMounted.current) {
    hasMounted.current = true; 
    return;
  }

  if (index !== -1) {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  }
}, [selectedTag, tags]);


  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={tags}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TagButton
            label={item}
            isActive={selectedTag === item}
            onPress={() => onSelect(item)}
          />
        )}
        getItemLayout={(_, index) => ({
          length: 94,
          offset: 94 * index,
          index,
        })}
      />
    </View>
  );
};

export default TagHeader;

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  listContent: { paddingBottom: 8 },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#553434",
    top: 2,
    left: 2,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
  },
  activeTag: {
    backgroundColor: "#553434",
  },
  tagText: {
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
  activeTagText: {
    color: "#fff",
  },
});
