import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

interface UserData {
  name?: string;
  profileImage?: string;
  followersCount?: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  senderName: string;
  senderImage?: string;
  conversationId: string;
}

interface Conversation {
  id: string;
  lastMessage: string;
  lastMessageTime: any;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  participants: string[];
}

interface FollowedUser {
  id: string;
  name: string;
  profileImage?: string;
}

const MessagesScreen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const currentUser = auth.currentUser;

  // Fetch followed users
  useEffect(() => {
    if (!currentUser) return;

    const followsRef = collection(firestore, 'follows');
    const q = query(followsRef, where('followerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const followedUsersData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const userDoc = await getDoc(doc(firestore, 'users', data.followedId));
          const userData = userDoc.data() as UserData;

          return {
            id: data.followedId,
            name: userData?.name || 'Unknown User',
            profileImage: userData?.profileImage,
          };
        })
      );

      setFollowedUsers(followedUsersData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch conversations
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
          const otherUserDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const otherUserData = otherUserDoc.data() as UserData;

          return {
            id: docSnapshot.id,
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime,
            otherUserId,
            otherUserName: otherUserData?.name || 'Unknown User',
            otherUserImage: otherUserData?.profileImage,
            participants: data.participants,
          };
        })
      );

      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    // Fetch messages for selected conversation
    const messagesRef = collection(firestore, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', selectedConversation.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedConversation, currentUser]);

  const startNewConversation = async (userId: string) => {
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const conversationsRef = collection(firestore, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const existingConversation = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(userId);
      });

      if (existingConversation) {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        const userData = userDoc.data() as UserData;
        
        setSelectedConversation({
          id: existingConversation.id,
          lastMessage: existingConversation.data().lastMessage || '',
          lastMessageTime: existingConversation.data().lastMessageTime || serverTimestamp(),
          otherUserId: userId,
          otherUserName: userData?.name || 'Unknown User',
          otherUserImage: userData?.profileImage,
          participants: existingConversation.data().participants,
        });
        return;
      }

      // Create new conversation
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      const userData = userDoc.data() as UserData;

      const newConversationRef = await addDoc(conversationsRef, {
        participants: [currentUser.uid, userId],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
      });

      setSelectedConversation({
        id: newConversationRef.id,
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        otherUserId: userId,
        otherUserName: userData?.name || 'Unknown User',
        otherUserImage: userData?.profileImage,
        participants: [currentUser.uid, userId],
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      const messageText = newMessage.trim();
      
      // Get sender's profile data
      const senderDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const senderData = senderDoc.data() as UserData;

      // Create message
      const messagesRef = collection(firestore, 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId: currentUser.uid,
        receiverId: selectedConversation.otherUserId,
        conversationId: selectedConversation.id,
        timestamp: serverTimestamp(),
        senderName: senderData?.name || currentUser.displayName || 'Unknown User',
        senderImage: senderData?.profileImage,
      });

      // Update conversation's last message
      const conversationRef = doc(firestore, 'conversations', selectedConversation.id);
      await updateDoc(conversationRef, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const filteredUsers = followedUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && item.senderImage && (
          <Image source={{ uri: item.senderImage }} style={styles.messageAvatar} />
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={styles.messageTime}>
            {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isOwnMessage && item.senderImage && (
          <Image source={{ uri: item.senderImage }} style={styles.messageAvatar} />
        )}
      </View>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => setSelectedConversation(item)}
    >
      {item.otherUserImage ? (
        <Image source={{ uri: item.otherUserImage }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color={colors.text} />
        </View>
      )}
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.otherUserName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <Text style={styles.messageTime}>
        {item.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: FollowedUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={async () => {
        try {
          await startNewConversation(item.id);
          setShowNewChat(false);
        } catch (error) {
          console.error('Error starting conversation:', error);
          Alert.alert('Error', 'Failed to start conversation');
        }
      }}
    >
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color={colors.text} />
        </View>
      )}
      <Text style={styles.userName}>{item.name}</Text>
      <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedConversation ? (
        <>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => setSelectedConversation(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.chatHeaderTitle}>{selectedConversation.otherUserName}</Text>
          </View>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            inverted={false}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.text + '80'}
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              disabled={!newMessage.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={newMessage.trim() ? colors.text : colors.text + '40'}
              />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Messages</Text>
            <TouchableOpacity
              onPress={() => setShowNewChat(!showNewChat)}
              style={styles.newChatButton}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {showNewChat ? (
            <>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.text + '80'} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={colors.text + '80'}
                />
              </View>
              <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                style={styles.usersList}
              />
            </>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              style={styles.conversationsList}
            />
          )}
        </>
      )}
    </View>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  newChatButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text + '20',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.text + '20',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.text + '20',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.text + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 15,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.text + '80',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: colors.text + '60',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.text + '20',
  },
  backButton: {
    marginRight: 15,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  messagesList: {
    flex: 1,
    padding: 15,
    paddingBottom: 70,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 8,
  },
  ownMessageBubble: {
    backgroundColor: colors.text,
  },
  otherMessageBubble: {
    backgroundColor: colors.text + '20',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: colors.background,
  },
  otherMessageText: {
    color: colors.text,
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.text + '20',
    backgroundColor: colors.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: colors.text + '20',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: colors.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    backgroundColor: colors.text + '20',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 