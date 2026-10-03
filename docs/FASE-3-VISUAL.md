# Fase 3 — Camada visual

Branch: `feat/fase-3-visual` (base: `cursor/fase-1b-dados-ea94`).  
PR separado. **Sem merge** até aprovação tela a tela.

## Ordem de entrega

1. **Fundação** — tokens, Plus Jakarta Sans, componentes base.
2. **3C** — detalhe do prestador `/prestador/[slug]`.
3. **3B** — categoria/resultados (aprovada; teste no preview).
4. **3A** — home (brief produto; pasta Stitch `01-home` ausente no zip — usa `DESIGN.md` + brief).

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
- Filtros: mobile = busca + botão “Filtros” (bottom sheet); desktop = linha completa
- Chips removíveis (`aria-label` “Remover filtro …”)
- Região: nomes completos + cruzamento `city`/`state` em `src/lib/regions.ts` (sem `contains` parcial)
- Seletor de região: só regiões com prestadores na categoria
- Sem filtros de nota, preço, 24h ou NF-e
- Cards `variant="results"`: iniciais, subcategoria, bairro, Destaque opcional, WA + ícone telefone
- Publicidade nativa: só se banner MIDDLE `isActive` + `imageUrl` (sem placeholder; schema sem período)
- “Carregar mais” (`?mais=`): server-side, sort estável (`id`), **teto `MAX_TAKE = 200`**
- Impacto ~1000 registros: sem teto o HTML/DOM cresceria até 1000 cards (TTI/memória ruins); com teto o usuário vê no máx. 200 e é orientado a refinar busca/região (cursor pagination fica no backlog)
- SEO: `canonical` limpo + `noindex` quando há query; meta description sempre presente
- Empty state + `loading.tsx` skeleton

### 3A — Home `/`

- Hero com marca + busca (sem bloco admin na home; admin só no Footer)
- BannerSlot HERO_TOP / MIDDLE — some se vazio
- Categorias (tiles) → link para filtro ou `/categoria/[slug]`
- **Recomendados** com `kind = 'prestador'` (utilidade só na seção própria)
- Filtro de região só se cobertura matchable ≥ 25% (`REGION_FILTER_MIN_COVERAGE`)
- Mobile 390 + desktop 1280; sem dados inventados (sem estrelas/anos/ratings)

### Região / clean-data

- Após `clean-data`, o script imprime % com bairro, cidade, ambos e matchable RJ
- Cidade vazia + bairro na lista + DDD 21/22/24 → sugestão de `city`/`state` no review
- Matching em runtime: igualdade + city/state; inferência DDD quando city vazia
- Seletor de região oculto se cobertura &lt; 25% ou nenhuma região com prestadores

### Cache / performance

Ver `docs/PERFORMANCE-CACHE.md` (`unstable_cache`, `revalidateTag`, `connection_limit`, contagem de queries).

### Backlog (pós-3B)

- Banner: campos `startDate` / `endDate` (janela de veiculação) + filtro na query pública
- Banner: imagem mobile separada (`imageUrlMobile`) para aspect ratio 2.5:1
- Banner: validação de dimensões no upload (admin)
- Paginação por cursor (`cursor`/`skip` estável) em categorias muito grandes
- Cache de `home-locations` (gate de região na home)

## Componentes base (fundação)

- `Header`, `Footer` / `SiteFooter`, `BottomNav`
- `ProviderAvatar`, `TrustBadge`, `WhatsAppButton`, `PhoneButton`
- `BannerSlot`, `Skeletons`
- Helpers: `src/lib/design.ts`
