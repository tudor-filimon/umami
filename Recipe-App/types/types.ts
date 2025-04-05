export interface UserData {
  id: string;
  name?: string;
  username: string;
  profileImage?: string;
  followersCount?: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  conversationId?: string;
  participants?: string[];
} 