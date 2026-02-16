import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { router, usePathname } from 'expo-router';
import MediumCard from './MediaCards/MediumCard';

const { width } = Dimensions.get('window');

const MusicSection = ({ title, data, onTagSelect }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const getTagFromTitle = (title: string) => {
    const possibleTags = ['meditation', 'focus', 'calm', 'stress relief', 'sleep', 'anxiety'];
    const lowerTitle = title.toLowerCase();
    const found = possibleTags.find(tag => lowerTitle.includes(tag));
    return found || 'others';
  };

  const path = usePathname();

  const handleSeeAll = () => {
    const tag = getTagFromTitle(title);

    // If on the search screen, just call the parent-provided handler
    if (path === '/media/search') {
      if (onTagSelect) {
        onTagSelect(tag);
      }
      return;
    }

    // If already on /media, just update params
    if (path === '/media') {
      router.setParams({ tag });
    } else {
      router.push({ pathname: '/media', params: { tag } });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </Text>

        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        snapToInterval={width * 0.7 + 15}
        decelerationRate="fast"
        bounces={false}
        renderItem={({ item }) => <MediumCard item={item} />}
      />

      {/* Pagination Dots */}
      {data.length > 1 && (
  <View style={styles.dotsContainer}>
    {data.map((_: any, index: number) => (
      <View key={index} style={styles.dotWrapper}>
        <View style={styles.dotShadow} />
        <View
          style={[
            styles.dot,
            activeIndex === index && styles.activeDot,
          ]}
        />
      </View>
    ))}
  </View>
)}
    </View>
  );
};

export default MusicSection;

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
    color: '#553434',
    fontFamily: 'KodchasanSemiBold',
  },
  seeAll: {
    fontFamily: 'KodchasanMedium',
    color: '#553434',
    fontSize: 14,
    marginBottom:10
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dotWrapper: {
    width: 10,
    height: 10,
    marginHorizontal: 4,
    position: 'relative',
  },
  dotShadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#553434',
    top: 1,
    left: 1,
  },
  dot: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#F5EFFF',
    borderBlockColor: '#553434',
    borderWidth: 1,
  },
  activeDot: {
    backgroundColor: '#553434',
  },
});
