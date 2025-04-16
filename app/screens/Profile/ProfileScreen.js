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
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
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
  
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Query the Profiles collection
        const profilesRef = collection(db, "Profiles");
        const q = query(profilesRef, where("userId", "==", user.uid));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          if (querySnapshot.empty) {
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
          //await fetchTrips(user.uid);
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
    
    // Fetch trips from Firestore
    const fetchTrips = async (userId) => {
      try {
        const tripsRef = collection(db, "Trips");
        const q = query(tripsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const now = new Date();
        const upcoming = [];
        const past = [];
        
        querySnapshot.forEach((doc) => {
          const trip = { id: doc.id, ...doc.data() };
          // Parse date strings to Date objects for comparison
          const endDate = new Date(trip.endDate);
          
          if (endDate >= now) {
            upcoming.push(trip);
          } else {
            past.push(trip);
          }
        });
        
        // Sort trips by date
        upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)); // Most recent first
        
        setUpcomingTrips(upcoming);
        setPastTrips(past);
      } catch (err) {
        console.error("Error fetching trips:", err);
      }
    };

    fetchProfileData();
  }, []);

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
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
          
          <View style={styles.infoItem}>
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
          </View>
          
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

{/* My Trip Section */}
<TouchableOpacity 
  style={styles.tripSection} 
  onPress={() => navigation.navigate("CurrentTrip")}
>
  <View style={styles.tripSectionInner}>
    <Text style={styles.tripSectionTitle}>My Trip</Text>
    <Ionicons name="chevron-forward" size={20} color="#555" />
  </View>
</TouchableOpacity>

{/* Divider */}
<View style={styles.divider} />

{/* Upcoming Trip Section */}
<TouchableOpacity 
  style={styles.tripSection} 
  onPress={() => navigation.navigate("UpcomingTrips")}
>
  <View style={styles.tripSectionInner}>
    <Text style={styles.tripSectionTitle}>Upcoming Trip</Text>
    <Ionicons name="chevron-forward" size={20} color="#555" />
  </View>
</TouchableOpacity>

{/* Divider */}
<View style={styles.divider} />

{/* Past Trip Section */}
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
  icon: { marginRight: 10 },
});

export default ProfileScreen;