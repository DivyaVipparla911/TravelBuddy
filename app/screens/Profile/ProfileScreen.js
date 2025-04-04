import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useNavigation } from "@react-navigation/native";


const MyProfile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const navigation = useNavigation();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out.");
      navigation.navigate("Login"); // Navigate to the login screen
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      {/* Profile Image */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={pickImage} style={{ position: "relative" }}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../../../assets/profile-pic.png")
            }
            style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 1 }}
          />
          <Ionicons
            name="camera"
            size={24}
            color="white"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: "gray",
              padding: 5,
              borderRadius: 12,
            }}
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 8 }}>
          Reem Mohanty
        </Text>
        <Text style={{ color: "gray" }}>Travel Enthusiast</Text>
      </View>

      {/* Contact Information */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>
          📧 reemmohanty@email.com
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>📞 +1 234 567 8900</Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>📅 15 Jan 1990</Text>
        <Text style={{ fontSize: 16 }}>📍 New York, USA</Text>
      </View>

      {/* About Me Section */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>About Me</Text>
        <Text style={{ color: "gray", marginTop: 4 }}>
          Passionate traveler exploring the world one destination at a time.
          Love meeting new people and experiencing different cultures.
        </Text>
      </View>

      {/* Upcoming Trips */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Upcoming Trips</Text>
        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>Paris Adventure</Text>
          <Text style={{ color: "gray" }}>March 15-22, 2025</Text>
          <View
            style={{
              backgroundColor: "#EEE",
              padding: 6,
              borderRadius: 6,
              alignSelf: "flex-start",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 14, color: "gray" }}>
              Looking for Companions
            </Text>
          </View>
        </View>

        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>Tokyo Explorer</Text>
          <Text style={{ color: "gray" }}>May 1-10, 2025</Text>
          <View
            style={{
              backgroundColor: "#DFF6DD",
              padding: 6,
              borderRadius: 6,
              alignSelf: "flex-start",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 14, color: "green" }}>Confirmed</Text>
          </View>
        </View>
      </View>

      {/* Past Trips */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Past Trips</Text>

        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>Bali Getaway</Text>
          <Text style={{ color: "gray" }}>December 10-20, 2024</Text>
        </View>

        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>Amsterdam Tour</Text>
          <Text style={{ color: "gray" }}>October 5-12, 2024</Text>
        </View>
      </View>

      {/* Edit Profile & Logout Buttons */}
      <TouchableOpacity
        style={{
          backgroundColor: "#000",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 12,
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Ionicons name="pencil" size={20} color="white" />
        <Text style={{ color: "white", fontSize: 16, marginLeft: 8 }}>
          Edit Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#DDD",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={20} color="black" />
        <Text style={{ fontSize: 16, marginLeft: 8 }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MyProfile;