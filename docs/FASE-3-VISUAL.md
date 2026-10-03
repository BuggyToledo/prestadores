# Fase 3 — Camada visual

Branch: `feat/fase-3-visual` (base: `cursor/fase-1b-dados-ea94`).  
PR separado. **Sem merge** até aprovação tela a tela.

## Ordem de entrega

1. **Fundação** — tokens, Plus Jakarta Sans, componentes base.
2. **3C** — detalhe do prestador `/prestador/[slug]`.
3. **3A** — home (brief produto).
4. **3B** — categoria/resultados (brief produto; pasta Stitch 02 ainda ausente).

## Preview (Vercel)

| Env | Valor |
|---|---|
| `DATABASE_URL` | Banco `*_teste` **já migrado** (baseline + aditivas) |
| `USE_REAL_PRISMA` | `true` |
| `JWT_SECRET` | ≥32 chars |

O filtro `kind = 'prestador'` / rota `/utilidade-publica` só tem efeito completo **depois** de `clean-data --apply` no `*_teste` (preenchimento de `kind`). Sem apply, a maioria permanece `prestador` (default da migration).

## Decisões

| Tema | Decisão |
|---|---|
| Tokens | `DESIGN.md` prevalece sobre a paleta antiga; amarelo `#f59e0b` com texto **escuro** (`brand-navy`) — WCAG AA |
| Fonte | Plus Jakarta Sans via `next/font` (`--font-plus-jakarta`) |
| Admin na UI pública | Só link discreto no **Footer** (“Administração”) |
| BottomNav | Início, Categorias, Buscar, Utilidade — **sem** Favoritos/Orçamento (Fase 2) |
| Favoritos | Não implementado nesta entrega |
| Avaliações / estrelas / anos / mapa embutido / conformidade inventada | **Removidos** |
| TrustBadge | Só `oficial` / `documentado`; `cadastrado` não mostra selo |
| “verificados” | Copy → “cadastrados”, exceto `trustTier === 'oficial'` |
| Atende 24h / Emite NF-e | Só se `true` |
| BannerSlot | Sem banner ativo → `null` (sem placeholder); `linkUrl` só http/https |
| Maps | Botão “Ver no Google Maps” com URL de busca (sem API key); **sem** iframe/mapa |
| Container | `max-w-shell` = 1200px; BottomNav só `< md` |
| Ícones de categoria | Lucide via `CategoryIcon` (não há `public/icons` no repo) |
| Avatar sem logo | Iniciais + tom derivado da categoria + ícone da categoria |

## Gaps / referência Stitch

| Tela | Status no `design-stitch/` |
|---|---|
| 01-home-mobile | Brief textual aprovado → home implementada em 3A |
| 02-resultados | Brief textual → `/categoria/[slug]` implementada (3B) |
| 03-detalhe | Presente (`guia_s_ndico_n_detalhes_do_prestador/screen.png`) |
| 04 orçamento | Fora do escopo desta fase |
| 05 admin | Fora do escopo desta fase |

Referência visual oficial da 3C: `design-stitch/guia_s_ndico_n_detalhes_do_prestador/screen.png`.

### Diferenças intencionais vs `screen.png` (3C)

| No print Stitch | Nesta entrega | Motivo |
|---|---|---|
| Galeria “1/5 fotos” + foto Unsplash | Capa única se `coverUrl`; senão gradiente | Sem imagens Stitch; sem campo de galeria |
| Badge “Pronta Entrega Predial” / “Online” / “Faturamento PJ 28d” | Removido | Sem campos no banco |
| “Oficial Guia Síndico Né!” amarelo | `TrustBadge` só se `trustTier` oficial/documentado | Regra de dados |
| Estrelas 4.9 / 48 síndicos / 12 anos / 100% docs | Removido | Sem avaliações/anos |
| Tabs Sobre / Conformidade / Avaliações | Só seções com dados (Sobre, Serviços, Localização) | Sem reviews/conformidade inventada |
| Mapa embutido + bairros de entrega | Botão “Ver no Google Maps” se houver endereço | Sem mapa; sem chave API |
| Card navy “Conformidade Predial” + kit documental | Removido | Sem dados de auditoria |
| Sticky WA + telefone | Mantido (mobile); desktop no header do perfil | Alinha ao print com dados reais |
| Ícone favoritar / compartilhar / avatar user no topo | Removido (Favoritos = Fase 2) | Escopo |
| Material Symbols | Lucide React | Stack do projeto |

### 3B — `/categoria/[slug]`

- Header: ícone + nome + “N prestadores” + descrição
- Filtros sticky (URL): busca, Bairro/Região, ordenação Nome A–Z / Mais recentes
- Chips removíveis dos filtros ativos (`aria-label` “Remover filtro …”)
- Seletor de região: só regiões com prestadores na categoria (`src/lib/regions.ts`)
- Sem filtros de nota, preço, 24h ou NF-e
- Cards `variant="results"`: iniciais, subcategoria, bairro, Destaque opcional, WA + ícone telefone
- Publicidade nativa: só se banner MIDDLE `isActive` + `imageUrl` (sem placeholder; schema sem período)
- “Carregar mais” (`?mais=`) server-side, sort estável com desempate `id`
- SEO: `canonical` limpo + `noindex` quando há query de filtro/ordenação/página
- Empty state + `loading.tsx` skeleton

## Componentes base (fundação)

- `Header`, `Footer` / `SiteFooter`, `BottomNav`
- `ProviderAvatar`, `TrustBadge`, `WhatsAppButton`, `PhoneButton`
- `BannerSlot`, `Skeletons`
- Helpers: `src/lib/design.ts`
