import { API_BASE_URL } from "../config/api";

const REQUEST_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

function jsonOptions(method, payload) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

export function getVoiceCharacters(limit = 200) {
  return request(`/api/voice/characters?limit=${limit}`);
}

export function createVoiceCharacter(payload) {
  return request("/api/voice/characters", jsonOptions("POST", payload));
}

export function updateVoiceCharacter(characterId, changes) {
  return request(
    `/api/voice/characters/${characterId}`,
    jsonOptions("PATCH", changes)
  );
}

export function deleteVoiceCharacter(characterId) {
  return request(`/api/voice/characters/${characterId}`, { method: "DELETE" });
}

export function getVoiceSamples(characterId, limit = 200) {
  return request(
    `/api/voice/characters/${characterId}/samples?limit=${limit}`
  );
}

export function requestVoiceSampleUpload(characterId, file, mimeType) {
  return request(
    `/api/voice/characters/${characterId}/samples/upload-url`,
    jsonOptions("POST", {
      fileName: file.name,
      mimeType,
      fileSizeBytes: file.size
    })
  );
}

export function uploadVoiceFile(upload, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method || "PUT", upload.url, true);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    Object.entries(upload.headers || {}).forEach(([name, value]) => {
      xhr.setRequestHeader(name, value);
    });

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Cloudflare R2 upload failed (${xhr.status || "network"})`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Unable to upload this audio file to Cloudflare R2"));
    });
    xhr.addEventListener("timeout", () => {
      reject(new Error("Audio upload timed out"));
    });
    xhr.addEventListener("abort", () => {
      reject(new Error("Audio upload was cancelled"));
    });

    xhr.send(file);
  });
}

export function completeVoiceSampleUpload(
  characterId,
  sampleId,
  durationSeconds
) {
  return request(
    `/api/voice/characters/${characterId}/samples/${sampleId}/complete`,
    jsonOptions("POST", { durationSeconds })
  );
}

export function getVoiceSamplePlayUrl(characterId, sampleId) {
  return request(
    `/api/voice/characters/${characterId}/samples/${sampleId}/play-url`
  );
}

export function updateVoiceSample(characterId, sampleId, changes) {
  return request(
    `/api/voice/characters/${characterId}/samples/${sampleId}`,
    jsonOptions("PATCH", changes)
  );
}

export function deleteVoiceSample(characterId, sampleId) {
  return request(
    `/api/voice/characters/${characterId}/samples/${sampleId}`,
    { method: "DELETE" }
  );
}
