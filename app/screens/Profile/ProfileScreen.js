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
  FlatList,
  Button,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { auth, db , firestore} from "../../config/firebase";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
import defaultAvatar from "../../../assets/profile-pic.png";
import { sendPasswordResetEmail } from "firebase/auth";

const ProfileScreen = () => {
  const [profileData, setProfileData] = useState(null);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [showBuddyInputFor, setShowBuddyInputFor] = useState(null); // Track which trip's input is open
  const [buddyEmail, setBuddyEmail] = useState(""); // Store inputted email
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const navigation = useNavigation();
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

        // Query the Profiles collection
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
          
          // Get profile data
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
          
          // Fetch trips data
          await fetchTrips(user.uid);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching profile:", err);
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
    
    const fetchTrips = async (userId) => {
      try {
        const tripsRef = collection(db, "Trips");
        const myTripsQ = query(tripsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(myTripsQ);
        const tripsSnapshot = await getDocs(tripsRef);
        const tripsData = tripsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(trip => 
            trip.userId === userId || (trip.participants && trip.participants.includes(auth.currentUser.email))
          );
          const now = new Date();
          const myTripsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(t => new Date(t.startDate) >= now);

      
        const upcoming = tripsData.filter(t => new Date(t.startDate) >= now);
        const past = tripsData.filter(t => new Date(t.endDate) < now);
        
 
        setUpcomingTrips(upcoming);
        setPastTrips(past);
        setTrips(myTripsData);
      } catch (error) {
        console.error("Error fetching user trips:", error);
      }
    };
    
    fetchProfileData();
  }, []);

  const handleResetPassword = async () => {
    try {
      const user = auth.currentUser;
  
      if (!user || !user.email) {
        Alert.alert("Error", "User not authenticated or email not available.");
        return;
      }
  
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Success", "Password reset email sent. Please check your inbox.");
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      Alert.alert("Error", "Failed to send password reset email.");
    }
  };
  

  const showTermsAndConditions = () => {
    setTermsVisible(true);
    setShowSettingsModal(false); // This closes your settings modal if it's open
  };
  const [termsVisible, setTermsVisible] = useState(false);



  const addBuddy = async (tripId, email) => {
    try {
      const tripRef = doc(db, "Trips", tripId);
      await updateDoc(tripRef, {
        participants: arrayUnion(email),
      });
      alert("Buddy added successfully!");
      setBuddyEmail(""); // Reset input
      setShowBuddyInputFor(null); // Hide input field
    } catch (error) {
      console.error("Error adding buddy:", error);
      alert("Failed to add buddy.");
    }
  };
  

  const renderMyTrip = ({ item }) => {
    const {
      destination,
      photoUrl,
      tripType,
      id, startDate, endDate
    } = item;

    const startDate1 = startDate?.toDate ? startDate.toDate() : new Date(startDate);
const endDate1 = endDate?.toDate ? endDate.toDate() : new Date(endDate);

const startDateFormatted = startDate1 ? startDate1.toLocaleDateString('en-US') : 'Not specified';
const endDateFormatted = endDate1 ? endDate1.toLocaleDateString('en-US') : 'Not specified';

  
    const destinationName = destination?.address?.split(',')[0] || "Unknown Destination";
  
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripContent}>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{destinationName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{startDateFormatted} - {endDateFormatted}</Text>
          </View>
  
          {showBuddyInputFor === id ? (
            <>
              <TextInput
                placeholder="Enter buddy's email"
                value={buddyEmail}
                onChangeText={setBuddyEmail}
                style={styles.buddyInput}
                keyboardType="email-address"
              />
               <TouchableOpacity
              style={styles.addBuddyButton}
              onPress={() => addBuddy(id, buddyEmail)}
            >
              <Text style={styles.addBuddyButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBuddyButton}
              onPress={() => setShowBuddyInputFor(null)}
            >
              <Text style={styles.addBuddyButtonText}>Cancel</Text>
            </TouchableOpacity>
            
              {/* <Button title="Submit" onPress={() => addBuddy(id, buddyEmail)} />
              <Button title="Cancel" onPress={() => setShowBuddyInputFor(null)} /> */}

            </>
          ) : (
            <TouchableOpacity
              style={styles.addBuddyButton}
              onPress={() => setShowBuddyInputFor(id)}
            >
              <Text style={styles.addBuddyButtonText}>Add Buddy</Text>
            </TouchableOpacity>
         )}
        </View>
      </View>
    );
  };
  

    const renderTrip = ({ item }) => {
      const {
        destination,
        photoUrl,
        tripType, startDate, endDate
      } = item;
      const startDate1 = startDate?.toDate ? startDate.toDate() : new Date(startDate);
const endDate1 = endDate?.toDate ? endDate.toDate() : new Date(endDate);

const startDateFormatted = startDate1 ? startDate1.toLocaleDateString('en-US') : 'Not specified';
const endDateFormatted = endDate1 ? endDate1.toLocaleDateString('en-US') : 'Not specified';

      // Use the first part of the address or a default destination name
      const destinationName = destination?.address?.split(',')[0] || "Unknown Destination";
  
      return (
        <View style={styles.tripCard}> 
          <View style={styles.tripContent}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{destinationName}</Text>
          </View>
          
            <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{startDateFormatted} - {endDateFormatted}</Text>
          </View>
  
          </View>
        </View>
      );
    };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditableData({
        fullName: profileData?.fullName || "",
        title: profileData?.title || "",
        phone: profileData?.phone || "",
        dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date(),
        address: profileData?.address || { street: "", city: "", state: "", zip: "" },
        aboutMe: profileData?.aboutMe || "",
        profileImage: profileData?.profileImage || null
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    try {
      setSavingChanges(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        setSavingChanges(false);
        return;
      }

      // Find the profile document reference
      const profilesRef = collection(db, "Profiles");
      const q = query(profilesRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert("Error", "Profile not found");
        setSavingChanges(false);
        return;
      }
      
      const profileDocRef = doc(db, "Profiles", profileData.id);
      
      // Update the profile document
      await updateDoc(profileDocRef, {
        title: editableData.title,
        fullName: editableData.fullName,
        phone: editableData.phone,
        dateOfBirth: editableData.dateOfBirth.toISOString(),
        address: editableData.address,
        aboutMe: editableData.aboutMe,
        profileImage: editableData.profileImage,
        // Not updating userId or other fields that shouldn't change
      });
      
      setIsEditing(false);
      setSavingChanges(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
      setSavingChanges(false);
    }
  };

  const pickImage = async () => {
    if (!isEditing) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need access to your photos to change your profile picture.");
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    
    if (!result.canceled) {
      setEditableData({
        ...editableData,
        profileImage: result.assets[0].uri
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditableData({
        ...editableData,
        dateOfBirth: selectedDate
      });
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Navigation will be handled by the auth listener in App.js
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}-${end.getDate()}, ${end.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

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
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
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
          
          {isEditing ? (
            <TextInput
              style={styles.editNameInput}
              value={editableData.fullName}
              onChangeText={(text) => setEditableData({...editableData, fullName: text})}
              placeholder="Your Name"
            />
          ) : (
            <Text style={styles.userName}>{profileData?.fullName || ""}</Text>
          )}
          
          {isEditing ? (
            <TextInput
              style={styles.editTitleInput}
              value={editableData.title}
              onChangeText={(text) => setEditableData({...editableData, title: text})}
              placeholder="Title (e.g. Travel Enthusiast)"
            />
          ) : (
            <Text style={styles.userTitle}>{profileData?.title || ""}</Text>
          )}
          
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={18} color="#555" />
            <Text style={styles.infoText}>{auth.currentUser?.email}</Text>
          </View>
          
          {/* <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={18} color="#555" />
            {isEditing ? (
              <TextInput
                style={styles.editInfoInput}
                value={editableData.phone}
                onChangeText={(text) => setEditableData({...editableData, phone: text})}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoText}>{profileData?.phone || ""}</Text>
            )}
          </View> */}
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#555" />
            {isEditing ? (
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerText}>
                  {editableData.dateOfBirth.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoText}>
                {profileData?.dateOfBirth 
                  ? new Date(profileData.dateOfBirth).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) 
                  : "Not specified"}
              </Text>
            )}
          </View>
          
          {showDatePicker && (
            <DateTimePicker
              value={editableData.dateOfBirth}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={18} color="#555" />
            {isEditing ? (
              <View style={styles.addressInputContainer}>
                <TextInput
                  style={styles.editAddressInput}
                  value={editableData.address.city || ""}
                  onChangeText={(text) => setEditableData({
                    ...editableData, 
                    address: {...editableData.address, city: text}
                  })}
                  placeholder="City"
                />
                <TextInput
                  style={styles.editAddressInput}
                  value={editableData.address.state || ""}
                  onChangeText={(text) => setEditableData({
                    ...editableData, 
                    address: {...editableData.address, state: text}
                  })}
                  placeholder="State/Country"
                />
              </View>
            ) : (
              <Text style={styles.infoText}>
                {profileData?.address?.city && profileData?.address?.state 
                  ? `${profileData.address.city}, ${profileData.address.state}` 
                  : "Location not specified"}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          {isEditing ? (
            <TextInput
              style={styles.editAboutInput}
              value={editableData.aboutMe}
              onChangeText={(text) => setEditableData({...editableData, aboutMe: text})}
              placeholder="Tell us about yourself..."
              multiline
            />
          ) : (
            <Text style={styles.aboutText}>{profileData?.aboutMe || "No information provided"}</Text>
          )}
        </View>
        
       {/* Trip Sections Container */}
<View style={styles.tripSectionsContainer}>
<View style={styles.tripsSection}>
  <Text style={styles.sectionTitle}>My Trips</Text>
  <FlatList
    data={trips}
    renderItem={renderMyTrip}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.list}
    showsVerticalScrollIndicator={false}
  />
</View>

<View style={styles.tripsSection}>
  <Text style={styles.sectionTitle}>Upcoming Trips</Text>
  <FlatList
    data={upcomingTrips}
    renderItem={renderTrip}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.list}
    showsVerticalScrollIndicator={false}
  />
</View>

<View style={styles.tripsSection}>
  <Text style={styles.sectionTitle}>Past Trips</Text>
  <FlatList
    data={pastTrips}
    renderItem={renderTrip}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.list}
    showsVerticalScrollIndicator={false}
  />
</View>

</View> 
      

        
        {isEditing ? (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveChanges}
              disabled={savingChanges}
            >
              {savingChanges ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.buttonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleEditToggle}
              disabled={savingChanges}
            >
              <Ionicons name="close" size={18} color="#000" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={handleEditToggle}>
            <Ionicons name="create-outline" size={18} color="#FFF" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
  userTitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
  },
  editNameInput: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    minWidth: 150,
  },
  editTitleInput: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    minWidth: 150,
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
  editInfoInput: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    flex: 1,
  },
  datePickerButton: {
    marginLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    flex: 1,
  },
  datePickerText: {
    fontSize: 14,
    color: "#333",
  },
  addressInputContainer: {
    flex: 1,
    marginLeft: 10,
  },
  editAddressInput: {
    fontSize: 14,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    marginBottom: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  editAboutInput: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    height: 100,
    textAlignVertical: "top",
  },
  tripCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 12,
  },
  tripDetails: {
    flex: 1,
  },
  buddyInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },  
  tripName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 13,
    color: "#666",
  },
  tripStatus: {
    justifyContent: "center",
  },
  statusText: {
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  confirmed: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
  lookingForCompanions: {
    backgroundColor: "#fff3e0",
    color: "#ef6c00",
  },
  tripSectionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  emptyText: {
    color: "#777",
    fontStyle: "italic",
  },
  editButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 10,
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
  saveButton: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  cancelText: {
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
  icon: { marginRight: 10 },
  addBuddyButton: {
    backgroundColor: 'black',  // Set the background to black
    paddingVertical: 10,        // Add some padding
    paddingHorizontal: 20,      // Add horizontal padding
    borderRadius: 5,           // Optional: Rounded corners
    alignItems: 'center',      // Center the text horizontally
    justifyContent: 'center',  // Center the text vertically
    marginVertical: 10,        // Optional: Some space between buttons
  },

  addBuddyButtonText: {
    color: 'white',            // Text color is white
    fontSize: 16,              // Optional: Font size
    fontWeight: 'bold',        // Optional: Bold text
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#444',
    flex: 1,
  },


});

export default ProfileScreen;