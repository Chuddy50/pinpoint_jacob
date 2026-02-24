/**
 * RFQ Email API Client
 * ------------------------------------------------------------------
 * This module provides low-level HTTP helpers for interacting with
 * the backend RFQ email messaging endpoints.
 *
 * Responsibilities:
 * - Construct properly formatted URLs with query parameters
 * - Perform authenticated GET and POST requests
 * - Normalize and centralize error handling
 * - Return parsed JSON responses to the caller
 *
 * Endpoints Covered:
 * - GET    /email/conversations
 * - GET    /email/conversations/{conversationId}/messages
 * - POST   /email/conversations/{conversationId}/messages
 *
 * Design Notes:
 * - This file contains NO React or UI logic.
 * - It is framework-agnostic and can be reused outside React.
 * - Error handling prioritizes backend `detail` or `message` fields.
 * - Query parameters omit undefined, null, or empty values.
 *
 * Used by:
 * - React Query hooks (mutations/email.js)
 * - Any frontend module requiring RFQ email communication
 */
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
