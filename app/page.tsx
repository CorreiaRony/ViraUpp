"use client";

import { useMemo, useState } from "react";

type Mode = "idea" | "script" | "video";
type Goal = "views" | "followers" | "engagement" | "sales";
type ActionType = "MANTER" | "TESTAR" | "ALTERAR";
type Recommendation = "PUBLICAR" | "TESTAR" | "ALTERAR";

type Metric = {
  label: string;
  score: number;
  action: ActionType;
  why: string;
  suggestion: string;
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

export default function Home() {
  const [mode, setMode] = useState<Mode>("script");
  const [goal, setGoal] = useState<Goal>("views");
  const [niche, setNiche] = useState("");
  const [text, setText] = useState(
    "Por que o cérebro ignorou o segundo o? É uma questão de eficiência. Reparou o segundo de? Loucura, né? Mas certeza que que não funciona três vezes. Reparou no segundo que?"
  );

  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [published, setPublished] = useState({
    views: "",
    likes: "",
    comments: "",
    shares: "",
    followers: "",
  });

  const recommendationClass = useMemo(() => {
    if (!result) return "";
    if (result.recommendation === "PUBLICAR") return "is-publish";
    if (result.recommendation === "TESTAR") return "is-test";
    return "is-change";
  }, [result]);

  async function runAnalysis() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          goal,
          niche,
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível analisar o conteúdo.");
      }

      setResult(data);
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
          <div className="vu-brand">
            Vira<span>Upp</span>✦
          </div>
          <div className="vu-subtitle">Seu copiloto de crescimento para vídeos curtos.</div>
        </div>

        <div className="vu-pill">V1 BETA · IA REAL</div>
      </header>

      <section className="vu-hero">
        <div className="vu-hero-copy">
          <p className="vu-eyebrow">NOVO DIAGNÓSTICO</p>
          <h1>Transforme uma ideia em algo impossível de ignorar.</h1>
          <p>
            A ViraUpp analisa seu conteúdo, aponta o que manter, identifica o que pode
            segurar seu vídeo e te entrega um pacote pronto para postar.
          </p>

          <div className="vu-hero-tags">
            <span>Probabilidade, não promessa</span>
            <span>Decisão antes de postar</span>
            <span>Feito para creators</span>
          </div>
        </div>

        <div className="vu-hero-side">
          <div className="vu-mini-card">
            <div className="vu-mini-dot" />
            <strong>O que você recebe</strong>
            <ul>
              <li>UppScore + decisão</li>
              <li>O que manter / testar / alterar</li>
              <li>Capa, legenda e hashtags</li>
              <li>Leitura de nicho e força do vídeo</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="vu-grid">
        <div className="vu-card">
          <div className="vu-card-head">
            <h2>1. O que vamos analisar?</h2>
            <div className="vu-soft-badge">Creator Mode</div>
          </div>

          <div className="vu-segmented">
            {(Object.keys(modeLabel) as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "active" : ""}
                onClick={() => setMode(item)}
              >
                {modeLabel[item]}
              </button>
            ))}
          </div>

          <label>Objetivo principal</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            <option value="views">Mais views</option>
            <option value="followers">Mais seguidores</option>
            <option value="engagement">Mais engajamento</option>
            <option value="sales">Mais vendas</option>
          </select>

          <label>
            Nicho <small>(opcional — deixe vazio para a IA interpretar)</small>
          </label>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex.: finanças, fitness, curiosidades..."
          />

          <label>
            {mode === "idea"
              ? "Descreva a ideia"
              : mode === "video"
              ? "Transcrição / contexto do vídeo"
              : "Cole o roteiro"}
          </label>
          <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />

          {error && <div className="vu-error">{error}</div>}

          <div className="vu-actions">
            <button className="vu-primary" onClick={runAnalysis} disabled={loading}>
              {loading ? "Analisando com IA..." : "Analisar com IA →"}
            </button>
            <div className="vu-tip">
              Objetivo atual: <strong>{goalLabel[goal]}</strong>
            </div>
          </div>
        </div>

        <div className="vu-card vu-dna">
          <p className="vu-eyebrow">DNA DO CRIADOR</p>
          <h2>Começa geral. Aprende com você.</h2>

          <div className="vu-dna-row">
            <span>Vídeos aprendidos</span>
            <strong>0</strong>
          </div>
          <div className="vu-dna-row">
            <span>Confiança do perfil</span>
            <strong>Inicial</strong>
          </div>
          <div className="vu-dna-row">
            <span>Nicho</span>
            <strong>{niche || "Será interpretado"}</strong>
          </div>
          <div className="vu-dna-row">
            <span>Status</span>
            <strong>IA ligada</strong>
          </div>

          <p className="vu-muted">
            Agora a análise já é feita por IA real. O próximo passo do DNA será aprender
            com os resultados reais dos vídeos publicados.
          </p>
        </div>
      </section>

      {result && (
        <>
          <section className="vu-scoreboard">
            <div className="vu-score-orb">
              <div className="vu-score-ring" style={{ ["--score" as any]: result.score }} />
              <div className="vu-score-center">
                <span>{result.score}</span>
                <small>UppScore</small>
              </div>
            </div>

            <div className="vu-score-copy">
              <p className="vu-eyebrow">DECISÃO DA VIRAUPP</p>
              <div className={`vu-rec ${recommendationClass}`}>{result.recommendation}</div>
              <h2>{result.summary}</h2>
              <p className="vu-muted">
                Força principal: <strong>{result.principalStrength}</strong>
              </p>
              <p className="vu-muted">
                Risco principal: <strong>{result.principalRisk}</strong>
              </p>
            </div>

            <div className="vu-score-meta">
              <div className="vu-kpi">
                <span>Confiança</span>
                <strong>{result.confidence}</strong>
              </div>
              <div className="vu-kpi">
                <span>Nicho provável</span>
                <strong>{result.niche}</strong>
              </div>
              <div className="vu-kpi">
                <span>Confiança do nicho</span>
                <strong>{result.nicheConfidence}%</strong>
              </div>
              <div className="vu-kpi">
                <span>Probabilidade</span>
                <strong>{result.performanceProbability}</strong>
              </div>
            </div>
          </section>

          <section className="vu-insights-grid">
            <div className="vu-card vu-insight-card">
              <p className="vu-eyebrow">POTENCIAL</p>
              <h3>Como a ViraUpp está lendo esse conteúdo</h3>
              <p>
                O vídeo tem sinais que podem favorecer performance, mas a análise continua
                sendo probabilística. A decisão considera objetivo, nicho, retenção e apelo
                de curiosidade.
              </p>
            </div>

            <div className="vu-card vu-insight-card">
              <p className="vu-eyebrow">LEITURA RÁPIDA</p>
              <h3>O que mais pesa aqui</h3>
              <ul className="vu-bullet-list">
                <li>Gancho inicial</li>
                <li>Curiosidade / payoff</li>
                <li>Compartilhamento natural</li>
                <li>Chance de virar seguidor</li>
              </ul>
            </div>
          </section>

          <section className="vu-card">
            <div className="vu-card-head">
              <h2>2. O que manter, testar ou alterar</h2>
              <div className="vu-soft-badge">Direto ao ponto</div>
            </div>

            <div className="vu-metric-grid">
              {result.metrics.map((metric) => (
                <div className="vu-metric-card" key={metric.label}>
                  <div className="vu-metric-top">
                    <strong>{metric.label}</strong>
                    <span>{metric.score}/100</span>
                  </div>

                  <div className={`vu-action-badge action-${metric.action.toLowerCase()}`}>
                    {metric.action}
                  </div>

                  <p>{metric.why}</p>

                  <div className="vu-suggestion-box">
                    <b>Sugestão:</b> {metric.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="vu-card">
            <div className="vu-card-head">
              <h2>3. Pacote pronto para postar</h2>
              <div className="vu-soft-badge">Post Pack</div>
            </div>

            <div className="vu-publish-grid">
              <div className="vu-pack-card">
                <span>🖼️ CAPA</span>
                <strong>{result.cover}</strong>
              </div>

              <div className="vu-pack-card">
                <span>📝 LEGENDA</span>
                <strong>{result.caption}</strong>
              </div>

              <div className="vu-pack-card">
                <span>#️⃣ 3 HASHTAGS</span>
                <strong>{result.hashtags.join(" ")}</strong>
              </div>

              <div className="vu-pack-card">
                <span>💬 CTA</span>
                <strong>{result.cta}</strong>
              </div>

              <div className="vu-pack-card vu-pack-wide">
                <span>📌 COMENTÁRIO FIXADO</span>
                <strong>{result.pinnedComment}</strong>
              </div>
            </div>
          </section>

          <section className="vu-card">
            <div className="vu-card-head">
              <div>
                <p className="vu-eyebrow">FEEDBACK LOOP</p>
                <h2>4. Depois de publicar</h2>
              </div>

              <button className="vu-secondary" onClick={() => setMetricsOpen(!metricsOpen)}>
                {metricsOpen ? "Fechar" : "Cadastrar resultado"}
              </button>
            </div>

            {metricsOpen && (
              <div className="vu-published-grid">
                {Object.entries(published).map(([key, value]) => (
                  <label key={key}>
                    {key === "views"
                      ? "Views"
                      : key === "likes"
                      ? "Likes"
                      : key === "comments"
                      ? "Comentários"
                      : key === "shares"
                      ? "Compartilhamentos"
                      : "Seguidores ganhos"}
                    <input
                      value={value}
                      onChange={(e) =>
                        setPublished({ ...published, [key]: e.target.value })
                      }
                      inputMode="numeric"
                    />
                  </label>
                ))}

                <button
                  className="vu-primary"
                  onClick={() =>
                    alert(
                      "Resultado registrado nesta fase. Na próxima versão, isso irá para o banco e recalibrará o DNA do perfil."
                    )
                  }
                >
                  Salvar resultado
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <footer className="vu-footer">
        ViraUpp V1 · Inteligência para decidir melhor antes de postar. Probabilidade,
        não promessa.
      </footer>
    </main>
  );
}
