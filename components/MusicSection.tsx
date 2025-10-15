import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet } from 'react-native';
import MediumCard from './MediaCards/MediumCard';

const { width } = Dimensions.get('window');

const MusicSection = ({ title, data }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  return (
    <View style={styles.container}>
        <View style={{flex:1, flexDirection:"row", alignItems:"center", justifyContent:"space-between"}}>

      <Text style={styles.title}>
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </Text>
      <Text style={{fontFamily:"KodchasanMedium", color:"#553434", fontSize:14}}>See All</Text>
        </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        snapToInterval={width * 0.7 + 15} // card width + marginRight
        decelerationRate="fast"
        bounces={false}
        renderItem={({ item }) => <MediumCard item={item} />}
      />

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {data.map((_: any, index: number) => (
          <View key={index} style={styles.dotWrapper}>
            {/* Shadow layer behind the dot */}
            <View style={styles.dotShadow} />
            {/* Foreground dot */}
            <View
              style={[
                styles.dot,
                activeIndex === index && styles.activeDot,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default MusicSection;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom:20
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    color: '#553434',
    fontFamily:"KodchasanSemiBold"
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dotWrapper: {
    width: 12,
    height: 12,
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
    borderBlockColor:"#553434",
    borderWidth:1
  },
  activeDot: {
    backgroundColor: '#553434',
  },
});
