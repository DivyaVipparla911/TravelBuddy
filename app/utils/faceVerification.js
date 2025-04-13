
import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Azure Face API configuration
const FACE_API_KEY = ""; // Replace with your Azure Face API key
const FACE_API_ENDPOINT = "https://face-id-travelbuddy.cognitiveservices.azure.com/face/v1.0"; // Replace with your endpoint

/**
 * Uploads image to Firebase Storage and returns download URL
 * @param {string} localUri - Local URI of the image
 * @param {string} storagePath - Path in Firebase Storage
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadImageToFirebase = async (localUri, storagePath) => {
  try {
    // Convert image URI to blob
    const response = await fetch(localUri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    const storage = getStorage();
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw error;
  }
};

/**
 * Fetches an image from a URL and returns base64 data
 * @param {string} imageUrl - URL of the image to fetch
 * @returns {Promise<string>} Base64 encoded image data
 */
export const fetchImageAsBase64 = async (imageUrl) => {
  try {
    // For local file URIs, use FileSystem
    if (imageUrl.startsWith('file://')) {
      return await FileSystem.readAsStringAsync(imageUrl, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    
    // For remote URLs, fetch and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Get base64 string without data URL prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Detects faces in an image and returns face IDs
 * @param {string} imageUri - URI or URL of the image to analyze
 * @returns {Promise<string[]>} Array of face IDs
 */
const detectFace = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();
  
      const apiUrl = `${FACE_API_ENDPOINT}/detect?returnFaceId=true`;
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Ocp-Apim-Subscription-Key": FACE_API_KEY,
        },
        body: imageBlob,
      });
  
      const data = await apiResponse.json();
  
      if (!apiResponse.ok) {
        console.log("Response status:", apiResponse.status);
        console.log("Response body:", data);
        throw new Error(`Face detection failed: ${data.error?.message}`);
      }
  
      if (data.length === 0) {
        throw new Error("No face detected in the image.");
      }
  
      return data[0].faceId;
    } catch (error) {
      console.error("detectFace error:", error);
      throw error;
    }
  };
  
  

/**
 * Verifies if two faces match
 * @param {string} faceId1 - First face ID
 * @param {string} faceId2 - Second face ID
 * @returns {Promise<{isIdentical: boolean, confidence: number}>} Verification result
 */
export const verifyFaces = async (faceId1, faceId2) => {
  try {
    const response = await fetch(`${FACE_API_ENDPOINT}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': FACE_API_KEY,
      },
      body: JSON.stringify({
        faceId1,
        faceId2,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return {
      isIdentical: data.isIdentical,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('Error verifying faces:', error);
    throw error;
  }
};

/**
 * Complete verification process - detects faces in both images and verifies if they match
 * @param {string} idImageUri - URI or URL of the ID card image
 * @param {string} selfieImageUri - URI or URL of the selfie image
 * @returns {Promise<{isVerified: boolean, confidence: number, message: string}>} Verification result
 */
export const verifyIdentity = async (idImageUri, selfieImageUri) => {
  try { 
    const idFaceId = await detectFace(idImageUri);
    if (!idFaceId) {
      return {
        isVerified: false,
        confidence: 0,
        message: 'No face detected in ID image',
      };
    }
    
    const selfieFaceId = await detectFace(selfieImageUri);
    if (!selfieFaceId) {
      return {
        isVerified: false,
        confidence: 0,
        message: 'No face detected in selfie image',
      };
    }
    
    const verificationResult = await verifyFaces(idFaceId, selfieFaceId);
    
    return {
      isVerified: verificationResult.isIdentical,
      confidence: verificationResult.confidence,
      message: verificationResult.isIdentical 
        ? `Identity verified with ${Math.round(verificationResult.confidence * 100)}% confidence` 
        : 'Face on ID does not match selfie',
    };
  } catch (error) {
    console.error('Error verifying identity:', error);
    return {
      isVerified: false,
      confidence: 0,
      message: `Error: ${error.message}`,
    };
  }
};
