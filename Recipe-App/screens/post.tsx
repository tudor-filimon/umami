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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { auth, firestore } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { uploadImage } from "../services/imageService";

type RootStackParamList = {
  Post: undefined;
  Caption: { imageUris: string[]; userName: string };
};

type PostScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Post">;
};

const { width } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = width / GRID_COLUMNS;

export default function PostScreen({ navigation }: PostScreenProps) {
  const [selectedImages, setSelectedImages] = useState<
    Array<{ id: string; uri: string }>
  >([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<
    Array<{ id: string; uri: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAndRequestPermissions();
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No current user found");
      Alert.alert("Error", "Please log in to continue");
      return;
    }

    try {
      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data:", userData);
        setUserName(userData.name || currentUser.displayName || "Anonymous");
      } else {
        console.log("User document not found, using display name");
        setUserName(currentUser.displayName || "Anonymous");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
      setUserName(currentUser.displayName || "Anonymous");
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
      if (items.length > 0 && selectedImages.length === 0) {
        setSelectedImages([items[0]]);
        setCurrentImageIndex(0);
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
        setSelectedImages((prev) => [...newImages, ...prev]);
        if (newImages.length > 0) {
          setCurrentImageIndex(selectedImages.length);
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
        setSelectedImages((prev) => [newImage, ...prev]);
        setCurrentImageIndex(selectedImages.length);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const handleImageSelect = (uri: string) => {
    if (selectedImages.length >= 5) {
      Alert.alert(
        "Maximum images reached",
        "You can only select up to 5 images"
      );
      return;
    }
    const newImage = { id: Date.now().toString(), uri };
    setSelectedImages((prev) => [...prev, newImage]);
    setCurrentImageIndex(selectedImages.length);
  };

  const handleDeleteImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNext = async () => {
    if (selectedImages.length === 0) {
      Alert.alert("Error", "Please select at least one image to continue");
      return;
    }

    if (!userName) {
      Alert.alert(
        "Error",
        "User information not found. Please try logging in again."
      );
      return;
    }

    try {
      setUploading(true);
      const imageUrls = await Promise.all(
        selectedImages.map((image) => uploadImage(image.uri))
      );
      navigation.navigate("Caption", {
        imageUris: imageUrls,
        userName: userName,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      Alert.alert(
        "Upload Failed",
        "Failed to upload images. Please try again."
      );
    } finally {
      setUploading(false);
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post (Max 5)</Text>
        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedImages.length === 0 || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#000831" />
          ) : (
            <Text
              style={[
                styles.nextButton,
                (selectedImages.length === 0 || uploading) &&
                  styles.nextButtonDisabled,
              ]}
            >
              Next
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Image Preview */}
        <View style={styles.previewContainer}>
          {selectedImages.length > 0 ? (
            <View style={styles.imageWrapper}>
              {selectedImages[currentImageIndex] && (
                <>
                  <Image
                    source={{ uri: selectedImages[currentImageIndex].uri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(currentImageIndex)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff0000" />
                  </TouchableOpacity>
                  {selectedImages.length > 1 && (
                    <>
                      {currentImageIndex > 0 && (
                        <TouchableOpacity
                          style={[styles.navButton, styles.prevButton]}
                          onPress={handlePrevImage}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={24}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                      {currentImageIndex < selectedImages.length - 1 && (
                        <TouchableOpacity
                          style={[styles.navButton, styles.navButtonNext]}
                          onPress={handleNextImage}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={24}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                      <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                          {currentImageIndex + 1}/{selectedImages.length}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderText}>
                No image selected
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.circularButton}
              onPress={pickMultipleImages}
            >
              <Ionicons name="images" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circularButton}
              onPress={openCamera}
            >
              <Ionicons name="camera" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading photos...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {mediaItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => handleImageSelect(item.uri)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  nextButton: {
    color: "#000831",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonDisabled: {
    color: "#ccc",
  },
  previewContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
    maxWidth: 400,
  },
  previewImage: {
    width: "100%",
    height: "100%",
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
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: GRID_ITEM_SIZE - 2,
    height: GRID_ITEM_SIZE - 2,
    margin: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 4,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    left: 10,
  },
  navButtonNext: {
    right: 10,
  },
  imageCounter: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});