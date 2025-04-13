import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Updates a user's verification status in Firestore
 * @param userId - The user's ID
 * @param isVerified - The verification status
 */
export const updateUserVerificationStatus = async (userId: string, isVerified: boolean) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isVerified: isVerified,
      verifiedAt: new Date().toISOString()
    });
    console.log("Verification status updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating verification status:", error);
    // If document doesn't exist yet, create it
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        isVerified: isVerified,
        verifiedAt: new Date().toISOString()
      });
      console.log("Verification status created successfully");
      return true;
    } catch (createError) {
      console.error("Error creating verification status:", createError);
      return false;
    }
  }
};