import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { globalStyles } from "../styles/globalStyles";
import { auth, firestore } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

type RootStackParamList = {
  Post: undefined;
  Caption: { imageUri: string; userName: string };
  // Add other screens as needed
};

type PostScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Post">;
};

const { width } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = width / GRID_COLUMNS;

export default function PostScreen({ navigation }: PostScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<
    Array<{ id: string; uri: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    checkAndRequestPermissions();
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    }
  };

  const checkAndRequestPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === "granted");
      if (status === "granted") {
        await loadMediaItems();
      } else {
        Alert.alert(
          "Permission needed",
          "Please grant media library permissions to view your photos."
        );
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      Alert.alert("Error", "Failed to check permissions. Please try again.");
    }
  };

  const loadMediaItems = async () => {
    try {
      setLoading(true);
      const albums = await MediaLibrary.getAlbumsAsync();
      const cameraRoll = albums.find((album) => album.title === "Camera Roll");

      if (!cameraRoll) {
        Alert.alert("Error", "Could not find camera roll");
        return;
      }

      const assets = await MediaLibrary.getAssetsAsync({
        album: cameraRoll,
        mediaType: ["photo"],
        sortBy: ["creationTime"],
        first: 100, // Increased to show more photos
      });

      const items = assets.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
      }));

      setMediaItems(items);
      if (items.length > 0 && !selectedImage) {
        setSelectedImage(items[0].uri);
      }
    } catch (error) {
      console.error("Error loading media:", error);
      Alert.alert("Error", "Failed to load photos. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadMediaItems();
  }, []);

  const pickMultipleImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset, index) => ({
          id: `new-${index}`,
          uri: asset.uri,
        }));
        setMediaItems((prev) => [...newImages, ...prev]);
        if (newImages.length > 0) {
          setSelectedImage(newImages[0].uri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera permissions to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        const newImage = {
          id: `camera-${Date.now()}`,
          uri: result.assets[0].uri,
        };
        setMediaItems((prev) => [newImage, ...prev]);
        setSelectedImage(newImage.uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No access to camera roll</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make a post</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Image Preview Area */}
      <View style={styles.previewContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>No image selected</Text>
          </View>
        )}
      </View>

      {/* Media Selection Icons */}
      <View style={styles.iconContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={openCamera}>
          <Ionicons name="camera-outline" size={24} color="#000831" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={pickMultipleImages}
        >
          <Ionicons name="image-outline" size={24} color="#000831" />
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            if (selectedImage) {
              if (!userName) {
                Alert.alert(
                  "Error",
                  "Failed to get user information. Please try again."
                );
                return;
              }
              navigation.navigate("Caption", {
                imageUri: selectedImage,
                userName: userName,
              });
            } else {
              Alert.alert(
                "No image selected",
                "Please select an image to continue"
              );
            }
          }}
          disabled={!selectedImage}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 90 : 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  headerRight: {
    width: 40,
  },
  previewContainer: {
    flex: 0.8,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  previewPlaceholderText: {
    color: "#999",
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    gap: 40,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 0,
    backgroundColor: "#fff",
  },
  continueButton: {
    backgroundColor: "#000831",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
