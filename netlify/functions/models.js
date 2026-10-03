// Netlify Function — Get available models
export default async (request, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Available Groq models (بەخۆڕایی)
  const models = [
    { id: "llama-3.1-70b-versatile",  label: "LLaMA 3.1 70B ⭐ (باشترین)" },
    { id: "llama-3.1-8b-instant",     label: "LLaMA 3.1 8B (خێراترین)" },
    { id: "mixtral-8x7b-32768",       label: "Mixtral 8x7B (زیاتر کریاتیڤ)" },
    { id: "gemma2-9b-it",             label: "Gemma 2 9B (Google)" },
    { id: "llama3-70b-8192",          label: "LLaMA 3 70B" },
  ];

  return new Response(JSON.stringify({ models }), { status: 200, headers });
};

export const config = {
  path: "/api/models",
};
