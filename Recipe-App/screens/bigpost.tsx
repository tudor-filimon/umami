import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    TextInput,
    Keyboard,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import {
    collection,
    query,
    orderBy,
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
    userId: string;
    // you can remove the post-level username if you're showing your own name
    imageUrl: string;
    caption?: string;
    hashtags?: string[];
    createdAt?: any;
    likes?: number;
    likedBy?: string[];
    comments?: Comment[];
};

type RootStackParamList = {
    BigPost: { posts: Post[]; initialIndex: number };
};

type BigPostRouteProp = RouteProp<RootStackParamList, "BigPost">;

const BigPost: React.FC = () => {
    const route = useRoute<BigPostRouteProp>();
    const { posts } = route.params;

    const [refreshing, setRefreshing] = useState(false);
    // We use local state for posts so that we can refresh them if needed.
    const [currentPosts, setCurrentPosts] = useState<Post[]>(posts);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const q = query(
                    collection(firestore, "posts"),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const fetchedPosts = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                })) as Post[];
                setCurrentPosts(fetchedPosts);
            }
        } catch (error) {
            console.error("Error refreshing posts:", error);
        }
        setRefreshing(false);
    };

    // Render each post in a large, detailed format.
    const renderBigPost = (post: Post) => {
        const [isLiked, setIsLiked] = useState(false);
        const [likesCount, setLikesCount] = useState(post.likes || 0);
        const [showComments, setShowComments] = useState(false);
        const [newComment, setNewComment] = useState("");
        const [comments, setComments] = useState<Comment[]>(post.comments || []);
        // state for current user name and profile picture
        const [userName, setUserName] = useState<string>("");
        const [profilePic, setProfilePic] = useState<string>("https://via.placeholder.com/40");

        useEffect(() => {
            fetchUserProfile();
            setIsLiked(post.likedBy?.includes(auth.currentUser?.uid || "") || false);
            setLikesCount(post.likes || 0);
        }, [post]);

        const fetchUserProfile = async () => {
            if (!post.userId) return;
            try {
              const userDoc = await getDoc(doc(firestore, "users", post.userId));
              if (userDoc.exists()) {
                const data = userDoc.data();
                setUserName(data.name || "Unknown");
                setProfilePic(data.profileImage || "https://via.placeholder.com/40"); // or photoURL depending on your schema
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
          };
          

        const handleLike = async () => {
            try {
                const postRef = doc(firestore, "posts", post.id);
                const newLikeStatus = !isLiked;
                const likeDelta = newLikeStatus ? 1 : -1;
                const newLikesCount = Math.max(0, likesCount + likeDelta);
                const updatedLikedBy = newLikeStatus
                    ? [...(post.likedBy || []), auth.currentUser?.uid]
                    : (post.likedBy || []).filter(id => id !== auth.currentUser?.uid);
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
                const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
                if (!userDoc.exists()) {
                    Alert.alert("Error", "User profile not found");
                    return;
                }
                const userProfile = userDoc.data();
                const postRef = doc(firestore, "posts", post.id);
                const newCommentObj: Comment = {
                    id: Date.now().toString(),
                    username: userProfile.name,
                    text: newComment.trim(),
                    createdAt: Timestamp.now(),
                };
                await updateDoc(postRef, {
                    comments: arrayUnion(newCommentObj),
                });
                setComments(prev => [...prev, newCommentObj]);
                setNewComment("");
                Keyboard.dismiss();
            } catch (error) {
                console.error("Error adding comment:", error);
                Alert.alert("Error", "Failed to add comment. Please try again.");
            }
        };

        return (
            <View key={post.id} style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image source={{ uri: profilePic }} style={styles.profilePic} />
                        <Text style={styles.username}>{userName}</Text>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                </View>
                {/* Post Image */}
                <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleLike}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={28}
                            color={isLiked ? "#FF3B30" : "black"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowComments(!showComments)}>
                        <Ionicons name="chatbubble-outline" size={28} color="black" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.likes}>{likesCount} likes</Text>
                <View style={styles.caption}>
                    <Text style={styles.captionText}>
                        <Text style={styles.username}>{userName}</Text>{" "}
                        {post.caption || ""}
                    </Text>
                </View>
                {showComments && (
                    <View style={styles.commentsSection}>
                        <ScrollView style={styles.commentsList}>
                            {comments.map(comment => (
                                <View key={comment.id} style={styles.commentItem}>
                                    <Text style={styles.commentUsername}>{comment.username}:</Text>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.addCommentSection}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Add a comment..."
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <TouchableOpacity style={styles.postCommentButton} onPress={handleAddComment}>
                                <Text style={styles.postCommentText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {currentPosts.map(post => renderBigPost(post))}
            </ScrollView>
        </View>
    );
};

export default BigPost;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFEEB7",
    },
    scrollViewContent: {
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    card: {
        width: "100%",
        marginBottom: 20,
        backgroundColor: "#FFEEB7",
        borderRadius: 8,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    profilePic: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    username: {
        marginLeft: 10,
        fontWeight: "600",
        fontSize: 16,
    },
    postImage: {
        width: "100%",
        height: 500,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-start",
        padding: 16,
    },
    likes: {
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: "600",
    },
    caption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    captionText: {
        fontSize: 16,
    },
    commentsSection: {
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        backgroundColor: "#FFEEB7",
    },
    commentsList: {
        maxHeight: 200,
        padding: 16,
    },
    commentItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    commentUsername: {
        fontWeight: "600",
        marginRight: 8,
        fontSize: 16,
    },
    commentText: {
        fontSize: 16,
        flexShrink: 1,
    },
    addCommentSection: {
        flexDirection: "row",
        padding: 16,
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
});
