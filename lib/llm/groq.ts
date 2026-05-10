import Groq from "groq-sdk";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is not set in .env.local");
    client = new Groq({ apiKey: key });
  }
  return client;
}

export async function groqJSON<T>(systemPrompt: string, userMessage: string): Promise<T> {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as T;
}

export async function groqText(systemPrompt: string, userMessage: string): Promise<string> {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.6,
    max_tokens: 1000,
  });
  return completion.choices[0]?.message?.content ?? "";
}
