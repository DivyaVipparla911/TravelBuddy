import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "Trips"));
        const tripsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrips(tripsData);
      } catch (error) {
        console.error("Error fetching trips: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const handleJoinTrip = (tripId) => {
    navigation.navigate("TripDetails", { 
      tripId: tripId,
    });
  };

  const renderTrip = ({ item }) => {
    const {
      destination,
      photoUrl,
      tripType,
      description = "Explore the beautiful destination",
      budget
    } = item;

    // Use the first part of the address or a default destination name
    const destinationName = destination?.address?.split(',')[0] || "Unknown Destination";

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripImageContainer}>
          {photoUrl ? (
            <Image 
              source={{ uri: photoUrl }}
              style={styles.tripImage} 
              onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.tripImage, styles.defaultImage]}>
              <Text style={styles.imageText}>Trip Image</Text>
            </View>
          )}
        </View>

        <View style={styles.tripContent}>
          <Text style={styles.tripTitle}>{destinationName}</Text>
          <Text style={styles.tripDescription}>{description}</Text>
          
          <View style={styles.tripTagsRow}>
            <View style={styles.tripTypeTag}>
              <Text style={styles.tripTypeText}>{tripType || "Adventure"}</Text>
            </View>
            <Text style={styles.tripPrice}>${budget}</Text> 
          </View>
          
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => handleJoinTrip(item.id)}
          >
            <Text style={styles.joinButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
  },
  tripImageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#ddd",
  },
  tripImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  defaultImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    color: "#777",
    fontSize: 16,
  },
  tripContent: {
    padding: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  tripDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  tripTagsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tripTypeTag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tripTypeText: {
    fontSize: 12,
    color: "#666",
  },
  tripPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  joinButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default HomeScreen;