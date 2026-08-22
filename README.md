# ViraUpp V1

MVP funcional de um copiloto de crescimento para vídeos curtos.

## O que já existe nesta V1
- Análise de Ideia, Roteiro e contexto/transcrição de Vídeo
- Viral Score 0–100
- Recomendação: PUBLICAR / TESTAR / ALTERAR
- Regra explícita de NÃO ALTERAR quando o ponto já está forte
- Análise de gancho, retenção, curiosidade, compartilhamento e seguidores
- Interpretação automática de nicho
- Objetivo: views, seguidores, engajamento ou vendas
- Pacote pronto para postar: capa, legenda, 3 hashtags, CTA e comentário fixado
- Formulário de resultado pós-publicação para demonstrar o feedback loop

## Importante
Esta V1 usa um motor local de regras para demonstrar o produto sem custo de API. A próxima etapa é ligar Supabase + OpenAI para análise real e memória por perfil.

## Rodar
```bash
npm install
npm run dev
```
Abra http://localhost:3000

## Próximas integrações
1. Supabase Auth + banco
2. Persistência do DNA do criador
3. OpenAI para diagnóstico semântico e sugestões
4. Upload e transcrição de vídeo
5. Histórico de análises
6. Aprendizado por métricas reais
7. Radar de padrões e testes A/B
