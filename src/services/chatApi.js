import { API_BASE_URL } from "../config/api";

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 150000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Shadower took too long to respond");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function checkBackendHealth() {
  return request("/health");
}

export function getChatModels() {
  return request("/api/chat/models");
}

export function getChatSessions(limit = 50) {
  return request(`/api/chats?limit=${limit}`);
}

export function createChatSession(payload = {}) {
  return request("/api/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function getChatMessages(chatId, limit = 200) {
  return request(`/api/chats/${chatId}/messages?limit=${limit}`);
}

export function updateChatSession(chatId, changes) {
  return request(`/api/chats/${chatId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(changes)
  });
}

export function deleteChatSession(chatId) {
  return request(`/api/chats/${chatId}`, {
    method: "DELETE"
  });
}

export function sendChatMessage(
  message,
  history = [],
  { model, intelligence, chatId = null }
) {
  
  return request("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
  chatId,
  message,
  history,
  model,
  intelligence
})
  });
}
