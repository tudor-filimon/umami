// Full BigPost.tsx with profile pictures fetched from Firestore and userName preserved

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { firestore, auth } from "../firebaseConfig";

// Define types

type Comment = {
  id: string;
  username: string;
  text: string;
  createdAt: Timestamp;
};

type Post = {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption?: string;
  hashtags?: string[];
  createdAt?: any;
  likes?: number;
  likedBy?: string[];
  comments?: Comment[];
  imageUrls?: string[];
};

type RootStackParamList = {
  BigPost: { posts: Post[]; initialIndex: number };
};

type BigPostRouteProp = RouteProp<RootStackParamList, "BigPost">;

const InstagramPost = ({ post }: { post: Post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [userProfilePic, setUserProfilePic] = useState<string>(
    "https://via.placeholder.com/32"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchUserProfilePic();
    setIsLiked(post.likedBy?.includes(post.userName) || false);
    setLikesCount(post.likes || 0);
  }, [post]);

  const fetchUserProfilePic = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", post.userId));
      if (userDoc.exists()) {
        const profileImage = userDoc.data().profileImage;
        if (profileImage) {
          setUserProfilePic(profileImage);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile image:", error);
    }
  };

  const handleLike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const name = post.userName;
    try {
      const postRef = doc(firestore, "posts", post.id);
      const newLikeStatus = !isLiked;
      const likeDelta = newLikeStatus ? 1 : -1;
      const newLikesCount = Math.max(0, likesCount + likeDelta);
      const updatedLikedBy = newLikeStatus
        ? [...(post.likedBy || []), name]
        : (post.likedBy || []).filter((id) => id !== name);

      await updateDoc(postRef, {
        likes: newLikesCount,
        likedBy: updatedLikedBy,
      });

      setIsLiked(newLikeStatus);
      setLikesCount(newLikesCount);
    } catch (error) {
      console.error("Error updating like:", error);
      Alert.alert("Error", "Failed to update like. Please try again.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const postRef = doc(firestore, "posts", post.id);
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        username: post.userName,
        text: newComment.trim(),
        createdAt: Timestamp.now(),
      };
      await updateDoc(postRef, {
        comments: arrayUnion(newCommentObj),
      });
      setComments((prev) => [...prev, newCommentObj]);
      setNewComment("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    }
  };

  const handleNextImage = () => {
    if (post.imageUrls && currentImageIndex < post.imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 10);
  const hasMoreComments = comments.length > 10;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: userProfilePic }} style={styles.profilePic} />
          <Text style={styles.username}>{post.userName}</Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: post.imageUrls
              ? post.imageUrls[currentImageIndex]
              : post.imageUrl,
          }}
          style={styles.postImage}
        />
        {post.imageUrls && post.imageUrls.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={handlePrevImage}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {currentImageIndex < post.imageUrls.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNextImage}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1}/{post.imageUrls.length}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF3B30" : "#262626"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <Text style={styles.likes}>{likesCount} likes</Text>

      <View style={styles.caption}>
        <Text style={styles.captionText}>
          <Text style={styles.username}>{post.userName}</Text>{" "}
          {post.caption || ""}
        </Text>
        <View style={styles.hashtagContainer}>
          {post.hashtags &&
            post.hashtags.map((tag, index) => (
              <Text key={index} style={styles.hashtag}>
                {tag}
              </Text>
            ))}
        </View>
      </View>

      {showComments && (
        <View style={styles.commentsSection}>
          <ScrollView style={styles.commentsList}>
            {displayedComments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentUsername}>{comment.username}:</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
            {hasMoreComments && !showAllComments && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => setShowAllComments(true)}
              >
                <Text style={styles.seeMoreText}>
                  View all {comments.length} comments
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.addCommentSection}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              placeholderTextColor="#8e8e8e"
            />
            <TouchableOpacity
              style={styles.postCommentButton}
              onPress={handleAddComment}
            >
              <Text style={styles.postCommentText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const BigPost: React.FC = () => {
  const route = useRoute<BigPostRouteProp>();
  const { posts, initialIndex } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [currentPosts, setCurrentPosts] = useState<Post[]>(posts);
  const flatListRef = useRef<FlatList<Post>>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const q = query(
        collection(firestore, "posts"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Post[];
      setCurrentPosts(fetchedPosts);
    } catch (error) {
      console.error("Error refreshing posts:", error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (flatListRef.current && initialIndex < posts.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: true,
        });
      }, 100);
    }
  }, [initialIndex]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000831" }}>
      <FlatList
        ref={flatListRef}
        data={currentPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InstagramPost post={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        getItemLayout={(data, index) => ({
          length: Dimensions.get("window").width,
          offset: Dimensions.get("window").width * index,
          index,
        })}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          flatListRef.current?.scrollToOffset({
            offset: index * averageItemLength,
            animated: true,
          });
        }}
      />
    </View>
  );
};

export default BigPost;

const styles = StyleSheet.create({
  card: {
    width: "96%",
    backgroundColor: "#ffffff",
    marginBottom: 12,
    borderRadius: 12,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  username: {
    fontWeight: "600",
    fontSize: 14,
    color: "#262626",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
  },
  postImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 14,
  },
  actionButton: {
    marginRight: 16,
  },
  likes: {
    paddingHorizontal: 14,
    fontWeight: "600",
    fontSize: 14,
    color: "#262626",
  },
  caption: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#262626",
  },
  hashtagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  hashtag: {
    color: "#003569",
    marginRight: 4,
  },
  commentsSection: {
    borderTopWidth: 0.5,
    borderTopColor: "#dbdbdb",
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  commentsList: {
    maxHeight: 300,
    padding: 14,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUsername: {
    fontWeight: "600",
    marginRight: 8,
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
    flexShrink: 1,
  },
  addCommentSection: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#dbdbdb",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: "#262626",
  },
  postCommentButton: {
    paddingHorizontal: 12,
  },
  postCommentText: {
    color: "#0095f6",
    fontSize: 14,
    fontWeight: "600",
  },
  seeMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: "#8e8e8e",
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
