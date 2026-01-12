"use client";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput,
  Pressable,
  PanResponder,
  Dimensions,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { router, useFocusEffect } from "expo-router";
import {
  Heart,
  ListVideo,
  ScrollText,
  History,
  PenLine,
  Bell,
  LockKeyhole,
  Trash2,
  CircleHelpIcon,
  LogOut,
  ChevronRight,
  Camera,
  Pencil,
  Contact,
} from "lucide-react-native";
import { useBackend } from "@/lib/useBackend";
import { getProfile, ProfileResponse } from "@/lib/api/auth";
import { images } from "@/constants";
import DeleteAccountOverlay from "@/components/DeleteAccountOverlay";
import DeletingAccountOverlay from "@/components/DeletingAccountOverlay";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Button"; 
import Overlay from "@/components/Overlay";
import { API_URL } from "@/config";
import { editCounselorProfile } from "@/lib/api/counselor";

const BORDER = "#553434";
const SCREEN_HEIGHT = Dimensions.get("window").height;

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

const CounselorProfile = () => {
    const [overlayVisible, setOverlayVisible] = useState(false);
  // initial StatusBar and closing overlay on blur using useFocusEffect
  useFocusEffect(
    useCallback(() => {
          StatusBar.setBarStyle("dark-content");
    StatusBar.setBackgroundColor("#ffffff");
      return () => {
        setOverlayVisible(false);
        setSheetVisible(false);
        sheetY.setValue(SCREEN_HEIGHT);
        keyboardOffset.setValue(0);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const { refetch, loading } = useBackend({ fn: getProfile });
  const { logout, role,userId } = useAuthStore();

  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
  Animated.timing(toggleAnim, {
    toValue: notificationsEnabled ? 1 : 0,
    duration: 180,
    useNativeDriver: false,
  }).start();
}, [notificationsEnabled]);
const handleNotificationToggle = () => {
    const isTurningOn = !notificationsEnabled;
    const userRoleLabel = role === 'counselor' ? 'Counselor' : 'Patient';

    if (isTurningOn) {
      Alert.alert(
        "Enable Notifications",
        "Would you like to receive daily reminders and updates?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Enable", 
            onPress: async () => {
              setNotificationsEnabled(true);
              try {
                // 1. Update User Preference in DB
                await fetch(`${API_URL}/user/notifications`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    userId: userId, 
                    userType: userRoleLabel, 
                    enabled: true 
                  })
                });

                // 2. If Patient, trigger the mood check immediately
                if (role === 'patient') {
                  await fetch(`${API_URL}/notifications/trigger-mood-check`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, userType: 'Patient' })
                  });
                }
              } catch (err) {
                console.error("Update failed", err);
              }
            } 
          }
        ]
      );
    } else {
      // TURNING OFF
      setNotificationsEnabled(false);
      fetch(`${API_URL}/user/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId, 
          userType: userRoleLabel, 
          enabled: false 
        })
      });
    }
  };


  const [showOverlay, setShowOverlay] = useState(false);
  const [showDeleting, setShowDeleting] = useState(false);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  // small offset when keyboard appears (we'll cap this to a small value so whole screen doesn't jump)
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const [sheetVisible, setSheetVisible] = useState(false);


  // track keyboardHeight for padding inside ScrollView
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editDob, setEditDob] = useState("");

  const formatDOB = (dobString: string) => {
    if (!dobString) return "";
    const date = new Date(dobString);
    if (isNaN(date.getTime())) return dobString;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
  if (sheetVisible) {
    StatusBar.setBarStyle("light-content");
    StatusBar.setBackgroundColor("rgba(0,0,0,0.5)");
  } else {
    StatusBar.setBarStyle("dark-content");
    StatusBar.setBackgroundColor("#ffffff");
  }
}, [sheetVisible]);


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          sheetY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          closeSheet();
        } else {
          openSheet(); // snap back
        }
      },
    })
  ).current;

  // --------------------- FUNCTIONS ---------------------
  const fetchProfile = async () => {
    const res = await refetch();
    if (res?.success) {
      setUser(res);
      // preload fields for editing
      setEditName(res.profile?.name || "");
      setEditContact(res.profile?.contactNumber || "");
      setEditDob(res?.profile?.dob ? formatDOB(res.profile.dob) : "");
    }
  };

  useEffect(() => {
    fetchProfile();

    // keyboard listeners
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e: any) => {
        const height = e.endCoordinates ? e.endCoordinates.height : 300;
        setKeyboardHeight(height);

        // Only nudge the sheet a little; do NOT lift the whole screen.
        // Cap to a small value (80-100px depending on available height).
        const liftAmount = Math.min(30, Math.max(40, height - 60));
        Animated.timing(keyboardOffset, {
          toValue: -liftAmount,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return email;
    const [name, domain] = email.split("@");
    const maskedName = name.length <= 2 ? name[0] + "****" : name.slice(0, 2) + "****";
    return `${maskedName}@${domain}`;
  };

  // open/close sheet (mirrors favourites)
  const openSheet = () => {
    setOverlayVisible(true);
    setSheetVisible(true);
    // animate sheet translateY to 0 (visible)
    Animated.timing(sheetY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    // dismiss keyboard first
    Keyboard.dismiss();
    Animated.timing(sheetY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setOverlayVisible(false);
      // reset sheetY so next open animates from bottom
      sheetY.setValue(SCREEN_HEIGHT);
      keyboardOffset.setValue(0);
      setKeyboardHeight(0);
    });
  };
  const pickImage = async () => {
  // Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    return Alert.alert("Permission required", "Please allow gallery access.");
  }

  // Open gallery
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (!result.canceled) {
    setSelectedImage(result.assets[0].uri); // show instantly
  }
};

const [showEditOverlay, setShowEditOverlay] = useState(false);
const [editLoading, setEditLoading] = useState(false);
  // simple local "save" — you can replace with actual API call later
  const handleSave = async () => {
    Keyboard.dismiss();
  try {
    setEditLoading(true);
    await editCounselorProfile({
      name: editName,
      contactNumber: editContact,
      dateOfBirth: editDob,
      imageUri: selectedImage ?? null,
    });
    setEditLoading(false);
      closeSheet();
    setShowEditOverlay(true);
  } catch (err: any) {
    Alert.alert("Error", err.message);
  } finally {
    setEditLoading(false);
  }
};
const Edit = async() =>{
  setShowEditOverlay(false);
  const updated = await refetch();
  setUser(updated);
}


  if (loading || !user) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={BORDER} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContainer}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <Image
              source={user?.profile.profileUrl ? { uri: user.profile.profileUrl } : images.Avatar}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.profile.name || "---"}</Text>
              <Text style={styles.email}>{user?.profile?.email ? maskEmail(user.profile.email) : "---"}</Text>
            </View>
            {/* EDIT opens bottom sheet */}
            <TouchableOpacity style={styles.editBtn} onPress={() => openSheet()}>
              <PenLine size={22} color={BORDER} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionTitle, { marginTop: 26 }]}>General Settings</Text>
          <View style={styles.cardBoxPeach}>
            <SettingItem
              icon={LockKeyhole}
              text="Change Password"
              onPress={() => {
                router.push("../settings/change-password");
              }}
            />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleNotificationToggle}
              activeOpacity={0.8}
            >
              <Bell size={22} color={BORDER} />
              <Text style={styles.settingText}>Notifications</Text>
             <View
            style={[
              styles.toggleOuter,
              { backgroundColor: notificationsEnabled ? BORDER : "#fff" },
            ]}
          >
            <Animated.View
              style={[
                styles.toggleCircle,
                {
                  backgroundColor: notificationsEnabled ? "#fff" : BORDER,
                  transform: [
                    {
                      translateX: toggleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 18],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Support</Text>
          <View style={styles.cardBoxPurple}>
            <SettingItem icon={CircleHelpIcon} text="Help & Support" onPress={() => {router.push("../settings/help")}} />
            <SettingItem
              icon={Trash2}
              text="Delete Account"
              showArrow={false}
              onPress={() => setShowOverlay(true)}
            />
            <SettingItem
              icon={LogOut}
              text="Logout"
              showArrow={false}
              onPress={() => {
                setShowLogoutOverlay(true);
                setTimeout(() => {
                  logout();
                  router.replace("/login");
                }, 1500);
              }}
            />
          </View>
        </View>

        <View style={{ marginBottom: 100 }} />
      </ScrollView>

      {/* Delete Confirmation Overlay */}
      {showOverlay && (
        <DeleteAccountOverlay
          onClose={() => setShowOverlay(false)}
          onDeleteStart={() => {
            setShowOverlay(false);
            setShowDeleting(true);
            setTimeout(() => {
              setShowDeleting(false);
              router.replace("/login");
            }, 2000);
          }}
        />
      )}
      {showDeleting && <DeletingAccountOverlay />}

      {/* Logout overlay */}
      {showLogoutOverlay && (
        <Animated.View style={styles.fullOverlay}>
          <View style={styles.cardWrapper}>
            <View style={styles.shadowLayer} />
            <View style={styles.cardMain}>
              <ActivityIndicator size="large" color={BORDER} />
              <Text style={styles.overlayText}>Logging Out...</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* dark overlay behind sheet when visible */}
      {overlayVisible && <Pressable style={styles.sheetOverlay} onPress={closeSheet} />}

      {/* bottom sheet - Animated + custom keyboard handling */}
      {sheetVisible && (
        // We do NOT use KeyboardAvoidingView here to prevent whole-screen jumping.
        <Animated.View
          style={[
            styles.editSheet,
            {
              transform: [{ translateY: Animated.add(sheetY, keyboardOffset) }],
            },
          ]}
        >
          {/* drag handle */}
          <View {...panResponder.panHandlers} style={styles.sheetDragHandle} />

           <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: Math.max(10, keyboardHeight + 10),
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetContent}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>

              {/* Avatar centered */}
             <View style={styles.avatarWrapper}>
              <TouchableOpacity onPress={pickImage}>
                <Image
                  source={
                    selectedImage
                      ? { uri: selectedImage }
                      : user?.profile?.profileUrl
                      ? { uri: user.profile.profileUrl }
                      : images.Camera
                  }
                  style={styles.centeredAvatar}
                />

                {/* Edit icon only if profile exists */}
                <View style={styles.editIcon}>
                  <Pencil size={20} color="#553434"/>               
                 </View>
              </TouchableOpacity>
            </View>


              <View style={{ marginTop: 18 }}>
                <Text style={styles.fieldLabelSmall}>Name</Text>
                <TextInput
                  style={[styles.inputUnderline]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // keep sheet steady; user can manually scroll to next input
                  }}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabelSmall}>Contact Number</Text>
                <TextInput
                  style={[styles.inputUnderline]}
                  value={editContact}
                  onChangeText={setEditContact}
                  placeholder="+977 98XXXXXXXX"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabelSmall}>Date of Birth</Text>
                <TextInput
                  style={[styles.inputUnderline]}
                  value={editDob}
                  onChangeText={setEditDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                />
              </View>

              <View style={{ marginTop: 18, marginBottom: 40 }}>
                {/* When pressed: keyboard dismissed then sheet closed (handled inside handleSave) */}
                <Button label={editLoading?"Saving Changes...":"Save Changes"} onPress={handleSave} />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}
      {showEditOverlay && (
        <Overlay
        title="Profile Updated successfully!"
        description="Your profile has been updated successfully."
        label="Continue"
        onPress={Edit}
        imageSource={images.Edit}
        />

      )}
    </SafeAreaView>
  );
};

export default CounselorProfile;

// --------------------- STYLES ---------------------
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
    marginTop: 4,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "KodchasanSemiBold",
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
    boxShadow: '3px 3px 0px rgb(85, 52, 52)',
  },
  avatar: {
    width: 55,
    height: 58,
    borderRadius: 10,
    marginRight: 14,
    borderWidth: 2,
    borderColor:"#553434",
    boxShadow: '2px 2px 0px rgb(85, 52, 52)',

  },
  name: {
    fontSize: 18,
    fontFamily: "KodchasanSemiBold",
    color: BORDER,
  },
  email: {
    fontSize: 14,
    fontFamily: "KodchasanRegular",
    color: BORDER,
    opacity: 0.7,
  },
  editBtn: {
    padding: 6,
  },
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
    fontFamily: "KodchasanSemiBold",
  },
  cardBoxPeach: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#FFD6A5",
    borderWidth: 4,
    borderColor: BORDER,
    boxShadow: '2px 2px 0px rgb(85, 52, 52)',

  },
  cardBoxPurple: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#E0BBFF",
    borderWidth: 4,
    borderColor: BORDER,
    boxShadow: '2px 2px 0px rgb(85, 52, 52)',
  },
  toggleOuter: {
    width: 42,
    height: 22,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BORDER,
    justifyContent: "center",
    padding: 2,
  },
  toggleCircle: {
    width: 16,
    height: 16,
    borderRadius: 20,
  },
  /* overlays and cards reused */
  fullOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  cardWrapper: {
    width: 255,
    height: 160,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  shadowLayer: {
    position: "absolute",
    top: 3,
    left: 3,
    width: "100%",
    height: "100%",
    backgroundColor: BORDER,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER,
  },
  cardMain: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayText: {
    marginTop: 18,
    color: BORDER,
    fontFamily: "Schoolbell",
    fontSize: 20,
  },
  /* ---------- EDIT SHEET styles ---------- */
  sheetOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 998,
  },
  editSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingTop: 14,
    paddingBottom: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 999,
    borderColor: BORDER,
    borderWidth: 4,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  sheetDragHandle: {
    width: 60,
    height: 6,
    backgroundColor: BORDER,
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 12,
  },
  sheetContent: {
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 20,
    color: BORDER,
    fontFamily: "KodchasanSemiBold",
    marginBottom: 2,
    textAlign: "center",
  },

  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cameraPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  profileNameSmall: {
    marginTop: 2,
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: BORDER,
  },
  profileEmailSmall: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: "KodchasanRegular",
    color: BORDER,
    opacity: 0.8,
  },
  fieldLabelSmall: {
    fontSize: 13,
    color: BORDER,
    fontFamily: "KodchasanSemiBold",
    marginBottom: 6,
  },
  inputUnderline: {
    borderBottomWidth: 2,
    borderColor: BORDER,
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 15,
    color: BORDER,
    fontFamily: "KodchasanRegular",
    backgroundColor: "#fff",
  },
  cancelRow: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelText: {
    color: BORDER,
    fontFamily: "KodchasanSemiBold",
    fontSize: 16,
  },
  avatarWrapper: {
  alignSelf: "center",
  marginVertical: 20,
},
centeredAvatar: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: "#ddd",
  borderColor:"#553434",
  borderWidth: 4,
  boxShadow: '3px 3px 0px rgb(85, 52, 52)',

},
editIcon: {
  position: "absolute",
  right: 0,
  top: 0,
  borderColor:"#553434",
  borderWidth: 3,
  boxShadow: '2px 2px 0px rgb(85, 52, 52)',
  backgroundColor: "#fff",
  padding: 6,
  borderRadius: 50,
},

});
