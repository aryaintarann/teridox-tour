// Google Cloud Translation v2 (Basic). Returns inputs unchanged when no key is set.
export async function translateToEnglish(texts: string[]): Promise<string[]> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  const idx = texts.map((t, i) => (t.trim() ? i : -1)).filter((i) => i >= 0);
  if (!key || idx.length === 0) return texts;

  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: idx.map((i) => texts[i]), source: "id", target: "en", format: "text" }),
  });
  if (!res.ok) throw new Error(`Translate failed: ${res.status}`);
  const json = await res.json();
  const out = [...texts];
  json.data.translations.forEach((t: { translatedText: string }, n: number) => (out[idx[n]] = t.translatedText));
  return out;
}
