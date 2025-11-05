import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { CounselorType, getAllCounselors } from '@/lib/api/counselor';
import { useBackend } from '@/lib/useBackend';
import CounselorCard from '@/components/CounselorCard';

const Chat = () => {
  const [counselors, setCounselors] = useState<CounselorType[]>([]);
  const { refetch } = useBackend({ fn: getAllCounselors });

  useEffect(() => {
    const fetchCounselors = async () => {
      const res = await refetch();
      if (res?.success) setCounselors(res.counselors);
    };
    fetchCounselors();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 22 }}
      >
        <View>
         <Text style={styles.headerText}>Choose Your Counselor</Text>
         <Text style={{fontFamily:"KodchasanRegular", color:"#553434", fontSize:16}}>Find the right therapist for you</Text>
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
    fontFamily: "KodchasanSemiBold",
    fontSize: 22,
    color: "#553434",
  },
});
