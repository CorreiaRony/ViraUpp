export type Mode = "idea" | "script" | "video";
export type Goal = "views" | "followers" | "engagement" | "sales";

export type Analysis = {
  score: number;
  confidence: "Baixa" | "Moderada" | "Alta";
  recommendation: "PUBLICAR" | "TESTAR" | "ALTERAR";
  niche: string;
  nicheConfidence: number;
  metrics: { label: string; score: number; action: "MANTER" | "TESTAR" | "ALTERAR"; why: string; suggestion?: string }[];
  cover: string;
  caption: string;
  hashtags: string[];
  cta: string;
  pinnedComment: string;
  summary: string;
};

const hasQuestion = (s: string) => /\?|por que|porque|como|qual|você|voce|duvido|reparou|descobri/i.test(s);
const hasReveal = (s: string) => /segredo|erro|reparou|descobri|ninguém|ninguem|isso|resultado|final/i.test(s);
const hasCTA = (s: string) => /comenta|segue|salva|compartilha|manda|clica|link/i.test(s);

export function analyze(text: string, mode: Mode, goal: Goal, statedNiche?: string): Analysis {
  const cleaned = text.trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const short = words.length <= 95;
  const question = hasQuestion(cleaned);
  const reveal = hasReveal(cleaned);
  const cta = hasCTA(cleaned);
  const base = 56 + (question ? 10 : 0) + (reveal ? 8 : 0) + (short ? 8 : -6) + (cta ? 3 : 0);
  const score = Math.max(28, Math.min(94, base + (mode === "video" ? 2 : 0)));
  const niche = statedNiche?.trim() || inferNiche(cleaned);
  const recommendation = score >= 78 ? "PUBLICAR" : score >= 62 ? "TESTAR" : "ALTERAR";
  const confidence = cleaned.length > 220 ? "Alta" : cleaned.length > 70 ? "Moderada" : "Baixa";

  const hook = Math.min(96, 52 + (question ? 26 : 0) + (reveal ? 10 : 0));
  const retention = Math.min(94, 50 + (short ? 18 : 2) + (reveal ? 13 : 0));
  const curiosity = Math.min(98, 46 + (question ? 18 : 0) + (reveal ? 24 : 0));
  const shares = Math.min(92, 43 + (question ? 12 : 0) + (goal === "engagement" ? 10 : 0) + (reveal ? 12 : 0));
  const follows = Math.min(90, 42 + (goal === "followers" ? 18 : 6) + (cta ? 10 : 0) + (reveal ? 8 : 0));

  const metrics = [
    metric("Gancho 0–2s", hook, question ? "A abertura cria curiosidade rapidamente." : "A abertura explica demais antes de criar tensão.", question ? undefined : "Comece com uma pergunta, desafio ou informação incompleta."),
    metric("Retenção", retention, short ? "O conteúdo está relativamente direto." : "O conteúdo está longo para o nível de tensão atual.", short ? undefined : "Corte contexto redundante e antecipe o conflito."),
    metric("Curiosidade", curiosity, reveal ? "Existe uma lacuna de informação que estimula continuidade." : "A promessa está previsível demais.", reveal ? undefined : "Esconda parte da resposta até o final."),
    metric("Compartilhamento", shares, shares >= 70 ? "Há um motivo natural para enviar a outra pessoa." : "Falta um elemento que faça a pessoa pensar em alguém.", shares >= 70 ? undefined : "Adicione um ponto de identificação ou surpresa compartilhável."),
    metric("Conversão em seguidores", follows, follows >= 70 ? "O conteúdo tem espaço para continuidade temática." : "O vídeo pode performar sem deixar claro por que seguir o perfil.", follows >= 70 ? undefined : "Crie uma promessa de continuidade sutil, sem pedir follow por pedir.")
  ];

  const topic = cleaned.split(/[.!?\n]/)[0]?.slice(0, 70) || "Você percebeu isso?";
  const cover = question ? topic.replace(/[.!?]+$/, "") : `Você percebeu isso?`;
  const caption = `Eu quase deixei isso passar. ${question ? "Você percebeu de primeira?" : "O que você faria diferente?"}`;
  const hashtags = hashtagsForNiche(niche);

  return {
    score,
    confidence,
    recommendation,
    niche,
    nicheConfidence: statedNiche ? 100 : 78,
    metrics,
    cover,
    caption,
    hashtags,
    cta: cta ? "Mantenha o CTA atual; ele já está integrado ao conteúdo." : goal === "followers" ? "Se isso te pegou, segue porque eu vou trazer mais testes assim." : "Comenta se você percebeu de primeira.",
    pinnedComment: "Quantas vezes você precisou assistir/ler para perceber? 👀",
    summary: recommendation === "PUBLICAR" ? "Não force mudanças. O conteúdo já tem uma estrutura competitiva; altere apenas pontos de baixo risco." : recommendation === "TESTAR" ? "A base é boa, mas vale testar 1–2 mudanças de maior impacto antes de publicar." : "Há sinais de perda de retenção. Priorize gancho e curiosidade antes de publicar."
  };
}

function metric(label: string, score: number, why: string, suggestion?: string) {
  const action: "MANTER" | "TESTAR" | "ALTERAR" = score >= 78 ? "MANTER" : score >= 62 ? "TESTAR" : "ALTERAR";
  return { label, score, action, why, suggestion: action === "MANTER" ? undefined : suggestion };
}

function inferNiche(text: string) {
  if (/dinheiro|finan|banco|dívida|divida|invest/i.test(text)) return "Finanças";
  if (/treino|academia|emagrec|fitness|saúde|saude/i.test(text)) return "Fitness e saúde";
  if (/igreja|bíblia|biblia|deus|jesus|fé|fe/i.test(text)) return "Cristão / fé";
  if (/cérebro|cerebro|reparou|teste|desafio|erro|curios/i.test(text)) return "Curiosidades e desafios";
  if (/venda|produto|shop|comprar|oferta/i.test(text)) return "Conteúdo comercial / TikTok Shop";
  return "Entretenimento / conteúdo geral";
}

function hashtagsForNiche(niche: string) {
  const n = niche.toLowerCase();
  if (n.includes("finan")) return ["#Financas", "#Dinheiro", "#EducacaoFinanceira"];
  if (n.includes("fitness") || n.includes("saúde") || n.includes("saude")) return ["#Fitness", "#Treino", "#VidaSaudavel"];
  if (n.includes("crist")) return ["#Fe", "#Biblia", "#VidaComDeus"];
  if (n.includes("curios")) return ["#Curiosidades", "#DesafioVisual", "#TesteSeuCerebro"];
  if (n.includes("shop") || n.includes("comercial")) return ["#TikTokShop", "#Achadinhos", "#ValeAPena"];
  return ["#Criadores", "#Conteudo", "#TikTokBrasil"];
}
