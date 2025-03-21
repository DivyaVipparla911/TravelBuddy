import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

const VerifyIdentityScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Identity</Text>
      <Text style={styles.description}>
        To ensure the security of our community, we need to verify your identity before proceeding.
      </Text>
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>🔒 Enhanced Security</Text>
          <Text style={styles.subText}>Protects you and other users from fraud</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>✅ Verified Badge</Text>
          <Text style={styles.subText}>Get a verified badge on your profile</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>🔐 Safe & Secure</Text>
          <Text style={styles.subText}>Your data is encrypted and protected</Text>
        </View>
      </View>
      <Text style={styles.requirementsTitle}>You'll need:</Text>
      <Text style={styles.requirementsText}>🆔 Valid government-issued ID</Text>
      <Text style={styles.requirementsText}>📷 Working camera for selfie</Text>
      <Text style={styles.requirementsText}>⏱️ About 5 minutes of your time</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("UploadLicense")}
      >
        <Text style={styles.buttonText}>Start Verification</Text>
      </TouchableOpacity>
      <Text style={styles.footerText}>
        By continuing, you agree to our verification process and data handling policies
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  stepText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  infoContainer: {
    width: "100%",
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 15,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 14,
    color: "#666",
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  requirementsText: {
    fontSize: 14,
    color: "#444",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 20,
  },
});

export default VerifyIdentityScreen;