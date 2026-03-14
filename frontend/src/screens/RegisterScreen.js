import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

/**
 * RegisterScreen component
 *
 * Parameters:
 * None
 *
 * What it does:
 * Displays registration form UI.
 * Navigates to dashboard on successful registration.
 * Backend integration will be implemented later.
 *
 * Returns:
 * React Native screen component
 */
export default function RegisterScreen() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  /**
   * Handles registration process.
   *
   * Parameters:
   * None
   *
   * What it does:
   * Logs register attempt and navigates to dashboard.
   *
   * Returns:
   * Nothing
   */
  function handleRegister() {

    console.log("Register attempt");

    console.log(name, email, password);

    // TODO:
    // POST /api/auth/register

    // For now, simulate success and navigate
    router.push("/dashboard");
  }

  /**
   * Navigates to login screen.
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
  function handleGoToLogin() {
    router.push("/login");
  }

  return (
    <LinearGradient
      colors={['#dbeafe', '#e0e7ff']} // from-blue-50 to-indigo-100
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Register</Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

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

        <Button title="Register" onPress={handleRegister} color="#2563eb" />

        <View style={styles.linkContainer}>
          <Button
            title="Go to Login"
            onPress={handleGoToLogin}
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