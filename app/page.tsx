"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Mode = "idea" | "script" | "video";
type Goal = "views" | "followers" | "engagement" | "sales";
type ActionType = "MANTER" | "TESTAR" | "ALTERAR";
type Recommendation = "PUBLICAR" | "TESTAR" | "ALTERAR";
type Risk = "baixo" | "médio" | "alto";

type Metric = {
  label: string;
  score: number;
  action: ActionType;
  why: string;
  suggestion: string;
};

type TimelineItem = {
  start: string;
  end: string;
  score: number;
  risk: Risk;
  diagnosis: string;
  suggestion: string;
};

type EditingSuggestion = {
  timestamp: string;
  action: ActionType;
  suggestion: string;
  reason: string;
};

type Analysis = {
  score: number;
  confidence: "Baixa" | "Moderada" | "Alta";
  recommendation: Recommendation;
  niche: string;
  nicheConfidence: number;
  summary: string;
  principalStrength: string;
  principalRisk: string;
  performanceProbability: "Baixa" | "Moderada" | "Alta";
  metrics: Metric[];
  cover: string;
  caption: string;
  hashtags: string[];
  cta: string;
  pinnedComment: string;
  visualHook: {
    score: number;
    action: ActionType;
    diagnosis: string;
    suggestion: string;
  };
  firstThreeSeconds: {
    diagnosis: string;
    strengths: string[];
    risks: string[];
  };
  retentionTimeline: TimelineItem[];
  editingSuggestions: EditingSuggestion[];
};

const modeLabel: Record<Mode, string> = {
  idea: "💡 Ideia",
  script: "📝 Roteiro",
  video: "🎬 Vídeo",
};

const goalLabel: Record<Goal, string> = {
  views: "Mais views",
  followers: "Mais seguidores",
  engagement: "Mais engajamento",
  sales: "Mais vendas",
};

type CapturedFrame = { timestamp: number; imageUrl: string };

