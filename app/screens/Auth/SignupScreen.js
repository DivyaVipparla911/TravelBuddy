import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  StyleSheet, Image, ScrollView, ActivityIndicator
} from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";

const SignupScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      Alert.alert(
        "Account Created", 
        "A verification email has been sent to your email address. Please verify your email before logging in.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      );
    } catch (error) {
      let errorMessage = "Signup Failed";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already in use";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        default:
          errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header with Icon */}
      <Ionicons name="shield-checkmark-outline" size={40} color="black" />
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Fill in your details to get started</Text>

      {/* Email Field */}
      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="gray" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Enter email address" 
          keyboardType="email-address"
          autoCapitalize="none"
          value={email} 
          onChangeText={setEmail} 
        />
      </View>

      {/* Password Field with Toggle */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Create password (min 6 characters)" 
          secureTextEntry={!showPassword}
          value={password} 
          onChangeText={setPassword} 
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity 
        onPress={handleSignup} 
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={{ fontWeight: "bold" }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ... (keep your existing styles)

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { 
    width: "90%", 
    backgroundColor: "white", 
    padding: 20, 
    borderRadius: 10, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 4, 
    elevation: 5, 
    alignItems: "center" 
  },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 10 },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 20 },
  label: { alignSelf: "flex-start", fontSize: 14, fontWeight: "600", marginTop: 10 },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    width: "100%", 
    borderWidth: 1, 
    borderRadius: 8, 
    borderColor: "#ccc", 
    paddingHorizontal: 10, 
    marginTop: 5 
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 45, fontSize: 16 },
  button: { 
    backgroundColor: "black", 
    width: "100%", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 20 
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  linkText: { marginTop: 15, color: "black", fontSize: 14 },
});

export default SignupScreen;
