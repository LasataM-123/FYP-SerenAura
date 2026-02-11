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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { images } from "@/constants";
import Button from "./Button"; // Assuming this is your custom button
import CustomInput from "./CustomInput"; // Assuming this is your custom input

const BORDER = "#553434";

interface Props {
  onClose: () => void;
  onConfirm: () => Promise<void>; 
}

const CancelSubscriptionOverlay: React.FC<Props> = ({ onClose, onConfirm }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [inputText, setInputText] = useState("");
  const [visible, setVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Validation: User must type "cancel"
  const normalized = (t: string) => t.trim().toLowerCase();
  const isMatch = normalized(inputText) === "cancel";

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
    onClose?.();
  };

  const handleCancelSubscription = async () => {
    if (!isMatch || isLoading) return;

    try {
      setIsLoading(true);
      Keyboard.dismiss();
      
      await onConfirm();
      
      closeOverlay();
    } catch (error) {
      console.error("Cancellation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (!isLoading) closeOverlay();
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
            onPress={handleBack}
            disabled={isLoading}
          >
            <Image
              source={images.cross}
              style={[styles.crossIcon, { opacity: isLoading ? 0.5 : 1 }]}
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

          <Text style={styles.title}>Cancel Subscription?</Text>

          <Text style={styles.description}>
            Are you sure? You will lose access to premium features at the end of your current billing cycle.
          </Text>
          
          <Text style={styles.deleteText}>
            Type “cancel” to confirm your action.
          </Text>

          {/* Input Field */}
          <CustomInput
            placeholder='Type "cancel"'
            value={inputText}
            onChangeText={setInputText}
          />

          <View style={{ height: 16 }} />

          {/* Action Button */}
          <TouchableOpacity
            disabled={!isMatch || isLoading}
            activeOpacity={isMatch ? 0.8 : 1}
            onPress={handleCancelSubscription}
            style={{ 
                opacity: (isMatch && !isLoading) ? 1 : 0.6, 
                width: "100%" 
            }}
          >
            <Button
              label={isLoading ? "Cancelling..." : "Cancel Subscription"}
              onPress={handleCancelSubscription}
              variant="solid"
            />
          </TouchableOpacity>

          <View style={{ height: 12 }} />

         

        </View>
      </View>
    </Animated.View>
  );
};

export default CancelSubscriptionOverlay;

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
  deleteText: {
    fontSize: 13.5,
    color: BORDER,
    fontFamily: "KodchasanMedium",
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  crossIconContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 6,
    zIndex: 10,
  },
  crossIcon: {
    width: 30,
    height: 30,
  },
});