import { API_BASE_URL } from "../config/api";

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Voice request failed");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Voice Studio took too long to respond");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getVoiceCharacters(limit = 200) {
  return request(`/api/voice/characters?limit=${limit}`);
}

export function createVoiceCharacter(payload) {
  return request("/api/voice/characters", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function updateVoiceCharacter(characterId, changes) {
  return request(`/api/voice/characters/${characterId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(changes)
  });
}

export function deleteVoiceCharacter(characterId) {
  return request(`/api/voice/characters/${characterId}`, {
    method: "DELETE"
  });
}
