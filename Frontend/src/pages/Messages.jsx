import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import {
  useRfqConversationsQuery,
  useRfqMessagesQuery,
  useSendRfqMessageMutation,
} from "../mutations/email";

// Tailwind class groups for readability.
const ui = {
  page: "flex h-screen w-full flex-col gap-4 bg-[#F3F4F6] p-4 md:flex-row md:gap-6 md:p-6",
  shell: "flex h-full min-h-0 flex-1 flex-col rounded-3xl bg-white p-4 shadow-sm md:p-6",
  header: "flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between ",
  listPane:
    "h-full min-h-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3 md:w-80 md:flex-shrink-0",
  listScroll: "h-full min-h-0 space-y-2 overflow-y-auto pr-1 overscroll-contain",
  chatPane:
    "flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-4",
  chatScroll:
    "flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 text-sm text-gray-700",
  input:
    "flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400",
  button:
    "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400",
};

const getConversationKey = (thread) => thread.conversation_id || thread.id;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

const getThreadPreview = (thread) => {
  if (thread.preview_text) return thread.preview_text;
  if (thread.details_summary?.clothing_type || thread.details_summary?.quantity) {
    return `${thread.details_summary?.clothing_type || "RFQ"} · ${
      thread.details_summary?.quantity ?? "—"
    }`;
  }
  return "Draft RFQ";
};

const sortThreadsByActivity = (threadList) =>
  [...threadList].sort((a, b) => {
    const aTs = new Date(a.last_message_at || a.created_at || 0).getTime();
    const bTs = new Date(b.last_message_at || b.created_at || 0).getTime();
    return bTs - aTs;
  });

export default function Messages() {
  const { user, authHeaders } = useAuth();
  const navigate = useNavigate();
  const messagesScrollRef = useRef(null);

  // Thread + message local UI state.
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");

  const conversationsQuery = useRfqConversationsQuery({
    userId: user?.id,
    authHeaders,
    limit: 20,
  });

  const threads = conversationsQuery.data ?? [];
  const loadingThreads = conversationsQuery.isLoading;
  const threadsError = conversationsQuery.error?.message ?? "";

  useEffect(() => {
    document.title = "Messages - PinPoint";
  }, []);

  // Auto-select first thread once conversations load.
  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(getConversationKey(threads[0]));
    }
  }, [threads, selectedThreadId]);

  const messagesQuery = useRfqMessagesQuery({
    conversationId: selectedThreadId,
    authHeaders,
    limit: 50,
    order: "asc",
  });

  const messages = messagesQuery.data?.messages ?? [];
  const loadingMessages = messagesQuery.isLoading;
  const messagesError = messagesQuery.error?.message ?? "";

  const sendMessageMutation = useSendRfqMessageMutation({
    userId: user?.id,
    authHeaders,
  });
  const sendingMessage = sendMessageMutation.isPending;

  // Keep newest messages visible after load/send.
  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedThreadId]);

  const selectedThread = useMemo(
    () => threads.find((thread) => getConversationKey(thread) === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const sortedThreads = useMemo(() => sortThreadsByActivity(threads), [threads]);

  const handleSendMessage = async () => {
    const body = draftMessage.trim();
    if (!selectedThreadId || !body || sendingMessage) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedThreadId,
        body,
      });
      setDraftMessage("");
    } catch {}
  };

  return (
    <div className={ui.page}>
      <aside className="w-full md:w-45">
        <NavBar />
      </aside>

      <div className={ui.shell}>
        {!user ? (
          <div className="flex min-h-[320px] h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600">
            You must sign in to view messages.
          </div>
        ) : (
          <>
            {/* Top header */}
            <header className={ui.header}>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Messages</p>
                <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
              </div>
            </header>

            {/* Two-column layout: threads + chat */}
            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
              {/* Thread list */}
              <section className={ui.listPane}>
                {loadingThreads ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                    Loading conversations...
                  </div>
                ) : threadsError ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-white text-sm text-red-600">
                    {threadsError}
                  </div>
                ) : sortedThreads.length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                    No quote requests yet.
                  </div>
                ) : (
                  <div className={ui.listScroll}>
                    {sortedThreads.map((thread) => {
                      const threadId = getConversationKey(thread);
                      const isSelected = threadId === selectedThreadId;

                      return (
                        <button
                          key={threadId}
                          onClick={() => setSelectedThreadId(threadId)}
                          className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition   ${
                            isSelected
                              ? "border-gray-300 "
                              : "border-transparent hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 ">
                              {thread.manufacturer_name || "Unassigned manufacturer"}
                            </h3>
                            <span className="text-xs text-gray-400">
                              {formatDate(thread.last_message_at || thread.created_at)}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                            {getThreadPreview(thread)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Chat panel */}
              <section className={ui.chatPane}>
                {/* Chat header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {selectedThread?.manufacturer_name || "Conversation"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedThread ? "Messages" : "Messages will appear here."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    disabled={!selectedThread?.manufacturer_id}
                    onClick={() => {
                      if (selectedThread?.manufacturer_id) {
                        navigate(`/manufacturers/${selectedThread.manufacturer_id}`);
                      }
                    }}
                  >
                    View profile
                  </button>
                </div>

                {/* Scrollable message list */}
                <div ref={messagesScrollRef} className={ui.chatScroll}>
                  {!selectedThread ? (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No messages to display.
                    </div>
                  ) : loadingMessages ? (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Loading messages...
                    </div>
                  ) : messagesError ? (
                    <div className="flex h-full items-center justify-center text-red-600">
                      {messagesError}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Request</p>
                        <p className="text-sm text-gray-800">
                          {selectedThread.details_summary?.clothing_type || "—"} ·{" "}
                          {selectedThread.details_summary?.quantity ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Deadline: {formatDate(selectedThread.details_summary?.deadline) || "—"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        No messages yet for this conversation.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-2">
                      {messages.map((messageItem) => {
                        const isBuyer = messageItem.sender_type === "buyer";
                        return (
                          <div
                            key={messageItem.id ?? `${messageItem.created_at}-${messageItem.body}`}
                            className={`max-w-[85%] rounded-lg px-4 py-3 ${
                              isBuyer
                                ? "ml-auto bg-blue-500 text-white"
                                : "mr-auto border border-gray-200 bg-gray-50 text-gray-800"
                            }`}
                          >
                            <p className="text-sm">
                              {messageItem.body || messageItem.message || "(empty message)"}
                            </p>
                            <p className={`mt-1 text-xs ${isBuyer ? "text-gray-300" : "text-gray-500"}`}>
                              {formatDateTime(messageItem.created_at)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      placeholder={
                        selectedThread
                          ? "Type a message..."
                          : "Select a conversation to message"
                      }
                      disabled={!selectedThread}
                      className={ui.input}
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!selectedThread || !draftMessage.trim() || sendingMessage}
                      className={ui.button}
                    >
                      {sendingMessage ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
