import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { postService } from "../services/postService";

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  Caption: {
    imageUris: string[];
    userName: string;
  };
};

type CaptionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Caption"
>;
type CaptionScreenRouteProp = RouteProp<RootStackParamList, "Caption">;

type CaptionScreenProps = {
  navigation: CaptionScreenNavigationProp;
  route: CaptionScreenRouteProp;
};

export default function CaptionScreen({
  navigation,
  route,
}: CaptionScreenProps) {
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showCaptionOverlay, setShowCaptionOverlay] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { imageUris = [] } = route.params;

  const handleNextImage = () => {
    if (currentImageIndex < imageUris.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleShare = async () => {
    if (isPosting) return;

    try {
      setIsPosting(true);

      if (!caption.trim()) {
        Alert.alert("Error", "Please add a caption to your post");
        return;
      }

      await postService.createPost(imageUris, caption, []);

      Alert.alert("Success", "Your post has been shared!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Main"),
        },
      ]);
    } catch (error) {
      console.error("Error sharing post:", error);
      let errorMessage = "Failed to share your post. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("logged in")) {
          errorMessage = "Please log in to share posts.";
        } else if (error.message.includes("profile not found")) {
          errorMessage =
            "Your profile was not found. Please try logging in again.";
        } else if (error.message.includes("permission-denied")) {
          errorMessage =
            "You do not have permission to share posts. Please check your account status.";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDone = () => {
    Keyboard.dismiss();
    setShowCaptionOverlay(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {imageUris.length > 0 && (
            <>
              <Image
                source={{ uri: imageUris[currentImageIndex] }}
                style={styles.image}
                resizeMode="cover"
              />
              {imageUris.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.prevButton]}
                      onPress={handlePrevImage}
                    >
                      <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {currentImageIndex < imageUris.length - 1 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={handleNextImage}
                    >
                      <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1}/{imageUris.length}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Caption Preview */}
        <TouchableOpacity
          style={styles.captionPreviewContainer}
          onPress={() => setShowCaptionOverlay(true)}
        >
          {caption ? (
            <Text style={styles.captionPreviewText} numberOfLines={3}>
              {caption}
            </Text>
          ) : (
            <Text style={styles.captionPlaceholder}>
              Tap to write a caption...
            </Text>
          )}
        </TouchableOpacity>

        {/* Share Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={isPosting}
          >
            <Text style={styles.shareButtonText}>
              {isPosting ? "Sharing..." : "Share"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Caption Overlay */}
      <Modal
        visible={showCaptionOverlay}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCaptionOverlay(false)}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Write a caption</Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.overlayInput}
              placeholder="Write a caption..."
              multiline
              value={caption}
              onChangeText={setCaption}
              autoFocus={true}
              editable={!isPosting}
            />
          </View>
        </View>
      </Modal>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 100 : 80, // Extra padding at bottom for better scrolling
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  captionPreviewContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    marginBottom: 20,
  },
  captionPreviewText: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
  },
  captionPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  bottomContainer: {
    width: "100%",
  },
  shareButton: {
    backgroundColor: "#000831",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000831",
  },
  overlayInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
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
  nextButton: {
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