async function captureFrames(file: File): Promise<{ frames: CapturedFrame[]; duration: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Não consegui ler o vídeo."));
  });

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (!duration || duration > 600) {
    URL.revokeObjectURL(url);
    throw new Error(duration > 600 ? "Use um vídeo de até 10 minutos." : "Não foi possível identificar a duração do vídeo.");
  }
  const lastFrame = Math.max(0, duration - 0.05);
  const times = [0, 0.5, 1, 1.5, 2, 3].map((t) => Math.min(t, lastFrame));

  const uniqueTimes = Array.from(new Set(times.map((t) => Number(t.toFixed(2)))));
  const frames: CapturedFrame[] = [];

  for (const time of uniqueTimes) {
    video.currentTime = time;
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      video.addEventListener("seeked", done, { once: true });
    });

    const scale = Math.min(1, 640 / Math.max(video.videoWidth || 720, video.videoHeight || 1280));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((video.videoWidth || 720) * scale));
    canvas.height = Math.max(1, Math.round((video.videoHeight || 1280) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({ timestamp: time, imageUrl: canvas.toDataURL("image/jpeg", 0.62) });
  }

  URL.revokeObjectURL(url);
  return { frames, duration };
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("script");
  const [goal, setGoal] = useState<Goal>("views");
  const [niche, setNiche] = useState("");
  const [text, setText] = useState(
    "Por que o cérebro ignorou o segundo o? É uma questão de eficiência. Reparou o segundo de? Loucura, né? Mas certeza que que não funciona três vezes. Reparou no segundo que?"
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [published, setPublished] = useState({ views: "", likes: "", comments: "", shares: "", followers: "" });

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const recommendationClass = useMemo(() => {
    if (!result) return "";
    if (result.recommendation === "PUBLICAR") return "is-publish";
    if (result.recommendation === "TESTAR") return "is-test";
    return "is-change";
  }, [result]);

  function handleVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato não aceito. Envie um vídeo MP4, MOV ou WEBM.");
      e.target.value = "";
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError("O arquivo é grande demais. Envie um vídeo de até 200 MB.");
      e.target.value = "";
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setVideoDuration(null);
    setMode("video");
    setError("");
  }

  async function runAnalysis() {
    if (mode !== "video" && !text.trim()) return;
    if (mode === "video" && !videoFile && !text.trim()) {
      setError("Envie um vídeo ou adicione contexto/transcrição.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let frames: CapturedFrame[] = [];
      let capturedDuration = 0;
      if (mode === "video" && videoFile) {
        const captured = await captureFrames(videoFile);
        frames = captured.frames;
        capturedDuration = captured.duration;
        setVideoDuration(captured.duration);
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          goal,
          niche,
          text,
          frames,
          videoDuration: capturedDuration,
          videoName: videoFile?.name || "",
          videoType: videoFile?.type || "",
          videoSize: videoFile?.size || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Não foi possível analisar o conteúdo.");
      setResult(data);
      window.setTimeout(() => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar conteúdo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="vu-shell">
      <div className="vu-bg vu-bg-1" />
      <div className="vu-bg vu-bg-2" />
      <div className="vu-bg vu-bg-3" />

      <header className="vu-topbar">
        <div>
          <div className="vu-brand">Vira<span>Upp</span>✦</div>
          <div className="vu-subtitle">Seu copiloto de crescimento para vídeos curtos.</div>
        </div>
        <div className="vu-pill">V2 BETA · VÍDEO + IA</div>
      </header>

      <section className="vu-hero">
        <div className="vu-hero-copy">
          <p className="vu-eyebrow">ANALISE ANTES DE POSTAR</p>
          <h1>Descubra onde seu vídeo prende — e onde ele pode perder atenção.</h1>
          <p>A ViraUpp lê sua ideia, roteiro ou os primeiros segundos do vídeo, recomenda o que manter e prioriza mudanças com ganho provável.</p>
          <div className="vu-hero-tags"><span>Primeiros 3 segundos</span><span>Timeline de retenção</span><span>Post Pack</span><span>Probabilidade, não promessa</span></div>
        </div>
        <div className="vu-hero-side"><div className="vu-mini-card"><div className="vu-mini-dot" /><strong>Agora na V2</strong><ul><li>Upload real de vídeo</li><li>Leitura visual do gancho</li><li>Retenção estimada por trecho</li><li>Dicas práticas de edição</li></ul></div></div>
      </section>

      <section className="vu-grid">
        <div className="vu-card">
          <div className="vu-card-head"><h2>1. O que vamos analisar?</h2><div className="vu-soft-badge">Creator Mode</div></div>
          <div className="vu-segmented">
            {(Object.keys(modeLabel) as Mode[]).map((item) => <button key={item} type="button" className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{modeLabel[item]}</button>)}
          </div>

          <label>Objetivo principal</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}><option value="views">Mais views</option><option value="followers">Mais seguidores</option><option value="engagement">Mais engajamento</option><option value="sales">Mais vendas</option></select>

          <label>Nicho <small>(opcional — deixe vazio para a IA interpretar)</small></label>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex.: finanças, fitness, curiosidades..." />

          {mode === "video" && (
            <div className="vu-upload-wrap">
              <label className="vu-upload-box">
                <input className="vu-file-input" type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={handleVideo} />
                <div className="vu-upload-icon">↥</div>
                <strong>{videoFile ? "Trocar vídeo" : "Enviar vídeo"}</strong>
                <span>{videoFile ? `${videoFile.name} · ${(videoFile.size / 1024 / 1024).toFixed(1)} MB${videoDuration ? ` · ${Math.floor(videoDuration / 60)}:${String(Math.round(videoDuration % 60)).padStart(2, "0")}` : ""}` : "MP4, MOV ou WEBM · até 200 MB"}</span>
              </label>
              {videoPreview && <div className="vu-video-preview"><video src={videoPreview} controls playsInline preload="metadata" onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration)} /><div><b>Leitura visual:</b> seis quadros entre 0s e 3s são comprimidos no seu aparelho. O vídeo completo não é enviado à IA.</div></div>}
            </div>
          )}

          <label>{mode === "idea" ? "Descreva a ideia" : mode === "video" ? "Contexto ou transcrição (opcional, mas melhora a análise)" : "Cole o roteiro"}</label>
          <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "video" ? "Ex.: Eu apareço olhando para o computador, depois olho para a câmera e entra o texto..." : undefined} />
          {error && <div className="vu-error">{error}</div>}

          <div className="vu-actions"><button className="vu-primary" onClick={runAnalysis} disabled={loading}>{loading ? (mode === "video" ? "Lendo frames + analisando..." : "Analisando com IA...") : mode === "video" ? "Analisar vídeo com IA →" : "Analisar com IA →"}</button><div className="vu-tip">Objetivo atual: <strong>{goalLabel[goal]}</strong></div></div>
        </div>

        <div className="vu-card vu-dna">
          <p className="vu-eyebrow">DNA DO CRIADOR</p><h2>Começa geral. Aprende com você.</h2>
          <div className="vu-dna-row"><span>Vídeos aprendidos</span><strong>0</strong></div><div className="vu-dna-row"><span>Confiança do perfil</span><strong>Inicial</strong></div><div className="vu-dna-row"><span>Nicho</span><strong>{niche || "Será interpretado"}</strong></div><div className="vu-dna-row"><span>Status</span><strong>IA + visão</strong></div>
          <p className="vu-muted">Nesta fase, a ViraUpp cruza contexto textual com frames do vídeo. O próximo passo será armazenar resultados reais e personalizar as recomendações por perfil.</p>
        </div>
      </section>

      {result && <div id="resultado">
        <section className="vu-scoreboard">
          <div className="vu-score-orb"><div className="vu-score-ring" style={{ ["--score" as any]: result.score }} /><div className="vu-score-center"><span>{result.score}</span><small>UppScore</small></div></div>
          <div className="vu-score-copy"><p className="vu-eyebrow">DECISÃO DA VIRAUPP</p><div className={`vu-rec ${recommendationClass}`}>{result.recommendation}</div><h2>{result.summary}</h2><p className="vu-muted">Força principal: <strong>{result.principalStrength}</strong></p><p className="vu-muted">Risco principal: <strong>{result.principalRisk}</strong></p></div>
          <div className="vu-score-meta"><div className="vu-kpi"><span>Confiança</span><strong>{result.confidence}</strong></div><div className="vu-kpi"><span>Nicho provável</span><strong>{result.niche}</strong></div><div className="vu-kpi"><span>Confiança do nicho</span><strong>{result.nicheConfidence}%</strong></div><div className="vu-kpi"><span>Probabilidade</span><strong>{result.performanceProbability}</strong></div></div>
        </section>

        <section className="vu-card vu-first3"><div className="vu-card-head"><div><p className="vu-eyebrow">GANCHO VISUAL</p><h2>2. Primeiros 3 segundos</h2></div><div className="vu-three-score">{result.visualHook.score}<small>/100</small></div></div><div className={`vu-action-badge action-${result.visualHook.action.toLowerCase()}`}>{result.visualHook.action}</div><p className="vu-first-diagnosis">{result.visualHook.diagnosis}</p><div className="vu-first3-grid"><div><span>✓ FORÇAS</span>{result.firstThreeSeconds.strengths.map((item) => <p key={item}>{item}</p>)}</div><div><span>⚠ RISCOS</span>{result.firstThreeSeconds.risks.map((item) => <p key={item}>{item}</p>)}</div><div><span>→ AÇÃO PRÁTICA</span><p>{result.visualHook.suggestion}</p></div></div><div className="vu-priority"><b>Leitura integrada:</b> {result.firstThreeSeconds.diagnosis}</div></section>

        {result.retentionTimeline.length > 0 && <section className="vu-card"><div className="vu-card-head"><div><p className="vu-eyebrow">RETENÇÃO ESTIMADA</p><h2>3. Timeline — risco estimado de queda</h2></div><div className="vu-soft-badge">Potencial por trecho</div></div><div className="vu-timeline">{result.retentionTimeline.map((item, index) => <div className="vu-time-row" key={`${item.start}-${index}`}><div className="vu-time-period">{item.start}–{item.end}</div><div className="vu-time-bar"><div className={`vu-time-fill risk-${item.risk.replace("é", "e")}`} style={{ width: `${item.score}%` }} /></div><div className="vu-time-score">{item.score}</div><div className="vu-time-copy"><span className={`vu-attention risk-text-${item.risk.replace("é", "e")}`}>RISCO {item.risk}</span><strong>{item.diagnosis}</strong><p>{item.suggestion}</p></div></div>)}</div><p className="vu-disclaimer">Estimativa de potencial de retenção baseada no material enviado. Não representa retenção real do TikTok, Reels ou Shorts.</p></section>}

        <section className="vu-card"><div className="vu-card-head"><h2>4. O que manter, testar ou alterar</h2><div className="vu-soft-badge">Direto ao ponto</div></div><div className="vu-metric-grid">{result.metrics.map((metric) => <div className="vu-metric-card" key={metric.label}><div className="vu-metric-top"><strong>{metric.label}</strong><span>{metric.score}/100</span></div><div className={`vu-action-badge action-${metric.action.toLowerCase()}`}>{metric.action}</div><p>{metric.why}</p><div className="vu-suggestion-box"><b>Sugestão:</b> {metric.suggestion}</div></div>)}</div></section>

        {result.editingSuggestions.length > 0 && <section className="vu-card"><div className="vu-card-head"><div><p className="vu-eyebrow">EDIÇÃO</p><h2>5. Como eu editaria esse vídeo</h2></div></div><div className="vu-edit-grid">{result.editingSuggestions.map((tip, i) => <div className="vu-edit-tip" key={`${tip.timestamp}-${i}`}><span>{tip.timestamp}</span><div><b className={`vu-action-text action-text-${tip.action.toLowerCase()}`}>{tip.action}</b><p>{tip.suggestion}</p><small>{tip.reason}</small></div></div>)}</div></section>}

        <section className="vu-card"><div className="vu-card-head"><h2>6. Pacote pronto para postar</h2><div className="vu-soft-badge">Post Pack</div></div><div className="vu-publish-grid"><div className="vu-pack-card"><span>🖼️ CAPA</span><strong>{result.cover}</strong></div><div className="vu-pack-card"><span>📝 LEGENDA</span><strong>{result.caption}</strong></div><div className="vu-pack-card"><span>#️⃣ 3 HASHTAGS</span><strong>{result.hashtags.join(" ")}</strong></div><div className="vu-pack-card"><span>💬 CTA</span><strong>{result.cta}</strong></div><div className="vu-pack-card vu-pack-wide"><span>📌 COMENTÁRIO FIXADO</span><strong>{result.pinnedComment}</strong></div></div></section>

        <section className="vu-card"><div className="vu-card-head"><div><p className="vu-eyebrow">FEEDBACK LOOP</p><h2>7. Depois de publicar</h2></div><button className="vu-secondary" onClick={() => setMetricsOpen(!metricsOpen)}>{metricsOpen ? "Fechar" : "Cadastrar resultado"}</button></div>{metricsOpen && <div className="vu-published-grid">{Object.entries(published).map(([key, value]) => <label key={key}>{key === "views" ? "Views" : key === "likes" ? "Likes" : key === "comments" ? "Comentários" : key === "shares" ? "Compartilhamentos" : "Seguidores ganhos"}<input value={value} onChange={(e) => setPublished({ ...published, [key]: e.target.value })} inputMode="numeric" /></label>)}<button className="vu-primary" onClick={() => alert("Resultado registrado nesta fase. Na próxima versão, isso será salvo no DNA do perfil.")}>Salvar resultado</button></div>}</section>
      </div>}

      <footer className="vu-footer">ViraUpp V2 · Inteligência para decidir melhor antes de postar. Probabilidade, não promessa.</footer>
    </main>
  );
}
