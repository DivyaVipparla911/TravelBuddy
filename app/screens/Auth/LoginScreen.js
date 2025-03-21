import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false); // Toggle state

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Login Successful", "You are now logged in!");
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleSendOTP = () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    Alert.alert("OTP Sent", "Please check your email for the OTP.");
  };

  return (
    <View style={styles.container}>
      {forgotPassword ? (
        // Forgot Password UI
        <View style={styles.forgotContainer}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => setForgotPassword(false)}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Forgot Password</Text>
          </TouchableOpacity>

          {/* Lock Icon */}
          <Image
            source={require("../../../assets/lock.png")}
            style={styles.icon}
          />

          {/* Title */}
          <Text style={styles.title}>Reset Password</Text>

          {/* Description */}
          <Text style={styles.description}>
            Enter your email address and we'll send you an OTP to reset your
            password
          </Text>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="Enter your email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Send OTP Button */}
          <TouchableOpacity onPress={handleSendOTP} style={styles.sendOtpButton}>
            <Text style={styles.sendOtpText}>Send OTP</Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity onPress={() => setForgotPassword(false)}>
            <Text style={styles.backToLogin}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Login UI
        <>
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.box}>
            <Text style={styles.title}>Welcome</Text>

            {/* Email/Mobile Input */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            {/* Password Input */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => setForgotPassword(true)}>
                <Text style={styles.forgotPassword}>
                  <Text style={{ fontWeight: "bold" }}>Forgot Password?</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  box: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    marginBottom: 60,
    height: 50,
    width: 300,
  },
  label: {
    color: "#666",
    marginBottom: 6,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5,
  },
  loginButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  forgotPassword: {
    textAlign: "center",
    color: "#666",
    marginTop: 12,
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "center",
  },
  signupText: {
    color: "#666",
  },
  signupLink: {
    color: "#000",
    fontWeight: "600",
  },

  // Forgot Password Styles
  forgotContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: "#000",
  },
  icon: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  sendOtpButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  sendOtpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToLogin: {
    marginTop: 16,
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
});

export default LoginScreen;