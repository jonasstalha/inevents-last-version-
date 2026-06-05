import { Theme } from '@/src/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Message = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
};

export default function ChatScreen() {
  const { clientId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const router = useRouter();
  const db = getFirestore();
  const flatListRef = useRef<FlatList>(null);
  
  // Get current user
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId || typeof clientId !== 'string') return;
      
      try {
        // Get client data
        const clientRef = doc(db, 'users', clientId);
        const clientSnapshot = await getDoc(clientRef);
        
        if (clientSnapshot.exists()) {
          setClientData({
            id: clientSnapshot.id,
            ...clientSnapshot.data(),
          });
        } else {
          setClientData({
            id: clientId,
            name: 'Client',
            profileImage: 'https://ui-avatars.com/api/?name=Client',
          });
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };
    
    const fetchMessages = async () => {
      if (!clientId || typeof clientId !== 'string' || !currentUser) return;
      
      try {
        setLoading(true);
        // Create a compound query to get messages between these two users
        const messagesQuery = query(
          collection(db, 'messages'),
          where('senderId', 'in', [currentUser.uid, clientId]),
          where('receiverId', 'in', [currentUser.uid, clientId]),
          orderBy('timestamp', 'asc')
        );
        
        const querySnapshot = await getDocs(messagesQuery);
        const messagesData: Message[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            receiverId: data.receiverId,
            timestamp: data.timestamp?.toDate() || new Date(),
            read: data.read || false,
          });
        });
        
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientData();
    fetchMessages();
  }, [clientId, currentUser]);
  
  const sendMessage = async () => {
    if (!inputText.trim() || !clientId || !currentUser) return;
    
    try {
      // Add new message to Firestore
      await addDoc(collection(db, 'messages'), {
        text: inputText.trim(),
        senderId: currentUser.uid,
        receiverId: clientId,
        timestamp: serverTimestamp(),
        read: false,
      });
      
      // Add to local state
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        text: inputText.trim(),
        senderId: currentUser.uid,
        receiverId: typeof clientId === 'string' ? clientId : '',
        timestamp: new Date(),
        read: false,
      };
      
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUser?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isMyMessage ? styles.myMessageTime : styles.theirMessageTime
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Theme.colors.textDark} />
        </TouchableOpacity>
        
        {clientData && (
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: clientData.profileImage || 'https://ui-avatars.com/api/?name=' + clientData.name }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.profileName}>{clientData.name}</Text>
              <Text style={styles.profileStatus}>
                {messages.length > 0 ? 'Active Now' : 'Start a conversation'}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={true}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}
      
      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={!inputText.trim() ? '#9CA3AF' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
  },
  profileStatus: {
    fontSize: 12,
    color: Theme.colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: Theme.colors.textDark,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: Theme.colors.textLight,
    alignSelf: 'flex-end',
  },
  theirMessageTime: {
    color: Theme.colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: Theme.colors.textDark,
  },
  sendButton: {
    backgroundColor: Theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
