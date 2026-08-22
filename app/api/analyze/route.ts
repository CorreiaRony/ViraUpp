import { NextResponse } from "next/server";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "string", enum: ["Baixa", "Moderada", "Alta"] },
    recommendation: { type: "string", enum: ["PUBLICAR", "TESTAR", "ALTERAR"] },
    niche: { type: "string" },
    nicheConfidence: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    principalStrength: { type: "string" },
    principalRisk: { type: "string" },
    performanceProbability: { type: "string", enum: ["Baixa", "Moderada", "Alta"] },
    metrics: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          action: { type: "string", enum: ["MANTER", "TESTAR", "ALTERAR"] },
          why: { type: "string" },
          suggestion: { type: "string" }
        },
        required: ["label", "score", "action", "why", "suggestion"]
      }
    },
    first3Seconds: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        visualHook: { type: "string" },
        verbalHook: { type: "string" },
        textOnScreen: { type: "string" },
        recommendation: { type: "string" }
      },
      required: ["score", "visualHook", "verbalHook", "textOnScreen", "recommendation"]
    },
    timeline: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          period: { type: "string" },
          attention: { type: "string", enum: ["Alta", "Moderada", "Baixa"] },
          score: { type: "integer", minimum: 0, maximum: 100 },
          diagnosis: { type: "string" },
          action: { type: "string" }
        },
        required: ["period", "attention", "score", "diagnosis", "action"]
      }
    },
    editingTips: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } },
    cover: { type: "string" },
    caption: { type: "string" },
    hashtags: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    cta: { type: "string" },
    pinnedComment: { type: "string" }
  },
  required: ["score", "confidence", "recommendation", "niche", "nicheConfidence", "summary", "principalStrength", "principalRisk", "performanceProbability", "metrics", "first3Seconds", "timeline", "editingTips", "cover", "caption", "hashtags", "cta", "pinnedComment"]
};

const instructions = `Você é o motor de inteligência da ViraUpp, um copiloto para criadores de TikTok, Reels e Shorts.
Sua função é avaliar probabilidade de performance e orientar decisões de edição. Nunca prometa viralização e nunca invente dados reais de retenção.

PRINCÍPIOS:
1. Não procure defeitos só para parecer útil. Se algo já está forte, diga MANTER.
2. Só sugira mudança quando houver motivo concreto e ganho provável.
3. Seja específico ao conteúdo enviado. Evite frases genéricas como 'melhore o gancho'.
4. Considere o objetivo: views, seguidores, engajamento ou vendas.
5. Se houver frames, faça leitura visual dos primeiros 3 segundos: enquadramento, movimento percebido, texto visível, contraste, pessoa/objeto em cena e mudança entre frames.
6. Se não houver áudio/transcrição, diga claramente que o gancho verbal não pode ser validado e baseie-se no contexto textual.
7. A timeline é uma ESTIMATIVA de risco de atenção, não analytics reais. Construa 3 a 6 trechos coerentes com a duração informada ou, sem duração, com a estrutura textual.
8. Capa deve gerar curiosidade sem entregar o payoff cedo demais.
9. Legenda deve soar humana e natural.
10. Retorne exatamente 3 hashtags úteis: uma de nicho, uma do assunto e uma contextual/de descoberta. Evite #fyp, #viral e #foryou por padrão.
11. Para cada métrica, suggestion deve ser uma string. Se a ação for MANTER, use uma orientação curta como 'Não altere este elemento.'
12. Em editingTips, entregue apenas ajustes práticos de edição: corte, pausa, texto, B-roll, zoom, enquadramento, ordem ou timing. Se algo não precisa mudar, diga para preservar.

As 5 métricas, nesta ordem: Gancho 0–2s, Retenção, Curiosidade, Compartilhamento, Conversão em seguidores.`;

function extractOutputText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content?.text === "string") return content.text;
    }
  }
  return "";
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
    const videoName = String(body?.videoName || "");
    const frames = Array.isArray(body?.frames) ? body.frames.filter((x: unknown) => typeof x === "string").slice(0, 3) : [];

    if (!text && frames.length === 0) return NextResponse.json({ error: "Envie conteúdo ou vídeo para analisar." }, { status: 400 });
    if (text.length > 18000) return NextResponse.json({ error: "Conteúdo muito longo para esta versão." }, { status: 400 });
    if (frames.some((frame: string) => frame.length > 1_800_000)) return NextResponse.json({ error: "Os frames do vídeo ficaram grandes demais. Tente outro vídeo." }, { status: 413 });

    const contextText = `TIPO: ${mode}\nOBJETIVO: ${goal}\nNICHO INFORMADO: ${niche || "não informado; inferir"}\nARQUIVO: ${videoName || "não informado"}\nDURAÇÃO DO VÍDEO: ${videoDuration ? `${videoDuration.toFixed(1)} segundos` : "não informada"}\nFRAMES DOS PRIMEIROS 3s: ${frames.length ? `${frames.length} frames anexados em ordem cronológica` : "não anexados"}\n\nCONTEXTO / ROTEIRO / TRANSCRIÇÃO:\n${text || "não fornecido"}`;

    const content: any[] = [{ type: "input_text", text: contextText }];
    frames.forEach((imageUrl: string, index: number) => {
      content.push({ type: "input_text", text: `Frame ${index + 1} dos primeiros 3 segundos:` });
      content.push({ type: "input_image", image_url: imageUrl, detail: "low" });
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        reasoning: { effort: "low" },
        instructions,
        input: [{ role: "user", content }],
        max_output_tokens: 3200,
        store: false,
        text: {
          verbosity: "low",
          format: { type: "json_schema", name: "viraupp_video_analysis", strict: true, schema }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error", data);
      const message = data?.error?.message || "Falha ao consultar a IA.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const output = extractOutputText(data);
    if (!output) return NextResponse.json({ error: "A IA não retornou uma análise utilizável." }, { status: 502 });
    return NextResponse.json(JSON.parse(output));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno ao analisar o conteúdo." }, { status: 500 });
  }
}
