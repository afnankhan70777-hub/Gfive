import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from './supabase';
import { ChatMessage } from './types';

interface ChatState {
  messages: ChatMessage[];
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  isOpen: boolean;
  isLoading: boolean;
  onlineUsers: Set<string>;

  // Actions
  loadMessages: (userId: string, otherUserId: string) => Promise<void>;
  sendMessage: (senderId: string, senderName: string, receiverId: string, receiverName: string, content: string) => Promise<void>;
  setActiveConversation: (userId: string | null) => void;
  toggleChat: () => void;
  markAsRead: (senderId: string, receiverId: string) => void;
  getUnreadCount: (userId: string, otherUserId: string) => number;
  subscribeToMessages: (userId: string) => () => void;
  subscribeToMessageUpdates: (userId: string) => () => void;
  initializeUnreadCounts: (userId: string) => Promise<void>;
  openChat: () => void;
  openChatWithUser: (userId: string) => void;
  markAllAsRead: (receiverId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  persist(
    immer((set, get) => ({
    messages: [],
    activeConversationId: null,
    unreadCounts: {},
    isOpen: false,
    isLoading: false,
    onlineUsers: new Set(),

    loadMessages: async (userId, otherUserId) => {
      set((state) => { state.isLoading = true; });
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: true })
          .limit(200);

        if (error) throw error;

        const msgs: ChatMessage[] = (data || []).map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          receiverId: m.receiver_id,
          receiverName: m.receiver_name,
          content: m.content,
          createdAt: m.created_at,
          read: m.read,
        }));

        set((state) => {
          state.messages = msgs;
          state.isLoading = false;
        });
      } catch {
        set((state) => { state.isLoading = false; });
      }
    },

    sendMessage: async (senderId, senderName, receiverId, receiverName, content) => {
      const tempId = `msg-${Date.now()}`;
      const now = new Date().toISOString();

      // Optimistic insert
      set((state) => {
        state.messages.push({
          id: tempId,
          senderId,
          senderName,
          receiverId,
          receiverName,
          content,
          createdAt: now,
          read: false,
        });
      });

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: senderId,
            sender_name: senderName,
            receiver_id: receiverId,
            receiver_name: receiverName,
            content,
            read: false,
          })
          .select()
          .single();

        if (error) throw error;

        // Replace temp id with real id
        set((state) => {
          const idx = state.messages.findIndex((m) => m.id === tempId);
          if (idx !== -1 && data) {
            state.messages[idx].id = data.id;
            state.messages[idx].createdAt = data.created_at;
          }
        });
      } catch {
        // On failure, remove the optimistic message
        set((state) => {
          state.messages = state.messages.filter((m) => m.id !== tempId);
        });
      }
    },

    setActiveConversation: (userId) => {
      set((state) => {
        state.activeConversationId = userId;
        if (userId) {
          state.unreadCounts[userId] = 0;
        }
      });
    },

    toggleChat: () => {
      set((state) => {
        state.isOpen = !state.isOpen;
        // When closing chat, clear active conversation so new messages
        // from that sender will trigger unread notifications again
        if (state.isOpen === false) {
          state.activeConversationId = null;
        }
      });
    },

    markAsRead: async (senderId, receiverId) => {
      try {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', senderId)
          .eq('receiver_id', receiverId)
          .eq('read', false);

        set((state) => {
          state.messages.forEach((m) => {
            if (m.senderId === senderId && m.receiverId === receiverId) {
              m.read = true;
            }
          });
          state.unreadCounts[senderId] = 0;
        });
      } catch {
        // silently fail
      }
    },

    getUnreadCount: (userId, otherUserId) => {
      const state = get();
      return state.messages.filter(
        (m) => m.senderId === otherUserId && m.receiverId === userId && !m.read
      ).length;
    },

    subscribeToMessages: (userId) => {
      const channelId = `messages-channel-${Date.now()}`;
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload: any) => {
            const msg = payload.new;
            if (!msg) return;

            // Only process messages relevant to this user
            if (msg.sender_id !== userId && msg.receiver_id !== userId) return;

            const newMessage: ChatMessage = {
              id: msg.id,
              senderId: msg.sender_id,
              senderName: msg.sender_name,
              receiverId: msg.receiver_id,
              receiverName: msg.receiver_name,
              content: msg.content,
              createdAt: msg.created_at,
              read: msg.read,
            };

            set((state) => {
              // Avoid duplicates
              const exists = state.messages.some((m) => m.id === newMessage.id);
              if (!exists) {
                state.messages.push(newMessage);
              }

              // If chat is open with sender, auto-mark as read in DB immediately
              if (msg.receiver_id === userId && state.activeConversationId === msg.sender_id) {
                supabase.from('messages').update({ read: true }).eq('id', msg.id).then();
                newMessage.read = true;
              }

              // Increment unread if message is for us and chat is not open with sender
              if (msg.receiver_id === userId && state.activeConversationId !== msg.sender_id) {
                state.unreadCounts[msg.sender_id] = (state.unreadCounts[msg.sender_id] || 0) + 1;
              }
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },

    subscribeToMessageUpdates: (userId) => {
      const channelId = `messages-updates-channel-${Date.now()}`;
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          (payload: any) => {
            const msg = payload.new;
            const oldMsg = payload.old;
            if (!msg || !oldMsg) return;

            // Only handle read status changes for messages sent to us
            if (msg.receiver_id !== userId) return;
            if (oldMsg.read === true || msg.read !== true) return;

            set((state) => {
              // Update local message read status
              const localMsg = state.messages.find((m) => m.id === msg.id);
              if (localMsg) {
                localMsg.read = true;
              }
              // Decrement unread count for this sender
              const currentCount = state.unreadCounts[msg.sender_id] || 0;
              if (currentCount > 0) {
                state.unreadCounts[msg.sender_id] = currentCount - 1;
              }
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },

    initializeUnreadCounts: async (userId) => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('receiver_id', userId)
          .eq('read', false);

        if (error) throw error;

        const counts: Record<string, number> = {};
        (data || []).forEach((m: any) => {
          const senderId = m.sender_id;
          counts[senderId] = (counts[senderId] || 0) + 1;
        });

        set((state) => {
          state.unreadCounts = counts;
        });
      } catch {
        // silently fail
      }
    },

    openChat: () => {
      set((state) => {
        state.isOpen = true;
      });
    },

    openChatWithUser: (userId) => {
      set((state) => {
        state.isOpen = true;
        state.activeConversationId = userId;
        state.unreadCounts[userId] = 0;
      });
    },

    markAllAsRead: async (receiverId) => {
      try {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', receiverId)
          .eq('read', false);

        set((state) => {
          state.messages.forEach((m) => {
            if (m.receiverId === receiverId) {
              m.read = true;
            }
          });
          state.unreadCounts = {};
        });
      } catch {
        // silently fail
      }
    },
  })),
  {
    name: 'mobiis-chat',
    partialize: (state) => ({ unreadCounts: state.unreadCounts }),
  }
));
