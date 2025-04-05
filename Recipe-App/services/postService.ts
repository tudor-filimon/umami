import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebaseConfig';
import { uploadImage } from './imageService';

export type Post = {
  id?: string;
  userId: string;
  userName: string;
  imageUrl: string;
  imageUrls: string[];
  caption: string;
  hashtags: string[];
  createdAt: any;
  likes: number;
  likedBy: string[];
  comments: any[];
};

export const createPost = async (imageUris: string[], caption: string, hashtags: string[]): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to create a post');
    }

    // Get user's name from Firestore
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    const userData = userDoc.data();
    const userName = userData.name || 'Anonymous';

    // Upload all images to Firebase Storage
    const imageUrls = await Promise.all(imageUris.map(uri => uploadImage(uri)));

    // Create post in Firestore
    const postData: Omit<Post, 'id'> = {
      userId: user.uid,
      userName: userName,
      imageUrl: imageUrls[0], // Keep first image as main image
      imageUrls: imageUrls, // Store all image URLs
      caption,
      hashtags,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      comments: []
    };

    await addDoc(collection(firestore, 'posts'), postData);
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const postService = {
  createPost,
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
