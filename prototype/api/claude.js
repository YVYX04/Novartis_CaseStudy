// Thin wrapper around the server SSE endpoint.
// Usage: streamChat({ system, messages, onToken, onDone, onError })

export async function streamChat({ system, messages, onToken, onDone, onError, max_tokens = 2048 }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens }),
  });

  if (!response.ok) {
    onError?.(`Server error: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') { onDone?.(); return; }
      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) { onError?.(parsed.error); return; }
        if (parsed.text) onToken?.(parsed.text);
      } catch {}
    }
  }
  onDone?.();
}
