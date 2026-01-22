import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";

const threads = [
  {
    id: 1,
    name: "Precision Metalworks",
    preview: "We can support aluminum runs by next week.",
    time: "2h ago",
    unread: 2,
  },
  {
    id: 2,
    name: "Delta Plastics",
    preview: "Do you have a revised CAD file?",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 3,
    name: "North Forge",
    preview: "Quote sent. Let us know if you want...",
    time: "Mon",
    unread: 0,
  },
];

const messages = [
  {
    id: 1,
    sender: "manufacturer",
    content: "Thanks for reaching out. What materials are you considering?",
    time: "9:12 AM",
  },
  {
    id: 2,
    sender: "user",
    content: "Likely aluminum 6061. We need about 300 units.",
    time: "9:14 AM",
  },
  {
    id: 3,
    sender: "manufacturer",
    content: "Great, we can turn that in about 10 days.",
    time: "9:16 AM",
  },
];

export default function Messages() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F3F4F6] p-4 gap-4 md:flex-row md:p-6 md:gap-6">
      <aside className="w-full md:w-72">
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
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {thread.name}
                    </h3>
                    <span className="text-xs text-gray-400">{thread.time}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                    {thread.preview}
                  </p>
                  {thread.unread > 0 && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {thread.unread} new
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Precision Metalworks
                </h2>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                View profile
              </button>
            </div>

            <div className="flex-1 space-y-3 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    message.sender === "user"
                      ? "ml-auto bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="mt-2 block text-[10px] uppercase tracking-wide text-gray-400">
                    {message.time}
                  </span>
                </div>
              ))}
            </div>

            <form className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-3">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition"
              >
                Send
              </button>
            </form>
          </section>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
