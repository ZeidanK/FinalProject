import { StyleSheet, Text, View } from "react-native";

/**
 * DashboardScreen component.
 *
 * Parameters:
 * None.
 *
 * What it does:
 * Displays a simple dashboard placeholder screen for the app.
 *
 * Returns:
 * A React Native screen component.
 */
export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        This is the main dashboard of Finkeep.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});