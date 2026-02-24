const BASE_URL = "http://127.0.0.1:8000";

const buildUrl = (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.detail || data?.message || `Request failed (HTTP ${response.status})`;
    throw new Error(message);
  }
  return data;
};

export async function fetchRfqConversations({
  authHeaders,
  signal,
  limit = 20,
  before,
} = {}) {
  const response = await fetch(
    buildUrl("/email/conversations", { limit, before }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeaders ?? {}),
      },
      signal,
    }
  );

  const data = await handleResponse(response);
  return data?.conversations ?? [];
}

export async function fetchRfqConversationMessages(
  conversationId,
  { authHeaders, signal, limit = 50, before, order = "asc" } = {}
) {
  const response = await fetch(
    buildUrl(`/email/conversations/${conversationId}/messages`, {
      limit,
      before,
      order,
    }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeaders ?? {}),
      },
      signal,
    }
  );

  return await handleResponse(response);
}

export async function postRfqConversationMessage(
  conversationId,
  body,
  { authHeaders, signal, senderType = "buyer", source = "web" } = {}
) {
  const response = await fetch(
    buildUrl(`/email/conversations/${conversationId}/messages`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeaders ?? {}),
      },
      body: JSON.stringify({
        body,
        sender_type: senderType,
        source,
      }),
      signal,
    }
  );

  return await handleResponse(response);
}
