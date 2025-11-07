import { ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { CounselorType, getAllCounselors } from '@/lib/api/counselor';
import { useBackend } from '@/lib/useBackend';
import CounselorCard from '@/components/CounselorCard';
import { useChatStatus } from '@/lib/useChatSocket';
import { useSessionStore } from '@/store/sessionStore';
import RequestOverlay from '@/components/BookingOverlay/RequestOverlay';
import { useFocusEffect, router } from 'expo-router';

const Chat = () => {
  const [counselors, setCounselors] = useState<CounselorType[]>([]);
  const counselorName = useSessionStore((state) => state.counselorName);
  const { refetch } = useBackend({ fn: getAllCounselors });
  const chatId = useSessionStore((state) => state.chatId);
  const requestSentDate = useSessionStore((state) => state.requestSentDate);
  const { clearSession } = useSessionStore();

  const chatStatus = useChatStatus(chatId || '', requestSentDate || '');
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    const fetchCounselors = async () => {
      const res = await refetch();
      if (res?.success) setCounselors(res.counselors);
    };
    fetchCounselors();
  }, []);

// [!code ++]
useFocusEffect(
 useCallback(() => {
 if (['pending', 'active', 'closed'].includes(chatStatus)) {
 setOverlayVisible(true);
 } else {

if (chatStatus === '') {
 setOverlayVisible(false);
 }
}
}, [chatStatus])  );

useEffect(() => {
console.log("Chat ID from store:", chatId);
console.log("Chat Status from hook:", chatStatus); }, [chatId, chatStatus]);

  const getOverlayContent = () => {
    switch (chatStatus) {
      case 'pending':
        return {
          title: 'Booking Request Sent',
          description: `We’re waiting for Dr.${counselorName} to confirm your chat request within the booked time slot.`,
          status: 'pending' as const,
          onPrimaryAction: () => {
            clearSession();
            setOverlayVisible(false);
          },
        };
      case 'active':
        return {
          title: 'Booking Request Accepted',
          description: `Dr.${counselorName} has accepted your chat request. You can start chatting now.`,
          status: 'active' as const,
          onPrimaryAction: () => {
            setOverlayVisible(false);
            
          },
        };
      case 'closed':
        return {
          title: 'Booking Request Cancelled',
          description: `Your chat with Dr.${counselorName} has cancelled.`,
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

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {overlayVisible && overlayContent && (
        <RequestOverlay
          title={overlayContent.title}
          description={overlayContent.description}
          status={overlayContent.status}
          onPrimaryAction={overlayContent.onPrimaryAction}
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
