import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import { verifyIdentity } from '../../utils/faceVerification';
import { getAuth } from 'firebase/auth';

const UploadLicenseScreen = ({ navigation }) => {
  const [idImage, setIdImage] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

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
      side === "front" ? setIdImage(result.assets[0].uri) : setUserImage(result.assets[0].uri);
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
        side === "front" ? setIdImage(result.assets[0].uri) : setUserImage(result.assets[0].uri);
      }
    } else {
      alert("Camera permission is required to take a photo.");
    }
  };

  const handleVerification = async () => {
    if (!idImage || !userImage) {
      Alert.alert(
        'Missing Images',
        'Please upload both your ID and take a selfie to proceed with verification.'
      );
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current user ID for Firebase Storage paths
      const auth = getAuth();
      const userId = auth.currentUser?.uid || `anonymous_${Date.now()}`;
      
      const result = await verifyIdentity(idImage, userImage);
      setVerificationResult(result);

      if (result.isVerified) {
        // If match, navigate to success screen
        setTimeout(() => {
          navigation.navigate('VerifyingSubmission', { 
            isVerified: true, 
            message: result.message 
          });
        }, 1000);
      } else {
        setErrorMessage(result.message || 'Face and ID do not match. Please upload clear images again.');
        
        // Optionally reset images
        setIdImage(null);
        setUserImage(null);
      }
    } catch (error) {
      Alert.alert('Verification Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Driver's License</Text>
      <Text style={styles.subtitle}>Please upload clear photos of your ID</Text>

      <View style={styles.uploadContainer}>
        {/* Front Side Upload */}
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("front")} onLongPress={() => takePhoto("front")}>
          {idImage ? (
            <Image source={{ uri: idImage }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>Your Picture- Tap to Upload, Hold to Capture</Text>
          )}
        </TouchableOpacity>
        
        {/* Back Side Upload */}
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("back")} onLongPress={() => takePhoto("back")}>
          {userImage ? (
            <Image source={{ uri: userImage }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>ID Picture - Tap to Upload, Hold to Capture</Text>
          )}
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, (!idImage || !userImage) && styles.disabledButton]}
        onPress={handleVerification}
        disabled={!idImage || !userImage}
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
  errorText: {
    color: 'red',
    fontSize: 14,
    marginVertical: 10,
    textAlign: 'center',
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
