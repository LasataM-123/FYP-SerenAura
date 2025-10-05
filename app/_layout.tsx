import { router, SplashScreen, Stack, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout() {
   const { isLoggedIn, hasCompletedOnboarding } = useAuthStore();
  const segments = useSegments();

  //use a loading state if Zustand takes a moment to hydrate
  const ready = isLoggedIn !== undefined && hasCompletedOnboarding !== undefined;
   const [fontsLoaded] = useFonts({
    KodchasanBold: require("../assets/fonts/Kodchasan-Bold.ttf"),
    KodchasanLight: require("../assets/fonts/Kodchasan-Light.ttf"),
    KodchasanMedium: require("../assets/fonts/Kodchasan-Medium.ttf"),
    KodchasanSemiBold: require("../assets/fonts/Kodchasan-SemiBold.ttf"),
    KodchasanRegular: require("../assets/fonts/Kodchasan-Regular.ttf"),
    Pacifico: require("../assets/fonts/Pacifico-Regular.ttf"),
    Schoolbell: require("../assets/fonts/Schoolbell-Regular.ttf"),
  });
   useEffect(() => {
    if (!ready) return; // wait for Zustand hydration
    const currentSegment = segments[0];

    // Current route group
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const inWelcome = currentSegment === "welcome"; 

    if (
      (isLoggedIn || hasCompletedOnboarding) &&
      (inAuthGroup || inOnboarding || inWelcome)
    ) {
      router.replace("/home");
    }
  }, [segments, isLoggedIn, hasCompletedOnboarding, ready]);
   // Prevent splash screen from auto-hiding
useEffect(() => {
  const prepare = async () => {
    await SplashScreen.preventAutoHideAsync();
  };
  prepare();
}, []);

  useEffect(() => {
    if (fontsLoaded) {
      // Hide native splash when fonts are ready
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);


  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{headerShown:false}}/>;
}
