import { createContext, useContext, useMemo, useState } from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      clearMessages: () => setMessages([]),
      appendMessage: (message) =>
        setMessages((prev) => [...prev, message]),
    }),
    [messages]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};
