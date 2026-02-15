import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import {
  getConversationMessages,
  getConversations,
  sendConversationMessage,
} from "../API/api";

export default function Messages() {
  const { user, authHeaders } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsError, setThreadsError] = useState("");

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    document.title = "Messages - PinPoint";
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let isActive = true;
    const controller = new AbortController();

    async function loadConversations() {
      setLoadingThreads(true);
      setThreadsError("");
      try {
        const conversations = await getConversations({
          authHeaders,
          signal: controller.signal,
          limit: 20,
        });
        if (!isActive) return;

        setThreads(conversations);
        if (!selectedThreadId && conversations.length > 0) {
          setSelectedThreadId(conversations[0].conversation_id || conversations[0].id);
        }
      } catch (err) {
        if (isActive && err.name !== "AbortError") {
          setThreadsError(err.message || "Failed to load conversations.");
        }
      } finally {
        if (isActive) setLoadingThreads(false);
      }
    }

    loadConversations();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [user?.id, authHeaders]);

  useEffect(() => {
    if (!selectedThreadId || !user?.id) {
      setMessages([]);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function loadMessages() {
      setLoadingMessages(true);
      setMessagesError("");
      try {
        const response = await getConversationMessages(selectedThreadId, {
          authHeaders,
          signal: controller.signal,
          limit: 50,
          order: "asc",
        });
        if (!isActive) return;
        setMessages(response?.messages ?? []);
      } catch (err) {
        if (isActive && err.name !== "AbortError") {
          setMessagesError(err.message || "Failed to load messages.");
          setMessages([]);
        }
      } finally {
        if (isActive) setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedThreadId, user?.id, authHeaders]);

  const selectedThread = useMemo(
    () =>
      threads.find(
        (thread) => (thread.conversation_id || thread.id) === selectedThreadId
      ) || null,
    [threads, selectedThreadId]
  );

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  const listPreview = (thread) => {
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

  const handleSendMessage = async () => {
    if (!selectedThreadId || !draftMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    setMessagesError("");
    try {
      const response = await sendConversationMessage(
        selectedThreadId,
        draftMessage.trim(),
        { authHeaders }
      );
      const inserted = response?.message;
      if (inserted) {
        setMessages((prev) => [...prev, inserted]);
        setThreads((prev) =>
          sortThreadsByActivity(
            prev.map((thread) =>
              (thread.conversation_id || thread.id) === selectedThreadId
                ? {
                    ...thread,
                    last_message_preview: inserted.body,
                    last_message_at: inserted.created_at,
                  }
                : thread
            )
          )
        );
      }
      setDraftMessage("");
    } catch (err) {
      setMessagesError(err.message || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F3F4F6] p-4 gap-4 md:flex-row md:p-6 md:gap-6">
      <aside className="w-full md:w-45">
        <NavBar />
      </aside>

      <div className="flex-1 rounded-3xl bg-white shadow-sm p-4 md:p-6">
        {!user ? (
          <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600">
            You must sign in to view messages.
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Messages
                </p>
                <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search conversations"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-72"
                />
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  New
                </button>
              </div>
            </header>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                {loadingThreads ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                    Loading conversations...
                  </div>
                ) : threadsError ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-white text-sm text-red-600">
                    {threadsError}
                  </div>
                ) : threads.length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                    No quote requests yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortThreadsByActivity(threads).map((thread) => (
                      <button
                        key={thread.conversation_id || thread.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.conversation_id || thread.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                          (thread.conversation_id || thread.id) === selectedThreadId
                            ? "border-gray-300 bg-white"
                            : "border-transparent bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {thread.manufacturer_name || "Unassigned manufacturer"}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {formatDate(thread.last_message_at || thread.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                          {listPreview(thread)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col min-h-[420px]">
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
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
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

                <div className="flex-1 py-6 text-sm text-gray-700">
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
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Request
                        </p>
                        <p className="text-sm text-gray-800">
                          {selectedThread.details_summary?.clothing_type || "—"} ·{" "}
                          {selectedThread.details_summary?.quantity ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Deadline:{" "}
                          {formatDate(selectedThread.details_summary?.deadline) || "—"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        No messages yet for this conversation.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((messageItem) => (
                        <div
                          key={messageItem.id ?? `${messageItem.created_at}-${messageItem.body}`}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <p className="text-sm text-gray-800">
                            {messageItem.body || messageItem.message || "(empty message)"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDateTime(messageItem.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!selectedThread || !draftMessage.trim() || sendingMessage}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:bg-gray-50 disabled:text-gray-400"
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
