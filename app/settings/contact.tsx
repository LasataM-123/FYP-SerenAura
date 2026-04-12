import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Phone, Mail } from 'lucide-react-native';

import Top from '@/components/top';

const COLORS = {
  border: '#553434',
  text: '#553434',
  bg: '#fff',
  accordionBg: '#E6F2EA', 
  cardBgSecondary: '#F5EFFF', 
};

const FONTS = {
  bold: 'KodchasanSemiBold',
  medium: 'KodchasanMedium',
  regular: 'KodchasanRegular',
};

/* ---------------- REUSABLE CONTACT CARD ---------------- */
const ContactCard = ({ 
  title, 
  value, 
  icon: Icon, 
  onPress, 
  bgColor 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  onPress: () => void;
  bgColor: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.shadowLayer} />
        <View style={[styles.cardBox, { backgroundColor: bgColor }]}>
          <View style={styles.iconContainer}>
            <Icon size={24} color={COLORS.border} strokeWidth={2.5} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardValue}>{value}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

/* ---------------- MAIN SCREEN ---------------- */
const Contact = () => {
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#fff');
    }
  }, []);

  const handleCall = async () => {
    const phoneNumber = 'tel:+9779800000000';
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert('Error', 'Your device does not support calling from this app.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while trying to make a call.');
    }
  };

  const handleEmail = async () => {
    const email = 'mailto:serenaura.space@gmail.com';
    try {
      const supported = await Linking.canOpenURL(email);
      if (supported) {
        await Linking.openURL(email);
      } else {
        Alert.alert('Error', 'No email app installed or configured.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while trying to open the email app.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Top label="Contact Us" onBack={() => router.back()} />

        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Text style={styles.description}>
          Have any questions? Feel free to reach out to us directly!
        </Text>

        <View style={styles.cardsContainer}>
          <ContactCard
            title="Call Us"
            value="+977 9800000000"
            icon={Phone}
            onPress={handleCall}
            bgColor={COLORS.accordionBg} 
          />

          <ContactCard
            title="Email Us"
            value="serenaura.space@gmail.com"
            icon={Mail}
            onPress={handleEmail}
            bgColor={COLORS.cardBgSecondary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Contact;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 20, 
  },
  cardWrapper: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.border,
    borderRadius: 20,
  },
  cardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    padding: 16,
    zIndex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
});