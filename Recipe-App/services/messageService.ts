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
  Timestamp
} from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Timestamp;
  conversationId?: string;
  participants: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
}

export const sendMessage = async (text: string, receiverId: string) => {
  const senderId = auth.currentUser?.uid;
  if (!senderId) throw new Error('User not logged in');

  await addDoc(collection(firestore, 'messages'), {
    text,
    senderId,
    receiverId,
    participants: [senderId, receiverId],
    timestamp: serverTimestamp()
  });
};

export const backfillParticipants = async () => {
  const messagesRef = collection(firestore, 'messages');
  const snapshot = await getDocs(messagesRef);

  for (const messageDoc of snapshot.docs) {
    const data = messageDoc.data();
    const senderId = data.senderId;
    const receiverId = data.receiverId;

    if (!data.participants && senderId && receiverId) {
      await updateDoc(doc(firestore, 'messages', messageDoc.id), {
        participants: [senderId, receiverId]
      });
    }
  }

  console.log('✅ Participants backfilled');
};

export const getMessages = (
  conversationId: string,
  onMessagesUpdate: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(firestore, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    onMessagesUpdate(messages);
  });

  return unsubscribe;
};

export const getConversations = (
  onConversationsUpdate: (conversations: Conversation[]) => void
): (() => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not authenticated');

  const conversationsRef = collection(firestore, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUser.uid),
    orderBy('lastMessageTime', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];
    onConversationsUpdate(conversations);
  });

  return unsubscribe;
};

export const startNewConversation = async (otherUserId: string): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Check if conversation already exists
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    
    const existingConversation = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(otherUserId);
    });

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation
    const newConversationRef = await addDoc(conversationsRef, {
      participants: [currentUser.uid, otherUserId],
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
    });

    return newConversationRef.id;
  } catch (error) {
    console.error('Error starting new conversation:', error);
    throw error;
  }
}; 