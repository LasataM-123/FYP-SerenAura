import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { useFocusEffect } from 'expo-router';
import {
  Heart,
  ListMusic,
  Notebook,
  MessageCircle,
  ChevronRight,
  PenLine,
  Lock,
  Bell,
  ScrollText,
  History,
  ListVideo,
  LockKeyhole,
  Trash2,
  CircleHelpIcon,
  LogOut,
} from 'lucide-react-native';

import { useBackend } from '@/lib/useBackend';
import { getProfile, ProfileResponse } from '@/lib/api/auth';
import { images } from '@/constants';
import { Animated } from 'react-native';

const BORDER = "#553434";

type SettingItemProps = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  text: string;
  showArrow?: boolean;
  onPress?: () => void;
};

const SettingItem: React.FC<SettingItemProps> = ({
  icon: Icon,
  text,
  showArrow = true,
  onPress,
}) => {

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Icon size={22} color={BORDER} />
        <Text style={styles.settingText}>{text}</Text>
        {showArrow && <ChevronRight size={22} color={BORDER} />}
      </TouchableOpacity>
    </Animated.View>
  );
};


const Profile = () => {

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#ffffff');
    }, [])
  );

  const { refetch,  loading } = useBackend({ fn: getProfile });

  const [user, setUser] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await refetch();
      if (res?.success) {
        setUser(res);
      }
    };
    fetchProfile();
  }, []);
  const maskEmail = (email: string) => {
  if (!email || !email.includes("@")) return email;

  const [name, domain] = email.split("@");

  // Show first 2 letters + ****
  const maskedName =
    name.length <= 2
      ? name[0] + "****"
      : name.slice(0, 2) + "****";

  return `${maskedName}@${domain}`;
};


  return (
    <SafeAreaView style={styles.container}>
      <Header isProfile={true} />

      {/* LOADING INDICATOR */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BORDER} />
        </View>
      )}

      {!loading && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileContainer}>
            <Text style={styles.sectionTitle}>Profile</Text>

            {/* Profile Card */}
            <View style={styles.profileCard}>

              {/* Avatar */}
              <Image
                source={
                  user?.profile.profileUrl
                    ? { uri: user.profile.profileUrl }
                    : images.Avatar
                }
                style={styles.avatar}
              />

              {/* Name + Email */}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.profile.name || "---"}</Text>
              <Text style={styles.email}>
              {user?.profile?.email ? maskEmail(user.profile.email) : "---"}
            </Text>

              </View>

              <TouchableOpacity style={styles.editBtn}>
                <PenLine size={22} color={BORDER} />
              </TouchableOpacity>
            </View>

            {/* My Wellness Hub */}
            <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
              My Wellness Hub
            </Text>

            <View style={styles.cardBoxGreen}>
              <SettingItem icon={Heart} text="Favorites" onPress={() => {}} />
              <SettingItem icon={ListVideo} text="Playlists" onPress={() => {}} />
              <SettingItem icon={ScrollText} text="Mood Logbook" onPress={() => {}} />
              <SettingItem icon={History} text="Chat History" onPress={() => {}} />
            </View>

            {/* General Settings */}
            <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
              General Settings
            </Text>

            <View style={styles.cardBoxPeach}>
              <SettingItem
                icon={LockKeyhole}
                text="Change Password"
                onPress={() => {}}
              />

              {/* Notifications Toggle Row */}
              <View style={styles.settingRow}>
                <Bell size={22} color={BORDER} />
                <Text style={styles.settingText}>Notifications</Text>

                <View style={styles.toggleOuter}>
                  <View style={styles.toggleCircle} />
                </View>
              </View>
            </View>
             {/* Support */}
            <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
              Support
            </Text>

            <View style={styles.cardBoxPurple}>
              <SettingItem icon={CircleHelpIcon} text="Help & Support" onPress={() => {}} />
              <SettingItem icon={Trash2} text="Delete Account" onPress={() => {}} showArrow={false} />
              <SettingItem icon={LogOut} text="Logout" onPress={() => {}} showArrow={false}/>
             
            </View>
          </View>
          <View style={{marginBottom:100}}></View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  profileContainer: {
    marginTop: 22,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 22,
    fontFamily:"KodchasanSemiBold",
    color: BORDER,
    marginBottom: 16,
  },

  profileCard: {
    borderRadius: 20,
    borderWidth: 4,
    borderColor: BORDER,
    backgroundColor: "#FFF3B0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    boxShadow: '3px 3px 0px rgb(85, 52, 52)',

  },

  avatar: {
    width: 55,
    height: 58,
    borderRadius: 10,
    marginRight: 14,
  },

  name: {
    fontSize: 18,
    fontFamily:"KodchasanSemiBold",
    color: BORDER,
  },

  email: {
    fontSize: 14,
    fontFamily:"KodchasanRegular",
    color: BORDER,
    opacity: 0.7,
  },

  editBtn: {
    padding: 6,
  },

  // Setting row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
   
  },

  settingText: {
    flex: 1,
    fontSize: 15,
    color: BORDER,
    marginLeft: 14,
    fontFamily:"KodchasanSemiBold",

  },

  // Boxes
  cardBoxGreen: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#B5EAD7",
    borderWidth: 4,
    borderColor: BORDER,
    marginTop: 12,
  },

  cardBoxPeach: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#FFD6A5",
    borderWidth: 4,
    borderColor: BORDER,
    marginTop: 12,
  },
  cardBoxPurple:{
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#E0BBFF",
    borderWidth: 4,
    borderColor: BORDER,
    marginTop: 12,
  },

  // Toggle switch
  toggleOuter: {
    width: 42,
    height: 22,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: BORDER,
    justifyContent: "center",
    padding: 2,
  },

  toggleCircle: {
    width: 16,
    height: 16,
    borderRadius: 20,
    backgroundColor: BORDER,
    alignSelf: "flex-end",
  },
});
