import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  limit,
  DocumentReference,
  DocumentData,
  writeBatch
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import { UserData } from '../types/types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  participants: string[];
  read: boolean;
  type: string;
  postImage: string;
  postCaption: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  otherUserId: string;
  otherUserData: UserData;
  read: boolean;
}

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;

  // Fetch previous conversations
  useEffect(() => {
    if (!currentUser) return;

    const fetchConversations = async () => {
      try {
        console.log('Fetching conversations for user:', currentUser.uid);
        const messagesRef = collection(firestore, 'messages');
        const q = query(
          messagesRef,
          where('participants', 'array-contains', currentUser.uid),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          console.log('Received snapshot with', snapshot.docs.length, 'messages');
          const uniqueParticipants = new Set<string>();
          const conversationsData: Conversation[] = [];

          for (const doc of snapshot.docs) {
            const message = doc.data();
            console.log('Processing message:', message);
            const otherUserId = message.participants.find((id: string) => id !== currentUser.uid);
            
            if (otherUserId && !uniqueParticipants.has(otherUserId)) {
              uniqueParticipants.add(otherUserId);
              
              try {
                // Get other user's data
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where('__name__', '==', otherUserId));
                const querySnapshot = await getDocs(q);
                const userData = querySnapshot.docs[0]?.data() as UserData;
                
                console.log('Fetched user data:', userData);
                console.log('User ID:', otherUserId);
                
                if (userData) {
                  // Check if the last message was read
                  const isRead = message.senderId === currentUser.uid || message.read === true;
                  console.log('Message read status:', { 
                    senderId: message.senderId, 
                    currentUserId: currentUser.uid, 
                    isRead 
                  });

                  conversationsData.push({
                    id: doc.id,
                    participants: message.participants,
                    lastMessage: message.text,
                    lastMessageTime: message.timestamp,
                    otherUserId: otherUserId,
                    otherUserData: {
                      id: otherUserId,
                      username: userData.name || 'No name found',
                      profileImage: userData.profileImage
                    },
                    read: isRead
                  });
                } else {
                  console.log('No user data found for ID:', otherUserId);
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
              }
            }
          }

          console.log('Processed conversations:', conversationsData);
          setConversations(conversationsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error in fetchConversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        console.log('Starting search with query:', searchQuery);
        const usersRef = collection(firestore, 'users');
        
        // First, get all users to verify data structure
        const allUsersSnapshot = await getDocs(usersRef);
        const allUsers = allUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));
        console.log('All users in database:', JSON.stringify(allUsers, null, 2));

        // Create a case-insensitive search query
        const searchLower = searchQuery.toLowerCase();
        console.log('Searching for name containing:', searchLower);
        
        // Get all users and filter in memory for better case-insensitive search
        const allUsersData = allUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));

        const results = allUsersData
          .filter(user => {
            const userName = user.data.name?.toLowerCase() || '';
            console.log('Checking user:', { userName, searchLower, matches: userName.includes(searchLower) });
            return userName.includes(searchLower) && user.id !== currentUser.uid;
          })
          .map(user => ({
            id: user.id,
            username: user.data.name || 'No name',
            profileImage: user.data.profileImage
          } as UserData));
        
        console.log('Final filtered results:', JSON.stringify(results, null, 2));
        setSearchResults(results);
      } catch (error) {
        console.error('Error in searchUsers:', error);
        Alert.alert('Error', 'Failed to search for users');
      }
    };

    // Debounce the search to avoid too many requests
    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentUser]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation && currentUser) {
      const messagesRef = collection(firestore, 'messages');
      const q = query(
        messagesRef,
        where('participants', 'array-contains', currentUser.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const userMessages = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message))
          .filter(msg => {
            const hasCurrentUser = msg.participants?.includes(currentUser.uid);
            const hasSelectedUser = msg.participants?.includes(selectedConversation.otherUserId);
            return hasCurrentUser && hasSelectedUser;
          })
          .reverse();
        
        setMessages(userMessages);

        // Mark all messages as read in Firebase
        const unreadMessages = userMessages.filter(msg => 
          !msg.read && msg.senderId !== currentUser.uid
        );

        if (unreadMessages.length > 0) {
          const batch = writeBatch(firestore);
          unreadMessages.forEach(msg => {
            const messageRef = doc(firestore, 'messages', msg.id);
            batch.update(messageRef, { read: true });
          });
          await batch.commit();
        }
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      return () => unsubscribe();
    }
  }, [selectedConversation, currentUser]);

  // Update conversation read status when selected
  useEffect(() => {
    if (selectedConversation) {
      // Mark the conversation as read in the UI
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, read: true }
            : conv
        )
      );
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      const messagesRef = collection(firestore, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        receiverId: selectedConversation.otherUserId,
        timestamp: serverTimestamp(),
        participants: [currentUser.uid, selectedConversation.otherUserId],
        read: false
      });

      // Update the conversation's read status when sending a message
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, read: true }
            : conv
        )
      );

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    // Only show notification for unread messages from other users
    const hasUnreadMessages = !item.read && item.lastMessage && item.otherUserId !== currentUser?.uid;
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => {
          // Mark as read immediately when selected
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === item.id 
                ? { ...conv, read: true }
                : conv
            )
          );
          setSelectedConversation(item);
        }}
      >
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={item.otherUserData.profileImage ? { uri: item.otherUserData.profileImage } : { uri: 'https://via.placeholder.com/50' }}
              style={styles.avatar}
            />
            {hasUnreadMessages && <View style={styles.unreadBadge} />}
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.nameAndTime}>
              <Text style={styles.conversationName}>{item.otherUserData.username}</Text>
              <Text style={styles.lastMessageTime}>
                {item.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: UserData }) => {
    console.log('Rendering search result:', item);
    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => {
          console.log('Selected user from search:', item);
          const newConversation: Conversation = {
            id: '',
            participants: [currentUser?.uid || '', item.id],
            lastMessage: '',
            lastMessageTime: null,
            otherUserId: item.id,
            otherUserData: {
              id: item.id,
              username: item.username,
              profileImage: item.profileImage
            },
            read: false
          };
          setSelectedConversation(newConversation);
          setSearchQuery(''); // Clear search after selection
        }}
      >
        <Image
          source={item.profileImage ? { uri: item.profileImage } : { uri: 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <Text style={styles.searchResultName}>{item.username}</Text>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;

    if (item.type === 'post') {
      return (
        <View style={[styles.messageContainer, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
          <View style={styles.postMessageContainer}>
            <Text style={[styles.postMessageText, isCurrentUser && styles.sentMessageText]}>{item.text}</Text>
            <Image source={{ uri: item.postImage }} style={styles.sharedPostImage} />
            <Text style={[styles.postCaption, isCurrentUser && styles.sentMessageText]}>{item.postCaption}</Text>
          </View>
          <Text style={styles.messageTime}>
            {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
        <Text style={[styles.messageText, isCurrentUser && styles.sentMessageText]}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (!loading && conversations.length === 0 && !searchQuery) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
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
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No conversations yet</Text>
          <Text style={styles.emptyStateSubtext}>Start a new conversation by searching for a user</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {!selectedConversation ? (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {searchQuery ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.searchResults}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No users found</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id}
              style={styles.conversationsList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No conversations yet</Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.chatUsername}>{selectedConversation.otherUserData.username}</Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  conversationInfo: {
    flex: 1,
  },
  nameAndTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultName: {
    fontSize: 16,
    color: '#333',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatUsername: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  sentMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  postMessageContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    maxWidth: '80%',
  },
  postMessageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  sharedPostImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  postCaption: {
    fontSize: 12,
    color: '#666',
  },
});

export default MessagesScreen; 