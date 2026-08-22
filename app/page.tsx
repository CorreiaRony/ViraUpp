"use client";

import { useMemo, useState } from "react";
import type { Analysis, Goal, Mode } from "../lib/analyzer";

const modeLabel: Record<Mode, string> = { idea: "💡 Ideia", script: "📝 Roteiro", video: "🎬 Vídeo" };

type AIAnalysis = Analysis & { principalStrength?: string; principalRisk?: string; performanceProbability?: string };

export default function Home() {
  const [mode, setMode] = useState<Mode>("script");
  const [goal, setGoal] = useState<Goal>("views");
  const [niche, setNiche] = useState("");
  const [text, setText] = useState("Por que o cérebro ignorou o segundo o? É uma questão de eficiência. Reparou o segundo de? Loucura, né? Mas certeza que que não funciona três vezes. Reparou no segundo que?");
  const [result, setResult] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [published, setPublished] = useState({ views: "", likes: "", comments: "", shares: "", followers: "" });

  const statusClass = useMemo(() => result?.recommendation === "PUBLICAR" ? "good" : result?.recommendation === "TESTAR" ? "warn" : "bad", [result]);

  async function runAnalysis() {
    if (!text.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, mode, goal, niche }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Não foi possível analisar agora.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao analisar o conteúdo.");
    } finally { setLoading(false); }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div><div className="brand">Vira<span>Upp</span> ✦</div><div className="subtitle">Seu copiloto de crescimento para vídeos curtos.</div></div>
        <div className="pill">V1 BETA · IA REAL</div>
      </header>

      <section className="hero card">
        <div><p className="eyebrow">NOVO DIAGNÓSTICO</p><h1>Antes de postar, descubra o que pode segurar seu vídeo.</h1><p>A ViraUpp analisa seu conteúdo, mostra o que manter e sugere mudanças apenas onde existe ganho provável.</p></div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>1. O que vamos analisar?</h2>
          <div className="segmented">{(Object.keys(modeLabel) as Mode[]).map(m => <button key={m} onClick={() => setMode(m)} className={mode === m ? "active" : ""}>{modeLabel[m]}</button>)}</div>
          <label>Objetivo principal</label>
          <select value={goal} onChange={e => setGoal(e.target.value as Goal)}><option value="views">Mais views</option><option value="followers">Mais seguidores</option><option value="engagement">Mais engajamento</option><option value="sales">Mais vendas</option></select>
          <label>Nicho <small>(opcional — deixe vazio para a IA interpretar)</small></label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex.: finanças, fitness, curiosidades..." />
          <label>{mode === "idea" ? "Descreva a ideia" : mode === "video" ? "Transcrição / contexto do vídeo" : "Cole o roteiro"}</label>
          <textarea rows={9} value={text} onChange={e => setText(e.target.value)} />
          <button className="primary" onClick={runAnalysis} disabled={loading}>{loading ? "✦ ViraUpp está analisando..." : "Analisar com IA →"}</button>
          {error && <p className="bad" style={{marginBottom:0}}>{error}</p>}
        </div>

        <div className="card dna">
          <p className="eyebrow">DNA DO CRIADOR</p><h2>Começa geral. Aprende com você.</h2>
          <div className="dnaRow"><span>Vídeos aprendidos</span><strong>0</strong></div><div className="dnaRow"><span>Confiança do perfil</span><strong>Inicial</strong></div><div className="dnaRow"><span>Nicho</span><strong>{result?.niche || niche || "Será interpretado"}</strong></div>
          <p className="muted">Agora a análise já é feita por IA. O próximo passo do DNA será aprender com os resultados reais dos vídeos publicados.</p>
        </div>
      </section>

      {result && <>
        <section className="card resultHead">
          <div className="score"><span>{result.score}</span><small>/100</small></div>
          <div><p className="eyebrow">VIRA SCORE</p><h2 className={statusClass}>{result.recommendation}</h2><p>{result.summary}</p>{result.principalStrength && <p><strong>Força:</strong> {result.principalStrength}</p>}{result.principalRisk && <p><strong>Risco:</strong> {result.principalRisk}</p>}</div>
          <div className="rightMeta"><div>Confiança <strong>{result.confidence}</strong></div><div>Nicho provável <strong>{result.niche}</strong></div><div>Probabilidade <strong>{result.performanceProbability || "—"}</strong></div></div>
        </section>
        <section className="card"><h2>2. O que mudar — e o que NÃO mudar</h2><div className="metricGrid">{result.metrics.map(m => <div className="metric" key={m.label}><div className="metricTop"><strong>{m.label}</strong><span>{m.score}/100</span></div><div className={`action ${m.action.toLowerCase()}`}>{m.action}</div><p>{m.why}</p>{m.suggestion && <div className={m.action === "MANTER" ? "keep" : "suggestion"}><b>{m.action === "MANTER" ? "Decisão:" : "Sugestão:"}</b> {m.suggestion}</div>}</div>)}</div></section>
        <section className="card ready"><p className="eyebrow">PRONTO PARA POSTAR</p><h2>3. Pacote de publicação</h2><div className="publishGrid"><div><span>🖼️ CAPA</span><strong>{result.cover}</strong></div><div><span>📝 LEGENDA</span><strong>{result.caption}</strong></div><div><span>#️⃣ 3 HASHTAGS</span><strong>{result.hashtags.join("  ")}</strong></div><div><span>💬 CTA</span><strong>{result.cta}</strong></div><div><span>📌 COMENTÁRIO FIXADO</span><strong>{result.pinnedComment}</strong></div></div></section>
        <section className="card"><div className="feedbackTitle"><div><p className="eyebrow">FEEDBACK LOOP</p><h2>4. Depois de publicar</h2></div><button className="secondary" onClick={() => setMetricsOpen(!metricsOpen)}>{metricsOpen ? "Fechar" : "Cadastrar resultado"}</button></div>{metricsOpen && <div className="publishedGrid">{Object.entries(published).map(([key,val]) => <label key={key}>{key === "views" ? "Views" : key === "likes" ? "Likes" : key === "comments" ? "Comentários" : key === "shares" ? "Compartilhamentos" : "Seguidores ganhos"}<input value={val} onChange={e => setPublished({...published,[key]:e.target.value})} inputMode="numeric" /></label>)}<button className="primary" onClick={() => alert("Próxima etapa: salvar esses dados para a ViraUpp aprender com o seu perfil.")}>Salvar resultado</button></div>}</section>
      </>}
      <footer>ViraUpp V1 · Inteligência para decidir melhor antes de postar. Probabilidade, não promessa.</footer>
    </main>
  );
}
