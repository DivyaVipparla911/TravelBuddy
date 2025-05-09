import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import defaultAvatar from "../../../assets/profile-pic.png";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../../config/firebase";
import { collection, doc, setDoc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const CreateProfile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState("");
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
  const [isVerified, setIsVerified] = useState(false);
  const [errors, setErrors] = useState({
    fullName: false,
    gender: false,
    address: { street: false, city: false },
    travelInterests: false,
    aboutMe: false,
  });

  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "We need access to your camera roll to select images.");
      }
      
      await checkVerificationStatus();
    })();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.isVerified) {
          setIsVerified(true);
          console.log("User is verified:", userData.isVerified);
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

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
    navigation.navigate("VerifyIdentity");
  };

  const validateFields = () => {
    const newErrors = {
      fullName: !fullName.trim(),
      gender: !gender,
      address: {
        street: !address.street.trim(),
        city: !address.city.trim(),
      },
      travelInterests: !Object.values(travelInterests).some(val => val),
      aboutMe: !aboutMe.trim(),
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => 
      typeof error === 'object' 
        ? Object.values(error).some(val => val)
        : error
    );
  };

  const handleSave = async () => {
    if (!validateFields()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;
    console.log("Current User:", user);
    
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a profile.");
      setIsLoading(false);
      return;
    }
    
    try {
      const profileData = collection(db, 'Profiles');
      await addDoc(profileData, {
        userId: user.uid,
        fullName,
        profileImage,
        idImage,
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        travelInterests: Object.keys(travelInterests).filter((key) => travelInterests[key]),
        address,
        aboutMe,
        isVerified: isVerified,
        createdAt: serverTimestamp(),
      });
      
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { 
        profileCreated: true,
        fullName: fullName,
        email: user.email,
      }, { merge: true });

      console.log("Profile saved successfully!");
      Alert.alert(
        "Success", 
        "Profile saved successfully!", 
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
      );
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => pickImage(setProfileImage)}>
              <Image
                source={profileImage ? { uri: profileImage } : defaultAvatar}
                style={styles.profileImage}
              />
              <Ionicons name="camera" size={24} style={styles.cameraIcon} />
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </View>

          {isVerified ? (
            <View style={styles.verificationContainer}>
              <Text style={styles.label}>Verification Status</Text>
              <View style={styles.verificationStatus}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color="#34C759" 
                  style={styles.verificationIcon} 
                />
                <Text style={[styles.verificationText, {color: "#34C759"}]}>
                  Verified
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadID}
            >
              <Ionicons name="document" size={24} color="gray" />
              <Text style={styles.uploadButtonText}>Upload License or State ID</Text>
            </TouchableOpacity>
          )}

        <Text style={styles.label}>Full Name *</Text>
          <View style={[styles.inputContainer, errors.fullName && styles.errorInput]}>
            <Ionicons name="person-outline" size={20} color="gray" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Enter your full name" 
              value={fullName} 
              onChangeText={(text) => {
                setFullName(text);
                setErrors({...errors, fullName: false});
              }} 
            />
          </View>
          {errors.fullName && <Text style={styles.errorText}>Please enter your full name</Text>}


          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity 
            style={[styles.datePickerButton, errors.dateOfBirth && styles.errorInput]} 
            onPress={() => setShowDatePicker(true)}
          >
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

          <Text style={styles.label}>Gender *</Text>
          <View style={[styles.pickerContainer, errors.gender && styles.errorInput]}>
            <Picker 
              selectedValue={gender} 
              onValueChange={(itemValue) => {
                setGender(itemValue);
                setErrors({...errors, gender: false});
              }}
            >
              <Picker.Item label="Select gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
          {errors.gender && <Text style={styles.errorText}>Please select your gender</Text>}

          <Text style={styles.label}>Travel Interests *</Text>
          <View style={[styles.interestsContainer, errors.travelInterests && styles.errorInput]}>
            {Object.keys(travelInterests).map((interest) => (
              <View key={interest} style={styles.interestItem}>
                <Checkbox 
                  value={travelInterests[interest]} 
                  onValueChange={(newValue) => {
                    setTravelInterests({ ...travelInterests, [interest]: newValue });
                    setErrors({...errors, travelInterests: false});
                  }} 
                />
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
          {errors.travelInterests && <Text style={styles.errorText}>Please select at least one interest</Text>}

          <Text style={styles.label}>Address *</Text>
          <TextInput 
            style={[styles.textInput, errors.address.street && styles.errorInput]} 
            placeholder="Street Address" 
            value={address.street} 
            onChangeText={(text) => {
              setAddress({ ...address, street: text });
              setErrors({...errors, address: {...errors.address, street: false}});
            }} 
          />
          {errors.address.street && <Text style={styles.errorText}>Please enter street address</Text>}
          
          <TextInput 
            style={[styles.textInput, errors.address.city && styles.errorInput]} 
            placeholder="City" 
            value={address.city} 
            onChangeText={(text) => {
              setAddress({ ...address, city: text });
              setErrors({...errors, address: {...errors.address, city: false}});
            }} 
          />
          {errors.address.city && <Text style={styles.errorText}>Please enter city</Text>}

          <Text style={styles.label}>About Me *</Text>
          <TextInput 
            style={[styles.textAreaInput, errors.aboutMe && styles.errorInput]} 
            placeholder="Tell us about yourself..." 
            multiline 
            value={aboutMe} 
            onChangeText={(text) => {
              setAboutMe(text);
              setErrors({...errors, aboutMe: false});
            }} 
          />
          {errors.aboutMe && <Text style={styles.errorText}>Please tell us about yourself</Text>}

          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.disabledButton]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>{isLoading ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "gray",
    padding: 5,
    borderRadius: 12
  },
  changePhotoText: {
    color: "gray",
    marginTop: 8
  },
  label: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
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
  icon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16
  },
  verificationContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  verificationIcon: {
    marginRight: 8,
  },
  verificationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  uploadButton: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    borderColor: "#ccc"
  },
  uploadButtonText: {
    color: "gray",
    marginTop: 4
  },
  datePickerButton: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc"
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc"
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  interestItem: {
    flexDirection: "row",
    alignItems: "center",
    margin: 8
  },
  interestText: {
    marginLeft: 8
  },
  textInput: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderColor: "#ccc"
  },
  textAreaInput: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    height: 80,
    borderColor: "#ccc",
    textAlignVertical: "top"
  },
  saveButton: {
    backgroundColor: "blue",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24
  },
  disabledButton: {
    backgroundColor: "lightblue",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold"
  },
  errorInput: {
    borderColor: "red"
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  }
});

export default CreateProfile;