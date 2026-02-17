import NavBar from "../components/NavBar";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { Link } from "react-router-dom";

export default function Consultant() {
  const { authHeaders } = useAuth();

  useEffect(() => {
    document.title = "Consultant - PinPoint";
  }, []);

  const { messages, setMessages } = useChat();

  // store current input here 
  const [draft, setDraft] = useState("");

  // spamming send button is locked
  const [isSending, setIsSending] = useState(false);

  // store error message here 
  const [error, setError] = useState("");

  const ALLOWED_ROUTES = new Set([
    "/",
    "/profile",
    "/filter",
    "/request-quote",
    "/consultant",
    "/prototype",
    "/messages",
  ]);

  function renderMessageContent(content) {
    const parts = [];
    const linkPattern = /\[([^\]]+)\]\((\/[^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      const [raw, label, to] = match;
      const start = match.index;

      if (start > lastIndex) {
        parts.push({
          type: "text",
          value: content.slice(lastIndex, start),
        });
      }

      if (ALLOWED_ROUTES.has(to)) {
        parts.push({
          type: "link",
          label,
          to,
        });
      } else {
        parts.push({
          type: "text",
          value: raw,
        });
      }

      lastIndex = start + raw.length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex),
      });
    }

    return parts.map((part, index) => {
      if (part.type === "link") {
        return (
          <Link
            key={`link-${index}`}
            to={part.to}
            className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
          >
            {part.label}
          </Link>
        );
      }
      return <span key={`text-${index}`}>{part.value}</span>;
    });
  }

  // send messages to backend 
  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || isSending) return;

    // create message object for the user 
    const userMessage = { role: "user", content: draft.trim() };
    
    // send message straight to ui 
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    // heres how im handling the ui state 
    setDraft(""); // input box 
    setIsSending(true); // locks the ui with a bool flag 
    setError(""); // reset any of the errors that may have happened

    // this is the backend call state 
    try {
      // 
      const res = await fetch("http://127.0.0.1:8000/consultant/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          messages: nextMessages, // this is the context akaa chat history
        }),
      });


      // error handling for backend 
      if (!res.ok) {
        throw new Error(`Backend error ${res.status}`);
      }

      // this json parse the response
      const data = await res.json();
      // extrat the replay or replay with no reply fallback
      const reply = data.reply || "No reply received.";

      // add assistant message to chat history 
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      // set the flag back to false 
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white p-4 gap-4 md:flex-row md:p-6 md:gap-6">
      {/* Nav bar stuff  */}
      <aside className="w-full md:w-45">
        <NavBar />
      </aside>

      {/* Main chat stuff   */}
      <section className="flex-1 p-4 flex flex-col gap-4 md:p-6">

        {/* Page Header */}
        <header>
          <h1 className="text-xl font-semibold text-gray-900">Consulting</h1>
          <p className="text-sm text-gray-500">Quick chat with the assistant.</p>
        </header>

        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Messages area  */}
        <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-gray-50 overflow-y-auto space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-xl rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-blue-100 text-blue-900"
                  : "mr-auto bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-500">
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <div>{renderMessageContent(msg.content)}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm">No messages yet.</div>
          )}
        </div>

          {/* input and submit button   */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message "
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={isSending}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
