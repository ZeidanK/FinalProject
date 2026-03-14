import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

/**
 * LoginScreen component
 *
 * Parameters:
 * None
 *
 * What it does:
 * Displays login form UI for user authentication.
 * Navigates to dashboard on successful login.
 * Backend integration will be implemented later.
 *
 * Returns:
 * React Native screen component
 */
export default function LoginScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  /**
   * Handles login process.
   *
   * Parameters:
   * None
   *
   * What it does:
   * Logs login attempt and navigates to dashboard.
   *
   * Returns:
   * Nothing
   */
  function handleLogin() {

    console.log("Login attempt");

    console.log("Email:", email);
    console.log("Password:", password);

    // TODO:
    // Call backend API when ready
    // Example:
    // POST /api/auth/login

    // For now, simulate success and navigate
    router.push("/dashboard");
  }

  /**
   * Navigates to register screen.
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
  function handleGoToRegister() {
    router.push("/register");
  }

  return (
    <LinearGradient
      colors={['#dbeafe', '#e0e7ff']} // from-blue-50 to-indigo-100
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Login" onPress={handleLogin} color="#2563eb" />

        <View style={styles.linkContainer}>
          <Button
            title="Go to Register"
            onPress={handleGoToRegister}
            color="#6b7280" // gray-500
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16, // rounded-2xl
    padding: 32, // p-8
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10, // shadow-xl
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#1f2937", // gray-800
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db", // gray-300
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 16,
  },
});