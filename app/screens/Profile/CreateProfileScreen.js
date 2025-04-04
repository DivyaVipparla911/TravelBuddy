import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import defaultAvatar from "../../../assets/profile-pic.png";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import { auth, firestore } from "../../config/firebase"; // Import Firebase Web SDK
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

const CreateProfile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [idImage, setIdImage] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [travelInterests, setTravelInterests] = useState({
    Adventure: false,
    Culture: false,
    Nature: false,
    Urban: false,
  });
  const [address, setAddress] = useState({ street: "", city: "", state: "", zip: "" });
  const [aboutMe, setAboutMe] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation(); // Initialize navigation

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "We need access to your camera roll to select images.");
      }
    })();
  }, []);

  const pickImage = async (setImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleUploadID = () => {
    navigation.navigate("VerifyIdentity"); // Navigate to VerifyIdentity screen
  };
  const handleSave = async () => {
    setIsLoading(true);
    const user = auth.currentUser; // Use auth.currentUser
    console.log("Current User:", user);
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a profile.");
      setIsLoading(false);
      return;
    }
    try{
      const profileData = collection(db, 'Profiles');
      await addDoc(profileData, {
        userId: user.uid,
            profileImage,
            idImage,
            dateOfBirth: dateOfBirth.toISOString(),
            gender,
            travelInterests: Object.keys(travelInterests).filter((key) => travelInterests[key]),
            address,
            aboutMe,
            createdAt: serverTimestamp(),
            
      });
      // Update the user document to mark profile as created
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { profileCreated: true }, { merge: true });

      console.log("Profile saved successfully!");
      Alert.alert("Success", "Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 16, backgroundColor: "white" }}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => pickImage(setProfileImage)}>
          <Image
            source={profileImage ? { uri: profileImage } : defaultAvatar}
            style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 1 }}
          />
          <Ionicons name="camera" size={24} style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "gray", padding: 5, borderRadius: 12 }} />
        </TouchableOpacity>
        <Text style={{ color: "gray", marginTop: 8 }}>Change Photo</Text>
      </View>

      <TouchableOpacity
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, alignItems: "center" }}
        onPress={handleUploadID} // Updated to navigate to VerifyIdentity
      >
        <Ionicons name="document" size={24} color="gray" />
        <Text style={{ color: "gray" }}>Upload License or State ID</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 16 }}>Date of Birth</Text>
      <TouchableOpacity style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} onPress={() => setShowDatePicker(true)}>
        <Text>{dateOfBirth.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setDateOfBirth(date);
          }}
        />
      )}

      <Text style={{ marginTop: 16 }}>Gender</Text>
      <View style={{ borderWidth: 1, borderRadius: 8 }}>
        <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)}>
          <Picker.Item label="Select gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <Text style={{ marginTop: 16 }}>Travel Interests</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Object.keys(travelInterests).map((interest) => (
          <View key={interest} style={{ flexDirection: "row", alignItems: "center", margin: 8 }}>
            <Checkbox value={travelInterests[interest]} onValueChange={(newValue) => setTravelInterests({ ...travelInterests, [interest]: newValue })} />
            <Text style={{ marginLeft: 8 }}>{interest}</Text>
          </View>
        ))}
      </View>

      <Text style={{ marginTop: 16 }}>Address</Text>
      <TextInput style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 8 }} placeholder="Street Address" value={address.street} onChangeText={(text) => setAddress({ ...address, street: text })} />
      <TextInput style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 8 }} placeholder="City" value={address.city} onChangeText={(text) => setAddress({ ...address, city: text })} />

      <Text style={{ marginTop: 16 }}>About Me</Text>
      <TextInput style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 8, height: 80 }} placeholder="Tell us about yourself..." multiline value={aboutMe} onChangeText={setAboutMe} />

      <TouchableOpacity style={{ backgroundColor: "blue", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 16 }} onPress={handleSave}>
        <Text style={{ color: "white" }}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateProfile;