import { NextResponse } from "next/server";

const ACTIONS = ["MANTER", "TESTAR", "ALTERAR"] as const;
const MAX_FRAMES = 6;
const MAX_FRAME_LENGTH = 900_000;
const MAX_TOTAL_FRAME_LENGTH = 3_600_000;

const itemString = { type: "string" };
const schema = {
  type: "object", additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "string", enum: ["Baixa", "Moderada", "Alta"] },
    recommendation: { type: "string", enum: ["PUBLICAR", "TESTAR", "ALTERAR"] },
    niche: itemString, nicheConfidence: { type: "integer", minimum: 0, maximum: 100 }, summary: itemString,
    principalStrength: itemString, principalRisk: itemString,
    performanceProbability: { type: "string", enum: ["Baixa", "Moderada", "Alta"] },
    metrics: { type: "array", minItems: 6, maxItems: 6, items: { type: "object", additionalProperties: false, properties: {
      label: itemString, score: { type: "integer", minimum: 0, maximum: 100 }, action: { type: "string", enum: ACTIONS }, why: itemString, suggestion: itemString
    }, required: ["label", "score", "action", "why", "suggestion"] } },
    visualHook: { type: "object", additionalProperties: false, properties: {
      score: { type: "integer", minimum: 0, maximum: 100 }, action: { type: "string", enum: ACTIONS }, diagnosis: itemString, suggestion: itemString
    }, required: ["score", "action", "diagnosis", "suggestion"] },
    firstThreeSeconds: { type: "object", additionalProperties: false, properties: {
      diagnosis: itemString, strengths: { type: "array", minItems: 1, maxItems: 4, items: itemString }, risks: { type: "array", minItems: 1, maxItems: 4, items: itemString }
    }, required: ["diagnosis", "strengths", "risks"] },
    retentionTimeline: { type: "array", minItems: 3, maxItems: 5, items: { type: "object", additionalProperties: false, properties: {
      start: itemString, end: itemString, score: { type: "integer", minimum: 0, maximum: 100 }, risk: { type: "string", enum: ["baixo", "médio", "alto"] }, diagnosis: itemString, suggestion: itemString
    }, required: ["start", "end", "score", "risk", "diagnosis", "suggestion"] } },
    editingSuggestions: { type: "array", minItems: 3, maxItems: 6, items: { type: "object", additionalProperties: false, properties: {
      timestamp: itemString, action: { type: "string", enum: ACTIONS }, suggestion: itemString, reason: itemString
    }, required: ["timestamp", "action", "suggestion", "reason"] } },
    cover: itemString, caption: itemString, hashtags: { type: "array", minItems: 3, maxItems: 3, items: itemString }, cta: itemString, pinnedComment: itemString
  },
  required: ["score", "confidence", "recommendation", "niche", "nicheConfidence", "summary", "principalStrength", "principalRisk", "performanceProbability", "metrics", "visualHook", "firstThreeSeconds", "retentionTimeline", "editingSuggestions", "cover", "caption", "hashtags", "cta", "pinnedComment"]
};

const instructions = `Você é o motor de análise da ViraUpp para TikTok, Reels e Shorts. Avalie probabilidade; nunca prometa viralização.
- Seja específico ao material. Descreva apenas elementos observáveis nos frames; não invente fala, áudio, texto ou movimento.
- Compare os frames em ordem: enquadramento, rosto, contraste, texto/legibilidade, mudança visual, informação precoce, curiosidade, clareza e interrupção de padrão.
- Sem transcrição, declare a limitação do gancho verbal. Áudio não é extraído nesta versão.
- Não sugira mudança só para parecer útil. Quando funciona, use MANTER e explique.
- Timeline é estimativa de risco, nunca analytics real. Adapte os intervalos à duração: 0–2s, 2–5s, 5–8s, 8–12s e 12s–final quando possível.
- Edição deve ser executável e ter timestamp: corte, zoom, pausa, texto, legenda, B-roll, reenquadramento, troca de cena, ritmo, silêncio ou payoff.
- UppScore deve ser coerente com seis métricas, nesta ordem: Gancho verbal, Gancho visual, Retenção, Curiosidade, Compartilhamento, Conversão em seguidores.
- Capa gera curiosidade sem repetir a primeira frase ou entregar o payoff. Legenda curta, natural e humana.
- Exatamente 3 hashtags: nicho, assunto e contexto/descoberta. Evite #fyp, #viral e #foryou.
- CTA é opcional. Se dispensável: "Não adicionaria CTA explícito neste vídeo."
- Para ideia/roteiro sem frames, preencha tudo e deixe claro que a leitura visual é hipótese não validada.`;

type InputFrame = { timestamp: number; imageUrl: string };

function extractOutputText(data: unknown) {
  const value = data as { output_text?: unknown; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: unknown }> }> };
  if (typeof value.output_text === "string") return value.output_text;
  for (const item of value.output || []) for (const content of item.type === "message" ? item.content || [] : []) {
    if (content.type === "output_text" && typeof content.text === "string") return content.text;
  }
  return "";
}

function parseFrames(value: unknown): InputFrame[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_FRAMES).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const frame = item as { timestamp?: unknown; imageUrl?: unknown };
    const timestamp = Number(frame.timestamp);
    if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > 3.1 || typeof frame.imageUrl !== "string" || !frame.imageUrl.startsWith("data:image/jpeg;base64,")) return [];
    return [{ timestamp, imageUrl: frame.imageUrl }];
  });
}

export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
    const body = await request.json();
    const text = String(body?.text || "").trim();
    const mode = String(body?.mode || "script");
    const goal = String(body?.goal || "views");
    const niche = String(body?.niche || "").trim();
    const videoDuration = Number(body?.videoDuration || 0);
    const videoName = String(body?.videoName || "").slice(0, 180);
    const videoType = String(body?.videoType || "");
    const videoSize = Number(body?.videoSize || 0);
    const frames = parseFrames(body?.frames);

    if (!["idea", "script", "video"].includes(mode) || !["views", "followers", "engagement", "sales"].includes(goal)) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    if (!text && !frames.length) return NextResponse.json({ error: "Envie conteúdo ou vídeo para analisar." }, { status: 400 });
    if (text.length > 18_000 || niche.length > 120) return NextResponse.json({ error: "Conteúdo muito longo para esta versão." }, { status: 400 });
    if (mode === "video" && videoType && !["video/mp4", "video/quicktime", "video/webm"].includes(videoType)) return NextResponse.json({ error: "Formato de vídeo não aceito." }, { status: 415 });
    if (videoSize > 200 * 1024 * 1024 || videoDuration > 600) return NextResponse.json({ error: "Use vídeo de até 200 MB e 10 minutos." }, { status: 413 });
    const totalLength = frames.reduce((sum, frame) => sum + frame.imageUrl.length, 0);
    if (frames.some((frame) => frame.imageUrl.length > MAX_FRAME_LENGTH) || totalLength > MAX_TOTAL_FRAME_LENGTH) return NextResponse.json({ error: "Os frames ficaram grandes demais. Tente resolução menor." }, { status: 413 });

    // Próxima etapa: acrescentar uma transcrição server-side a este contexto, sem alterar o contrato visual nem enviar o vídeo inteiro ao modelo.
    const context = `TIPO: ${mode}\nOBJETIVO: ${goal}\nNICHO: ${niche || "inferir"}\nARQUIVO: ${videoName || "não informado"}\nDURAÇÃO: ${videoDuration ? `${videoDuration.toFixed(1)}s` : "não informada"}\nFRAMES: ${frames.length || "nenhum"}\nÁUDIO: não extraído nesta versão\n\nCONTEXTO/ROTEIRO/TRANSCRIÇÃO:\n${text || "não fornecido"}`;
    const content: Array<Record<string, unknown>> = [{ type: "input_text", text: context }];
    for (const frame of frames) {
      content.push({ type: "input_text", text: `Frame em ${frame.timestamp.toFixed(2)}s:` });
      content.push({ type: "input_image", image_url: frame.imageUrl, detail: "low" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, instructions, input: [{ role: "user", content }], max_output_tokens: 4200, store: false, text: { verbosity: "low", format: { type: "json_schema", name: "viraupp_video_analysis", strict: true, schema } } })
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const apiError = data as { error?: { message?: string } };
      console.error("OpenAI error", apiError.error?.message || response.statusText);
      return NextResponse.json({ error: apiError.error?.message || "Falha ao consultar a IA." }, { status: response.status });
    }
    const output = extractOutputText(data);
    if (!output) return NextResponse.json({ error: "A IA não retornou uma análise utilizável." }, { status: 502 });
    return NextResponse.json(JSON.parse(output));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno ao analisar o conteúdo." }, { status: 500 });
  }
}
