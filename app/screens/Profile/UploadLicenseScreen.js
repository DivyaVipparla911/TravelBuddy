import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";

const UploadLicenseScreen = ({ navigation }) => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  // Request camera permission
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  // Open image library
  const pickImage = async (side) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      side === "front" ? setFrontImage(result.assets[0].uri) : setBackImage(result.assets[0].uri);
    }
  };

  // Open camera to take a photo
  const takePhoto = async (side) => {
    await requestCameraPermission();
    if (hasPermission) {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        side === "front" ? setFrontImage(result.assets[0].uri) : setBackImage(result.assets[0].uri);
      }
    } else {
      alert("Camera permission is required to take a photo.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Driver's License</Text>
      <Text style={styles.subtitle}>Please upload clear photos of your ID</Text>

      <View style={styles.uploadContainer}>
        {/* Front Side Upload */}
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("front")} onLongPress={() => takePhoto("front")}>
          {frontImage ? (
            <Image source={{ uri: frontImage }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>Your Picture- Tap to Upload, Hold to Capture</Text>
          )}
        </TouchableOpacity>
        
        {/* Back Side Upload */}
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("back")} onLongPress={() => takePhoto("back")}>
          {backImage ? (
            <Image source={{ uri: backImage }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>ID Picture - Tap to Upload, Hold to Capture</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, (!frontImage || !backImage) && styles.disabledButton]}
        onPress={() => navigation.navigate("VerifyingSubmission")}
        disabled={!frontImage || !backImage}
      >
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  uploadContainer: {
    width: "100%",
    alignItems: "center",
  },
  uploadBox: {
    width: "90%",
    height: 150,
    backgroundColor: "#e3e3e3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 10,
  },
  uploadText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default UploadLicenseScreen;
