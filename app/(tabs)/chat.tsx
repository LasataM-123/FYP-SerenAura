import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ActivityIndicator 
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { CounselorType, getAllCounselors } from '@/lib/api/counselor';
import { useBackend } from '@/lib/useBackend';
import CounselorCard from '@/components/CounselorCard';
import { useChatStatus } from '@/lib/useChatSocket';
import { useSessionStore } from '@/store/sessionStore';
import RequestOverlay from '@/components/BookingOverlay/RequestOverlay';
import { router, useFocusEffect } from 'expo-router';
import { cancelRequest } from '@/lib/api/chat';

const Chat = () => {
  const [counselors, setCounselors] = useState<CounselorType[]>([]);
  const [loading, setLoading] = useState(true);
  const counselorName = useSessionStore((state) => state.counselorName);
  const { refetch } = useBackend({ fn: getAllCounselors });
  const chatId = useSessionStore((state) => state.chatId);
  const requestSentDate = useSessionStore((state) => state.requestSentDate);
  const appointmentDate = useSessionStore((state) => state.appointmentDate);
  const { clearSession } = useSessionStore();
  const { refetch: cancel } = useBackend({ fn: cancelRequest });
  const chatStatus = useChatStatus(chatId || '', requestSentDate || '', appointmentDate);
  const [overlayVisible, setOverlayVisible] = useState(true);

  const [isAppointmentAvailable, setIsAppointmentAvailable] = useState(false);

  // Check appointment availability every second
  useEffect(() => {
    if (!appointmentDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const appointment = new Date(appointmentDate);
      setIsAppointmentAvailable(now >= appointment);
    }, 1000);

    return () => clearInterval(interval);
  }, [appointmentDate]);

  const cancelChatRequest = async () => {
    const res = await cancel({ chatId });
    if (res?.status === 'closed') {
      clearSession();
      setOverlayVisible(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (chatStatus === '' && !chatId) {
        clearSession();
        setOverlayVisible(false);
      }
    }, [chatStatus, chatId])
  );

  useEffect(() => {
    const fetchCounselors = async () => {
      setLoading(true);
      const res = await refetch();
      if (res?.success) setCounselors(res.counselors);
      setLoading(false);
    };
    fetchCounselors();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (['pending', 'active', 'closed', 'ended'].includes(chatStatus) || chatId) {
        setOverlayVisible(true);
      } else if (chatStatus === '') {
        setOverlayVisible(false);
      }
    }, [chatStatus])
  );

  useFocusEffect(
    useCallback(() => {
      if (overlayVisible) {
        StatusBar.setBarStyle('light-content');
        StatusBar.setBackgroundColor('rgba(0,0,0,0.5)');
      } else {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#ffffff');
      }
    }, [overlayVisible])
  );

  const getOverlayContent = () => {
    switch (chatStatus) {

      case 'pending':
        return {
          title: 'Booking Request Sent',
          description: `We’re waiting for Dr.${counselorName} to confirm your chat request within the booked time slot.`,
          status: 'pending' as const,
          onPrimaryAction: () => {
            cancelChatRequest();
          },
        };

      case 'active':
        return {
          title: 'Booking Request Accepted',
          description: `Dr.${counselorName} has accepted your chat request. You can start chatting once your appointment time arrives. 
Please note that if the chat does not begin within an hour of acceptance, the booking will automatically be cancelled.`,
          status: 'active' as const,
          onPrimaryAction: () => {
            if (isAppointmentAvailable) {
              setOverlayVisible(false);
            }
            router.push('/counselors/counselor-chat');
          },
          disabled: !isAppointmentAvailable,
        };

      case 'ended': 
        return {
          title: 'Chat Session Ended',
          description: `Your chat session with Dr.${counselorName} has ended.`,
          status: 'ended' as const,
          onPrimaryAction: () => {
            clearSession();
            setOverlayVisible(false);
          },
        };

      case 'closed':
      case '':
        return {
          title: 'Booking Request Cancelled',
          description: `Your chat with Dr.${counselorName} has been cancelled.`,
          status: 'closed' as const,
          onPrimaryAction: () => {
            clearSession();
            setOverlayVisible(false);
          },
        };

      default:
        return null;
    }
  };

  const overlayContent = getOverlayContent();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#553434" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {overlayVisible && overlayContent && (
        <RequestOverlay
          title={overlayContent.title}
          description={overlayContent.description}
          status={overlayContent.status}
          onPrimaryAction={overlayContent.onPrimaryAction}
          disabled={overlayContent.disabled}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 22 }}
      >
        <View>
          <Text style={styles.headerText}>Choose Your Counselor</Text>
          <Text style={styles.subText}>Find the right therapist for you</Text>
        </View>

        {counselors.map((counselor) => (
          <CounselorCard key={counselor._id} {...counselor} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerText: {
    marginTop: 4,
    fontFamily: 'KodchasanSemiBold',
    fontSize: 22,
    color: '#553434',
  },
  subText: {
    fontFamily: 'KodchasanRegular',
    color: '#553434',
    fontSize: 16,
  },
});
