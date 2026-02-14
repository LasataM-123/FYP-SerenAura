import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function NotFoundScreen() {
    const { isLoggedIn, role } = useAuthStore();

    useEffect(() => {
        if (isLoggedIn) {
            if (role === "counselor") {
                router.replace("/(counselor)/requests");
            } else {
                router.replace("/(tabs)/home");
            }
            return;
        }

        router.replace("/welcome");
    }, [isLoggedIn, role]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#553434" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
});
