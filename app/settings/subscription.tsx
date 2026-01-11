import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Button from "@/components/Button";
import { images } from "@/constants";
const plans = [
  {
    id: "annual",
    name: "Annual",
    price: "Then Rs 5000/year",
    trial: "First 14 days free",
    color: "#FFF3B0", 
    badge: "Best Value",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "Then Rs 700/month",
    trial: "First 7 days free",
    color: "#E0BBFF",
    badge: null,
  },
];

const PremiumScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#fff");
    }
  }, []);

  // --- Toast Logic (reused from your code) ---
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

  const handlePurchase = () => {
    if (!selectedPlan) {
      showToastMessage("❌ Please select a plan");
      return;
    }

  };

  const PlanItem = ({ item, isSelected, anySelected, onSelect }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

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
   const opacity = anySelected && isSelected ? 0.5 :1;

    const borderWidth = isSelected ? 4 : 4; 

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(item.id)}
      >
        <Animated.View
          style={[
            styles.planContainer,
            { transform: [{ scale: scaleAnim }], opacity },
          ]}
        >
          {/* Shadow Layer */}
          <View style={styles.planShadowLayer} pointerEvents="none" />

          {/* Main Card */}
          <View style={[styles.planBox, { backgroundColor: item.color, borderWidth }]}>
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>{item.name}</Text>
              <View style={styles.planDetails}>
                <Text style={styles.planTrial}>{item.trial}</Text>
                <Text style={styles.bullet}> • </Text>
                <Text style={styles.planPrice}>{item.price}</Text>
              </View>
            </View>
            
            {/* Best Value Badge */}
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
             {images.cross ? (
                 <Image source={images.cross} style={{width: 30, height: 30}} />
             ) : (
                <View style={styles.closeBtnCircle}><Text style={styles.closeBtnText}>✕</Text></View>
             )}
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </TouchableOpacity>
        </View>

        {/* --- Title --- */}
        <Text style={styles.mainTitle}>
          Unlock Your Best Relaxation Experience
        </Text>

        {/* --- Hero Image Card --- */}
        <View style={styles.heroContainer}>
            <View style={styles.heroShadow} />
            <View style={styles.heroBox}>
                <Image source={images.Gift} style={styles.heroImage} />
                <Text style={styles.heroText}>
                    Get the most of our app with a premium account.
                </Text>
            </View>
        </View>

        {/* --- Benefits List --- */}
        <View style={styles.benefitsSection}>
            <Text style={styles.benefitsHeader}>Try <Text style={{fontFamily: 'Pacifico', fontSize:20}}>SerenAura</Text> Premium</Text>
            
            <View style={styles.benefitItem}>
                <Image source={images.SimpleTick} style={styles.checkIcon} />
                <Text style={styles.benefitText}>Exclusive Meditations</Text>
            </View>
            <View style={styles.benefitItem}>
                <Image source={images.SimpleTick} style={styles.checkIcon} />
                <Text style={styles.benefitText}>Ad-free Experience</Text>
            </View>
            <View style={styles.benefitItem}>
                <Image source={images.SimpleTick} style={styles.checkIcon} />
                <Text style={styles.benefitText}>Advanced mood insights</Text>
            </View>
        </View>

        {/* --- Plans Selection --- */}
        <View style={styles.plansSection}>
            {plans.map((plan) => (
                <PlanItem 
                    key={plan.id}
                    item={plan}
                    isSelected={selectedPlan === plan.id}
                    anySelected={!!selectedPlan}
                    onSelect={setSelectedPlan}
                />
            ))}
        </View>

        {/* --- Footer Button --- */}
        <View style={styles.footer}>
            <Button 
                label="Purchase"
                onPress={handlePurchase}
            />
            <Text style={styles.legalText}>
                By tapping "Purchase",{"\n"}
                you agree to our Terms of Service and Privacy Policy
            </Text>
        </View>

      </ScrollView>

      {/* --- Toast Component --- */}
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
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  closeBtnCircle: {
      width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#553434', justifyContent: 'center', alignItems: 'center'
  },
  closeBtnText: {
      color: '#553434', fontSize: 16, fontWeight: 'bold', marginTop: -2
  },
  restoreText: {
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    fontSize: 14,
   
  },

  // Title
  mainTitle: {
    fontSize: 24,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 30,
  },

  // Hero Card
  heroContainer: {
    height: 180,
    width: '100%',
    marginBottom: 30,
    position: 'relative'
  },
  heroShadow: {
      position: 'absolute',
      top: 3, left: 3,
      width: '100%', height: '100%',
      backgroundColor: '#553434',
      borderRadius: 20,
  },
  heroBox: {
      flex: 1,
      backgroundColor: '#D0DEEE',
      borderRadius: 20,
      borderWidth: 3,
      borderColor: '#553434',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      justifyContent: 'space-between'
  },
  heroImage: {
      width: 120,
      height: 120,
      resizeMode: 'contain'
  },
  heroText: {
      flex: 1,
      fontFamily: "KodchasanMedium",
      color: "#553434",
      fontSize: 16,
      marginLeft: 15,
  },

  // Benefits
  benefitsSection: {
      alignItems: 'center',
      marginBottom: 30,
  },
  benefitsHeader: {
      fontSize: 20,
      fontFamily: "KodchasanRegular",
      color: "#553434",
      marginBottom: 15,
  },
  benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      width: '100%',
      paddingLeft: 40, 
  },
  checkIcon: {
      width: 24,
      height: 24,
      marginRight: 10,
      resizeMode: 'contain'
  },
  benefitText: {
      fontFamily: "KodchasanRegular",
      color: "#553434",
      fontSize: 16,
  },

  // Plans
  plansSection: {
      gap: 16,
      marginBottom: 20,
  },
  planContainer: {
      width: '100%',
      height: 70,
      position: 'relative',
  },
  planShadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
    zIndex: 0,
  },
  planBox: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: "#553434",
      justifyContent: 'center',
      paddingHorizontal: 20,
      zIndex: 1,
  },
  planContent: {
      
  },
  planTitle: {
      fontFamily: "KodchasanMedium",
      fontSize: 18,
      color: "#553434",
  },
  planDetails: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  planTrial: {
      fontFamily: "KodchasanRegular",
      fontSize: 14,
      color: "#553434",
  },
  bullet: {
    fontSize: 14,
    color: "#553434", 
  },
  planPrice: {
      fontFamily: "KodchasanRegular",
      fontSize: 14,
      color: "#553434",
  },
  badge: {
      position: 'absolute',
      right: 15,
      top: 10, // Adjusted to fit
      backgroundColor: '#EFD483', 
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: '#553434',
  },
  badgeText: {
      fontSize: 10,
      fontFamily: "KodchasanBold",
      color: "#553434",
      textTransform: 'uppercase'
  },
  footer: {
      alignItems: 'center',
      marginTop: 10,
  },
  legalText: {
      textAlign: 'center',
      fontFamily: "KodchasanRegular",
      fontSize: 12,
      color: "#553434",
      marginTop: 30,
      lineHeight: 18,
  },

  // Toast
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
});