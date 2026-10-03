# Performance — cache, conexões MySQL e contagem de queries

## Cache (`unstable_cache` + tags)

Arquivo: `src/lib/catalogCache.ts`.

| Cache | Tags | Uso |
|---|---|---|
| Categorias home (12) | `categories`, `providers` | `/` |
| Contagens catálogo | `categories`, `providers` | `/` |
| Banners ativos | `banners` | `/` |
| Recomendados (featured) | `providers` | `/` |
| Locais por categoria | `providers` | `/categoria/[slug]` |
| Banner MIDDLE | `banners` | `/categoria/[slug]` |

**Invalidação:** `revalidateCatalog(...)` nas mutações admin de prestador, categoria, banner e import.

**React `cache()`:** `getCategoryBySlug` é compartilhado entre `generateMetadata` e a page de categoria na **mesma request** (sem query duplicada).

## `htmlLimitedBots` e TTFB

Com `htmlLimitedBots: /.*/` (ver `next.config.js`), o HTML espera `generateMetadata` terminar → metadados no `<head>`.

| Modo | TTFB (local prod, `/categoria/eletricistas`) | Observação |
|---|---|---|
| Streaming metadata (antes) | ~mais baixo (HTML inicia cedo) | meta description fora do `<head>` → SEO/LH falha |
| Blocking (`/.*/`, depois) | ~mais alto (+1 round-trip metadata se não houver `cache()`) | com `cache()` a page reusa a mesma query da categoria |

Medição local (curl `time_starttransfer`) no ambiente do agente — ver PR.

## `DATABASE_URL` e DreamHost

DreamHost MySQL tem limite baixo de conexões simultâneas. Na Vercel (serverless), cada invocação pode abrir pool.

**Recomendado na `DATABASE_URL`:**

```
mysql://USER:PASS@HOST:3306/DB?connection_limit=1&pool_timeout=20&connect_timeout=10
```

- `connection_limit=1` — uma conexão por instância serverless (evita “Too many connections”).
- Não suba `connection_limit` sem medir; DreamHost shared costuma estourar com pools grandes.

**Região Vercel:** escolha a região de Functions **mais próxima do host MySQL** (ex.: se o MySQL DreamHost estiver nos EUA Leste, use `iad1` / Washington, D.C.). Configure em Project → Settings → Functions → Region. Latência RTT domina TTFB das páginas `force-dynamic`.

Ver também `docs/VARIAVEIS-AMBIENTE.md`.

## Consultas ao banco por página (estado atual)

Contagem **por request fria** (sem hit de `unstable_cache`). Com cache quente, as linhas marcadas ↓ caem para 0 idas ao MySQL.

### Home `/`

| # | Consulta | Cache? |
|---|---|---|
| 1 | `category.findMany` (12 + counts) | sim |
| 2 | `banner.findMany` ativos | sim |
| 3–4 | `provider.count` + `category.count` | sim (1 fn) |
| 5 | `provider.findMany` locais (gate região, até 2000) | não* |
| 6 | `provider.findMany` recomendados **ou** busca filtrada | recomendados: sim; busca: não |

\*Pode ser cacheada numa iteração futura (`home-locations`).

**Total frio:** ~6 (home sem filtro) / ~6–7 (com filtro de busca).  
**Total quente (recomendados):** ~1–2 (só locais + eventual busca).

### Categoria `/categoria/[slug]`

| # | Consulta | Cache? |
|---|---|---|
| 1 | `category.findUnique` (React `cache` — 1× por request, metadata+page) | request-dedupe |
| 2 | `provider.findMany` locais da categoria | sim |
| 3 | `banner.findMany` MIDDLE | sim |
| 4 | `provider.count` (filtros) | não |
| 5 | `provider.findMany` resultados (`take` ≤ 200) | não |

**Total frio:** 5. **Quente (só filtros mudam):** 3 (categoria + count + list).

### Prestador `/prestador/[slug]`

| # | Consulta |
|---|---|
| 1 | `provider.findFirst` (slug/id) |
| 2 | `provider.update` viewsCount |

**Total:** 2 (sempre dinâmico).
