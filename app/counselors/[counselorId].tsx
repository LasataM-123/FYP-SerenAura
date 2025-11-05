import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Top from '@/components/top'
import { router, useLocalSearchParams } from 'expo-router'
import { useBackend } from '@/lib/useBackend'
import { getIndividualCounselor } from '@/lib/api/counselor'
import { Calendar, Clock, Hourglass, Stethoscope, UserRound } from 'lucide-react-native'
import Button from '@/components/Button'

const { width } = Dimensions.get('window')
const BORDER_COLOR = '#553434'

const IndividualCounselor = () => {
  const { counselorId } = useLocalSearchParams<{ counselorId: string }>()
  const { refetch, data } = useBackend({ fn: getIndividualCounselor })
  const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const toastAnim = useRef(new Animated.Value(0)).current;
  const [dates, setDates] = useState<{ label: string; day: string; value: string }[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const handleLogMood = () => {
  }
  const times = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
  ]

  useEffect(() => {
    StatusBar.setBarStyle('dark-content')
    refetch({ id: counselorId })
    generateDates()
  }, [])

  const generateDates = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const startFromTomorrow = currentHour >= 18
    const startDate = new Date()

    if (startFromTomorrow) startDate.setDate(startDate.getDate() + 1)

    const arr: { label: string; day: string; value: string }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      const day = d.getDate().toString()
      const value = d.toISOString()
      arr.push({ label, day, value })
    }
    setDates(arr)
  }

  // --- Date Button Component ---
  const AnimatedButton = ({
    topText,
    bottomText,
    label,
    onPress,
    isSelected,
    stacked = false,
  }: {
    topText?: string
    bottomText?: string
    label?: string
    onPress: () => void
    isSelected: boolean
    stacked?: boolean
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        friction: 4,
        useNativeDriver: true,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View
          style={[
            styles.outerCard,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: isSelected ? '#FFF' : '#F4EEE0',
              opacity: isSelected ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.innerCard}>
            {stacked ? (
              <>
                <Text style={styles.dateTop}>{topText}</Text>
                <Text style={styles.dateBottom}>{bottomText}</Text>
              </>
            ) : (
              <Text style={styles.timeLabel}>{label}</Text>
            )}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  }

  // --- Time Button Component ---
  const AnimatedTimeButton = ({
    label,
    onPress,
    isSelected,
  }: {
    label: string
    onPress: () => void
    isSelected: boolean
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        friction: 4,
        useNativeDriver: true,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
     const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        toastAnim.setValue(0);
    
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
    
        setTimeout(() => {
          Animated.timing(toastAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowToast(false));
        }, 2000);
      };

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View
          style={[
            styles.timeOuterCard,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: isSelected ? '#FFF' : '#F4EEE0',
              opacity: isSelected ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.timeLabel}>{label}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
      >
        <Top label="Book Session" onBack={() => router.back()} />
        <Text style={styles.counselorText}>with Dr. {data?.counselor.name}</Text>

        {/* Counselor Info */}
        <View style={styles.counselorContainer}>
          <View style={styles.imageWrapper}>
            <View style={styles.imageShadow} />
            <Image
              source={{ uri: data?.counselor.profileUrl }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cardWrapper}>
            <View style={styles.shadowLayer} />
            <View style={styles.card}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <UserRound size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{data?.counselor.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Stethoscope size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{data?.counselor.speciality}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Hourglass size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{data?.counselor.experience} yrs</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Select Date */}
        <View style={styles.sectionContainer}>
          <View style={styles.shadowLayer} />
          <View style={[styles.sectionCard, { backgroundColor: '#D6E6FA' }]}>
            <View style={styles.sectionHeader}>
              <Calendar size={18} color={BORDER_COLOR} />
              <Text style={styles.sectionTitle}>Select Date</Text>
            </View>
            <View style={styles.dateGrid}>
              {dates.map((d) => (
                <AnimatedButton
                  key={d.value}
                  topText={d.label}
                  bottomText={d.day}
                  onPress={() => setSelectedDate(d.value)}
                  isSelected={selectedDate === d.value}
                  stacked
                />
              ))}
            </View>
          </View>
        </View>

        {/* Select Time */}
        <View style={styles.sectionContainer}>
          <View style={styles.shadowLayer} />
          <View style={[styles.sectionCard, { backgroundColor: '#E4C6FA' }]}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={BORDER_COLOR} />
              <Text style={styles.sectionTitle}>Select Time</Text>
            </View>
            <View style={styles.timeGrid}>
              {times.map((t) => (
                <AnimatedTimeButton
                  key={t}
                  label={t}
                  onPress={() => setSelectedTime(t)}
                  isSelected={selectedTime === t}
                />
              ))}
            </View>
          </View>
        </View>
         <View style={{ marginTop: 30, marginBottom: 30 }}>
            <Button
              label="Book Session"
              onPress={handleLogMood}
            />
          </View>
      </ScrollView>
      {showToast && (
              <Animated.View
                style={[
                  styles.toast,
                  {
                    opacity: toastAnim,
                    transform: [
                      {
                        translateY: toastAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.toastText}>{toastMessage}</Text>
              </Animated.View>
            )}
    </SafeAreaView>
  )
}

export default IndividualCounselor

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  counselorText: {
    fontFamily: 'KodchasanSemiBold',
    fontSize: 16,
    color: BORDER_COLOR,
    textAlign: 'center',
    marginBottom: 22,
  },
  counselorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 110,
    height: 130,
    position: 'relative',
    marginRight: 12,
  },
  imageShadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: '#fff',
    top: 2,
    left: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
  },
  cardWrapper: {
    flex: 1,
    height: 130,
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
    justifyContent: 'center',
    backgroundColor: '#FFF3B0',
    paddingHorizontal: 16,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 8,
    color: BORDER_COLOR,
    fontFamily: 'KodchasanSemiBold',
    flexShrink: 1,
  },

  // Sections
  sectionContainer: {
    marginTop: 26,
    position: 'relative',
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'KodchasanSemiBold',
    color: BORDER_COLOR,
    fontSize: 15,
    marginLeft: 6,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 6,
  },
  outerCard: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    boxShadow: '2px 2px 0px rgb(85, 52, 52)',
  },
  innerCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTop: {
    fontFamily: 'KodchasanSemiBold',
    color: BORDER_COLOR,
    fontSize: 12,
  },
  dateBottom: {
    fontFamily: 'KodchasanSemiBold',
    color: BORDER_COLOR,
    fontSize: 16,
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  timeOuterCard: {
    width: '48%', // 2 per row
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px rgb(85, 52, 52)',

  },
  timeLabel: {
    fontFamily: 'KodchasanSemiBold',
    color: BORDER_COLOR,
    fontSize: 13,
  },
  toast: {
    position: "absolute",
    bottom: 60,
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 3,
    borderColor: "#553434",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  toastText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 16,
  },
})
