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
  Platform,
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
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore, auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

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
  userProfileImage?: string;
  imageUrl: string;
  imageUrls?: string[];
  caption: string;
  hashtags: string[];
  createdAt: any;
  likes: number;
  likedBy: string[];
  comments: Comment[];
};

type UserData = {
  id: string;
  name: string;
  profileImage?: string;
  [key: string]: any;
};

const InstagramPost = ({ post }: { post: Post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [userName, setUserName] = useState<string>("");
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserName();
    // Initialize like status and count from post data
    setIsLiked(post.likedBy?.includes(userName) || false);
    setLikesCount(post.likes || 0);
  }, [post]);

  const fetchUserName = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          const name = userDoc.data().name;
          setUserName(name);
          // Update like status after getting username
          setIsLiked(post.likedBy?.includes(name) || false);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    }
  };

  const handleLike = async () => {
    if (!userName) {
      Alert.alert("Error", "Please wait while we load your information");
      return;
    }

    try {
      const postRef = doc(firestore, "posts", post.id);
      const newLikeStatus = !isLiked;
      const likeDelta = newLikeStatus ? 1 : -1;
      const newLikesCount = Math.max(0, likesCount + likeDelta);

      const updatedLikedBy = newLikeStatus
        ? [...(post.likedBy || []), userName]
        : (post.likedBy || []).filter((id) => id !== userName);

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
    if (!currentUser || !userName) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }

    try {
      const postRef = doc(firestore, "posts", post.id);
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        username: userName,
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

  const handleNextImage = () => {
    if (
      post.imageUrls &&
      Array.isArray(post.imageUrls) &&
      currentImageIndex < post.imageUrls.length - 1
    ) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (
      post.imageUrls &&
      Array.isArray(post.imageUrls) &&
      currentImageIndex > 0
    ) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

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
          {(post.likedBy.length === 0) && (
            <View style={styles.emptyLikes}>
              <Text style={styles.emptyLikesText}>No likes yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );

  // Handle post deletion
  const handleDeletePost = async () => {
    try {
      await deleteDoc(doc(firestore, "posts", post.id));
      Alert.alert("Success", "Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Error", "Failed to delete post. Please try again.");
    }
    setShowDeleteOverlay(false);
  };

  // Delete confirmation overlay component
  const DeleteOverlay = () => (
    <View style={styles.overlay}>
      <View style={styles.deleteModal}>
        <Text style={styles.deleteTitle}>Delete Post?</Text>
        <Text style={styles.deleteMessage}>
          Are you sure you want to delete this post?
        </Text>
        <View style={styles.deleteButtons}>
          <TouchableOpacity
            style={[styles.deleteButton, styles.cancelButton]}
            onPress={() => setShowDeleteOverlay(false)}
          >
            <Text style={styles.cancelButtonText}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, styles.confirmButton]}
            onPress={handleDeletePost}
          >
            <Text style={styles.confirmButtonText}>Yes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Add this function to fetch users
  const fetchUsers = async () => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Add this function to handle sharing
  const handleShare = async (post: Post, receiverId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Create a message with the post details
      const messageData = {
        text: `Shared a post: ${post.caption}`,
        senderId: currentUser.uid,
        receiverId: receiverId,
        timestamp: serverTimestamp(),
        participants: [currentUser.uid, receiverId],
        read: false,
        postId: post.id, // Store the post ID
        postImage: post.imageUrl, // Store the post image URL
        postCaption: post.caption, // Store the post caption
        type: 'post' // Indicate this is a post share
      };

      // Add the message to the messages collection
      await addDoc(collection(firestore, 'messages'), messageData);

      // Close the share overlay
      setShowShareOverlay(false);
      Alert.alert('Success', 'Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  // Add this component for the share overlay
  const ShareOverlay = () => (
    <View style={styles.overlay}>
      <View style={styles.shareModal}>
        <View style={styles.shareHeader}>
          <Text style={styles.shareTitle}>Share with</Text>
          <TouchableOpacity onPress={() => setShowShareOverlay(false)} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView style={styles.usersList}>
          {users
            .filter(user => 
              user.id !== auth.currentUser?.uid &&
              user.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItem}
                onPress={() => handleShare(post, user.id)}
              >
                <Image
                  source={{ uri: user.profileImage || 'https://via.placeholder.com/40' }}
                  style={styles.userImage}
                />
                <Text style={styles.userName}>{user.name}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      {showLikesOverlay && <LikesOverlay />}
      {showDeleteOverlay && <DeleteOverlay />}
      {showShareOverlay && <ShareOverlay />}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.profilePicContainer}>
            <Image
              source={{ uri: post.userProfileImage || 'https://via.placeholder.com/32' }}
              style={styles.profilePic}
            />
          </View>
          <Text style={styles.username}>{post.userName}</Text>
        </View>
        {userName === post.userName && (
          <TouchableOpacity onPress={() => setShowDeleteOverlay(true)}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#262626" />
          </TouchableOpacity>
        )}
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              post.imageUrls &&
              Array.isArray(post.imageUrls) &&
              post.imageUrls.length > 0
                ? post.imageUrls[currentImageIndex]
                : post.imageUrl,
          }}
          style={styles.postImage}
        />
        {post.imageUrls &&
          Array.isArray(post.imageUrls) &&
          post.imageUrls.length > 1 && (
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
                  style={[styles.navButton, styles.navButtonNext]}
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

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#FF3B30" : "#262626"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionIcon]}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons
              name={showComments ? "chatbubble" : "chatbubble-outline"}
              size={22}
              color="#262626"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionIcon]}
            onPress={() => {
              fetchUsers();
              setShowShareOverlay(true);
            }}
          >
            <Ionicons name="paper-plane-outline" size={22} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsBookmarked(!isBookmarked)}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#262626"
          />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <TouchableOpacity
        onPress={() => setShowLikesOverlay(true)}
        style={styles.likesContainer}
      >
        <Text style={styles.likes}>{likesCount} likes</Text>
      </TouchableOpacity>

      {/* Caption */}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          <Text style={styles.username}>{post.userName}</Text>{" "}
          <Text style={styles.captionContent}>{post.caption}</Text>
        </Text>
        <View style={styles.hashtagContainer}>
          {post.hashtags.map((tag, index) => (
            <Text key={index} style={styles.hashtag}>
              {tag}
            </Text>
          ))}
        </View>
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
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
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

const HomeScreen = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(firestore, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      const postsData = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        // Fetch user profile image
        const userDoc = await getDoc(doc(firestore, "users", postData.userId));
        const userData = userDoc.data() as UserData;
        
        return {
          id: docSnapshot.id,
          ...postData,
          userId: postData.userId || auth.currentUser?.uid,
          userProfileImage: userData?.profileImage
        } as Post;
      }));
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
        userId: doc.data().userId || auth.currentUser?.uid // Ensure userId is set
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
    <View style={{ flex: 1, backgroundColor: "#000831" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Messages')}
          style={styles.chatButton}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 8,
  },
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
  profilePicContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
    overflow: 'hidden',
  },
  profilePic: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
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
    justifyContent: "space-between",
    padding: 14,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginRight: 16,
  },
  actionIcon: {
    marginLeft: 16,
  },
  likesContainer: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  likes: {
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
  captionContent: {
    fontFamily: "Inter_400Regular",
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
  commentContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  seeMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: "#8e8e8e",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  likesModal: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  likesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  likesTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#262626",
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
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  likeUserImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  likeUsername: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#262626",
  },
  emptyLikes: {
    padding: 20,
    alignItems: "center",
  },
  emptyLikesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#8e8e8e",
  },
  deleteModal: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  deleteTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#262626",
    marginBottom: 12,
  },
  deleteMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#262626",
    marginBottom: 20,
    textAlign: "center",
  },
  deleteButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButtonText: {
    fontFamily: "Inter_600SemiBold",
    color: "#262626",
    fontSize: 14,
  },
  confirmButtonText: {
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
    fontSize: 14,
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
    fontWeight: "600",
  },
  shareModal: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  shareTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#262626",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  usersList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#262626",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  chatButton: {
    padding: 8,
  },
});

export default HomeScreen;