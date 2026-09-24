import { getSession } from "@/lib/auth";
import { translateToEnglish } from "@/lib/translate";

export async function POST(request: Request) {
  const { profile } = await getSession();
  if (profile?.role !== "admin") return new Response("forbidden", { status: 403 });

  const { texts } = await request.json();
  if (!Array.isArray(texts) || texts.length > 200 || !texts.every((t) => typeof t === "string")) {
    return new Response("bad request", { status: 400 });
  }
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return Response.json({ error: "GOOGLE_TRANSLATE_API_KEY is not set" }, { status: 503 });
  try {
    return Response.json({ texts: await translateToEnglish(texts) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
