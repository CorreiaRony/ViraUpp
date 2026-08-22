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
    cover: { type: "string" },
    caption: { type: "string" },
    hashtags: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    cta: { type: "string" },
    pinnedComment: { type: "string" }
  },
  required: ["score", "confidence", "recommendation", "niche", "nicheConfidence", "summary", "principalStrength", "principalRisk", "performanceProbability", "metrics", "cover", "caption", "hashtags", "cta", "pinnedComment"]
};

const instructions = `Você é o motor de inteligência da ViraUpp, um copiloto para criadores de vídeos curtos.
Sua função é avaliar probabilidade de performance, nunca prometer viralização.
Analise o conteúdo em português do Brasil considerando o objetivo e o nicho informado ou inferido.

PRINCÍPIOS OBRIGATÓRIOS:
1. Não procure defeitos só para parecer útil. Se algo já está forte, diga MANTER.
2. Uma mudança só deve ser sugerida quando houver motivo concreto e ganho provável.
3. Explique o porquê com referência específica ao conteúdo enviado, não com frases genéricas.
4. Diferencie boas práticas gerais de sinais daquele nicho e objetivo.
5. Não invente métricas reais do TikTok. O score é heurístico/probabilístico.
6. Capa deve gerar curiosidade sem entregar cedo demais o payoff.
7. Legenda deve soar humana e natural, não como texto publicitário genérico.
8. Retorne exatamente 3 hashtags úteis: uma de nicho, uma do assunto e uma contextual/de descoberta. Evite #fyp, #viral e #foryou por padrão.
9. CTA só deve existir se ajudar. Se um CTA explícito puder piorar o conteúdo, use uma orientação sutil.
10. Para cada métrica, suggestion deve ser uma string. Quando a ação for MANTER, escreva em suggestion algo curto como 'Não altere este elemento.'

As 5 métricas, nesta ordem, devem ser: Gancho 0–2s, Retenção, Curiosidade, Compartilhamento, Conversão em seguidores.`;

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
    if (!text) return NextResponse.json({ error: "Envie um conteúdo para analisar." }, { status: 400 });
    if (text.length > 18000) return NextResponse.json({ error: "Conteúdo muito longo para esta versão do MVP." }, { status: 400 });

    const input = `TIPO: ${mode}\nOBJETIVO: ${goal}\nNICHO INFORMADO: ${niche || "não informado; inferir"}\n\nCONTEÚDO:\n${text}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        reasoning: { effort: "low" },
        instructions,
        input,
        max_output_tokens: 2600,
        store: false,
        text: {
          verbosity: "low",
          format: { type: "json_schema", name: "viraupp_analysis", strict: true, schema }
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

    const analysis = JSON.parse(output);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno ao analisar o conteúdo." }, { status: 500 });
  }
}
