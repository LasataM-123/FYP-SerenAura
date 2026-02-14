import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AuthCallback() {
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