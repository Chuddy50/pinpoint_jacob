import { useState } from "react";

export default function LoginForm({ onSubmit }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function userSignup(e) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/pinpoint/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (data.success) {
        onSubmit?.(data);  // Pass data up to Profile page
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  async function userLogin(e){
    e.preventDefault()
    setError(null)

    try{
      const result = await fetch("http://127.0.0.1:8000/pinpoint/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await result.json()

      if (data.success) {
        onSubmit?.(data); 
      } else {
        setError(data.error || "Signup failed");
      }

    } catch (err) {
      setError("Network error")
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <form className="flex flex-col gap-4 border rounded-xl p-4 bg-white shadow-lg">
        <h2 className="text-xl font-semibold text-center">Sign In</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

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
          type="button"
          onClick={userSignup}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
        >
          Sign Up
        </button>

        <button
          type="button"
          onClick={userLogin}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>

      </form>
    </div>
  );
}