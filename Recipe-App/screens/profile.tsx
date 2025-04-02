import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { auth, firestore } from '../firebaseConfig';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';

interface UserInfo {
  name: string;
  age?: string;
  pronouns?: string;
  profileImage?: string; // URL to profile image
}

type RootStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Login: undefined;
  BigPost: { posts: DocumentData[]; initialIndex: number };
};

const screenWidth = Dimensions.get('window').width;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', pronouns: '' });
  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'saved'>('posts');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserInfo = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userCollection = collection(firestore, 'users');
      const q = query(userCollection, where('__name__', '==', currentUser.uid));
      const userSnapshot = await getDocs(q);
      userSnapshot.forEach(doc => {
        setUserInfo(doc.data() as UserInfo);
      });
    }
  };

  const fetchUserPosts = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const postsQuery = query(
        collection(firestore, 'posts'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(postsQuery);
      const userPosts = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => !!post.imageUrl);
      setPosts(userPosts);
    }
  };

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserInfo(), fetchUserPosts()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await auth.signOut();
            Alert.alert('Logged Out', 'You have been logged out.', [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Login'),
              },
            ]);
          } catch (error) {
            Alert.alert('Error', 'Logout failed.');
          }
        },
      },
    ]);
  };

  const HeaderComponent = () => (
    <View>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        {userInfo.profileImage ? (
          <Image source={{ uri: userInfo.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderCircle} />
        )}
        <View style={styles.textColumn}>
          <Text style={styles.nameText}>
            {userInfo.name || 'Loading...'}
            {userInfo.pronouns ? (
              <Text style={styles.pronounsText}> ({userInfo.pronouns})</Text>
            ) : null}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setSelectedTab('posts')}>
          <Text style={[styles.tabText, selectedTab === 'posts' && styles.activeTab]}>
            POSTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('saved')}>
          <Text style={[styles.tabText, selectedTab === 'saved' && styles.activeTab]}>
            SAVED
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPost = ({ item, index }: { item: DocumentData; index: number }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BigPost', { posts, initialIndex: index })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
    </TouchableOpacity>
  );

  if (selectedTab === 'posts') {
    return (
      <FlatList
        data={posts}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderPost}
        numColumns={3}
        ListHeaderComponent={<HeaderComponent />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
        contentContainerStyle={styles.postGrid}
        style={styles.container}
      />
    );
  } else {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        <HeaderComponent />
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Saved posts coming soon...</Text>
        </View>
      </ScrollView>
    );
  }
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEB7',
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  textColumn: {
    marginLeft: 15,
    flexShrink: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  placeholderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pronounsText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  actionButton: {
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#aaa',
    paddingVertical: 10,
    backgroundColor: '#fff3d6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  postGrid: {
    paddingHorizontal: 2,
    paddingTop: 10,
  },
  postImage: {
    width: screenWidth / 3 - 4,
    height: screenWidth / 3,
    margin: 1,
    backgroundColor: '#eee',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
