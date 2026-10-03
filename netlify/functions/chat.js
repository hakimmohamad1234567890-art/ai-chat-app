// Netlify Function — AI Chat via Groq API
// ئەم فایلە backend ئەپەکەیە

export default async (request, context) => {

  // CORS headers
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const GROQ_API_KEY = Netlify.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ error: "GROQ_API_KEY دامەزراو نییە لە Netlify Environment Variables" })}\n\n`,
      { status: 200, headers }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages = [], model = "llama-3.1-70b-versatile" } = body;

  // Streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Run async
  (async () => {
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!groqResponse.ok) {
        const err = await groqResponse.text();
        await writer.write(encoder.encode(
          `data: ${JSON.stringify({ error: `Groq API هەڵە: ${err}` })}\n\n`
        ));
        await writer.close();
        return;
      }

      const reader = groqResponse.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            await writer.write(encoder.encode(
              `data: ${JSON.stringify({ done: true })}\n\n`
            ));
            continue;
          }
          try {
            const chunk = JSON.parse(jsonStr);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              await writer.write(encoder.encode(
                `data: ${JSON.stringify({ content })}\n\n`
              ));
            }
          } catch {}
        }
      }
    } catch (err) {
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({ error: err.message })}\n\n`
      ));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, { status: 200, headers });
};

export const config = {
  path: "/api/chat",
};
