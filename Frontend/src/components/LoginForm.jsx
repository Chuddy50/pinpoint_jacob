import { useState } from "react";

export default function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState(null);   // ← holds FastAPI response

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/pinpoint/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setResponse(data);        // ← show backend response
      onSubmit?.(data);         // optional callback
    } catch (err) {
      setResponse({ error: "Network error" });
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4 flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 border rounded-xl p-4"
      >
        <h2 className="text-xl font-semibold text-center">Login</h2>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Email</label>
          <input
            type="email"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Password</label>
          <input
            type="password"
            className="border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
        >
          Log In
        </button>
      </form>

      {/* Backend Response Display */}
      {response && (
        <div className="mt-4 p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap">
          <strong>Response:</strong>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
