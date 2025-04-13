import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { updateUserVerificationStatus } from '../../utils/databaseUtils';

const VerifyingSubmissionScreen = ({ navigation, route }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [isUpdatingDatabase, setIsUpdatingDatabase] = useState(false);

  useEffect(() => {
    // If we have params from the previous screen, use them directly
    if (route.params?.isVerified !== undefined) {
      setIsVerifying(false);
      setVerificationSuccess(route.params.isVerified);
      setMessage(route.params.message || '');
      
      // Update verification status in database
      if (route.params.isVerified) {
        updateVerificationInDatabase(route.params.isVerified);
      }
      return;
    }

    // Otherwise, simulate verification process
    const timer = setTimeout(() => {
      const simulatedSuccess = true; // You can change this for testing
      setIsVerifying(false);
      setVerificationSuccess(simulatedSuccess);
      setMessage(simulatedSuccess ? 'Identity verified successfully!' : 'Verification failed. Please try again.');
      
      // Update verification status in database
      if (simulatedSuccess) {
        updateVerificationInDatabase(simulatedSuccess);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [route.params]);

  const updateVerificationInDatabase = async (isVerified) => {
    try {
      setIsUpdatingDatabase(true);
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error("No user is logged in");
        Alert.alert("Error", "You need to be logged in to verify your identity.");
        return;
      }
      
      await updateUserVerificationStatus(userId, isVerified);
      console.log(`User verification status updated: ${isVerified}`);
    } catch (error) {
      console.error("Failed to update verification status:", error);
      Alert.alert("Error", "Failed to update verification status. Please try again later.");
    } finally {
      setIsUpdatingDatabase(false);
    }
  };

  const handleContinue = () => {
    if (verificationSuccess) {
      // Navigate to home screen or next appropriate screen
      navigation.navigate('CreateProfile');
    } else {
      // Go back to try again
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {isVerifying || isUpdatingDatabase ? (
          <>
            <ActivityIndicator size="large" color="#4A80F0" style={styles.spinner} />
            <Text style={styles.title}>
              {isVerifying ? "Verifying Your Identity" : "Updating Your Profile"}
            </Text>
            <Text style={styles.message}>
              {isVerifying 
                ? "Please wait while we securely verify your identity..." 
                : "Saving verification results to your profile..."}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Ionicons
                name={verificationSuccess ? "checkmark-circle" : "close-circle"}
                size={100}
                color={verificationSuccess ? "#34C759" : "#FF3B30"}
              />
            </View>
            <Text style={styles.title}>
              {verificationSuccess ? "Verification Successful" : "Verification Failed"}
            </Text>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>
                {verificationSuccess ? "Continue" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4A80F0',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default VerifyingSubmissionScreen;