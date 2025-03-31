import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  Keyboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { firestore, auth } from "../firebaseConfig";

type Comment = {
  id: string;
  username: string;
  text: string;
  createdAt: Timestamp;
};

type Post = {
  id: string;
  userName: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  createdAt: any;
  likes: number;
  likedBy: string[];
  comments: Comment[];
};

const InstagramPost = ({ post }: { post: Post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchUserName();
    // Initialize like status and count from post data
    setIsLiked(post.likedBy?.includes(currentUserId) || false);
    setLikesCount(post.likes || 0);
  }, [post]);

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

  // User ID from auth
  const currentUserId = post.userName;

  const handleLike = async () => {
    try {
      const postRef = doc(firestore, "posts", post.id);
      const newLikeStatus = !isLiked;
      const likeDelta = newLikeStatus ? 1 : -1;
      const newLikesCount = Math.max(0, likesCount + likeDelta); // Ensure likes don't go below 0

      const updatedLikedBy = newLikeStatus
        ? [...(post.likedBy || []), currentUserId]
        : (post.likedBy || []).filter((id) => id !== currentUserId);

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
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }

    try {
      // Get the current user's name from Firestore
      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      if (!userDoc.exists()) {
        Alert.alert("Error", "User profile not found");
        return;
      }

      const userProfile = userDoc.data();
      const postRef = doc(firestore, "posts", post.id);
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        username: userProfile.name, // Use the actual user's name from their profile
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

  const handleDeleteComment = async (commentId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const postRef = doc(firestore, "posts", post.id);
      const updatedComments = comments.filter(
        (comment) => comment.id !== commentId
      );

      await updateDoc(postRef, {
        comments: updatedComments,
      });

      setComments(updatedComments);
    } catch (error) {
      console.error("Error deleting comment:", error);
      Alert.alert("Error", "Failed to delete comment. Please try again.");
    }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 10);
  const hasMoreComments = comments.length > 10;

  const LikesOverlay = () => (
    <View style={styles.overlay}>
      <View style={styles.likesModal}>
        <View style={styles.likesHeader}>
          <Text style={styles.likesTitle}>Liked By</Text>
          <TouchableOpacity
            onPress={() => setShowLikesOverlay(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.likesList}>
          {post.likedBy &&
            post.likedBy.map((username, index) => (
              <View key={index} style={styles.likeItem}>
                <Image
                  source={{ uri: "https://via.placeholder.com/40" }}
                  style={styles.likeUserImage}
                />
                <Text style={styles.likeUsername}>{username}</Text>
              </View>
            ))}
          {(!post.likedBy || post.likedBy.length === 0) && (
            <View style={styles.emptyLikes}>
              <Text style={styles.emptyLikesText}>No likes yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      {showLikesOverlay && <LikesOverlay />}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: "https://via.placeholder.com/32" }}
            style={styles.profilePic}
          />
          <Text style={styles.username}>{post.userName}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={24} color="black" />
      </View>

      {/* Image */}
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#FF3B30" : "black"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <Ionicons name="bookmark-outline" size={24} color="black" />
      </View>

      {/* Likes */}
      <TouchableOpacity onPress={() => setShowLikesOverlay(true)}>
        <Text style={styles.likes}>{likesCount} likes</Text>
      </TouchableOpacity>

      {/* Caption */}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          <Text style={styles.username}>{post.userName}</Text> {post.caption}
          {post.hashtags.map((tag, index) => (
            <Text key={index} style={styles.hashtag}>
              {" "}
              {tag}
            </Text>
          ))}
        </Text>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          <ScrollView style={styles.commentsList}>
            {displayedComments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUsername}>{comment.username}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
                {comment.username === userName && (
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(comment.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {hasMoreComments && !showAllComments && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => setShowAllComments(true)}
              >
                <Text style={styles.seeMoreText}>
                  See all {comments.length} comments
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

const HomeScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(firestore, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    // Set up real-time listener for posts
    const postsRef = collection(firestore, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFEEB7" }}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.map((post) => (
          <InstagramPost key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingVertical: 12,
    paddingBottom: 80,
    paddingHorizontal: 0,
  },
  flatList: {
    flex: 1,
    backgroundColor: "#FFEEB7",
  },
  listContainer: {
    paddingVertical: 8,
  },
  card: {
    width: "95%",
    alignSelf: "center",
    backgroundColor: "#FFEEB7",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFEEB7",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    marginLeft: 8,
    fontWeight: "600",
  },
  postImage: {
    width: "100%",
    height: 450,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#FFEEB7",
  },
  leftActions: {
    flexDirection: "row",
  },
  actionIcon: {
    marginLeft: 16,
  },
  likes: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#FFEEB7",
  },
  caption: {
    padding: 12,
    paddingTop: 4,
    backgroundColor: "#FFEEB7",
  },
  captionText: {
    fontSize: 14,
  },
  hashtag: {
    color: "#007AFF",
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#FFEEB7",
    maxHeight: 300,
  },
  commentsList: {
    maxHeight: 200,
    padding: 12,
  },
  commentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingRight: 8,
  },
  commentUsername: {
    fontWeight: "600",
    marginRight: 8,
  },
  commentText: {
    flex: 1,
    flexWrap: "wrap",
  },
  addCommentSection: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  postCommentButton: {
    padding: 8,
  },
  postCommentText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  commentContent: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  deleteButton: {
    padding: 4,
  },
  seeMoreButton: {
    padding: 12,
    alignItems: "center",
  },
  seeMoreText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  likesModal: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "#FFEEB7",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  likesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  likesTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  likesList: {
    maxHeight: 400,
  },
  likeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  likeUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  likeUsername: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyLikes: {
    padding: 20,
    alignItems: "center",
  },
  emptyLikesText: {
    fontSize: 16,
    color: "#666",
  },
});

export default HomeScreen;
