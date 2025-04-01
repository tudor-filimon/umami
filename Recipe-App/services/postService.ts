import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { firestore, auth } from "../firebaseConfig";

export type Post = {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  createdAt: any;
  likes: number;
  comments: any[];
};

export const postService = {
  async createPost(
    imageUrl: string,
    caption: string,
    hashtags: string[]
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You need to be logged in to create a post");
      }

      // Get user's name from Firestore
      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }
      const userName = userDoc.data().name;

      // Create post data
      const postData = {
        userId: currentUser.uid,
        userName: userName,
        imageUrl,
        caption: caption.trim(),
        hashtags: hashtags.filter((tag) => tag.startsWith("#")),
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: [],
      };

      // Add to Firestore
      const postsRef = collection(firestore, "posts");
      await addDoc(postsRef, postData);
    } catch (error) {
      console.error("Error in createPost:", error);
      throw error;
    }
  },

  async likePost(postId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You need to be logged in to like a post");
    }

    const postRef = doc(firestore, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error("Post not found");
    }

    const postData = postDoc.data() as Post;
    await updateDoc(postRef, {
      likes: postData.likes + 1,
    });
  },
};
