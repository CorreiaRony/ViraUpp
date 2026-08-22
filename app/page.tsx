"use client";

import { useMemo, useState } from "react";
import { analyze, Analysis, Goal, Mode } from "../lib/analyzer";

const modeLabel: Record<Mode, string> = { idea: "💡 Ideia", script: "📝 Roteiro", video: "🎬 Vídeo" };

export default function Home() {
  const [mode, setMode] = useState<Mode>("script");
  const [goal, setGoal] = useState<Goal>("views");
  const [niche, setNiche] = useState("");
  const [text, setText] = useState("Por que o cérebro ignorou o segundo o? É uma questão de eficiência. Reparou o segundo de? Loucura, né? Mas certeza que que não funciona três vezes. Reparou no segundo que?");
  const [result, setResult] = useState<Analysis | null>(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [published, setPublished] = useState({ views: "", likes: "", comments: "", shares: "", followers: "" });

  const statusClass = useMemo(() => result?.recommendation === "PUBLICAR" ? "good" : result?.recommendation === "TESTAR" ? "warn" : "bad", [result]);

  function runAnalysis() {
    if (!text.trim()) return;
    setResult(analyze(text, mode, goal, niche));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div><div className="brand">VIRAL<span>LAB</span></div><div className="subtitle">A IA que aprende o que funciona no seu perfil.</div></div>
        <div className="pill">MVP V1 · Probabilidade, não promessa</div>
      </header>

      <section className="hero card">
        <div>
          <p className="eyebrow">NOVO DIAGNÓSTICO</p>
          <h1>Seu conteúdo está pronto para postar?</h1>
          <p>Analise, decida o que manter, receba sugestões e saia com capa, legenda, CTA e 3 hashtags.</p>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>1. O que vamos analisar?</h2>
          <div className="segmented">{(Object.keys(modeLabel) as Mode[]).map(m => <button key={m} onClick={() => setMode(m)} className={mode === m ? "active" : ""}>{modeLabel[m]}</button>)}</div>

          <label>Objetivo principal</label>
          <select value={goal} onChange={e => setGoal(e.target.value as Goal)}>
            <option value="views">Mais views</option><option value="followers">Mais seguidores</option><option value="engagement">Mais engajamento</option><option value="sales">Mais vendas</option>
          </select>

          <label>Nicho <small>(opcional — deixe vazio para a IA interpretar)</small></label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex.: finanças, fitness, curiosidades..." />

          <label>{mode === "idea" ? "Descreva a ideia" : mode === "video" ? "Transcrição / contexto do vídeo" : "Cole o roteiro"}</label>
          <textarea rows={9} value={text} onChange={e => setText(e.target.value)} />
          <button className="primary" onClick={runAnalysis}>Analisar conteúdo →</button>
        </div>

        <div className="card dna">
          <p className="eyebrow">DNA DO CRIADOR</p>
          <h2>O sistema começa geral e fica pessoal.</h2>
          <div className="dnaRow"><span>Vídeos aprendidos</span><strong>0</strong></div>
          <div className="dnaRow"><span>Confiança do perfil</span><strong>Inicial</strong></div>
          <div className="dnaRow"><span>Nicho</span><strong>{niche || "Será interpretado"}</strong></div>
          <p className="muted">Depois da publicação, cadastre as métricas reais. A V1 guarda o conceito de feedback; a próxima versão conecta persistência e IA real.</p>
        </div>
      </section>

      {result && <>
        <section className="card resultHead">
          <div className="score"><span>{result.score}</span><small>/100</small></div>
          <div><p className="eyebrow">VIRAL SCORE</p><h2 className={statusClass}>{result.recommendation}</h2><p>{result.summary}</p></div>
          <div className="rightMeta"><div>Confiança <strong>{result.confidence}</strong></div><div>Nicho provável <strong>{result.niche}</strong></div><div>Confiança do nicho <strong>{result.nicheConfidence}%</strong></div></div>
        </section>

        <section className="card">
          <h2>2. O que mudar — e o que NÃO mudar</h2>
          <div className="metricGrid">{result.metrics.map(m => <div className="metric" key={m.label}>
            <div className="metricTop"><strong>{m.label}</strong><span>{m.score}/100</span></div>
            <div className={`action ${m.action.toLowerCase()}`}>{m.action}</div>
            <p>{m.why}</p>
            {m.suggestion && <div className="suggestion"><b>Sugestão:</b> {m.suggestion}</div>}
            {m.action === "MANTER" && <div className="keep">Não altere apenas por alterar.</div>}
          </div>)}</div>
        </section>

        <section className="card ready">
          <p className="eyebrow">PRONTO PARA POSTAR</p><h2>3. Pacote de publicação</h2>
          <div className="publishGrid">
            <div><span>🖼️ CAPA</span><strong>{result.cover}</strong></div>
            <div><span>📝 LEGENDA</span><strong>{result.caption}</strong></div>
            <div><span>#️⃣ 3 HASHTAGS</span><strong>{result.hashtags.join("  ")}</strong></div>
            <div><span>💬 CTA</span><strong>{result.cta}</strong></div>
            <div><span>📌 COMENTÁRIO FIXADO</span><strong>{result.pinnedComment}</strong></div>
          </div>
        </section>

        <section className="card">
          <div className="feedbackTitle"><div><p className="eyebrow">FEEDBACK LOOP</p><h2>4. Depois de publicar</h2></div><button className="secondary" onClick={() => setMetricsOpen(!metricsOpen)}>{metricsOpen ? "Fechar" : "Cadastrar resultado"}</button></div>
          {metricsOpen && <div className="publishedGrid">{Object.entries(published).map(([key,val]) => <label key={key}>{key === "views" ? "Views" : key === "likes" ? "Likes" : key === "comments" ? "Comentários" : key === "shares" ? "Compartilhamentos" : "Seguidores ganhos"}<input value={val} onChange={e => setPublished({...published,[key]:e.target.value})} inputMode="numeric" /></label>)}<button className="primary" onClick={() => alert("Resultado registrado nesta demo. Na V2, isso será salvo no banco e recalibrará o DNA do perfil.")}>Salvar resultado</button></div>}
        </section>
      </>}

      <footer>ViraUpp V1 · Não garante viralização. Trabalha com sinais, contexto e probabilidade.</footer>
    </main>
  );
}
