import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  //give tab a title
  useEffect(() => {
    document.title = "Messages - PinPoint";
  }, []);

  useEffect(() => {
    if (!user?.user_id) return;
    let isActive = true;

    async function fetchThreads() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/rfq/conversations/${user.user_id}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Failed to load RFQs");
        }
        if (!isActive) return;
        const conversations = data.conversations || [];
        setThreads(conversations);
        if (conversations.length > 0 && !selectedThreadId) {
          setSelectedThreadId(conversations[0].id);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load conversations.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchThreads();
    return () => {
      isActive = false;
    };
  }, [user?.user_id]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Inbox
            </h1>
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
            {loading ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                Loading conversations...
              </div>
            ) : error ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-white text-sm text-red-600">
                {error}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                No conversations yet.
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                      thread.id === selectedThreadId
                        ? "border-gray-300 bg-white"
                        : "border-transparent bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {thread.manufacturer_name || "Unassigned manufacturer"}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {formatDate(thread.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                      {thread.details
                        ? `${thread.details.clothing_type} · ${thread.details.quantity}`
                        : "Draft RFQ"}
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
                  {selectedThread?.manufacturer_name || "Request details"}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedThread ? "RFQ details" : "Messages will appear here."}
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
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Request
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedThread.details?.clothing_type || "—"} ·{" "}
                      {selectedThread.details?.quantity ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Material: {selectedThread.details?.material || "—"} ·
                      Color: {selectedThread.details?.color || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size range: {selectedThread.details?.size_range || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Deadline: {formatDate(selectedThread.details?.deadline) || "—"}
                    </p>
                  </div>

                  {selectedThread.details?.notes && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Notes
                      </p>
                      <p className="text-sm text-gray-800">
                        {selectedThread.details.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 text-xs text-gray-400">
              Messaging is coming soon.
            </div>
          </section>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
