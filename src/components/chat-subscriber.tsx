'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';

/**
 * Always-mounted chat realtime subscriber.
 *
 * The chat panel is conditionally rendered (returns null when closed), so its
 * useEffect for subscribing to Supabase realtime messages would unmount when the
 * panel is closed. This component lives in the dashboard shell (always mounted
 * while authenticated) so unread counts keep updating even when the chat panel is
 * closed, which drives the header notification badge and "New Messages" item.
 */
export function ChatSubscriber() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const subscribeToMessageUpdates = useChatStore((state) => state.subscribeToMessageUpdates);
  const initializeUnreadCounts = useChatStore((state) => state.initializeUnreadCounts);

  useEffect(() => {
    if (!currentUser?.id) return;

    let unsubscribeMessages: (() => void) | undefined;
    let unsubscribeUpdates: (() => void) | undefined;

    // Seed unread counts first, then start realtime listeners
    initializeUnreadCounts(currentUser.id).then(() => {
      unsubscribeMessages = subscribeToMessages(currentUser.id);
      unsubscribeUpdates = subscribeToMessageUpdates(currentUser.id);
    });

    return () => {
      unsubscribeMessages?.();
      unsubscribeUpdates?.();
    };
  }, [currentUser?.id, subscribeToMessages, subscribeToMessageUpdates, initializeUnreadCounts]);

  return null;
}
