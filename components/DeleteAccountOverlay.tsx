import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Animated,
  Easing,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { images } from "@/constants";
import Button from "./Button";
import CustomInput from "./CustomInput";

const BORDER = "#553434";

interface Props {
  onClose?: () => void; // 🔥 added here
}

const DeleteAccountOverlay: React.FC<Props> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [inputText, setInputText] = useState("");
  const [visible, setVisible] = useState(true);

  const normalized = (t: string) => t.trim().toLowerCase();
  const isMatch = normalized(inputText) === "delete account";

  useEffect(() => {
    Keyboard.dismiss();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
  }, []);

  const closeOverlay = () => {
    setVisible(false);
    onClose?.(); // 🔥 call parent if provided
  };

  const handleDelete = () => {
    if (!isMatch) return;

    console.log("ACCOUNT DELETED (placeholder)");

    closeOverlay();
  };

  const handleCancel = () => {
    closeOverlay(); // cancel also closes overlay
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" style="light" />

      <View style={[styles.wrapper, { paddingBottom: insets.bottom + 16 }]}>
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Main Card */}
        <View style={styles.card}>
            
        <TouchableOpacity
            style={styles.crossIconContainer}
            onPress={onClose}
        >
            <Image
            source={images.cross}
            style={styles.crossIcon}
            resizeMode="contain"
            />
        </TouchableOpacity>
                     
          <View style={styles.iconWrapper}>
            <Image
              source={images.Warning}
              style={{ width: 90, height: 90 }}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Delete Account?</Text>

          <Text style={styles.description}>
            This action cannot be undone. All your data will be permanently deleted. 
          </Text>
          <Text style={styles.deleteText}>
            Type “delete account” to confirm your action.
          </Text>

          {/* Input Field */}
           <CustomInput
            placeholder='Type "delete account"'
            value={inputText}
            onChangeText={setInputText}
          />

          <View style={{ height: 16}} />


          {/* Delete Account Button */}
          <TouchableOpacity
            disabled={!isMatch}
            activeOpacity={isMatch ? 0.8 : 1}
            onPress={isMatch ? handleDelete : undefined}
            style={{ opacity: isMatch ? 1 : 0.4, width: "100%" }}
          >
            <Button label="Delete Account" onPress={handleDelete} variant="solid" />
          </TouchableOpacity>
          <View style={{ height: 12 }} />
          {/* Cancel Button */}
          <Button label="Cancel" variant="outline" onPress={handleCancel} />

        </View>
      </View>
    </Animated.View>
  );
};

export default DeleteAccountOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  wrapper: {
    width: "80%",
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    top: 3,
    left: 3,
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER,
    backgroundColor: BORDER,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 4,
    borderColor: BORDER,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "KodchasanSemiBold",
    color: BORDER,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    color: BORDER,
    textAlign: "center",
    fontFamily: "KodchasanLight",
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  deleteText:{
    fontSize: 13.5,
    color: BORDER,
    fontFamily: "KodchasanMedium",
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  input: {
    width: "100%",
    minHeight: Platform.OS === "ios" ? 42 : 44,
    borderRadius: 10,
    borderColor: `${BORDER}66`,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "KodchasanRegular",
    color: BORDER,
  },
   crossIconContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 6,
  },
  crossIcon: {
    width: 30,
    height: 30,
  },
});
