/**
 * Thin wrapper around fetch for the AutoML Studio API.
 * All calls go through /api which Vite proxies to the FastAPI backend
 * in development (see vite.config.js); in production, serve the built
 * frontend behind the same origin as the API, or set VITE_API_BASE.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* response wasn't JSON */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  uploadDataset(file) {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/dataset/upload`, { method: "POST", body: formData }).then(handleResponse);
  },

  selectTarget(sessionId, targetColumn, taskType = "auto") {
    return fetch(`${API_BASE}/dataset/select-target`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, target_column: targetColumn, task_type: taskType }),
    }).then(handleResponse);
  },

  getEDA(sessionId) {
    return fetch(`${API_BASE}/eda/${sessionId}`).then(handleResponse);
  },

  getAlgorithms(sessionId) {
    return fetch(`${API_BASE}/train/algorithms/${sessionId}`).then(handleResponse);
  },

  trainModels(sessionId, algorithms, { hyperparameters, tuneHyperparameters } = {}) {
    return fetch(`${API_BASE}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        algorithms,
        hyperparameters: hyperparameters || null,
        tune_hyperparameters: !!tuneHyperparameters,
      }),
    }).then(handleResponse);
  },

  getPredictionSchema(sessionId) {
    return fetch(`${API_BASE}/predict/schema/${sessionId}`).then(handleResponse);
  },

  predict(sessionId, modelKey, inputs) {
    return fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, model_key: modelKey, inputs }),
    }).then(handleResponse);
  },

  downloadModelUrl(sessionId, modelKey) {
    return `${API_BASE}/models/download/${sessionId}/${modelKey}`;
  },
};
