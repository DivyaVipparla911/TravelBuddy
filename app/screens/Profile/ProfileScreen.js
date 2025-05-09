import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import defaultAvatar from "../../../assets/profile-pic.png";

const ProfileScreen = () => {
  const [profileData, setProfileData] = useState(null);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const navigation = useNavigation();

  // Debug initial state
  console.log("Initial render - loading:", loading, "error:", error);

  useEffect(() => {
    console.log("Starting profile fetch");
    const fetchProfileData = async () => {
      try {
        const user = auth.currentUser;
        console.log("Current user:", user);
        
        if (!user) {
          console.log("No user found");
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        const profilesRef = collection(db, "Profiles");
        const q = query(profilesRef, where("userId", "==", user.uid));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          console.log("Query snapshot received with", querySnapshot.docs.length, "docs");
          
          if (querySnapshot.empty) {
            console.log("No profile found");
            setError("Profile not found");
            setLoading(false);
            return;
          }
          
          const profileDoc = querySnapshot.docs[0];
          const profile = {
            id: profileDoc.id,
            ...profileDoc.data()
          };
          console.log("Profile data loaded:", profile);
          
          setProfileData(profile);
          setEditableData({
            fullName: profile.fullName || "",
            title: profile.title || "",
            phone: profile.phone || "",
            dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date(),
            address: profile.address || { street: "", city: "", state: "", zip: "" },
            aboutMe: profile.aboutMe || "",
            profileImage: profile.profileImage || null
          });
          
          setLoading(false);
        }, (err) => {
          console.error("Error in snapshot:", err);
          setError("Failed to load profile data");
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error in profile fetch:", err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleResetPassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }
      
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Success", "Password reset email sent. Please check your inbox.");
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      Alert.alert("Error", "Failed to send password reset email");
    }
  };

  const showTermsAndConditions = () => {
    setTermsVisible(true);
    setShowSettingsModal(false); // This closes your settings modal if it's open
  };
  const [termsVisible, setTermsVisible] = useState(false);

  

  // Debug current state before render
  console.log("Before render - loading:", loading, "error:", error, "profileData:", profileData);

  if (loading) {
    console.log("Rendering loading state");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading profile data...</Text>
      </View>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{color: 'blue', marginTop: 10}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profileData) {
    console.log("Rendering no profile data state");
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No profile data available</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{color: 'blue', marginTop: 10}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log("Rendering profile screen with data");
  return (
    <View style={styles.container}>
      {/* Header with Settings Icon */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={showTermsAndConditions}
            >
              <Ionicons name="document-text-outline" size={20} color="#555" />
              <Text style={styles.modalOptionText}>Terms and Conditions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={handleResetPassword}
            >
              <Ionicons name="key-outline" size={20} color="#555" />
              <Text style={styles.modalOptionText}>Reset Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
  visible={termsVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setTermsVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.termsModalContainer}>
      {/* Header with "TERMS & CONDITIONS" */}
      <View style={styles.termsHeader}>
        <Text style={styles.termsHeaderText}>TERMS & CONDITIONS</Text>
      </View>
      
      {/* Bold "TravelBuddy" Title */}
      <Text style={styles.termsAppTitle}>TravelBuddy</Text>
      
      {/* Scrollable Content */}
      <ScrollView style={styles.termsScrollContainer}>
        <Text style={styles.termsContentText}>
          Welcome to TravelBuddy! These Terms and Conditions ("Terms") govern your use of our mobile application ("App"). 
          {"\n\n"}1. Acceptance of Terms{"\n"}By using TravelBuddy, you agree to:{"\n"}- Be at least 18 years old.{"\n"}- Comply with all laws.{"\n"}- Accept our Privacy Policy.
          {"\n\n"}2. Account Security{"\n"}- Keep your password secure.{"\n"}- Notify us of unauthorized access.
          {"\n\n"}3. Prohibited Actions{"\n"}- No illegal activities.{"\n"}- No spam or harassment.
          {"\n\n"}4. Changes to Terms{"\n"}We may update these Terms periodically.
        </Text>
      </ScrollView>
      
      {/* Close Button */}
      <TouchableOpacity
        style={styles.termsCloseButton}
        onPress={() => setTermsVisible(false)}
      >
        <Text style={styles.termsCloseText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => {}}>
            <Image 
              source={editableData.profileImage ? { uri: editableData.profileImage } : defaultAvatar} 
              style={styles.avatar} 
            />
            {isEditing && (
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={18} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.userName}>{profileData.fullName || "No name"}</Text>
          <Text style={styles.userEmail}>{auth.currentUser?.email || "No email"}</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#555" />
            <Text style={styles.infoText}>
              {profileData.dateOfBirth 
                ? new Date(profileData.dateOfBirth).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) 
                : "Birthday not specified"}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={18} color="#555" />
            <Text style={styles.infoText}>
              {profileData.address?.city && profileData.address?.state 
                ? `${profileData.address.city}, ${profileData.address.state}` 
                : "Location not specified"}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.aboutText}>{profileData.aboutMe || "No information provided"}</Text>
        </View>
        
        {/* Trip Sections */}
        <View style={styles.tripSectionsContainer}>
          <TouchableOpacity 
            style={styles.tripSection} 
            onPress={() => navigation.navigate("CurrentTrip")}
          >
            <View style={styles.tripSectionInner}>
              <Text style={styles.tripSectionTitle}>My Trip</Text>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.tripSection} 
            onPress={() => navigation.navigate("UpcomingTrips")}
          >
            <View style={styles.tripSectionInner}>
              <Text style={styles.tripSectionTitle}>Upcoming Trip</Text>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.tripSection} 
            onPress={() => navigation.navigate("PastTrips")}
          >
            <View style={styles.tripSectionInner}>
              <Text style={styles.tripSectionTitle}>Past Trip</Text>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name="create-outline" size={18} color="#FFF" />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={() => auth.signOut()}>
          <Ionicons name="log-out-outline" size={18} color="#000" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  profileSection: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  termsModalContainer: {
  backgroundColor: 'white',
  borderRadius: 15,
  width: '90%',
  maxHeight: '80%',
  overflow: 'hidden',
},
termsHeader: {
  backgroundColor: '#000',
  paddingVertical: 15,
  alignItems: 'center',
},
termsHeaderText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
  letterSpacing: 1,
},
termsAppTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  textAlign: 'center',
  marginVertical: 20,
},
termsScrollContainer: {
  paddingHorizontal: 20,
  marginBottom: 15,
},
termsContentText: {
  fontSize: 14,
  lineHeight: 22,
  color: '#333',
},
termsCloseButton: {
  backgroundColor: '#000',
  padding: 12,
  alignItems: 'center',
},
termsCloseText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#555",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    width: "100%",
    paddingHorizontal: 20,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  tripSectionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tripSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  tripSectionInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  editButton: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  logoutText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;