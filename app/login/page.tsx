"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || "Não foi possível entrar."); setLoading(false); return; }
    router.replace("/"); router.refresh();
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#09090b",color:"#fafafa",padding:24,fontFamily:"Arial,sans-serif"}}>
    <form onSubmit={submit} style={{width:"100%",maxWidth:420,background:"#121218",border:"1px solid #292933",borderRadius:24,padding:32,boxShadow:"0 24px 80px rgba(139,92,246,.12)"}}>
      <div style={{fontWeight:900,fontSize:28,marginBottom:6}}>Vira<span style={{color:"#a855f7"}}>Upp</span> ✦</div>
      <p style={{color:"#a1a1aa",marginTop:0,marginBottom:30}}>Acesso privado ao laboratório.</p>
      <label style={{display:"block",marginBottom:8}}>Usuário</label>
      <input autoFocus value={username} onChange={e=>setUsername(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:14,borderRadius:12,border:"1px solid #30303b",background:"#09090b",color:"white",marginBottom:18}} />
      <label style={{display:"block",marginBottom:8}}>Senha</label>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:14,borderRadius:12,border:"1px solid #30303b",background:"#09090b",color:"white",marginBottom:12}} />
      {error && <p style={{color:"#fb7185",fontSize:14}}>{error}</p>}
      <button disabled={loading} style={{width:"100%",padding:14,border:0,borderRadius:12,color:"white",fontWeight:800,cursor:"pointer",background:"linear-gradient(90deg,#8b5cf6,#ec4899)"}}>{loading ? "Entrando..." : "Entrar →"}</button>
    </form>
  </main>;
}
