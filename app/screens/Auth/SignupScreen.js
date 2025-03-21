import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  StyleSheet, Image, ScrollView 
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons"; // For icons

const SignupScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

const handleSignup = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    Alert.alert("Account Created", "You can now log in!");
    navigation.navigate("Login");
  } catch (error) {
    Alert.alert("Signup Failed", error.message);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      
        {/* Header with Icon */}
        <Ionicons name="shield-checkmark-outline" size={40} color="black" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Fill in your details to get started</Text>

        {/* Full Name Field */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="gray" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Enter your full name" 
            value={fullName} 
            onChangeText={setFullName} 
          />
        </View>

        

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
            placeholder="Create password" 
            secureTextEntry={!showPassword}
            value={password} 
            onChangeText={setPassword} 
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity onPress={handleSignup} style={styles.button}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
  <Text style={styles.linkText}>
    Already have an account? <Text style={{ fontWeight: "bold" }}>Login</Text>
  </Text>
</TouchableOpacity>
      
    </ScrollView>
  );
};

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
