/**
 * API client for the Reconciliation Engine backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function runBenchmark(count = 500, seed = 42) {
  const url = `${API_BASE_URL}/evaluate-benchmark?count=${count}&seed=${seed}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.error || errorData.detail || `Server returned ${response.status}`);
  }

  return response.json();
}

export async function reconcileFiles(invoicesFile, paymentsFile, bankFile) {
  const formData = new FormData();
  formData.append('invoices', invoicesFile);
  formData.append('payments', paymentsFile);
  formData.append('bank_transactions', bankFile);

  const response = await fetch(`${API_BASE_URL}/reconcile`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.error || errorData.detail || `Server returned ${response.status}`);
  }

  return response.json();
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (err) {
    return false;
  }
}

export async function checkAIStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/status`);
    if (!response.ok) return { configured: false };
    return await response.json();
  } catch (err) {
    return { configured: false };
  }
}

export async function analyzeRecordWithAI(recordPayload) {
  const response = await fetch(`${API_BASE_URL}/ai/analyze-record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(recordPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = `AI Analysis returned status ${response.status}`;
    if (typeof errorData.detail === 'string') {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      msg = errorData.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    }
    throw new Error(msg);
  }

  return response.json();
}

export async function sendAIChatMessage(recordPayload, messages, userQuery) {
  // Sanitize message history so every message has string content for Pydantic
  const cleanMessages = (messages || []).map(m => ({
    role: m.role || 'assistant',
    content: typeof m.content === 'string' && m.content.trim().length > 0 
      ? m.content 
      : (m.data?.root_cause ? `Forensic Findings: ${m.data.root_cause}` : 'Analysis completed.')
  }));

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      record: recordPayload,
      messages: cleanMessages,
      user_query: userQuery,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = `AI Chat returned status ${response.status}`;
    if (typeof errorData.detail === 'string') {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      msg = errorData.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    }
    throw new Error(msg);
  }

  return response.json();
}

