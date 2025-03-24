import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

type Post = {
  id: string;
  userName: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  createdAt: any;
  likes: number;
};

const InstagramPost = ({ post }: { post: Post }) => {
  return (
    <View style={styles.card}>
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
      <Image 
        source={{ uri: post.imageUrl }}
        style={styles.postImage}
      />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Ionicons name="heart-outline" size={24} color="black" />
          <Ionicons name="chatbubble-outline" size={24} color="black" style={styles.actionIcon} />
        </View>
        <Ionicons name="bookmark-outline" size={24} color="black" />
      </View>

      {/* Likes */}
      <Text style={styles.likes}>{post.likes} likes</Text>

      {/* Caption */}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          <Text style={styles.username}>{post.userName}</Text> {post.caption}
          {post.hashtags.map((tag, index) => (
            <Text key={index} style={styles.hashtag}> {tag}</Text>
          ))}
        </Text>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(firestore, 'posts');
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    // Set up real-time listener for posts
    const postsRef = collection(firestore, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
    <View style={{ flex: 1, backgroundColor: '#FFEEB7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 12,
          paddingBottom: 80, // Optional bottom space
        }}
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
  flatList: {
    flex: 1,
    backgroundColor: '#FFEEB7',
  },
  listContainer: {
    paddingVertical: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFEEB7',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFEEB7',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    marginLeft: 8,
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 450,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFEEB7',
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 16,
  },
  likes: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#FFEEB7',
  },
  caption: {
    padding: 12,
    paddingTop: 4,
    backgroundColor: '#FFEEB7',
  },
  captionText: {
    fontSize: 14,
  },
  hashtag: {
    color: '#007AFF',
  },
});

export default HomeScreen;