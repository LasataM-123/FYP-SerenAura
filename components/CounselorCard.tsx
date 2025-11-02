import { 
  Animated, 
  Dimensions, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableWithoutFeedback, 
  View 
} from 'react-native';
import React, { useRef } from 'react';
import { CounselorType } from '../lib/api/counselor';
import Button from '@/components/Button'; 
import { Hourglass, Stethoscope, UserRound } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // considering paddingHorizontal: 24
const CARD_HEIGHT = CARD_WIDTH * 0.38;
const BORDER_COLOR = '#553434';

const CounselorCard: React.FC<CounselorType> = ({
  _id,
  name,
  profileUrl,
  experience,
  speciality,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {/* Shadow border around the card */}
        <View style={styles.shadowLayer} />

        <View style={styles.card}>
          {/* Image section with its own shadow layer */}
          <View style={styles.imageWrapper}>
            <View style={styles.imageShadow} />
            <Image source={{ uri: profileUrl }} style={styles.profileImage} />
          </View>

          {/* Info section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <UserRound size={18} color={BORDER_COLOR} />
              <Text style={styles.infoText}>{name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Stethoscope size={18} color={BORDER_COLOR} />
              <Text style={styles.infoText}>{speciality}</Text>
            </View>
            <View style={styles.infoRow}>
              <Hourglass size={18} color={BORDER_COLOR} />
              <Text style={styles.infoText}>{experience} yrs</Text>
            </View>
          </View>

          {/* Bottom-right button */}
          <View style={styles.buttonContainer}>
            <Button label="Select" width={80} height={28} onPress={() => {}} />
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default CounselorCard;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: '#fff',
    top: 2,
    left: 2,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
    paddingRight: 90, 
  },
  imageWrapper: {
    height: '60%',
    width: CARD_HEIGHT * 0.5,
    marginRight: 14,
    position: 'relative',
  },
  imageShadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    backgroundColor: '#fff',
    top: 2,
    left: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#333',
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
});
