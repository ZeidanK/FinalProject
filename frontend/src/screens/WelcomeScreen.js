import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

/**
 * WelcomeScreen component.
 *
 * Parameters:
 * None.
 *
 * What it does:
 * Displays the first screen of the Finkeep app with gradient background.
 * Allows navigation to login or register screens.
 *
 * Returns:
 * React Native screen component.
 */
export default function WelcomeScreen() {

  const router = useRouter();

  /**
   * Handles navigation to login screen.
   *
   * Parameters:
   * None
   *
   * What it does:
   * Pushes login route.
   *
   * Returns:
   * Nothing
   */
  function handleLoginPress() {
    router.push("/login");
  }

  /**
   * Handles navigation to register screen.
   *
   * Parameters:
   * None
   *
   * What it does:
   * Pushes register route.
   *
   * Returns:
   * Nothing
   */
  function handleRegisterPress() {
    router.push("/register");
  }

  return (
    <LinearGradient
      colors={['#dbeafe', '#e0e7ff']} // from-blue-50 to-indigo-100
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Finkeep</Text>

        <Text style={styles.subtitle}>
          Smart receipt and financial management platform
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            onPress={handleLoginPress}
            color="#2563eb" // blue-600
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Register"
            onPress={handleRegisterPress}
            color="#7c3aed" // violet-600
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e40af", // blue-800
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
    color: "#374151", // gray-700
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 20,
  },
});