/**
 * RFQ Email React Query Hooks
 * -------------------------------------------------------------
 * This module provides React Query hooks for working with
 * RFQ email conversations and messages.
 *
 * Responsibilities:
 * - Fetch and cache conversation lists
 * - Fetch and cache messages per conversation
 * - Send new messages via mutations
 * - Optimistically update the React Query cache after sends
 *
 * Query Keys:
 * - ["email", "conversations", userId]
 * - ["email", "messages", conversationId]
 *
 * This layer connects the API client (../API/email)
 * to React components using @tanstack/react-query.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRfqConversations,
  fetchRfqConversationMessages,
  postRfqConversationMessage,
} from "../API/email";

export const emailQueryKeys = {
  conversations: (userId) => ["email", "conversations", userId],
  messages: (conversationId) => ["email", "messages", conversationId],
};

export function useRfqConversationsQuery({ userId, authHeaders, limit = 20 }) {
  return useQuery({
    queryKey: emailQueryKeys.conversations(userId),
    queryFn: ({ signal }) =>
      fetchRfqConversations({
        authHeaders,
        signal,
        limit,
      }),
    enabled: !!userId,
  });
}

export function useRfqMessagesQuery({
  conversationId,
  authHeaders,
  limit = 50,
  order = "asc",
}) {
  return useQuery({
    queryKey: emailQueryKeys.messages(conversationId),
    queryFn: ({ signal }) =>
      fetchRfqConversationMessages(conversationId, {
        authHeaders,
        signal,
        limit,
        order,
      }),
    enabled: !!conversationId,
  });
}

export function useSendRfqMessageMutation({ userId, authHeaders }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, body }) =>
      postRfqConversationMessage(conversationId, body, { authHeaders }),
    onSuccess: (response, variables) => {
      const inserted = response?.message;
      const manufacturer = response?.manufacturer;
      if (!inserted) return;

      queryClient.setQueryData(
        emailQueryKeys.messages(variables.conversationId),
        (prev) => {
          const prevMessages = prev?.messages ?? [];
          return {
            ...(prev || {}),
            messages: [...prevMessages, inserted],
          };
        }
      );

      queryClient.setQueryData(emailQueryKeys.conversations(userId), (prev) => {
        if (!Array.isArray(prev)) return prev;

        const next = prev.map((thread) => {
          const threadId = thread.conversation_id || thread.id;
          if (threadId !== variables.conversationId) return thread;
          return {
            ...thread,
            last_message_preview: inserted.body,
            last_message_at: inserted.created_at,
            manufacturer_id: thread.manufacturer_id ?? response?.manufacturer_id ?? null,
            manufacturer_name:
              thread.manufacturer_name || manufacturer?.name || "Unassigned manufacturer",
          };
        });

        return [...next].sort((a, b) => {
          const aTs = new Date(a.last_message_at || a.created_at || 0).getTime();
          const bTs = new Date(b.last_message_at || b.created_at || 0).getTime();
          return bTs - aTs;
        });
      });
    },
  });
}
