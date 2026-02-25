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
  ActivityIndicator,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router"; 
import Button from "@/components/Button";
import { images } from "@/constants";
import { 
  initiatePayment, 
  getSubscriptionStatus, 
  cancelSubscription,
  resubscribeSubscription
} from "@/lib/api/subscription";
import CancelSubscriptionOverlay from "@/components/CancelSubscriptionOverlay"; 
import Overlay from "@/components/Overlay";

const plans = [
  {
    id: "yearly",
    name: "Yearly",
    price: "Rs 5000/year",
    color: "#FFF3B0",
    badge: "Best Value",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "Rs 700/month",
    color: "#E0BBFF",
    badge: null,
  },
];

const PremiumScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Base Loading States
  const [loading, setLoading] = useState(false); // For purchase button
  const [statusLoading, setStatusLoading] = useState(true); // For main screen reload

  // Specific Action Loading States for Overlays
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resubscribeLoading, setResubscribeLoading] = useState(false);

  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentSubscriptionType, setCurrentSubscriptionType] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null); 
  
  // Overlay States
  const [showCancelOverlay, setShowCancelOverlay] = useState(false);
  const [showResubscribeOverlay, setShowResubscribeOverlay] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  const fetchStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setIsSubscribed(status.isSubscribed);
      setCurrentSubscriptionType(status.subscriptionType);
      setSubscriptionStatus(status.status || "active"); 
      
      if (status.isSubscribed && status.subscriptionType) {
        setSelectedPlan(status.subscriptionType);
      }
    } catch (error) {
      console.log("Error fetching status:", error);
    } finally {
        setStatusLoading(false);
    }
  };

  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#fff");
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setStatusLoading(true);
      fetchStatus();
    }, [])
  );

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShowToast(false));
    }, 2000);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      showToastMessage("❌ Please select a plan");
      return;
    }

    setLoading(true);
    try {
      const response = await initiatePayment(selectedPlan);

      if (response.success) {
        router.push({
          pathname: "/payment/esewa",
          params: {
            amount: response.amount,
            uuid: response.uuid,
            signature: response.signature,
            product_code: response.product_code,
            planType: selectedPlan
          }
        });
      } else {
        showToastMessage("Failed to initiate");
      }
    } catch (error) {
      console.log(error);
      showToastMessage("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    setCancelLoading(true); // Start Cancel Loader
    try {
      const res = await cancelSubscription();
      if (res.success || res.message) {
         showToastMessage("Subscription Cancelled");
         setShowCancelOverlay(false); // Close overlay after success
         setStatusLoading(true); // Trigger whole screen reload
         await fetchStatus(); 
      }
    } catch (error: any) {
      console.log(error);
      showToastMessage(error.message || "Cancellation failed");
      setShowCancelOverlay(false);
    } finally {
      setCancelLoading(false); // End Cancel Loader
    }
  };

  const handleResubscribe = async () => {
    setResubscribeLoading(true); // Start Resubscribe Loader
    try {
      const res = await resubscribeSubscription();
      if (res.success || res.message) {
        showToastMessage("Successfully Resubscribed!");
        setShowResubscribeOverlay(false); // Close overlay after success
        setStatusLoading(true); // Trigger whole screen reload
        await fetchStatus(); 
      }
    } catch (error: any) {
      console.log(error);
      showToastMessage(error.message || "Resubscription failed");
      setShowResubscribeOverlay(false);
    } finally {
      setResubscribeLoading(false); // End Resubscribe Loader
    }
  };

  const PlanItem = ({ item, isSelected, anySelected, onSelect, disabled }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      if (disabled) return;
      Animated.spring(scaleAnim, { toValue: 0.95, friction: 4, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      if (disabled) return;
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
    };
    
    const opacity = (anySelected && !disabled) ? (isSelected ? 0.5 : 1) : 1;
    const borderWidth = isSelected ? 4 : 4;

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (!disabled) onSelect(item.id);
        }}
      >
        <Animated.View
          style={[
            styles.planContainer,
            { transform: [{ scale: scaleAnim }], opacity },
          ]}
        >
          <View style={styles.planShadowLayer} pointerEvents="none" />
          <View style={[styles.planBox, { backgroundColor: item.color, borderWidth }]}>
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>{item.name}</Text>
              <View style={styles.planDetails}>
                <Text style={styles.planPrice}>{item.price}</Text>
              </View>
            </View>
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

  let buttonLabel = "Purchase";
  let buttonAction = () => { handlePurchase(); };
  let legalMessage = 'By tapping "Purchase",\nyou agree to our Terms of Service and Privacy Policy';
  let heroText = "Get the most of our app with a premium account.";

  if (isSubscribed) {
    if (subscriptionStatus === "cancelled") {
      buttonLabel = loading ? "Processing..." : "Resubscribe";
      buttonAction = () => { setShowResubscribeOverlay(true); };
      legalMessage = "Resubscribe to continue auto-renewing your benefits without interruption.";
      heroText = "Your premium benefits will end soon. Resubscribe to keep them!";
    } else {
      buttonLabel = "Cancel Subscription";
      buttonAction = () => { setShowCancelOverlay(true); };
      legalMessage = "Cancellations will take effect at the end of the current billing cycle.";
      heroText = "You are currently enjoying Premium benefits.";
    }
  } else if (loading) {
    buttonLabel = "Processing...";
  }

  if (statusLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
         <ActivityIndicator size="large" color="#553434" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { router.back(); }}>
             {images.cross ? (
                 <Image source={images.cross} style={{width: 30, height: 30}} />
             ) : (
                <View style={styles.closeBtnCircle}><Text style={styles.closeBtnText}>✕</Text></View>
             )}
          </TouchableOpacity>
        </View>

        <Text style={styles.mainTitle}>
          {isSubscribed ? "Your Active Plan" : "Unlock Your Best Relaxation Experience"}
        </Text>

        <View style={styles.heroContainer}>
          <View style={styles.heroShadow} />
          <View style={styles.heroBox}>
            <Image source={images.Gift} style={styles.heroImage} />
            <Text style={styles.heroText}>{heroText}</Text>
          </View>
        </View>

        <View style={styles.benefitsSection}>
            <Text style={styles.benefitsHeader}>
                {isSubscribed ? "Your" : "Try"} <Text style={{fontFamily: 'Pacifico', fontSize:20}}>SerenAura</Text> Premium
            </Text>
            
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

        <View style={styles.plansSection}>
            {isSubscribed ? (
                plans
                  .filter(plan => plan.id === currentSubscriptionType)
                  .map(plan => (
                    <PlanItem 
                      key={plan.id}
                      item={plan}
                      isSelected={true} 
                      anySelected={true}
                      onSelect={() => {}} 
                      disabled={true} 
                    />
                  ))
            ) : (
                plans.map((plan) => (
                    <PlanItem 
                      key={plan.id}
                      item={plan}
                      isSelected={selectedPlan === plan.id}
                      anySelected={!!selectedPlan}
                      onSelect={setSelectedPlan}
                      disabled={false}
                    />
                ))
            )}
        </View>

        <View style={styles.footer}>
            <Button 
                label={buttonLabel}
                onPress={buttonAction}
                variant="solid" 
            />
            <Text style={styles.legalText}>
                {legalMessage}
            </Text>
        </View>

      </ScrollView>

      {/* --- Cancel Overlay --- */}
      {showCancelOverlay && (
        <CancelSubscriptionOverlay 
            onClose={() => { if(!cancelLoading) setShowCancelOverlay(false) }}
            onConfirm={handleCancelConfirm}
        />
      )}

      {/* --- Resubscribe Overlay using your generic component --- */}
      {showResubscribeOverlay && (
        <Overlay 
            title="Reactivate Premium?"
            description="Are you sure you want to resubscribe and keep enjoying your premium benefits?"
            label={resubscribeLoading ? "Resubscribing..." : "Yes, Resubscribe"}
            imageSource={images.tick}
            includeOutlinedButton={true}
            outlineLabel="Cancel"
            onPress={() => { if (!resubscribeLoading) handleResubscribe(); }} 
            onOutline={() => { if (!resubscribeLoading) setShowResubscribeOverlay(false); }} 
            onClose={() => { if (!resubscribeLoading) setShowResubscribeOverlay(false); }}
            crossIcon={false}
        />
      )}

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
  container: { flex: 1, backgroundColor: "#fff" },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 20 },
  closeBtnCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#553434', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#553434', fontSize: 16, fontWeight: 'bold', marginTop: -2 },
  restoreText: { fontFamily: "KodchasanSemiBold", color: "#553434", fontSize: 14 },
  mainTitle: { fontSize: 24, fontFamily: "KodchasanSemiBold", color: "#553434", textAlign: "center", marginBottom: 24, lineHeight: 30 },
  heroContainer: { height: 180, width: '100%', marginBottom: 30, position: 'relative' },
  heroShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#553434', borderRadius: 20 },
  heroBox: { flex: 1, backgroundColor: '#D0DEEE', borderRadius: 20, borderWidth: 3, borderColor: '#553434', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between' },
  heroImage: { width: 120, height: 120, resizeMode: 'contain' },
  heroText: { flex: 1, fontFamily: "KodchasanMedium", color: "#553434", fontSize: 16, marginLeft: 15 },
  benefitsSection: { alignItems: 'center', marginBottom: 30 },
  benefitsHeader: { fontSize: 20, fontFamily: "KodchasanRegular", color: "#553434", marginBottom: 15 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, width: '100%', paddingLeft: 40 },
  checkIcon: { width: 24, height: 24, marginRight: 10, resizeMode: 'contain' },
  benefitText: { fontFamily: "KodchasanRegular", color: "#553434", fontSize: 16 },
  plansSection: { gap: 16, marginBottom: 20 },
  planContainer: { width: '100%', height: 70, position: 'relative' },
  planShadowLayer: { position: "absolute", width: "100%", height: "100%", borderRadius: 16, borderWidth: 3, borderColor: "#553434", backgroundColor: "#fff", top: 2, left: 2, zIndex: 0 },
  planBox: { flex: 1, borderRadius: 16, borderWidth: 3, borderColor: "#553434", justifyContent: 'center', paddingHorizontal: 20, zIndex: 1 },
  planContent: {},
  planTitle: { fontFamily: "KodchasanMedium", fontSize: 18, color: "#553434" },
  planDetails: { flexDirection: 'row', alignItems: 'center' },
  planTrial: { fontFamily: "KodchasanRegular", fontSize: 14, color: "#553434" },
  bullet: { fontSize: 14, color: "#553434" },
  planPrice: { fontFamily: "KodchasanRegular", fontSize: 14, color: "#553434" },
  badge: { position: 'absolute', right: 15, top: 10, backgroundColor: '#EFD483', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#553434' },
  badgeText: { fontSize: 10, fontFamily: "KodchasanBold", color: "#553434", textTransform: 'uppercase' },
  footer: { alignItems: 'center', marginTop: 10 },
  legalText: { textAlign: 'center', fontFamily: "KodchasanRegular", fontSize: 12, color: "#553434", marginTop: 30, lineHeight: 18 },
  toast: { position: "absolute", bottom: 60, left: "10%", right: "10%", backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 3, borderColor: "#553434", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", zIndex: 9999, elevation: 9999 },
  toastText: { fontFamily: "KodchasanMedium", color: "#553434", fontSize: 16 },
});