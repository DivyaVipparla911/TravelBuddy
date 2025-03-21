import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

const VerifyingSubmissionScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.text}>Verifying Your Submission</Text>
      <Text style={styles.subtext}>Please wait while we process your information...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },
  subtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
});

export default VerifyingSubmissionScreen;
