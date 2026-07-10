# Auto-inject — plan działania (soft)

Cel: encyklopedia wiedzy marketingowej, która **sama wstrzykuje się do kontekstu**
w zależności od tego, co pojawia się w promcie użytkownika i w wywołaniach narzędzi
(pre/post tool use) — model context7, ale dla wiedzy biznesowej Google/Meta Ads.

## Stan zastany (2026-07)

| Element | Stan |
|---|---|
| `search_knowledge` / `read_knowledge` / `list_knowledge` | Działa (ranking: title +8, path +5, meta +4, body +1). Ładuje wszystkie docsy per wywołanie. |
| Frontmatter | `keywords`, `applies_to`, `task_type`, `risk_level`, `summary`. Parser to **płaski subset YAML** (`key: value`, tablice `[a, b]`, scalary). Bez zagnieżdżeń i multiline. |
| `scripts/marketing-context-hook.js` | Istnieje, ale **niepodpięty** i robi tylko przypomnienie po `confirm_mutation`. Brak auto-injectu, brak dedupe, brak obsługi `UserPromptSubmit`/`PreToolUse`. |
| `plugin.json` / `.mcp.json` | Tylko `mcpServers`. **Brak bloku `hooks`.** |

**Wniosek:** trzeba (1) rozbudować hook o retrieval na 3 etapach, (2) podpiąć go w
manifeście, (3) rozszerzyć frontmatter o metadane wyzwalaczy, (4) ustandaryzować
format notatek pod te wyzwalacze.

## Model retrievalu (decyzja)

Hook **czyta pliki sam** (skanuje `MARKETING_CONTEXT_DIR`, bez round-tripu do MCP)
i dopasowuje dokumenty przez frontmatter + keywords do **bieżącej sytuacji oraz
stanu sesji**. Wstrzyknięty artykuł jest „hubem": zawiera pole `related` i wskazówki,
by model **doczytał kolejne artykuły przez narzędzia MCP** (`read_knowledge`) na
żądanie. Czyli: hook wstrzykuje punkt wejścia + graf powiązań, model rozwija graf
sam, gdy tego potrzebuje.

### Stan sesji
Hook trzyma stan per `session_id` (plik w tmp): numer rundy + zbiór już
wstrzykniętych dokumentów.
- **Runda 1 (start sesji):** pełny spis treści biblioteki jako **obowiązkowa mapa
  wiedzy**: wszystkie ścieżki artykułów + krótkie wskazówki "kiedy czytać / przed
  czym chroni". Nagłówek TOC mówi wprost, że przed planowaniem, review lub mutacją
  trzeba wybrać właściwe ścieżki i wykonać `read_knowledge("<path>")`. Jeśli
  `SessionStart` nie odpali, pierwszy `UserPromptSubmit` robi ten sam fallback.
- **Kolejne rundy:** wąskie dopasowanie do promptu/narzędzia; **dedupe** — nie
  wstrzykuj ponownie tego, co już jest w kontekście tej sesji.

## Architektura: 3 etapy wstrzykiwania

Hook obsługuje trzy zdarzenia. Retrieval robi **sam hook**, poza etapem post, gdzie
zostaje dotychczasowy „nudge do zapisu notatki".

### 1. `UserPromptSubmit` — dopasowanie po treści promptu
- Tokenizacja promptu → scoring względem `keywords` + `summary` + `title` + body.
- Wstrzykiwane: top-N jako `summary` + ścieżka + jawne `read_knowledge`.
  Platformowe core docs z `session_start: true` są dobierane po wykrytej
  platformie niezależnie od score.
- Model dostaje twardą instrukcję: wpisy start packa to wymagany indeks wiedzy;
  przed planowaniem, review lub mutacją konta trzeba użyć `read_knowledge` dla
  właściwego core artykułu.
- Budżet: limit pojedynczego hooka utrzymany z marginesem poniżej 10k znaków.

### 2. `PreToolUse` — dopasowanie po narzędziu i argumentach
- Wyzwalacz: `tool_name` (np. `prepare_budget_change`, `execute_gaql`,
  `prepare_bidding_strategy`, `prepare_keywords`) + skan argumentów.
- Selekcja przez **`trigger_tools`** we frontmatter (mapa narzędzie→dokument) oraz
  `risk_level: high` dla operacji ryzykownych.
- Wstrzykiwane: reguły „always/never" i progi liczbowe **zanim** model wykona
  zmianę. To jest właściwy „guardrail injection".
- Przykład: `prepare_budget_change` → `always-never-checklist.md` (sekcja budżet) +
  `budget-scaling-seasonality.md` (progi %, reset learning phase dla Meta).

### 3. `PostToolUse` — przypomnienie o zapisie + interpretacja
- Zostaje obecne zachowanie (nudge do `append_mutation`/`append_decision`), ale
  rozszerzone o statystyki/insighty (`get_insights`, `execute_gaql`,
  `get_campaigns`) i klasyfikację zdarzeń wg planu bazowego (mutation/stats/review).
- Opcjonalnie wstrzyknięcie docsów `task_type: [interpretation]` (jak czytać wynik).

## Frontmatter v2 (płaski, zgodny z parserem)

Dokładane pola (wszystkie opcjonalne, wstecznie kompatybilne):

```yaml
---
keywords: [budzet, budget, skalowanie, scaling, learning-phase]
applies_to: [google-ads, meta-ads]
task_type: [mutation, review, interpretation]
risk_level: high
summary: "Reguły zmiany budżetu i progi resetu fazy uczenia."
# --- NOWE ---
trigger_tools: [prepare_budget_change, prepare_ad_set_update, prepare_campaign_update]
trigger_stage: [prompt, pre_tool, post_tool]   # gdzie dokument jest eligible; brak = wszędzie
priority: 4          # 1..5; 5 = pin/always-inject dla pasującej platformy
inject: body         # body = wstrzyknij całość (krótkie reguły); summary = tylko streszczenie + path
session_start: true  # wstrzyknij w rundzie 1 sesji jako orientacja (opcjonalne)
related: [google-ads/bidding-strategies.md, google-ads/account-hygiene-diagnostics.md]  # sugerowane doczytanie przez read_knowledge
source: ["https://support.google.com/adspolicy/answer/6008942"]  # provenance: bezpośredni URL lub repo-native specyfikacja
---

Pole `source` jest OBOWIĄZKOWE dla nowych plików (traceability). Format płaski
(tablica krótkich referencji). Kanon → bezpośredni oficjalny URL; materiał własny
→ ścieżka do specyfikacji w repo; praktycy → nazwany i datowany URL. Hook
pokazuje źródła zwięźle przy injekcie.
```

Zasady formatowania notatek (żeby były injectowalne):
- **Jeden dokument = jeden temat wyzwalany podobnym zestawem narzędzi.** Nie mieszaj
  budżetu z keywordami w jednym pliku, bo `trigger_tools` traci ostrość.
- **`summary` = 1 zdanie operacyjne** (to trafia do promptu na etapie 1) — ma nieść
  konkret, nie marketing.
- **Progi liczbowe w tabelach** na górze dokumentu (łatwe do wycięcia jako `body`).
- **Krótkie reguły `always/never` → `inject: body`**; długie kompendia →
  `inject: summary` + model doczyta `read_knowledge`.
- **`keywords` dwujęzyczne** (PL + EN), bo prompty bywają mieszane.
- **`trigger_tools` bez prefiksu serwera** (dopasowanie przez `includes`), np.
  `prepare_budget_change`, nie `google-ads__prepare_budget_change`.

## Zmiany w kodzie (checklista)

**P0 — sprawić, by auto-inject w ogóle działał — ZROBIONE**
- [x] `src/retrieval.ts` — wydzielony scoring/matching + selektory
      (`selectForPrompt`, `selectForTool`, `selectForSessionStart`,
      `detectPlatforms`). `knowledge.ts` importuje z niego (bez driftu logiki).
- [x] `src/hook.ts` — hook obsługuje `UserPromptSubmit` (etap 1 + orientacja w
      rundzie 1), `PreToolUse` (etap 2, `trigger_tools`), `PostToolUse` (etap 3,
      nudge). Emituje `hookSpecificOutput.additionalContext` (Claude) /
      `additionalContext` (Codex).
- [x] Build: drugi bundle `hook.cjs` (esbuild) w `npm run build`. `start-mcp.js`
      pobiera `hook.cjs`. Stary `scripts/marketing-context-hook.js` usunięty.
- [x] Parser: nowe pola (`trigger_tools`, `trigger_stage`, `priority`,
      `session_start`, `inject`, `related`) są płaskie — obecny parser je łyka.
- [x] Hooki wpięte w `.claude-plugin/plugin.json` (UserPromptSubmit `""`,
      Pre/PostToolUse matcher `mcp__.*(google-ads|meta-ads).*`).
- [x] Budżet wstrzyknięcia (`INJECT_BUDGET=2000`, body trunc 700) + porządek wg
      `priority` potem `score`.
- [x] Dedupe: stan per `session_id` w tmp (`round` + `injected[]`) — bez powtórnego
      wstrzykiwania tego samego dokumentu w sesji.
- [x] Fallback: brak eventu/roota/parsowania → `exit 0` bez szumu.

Zweryfikowane smoke-testami (echo JSON | node hook.cjs): UserPromptSubmit
runda 1 (orientacja `always-never` jako body + dopasowania), runda 2 (dedupe),
PreToolUse `prepare_budget_change`/`execute_gaql` (trafienia), `list_accounts`
(brak fałszywek), PostToolUse `confirm_mutation` (nudge). `npm run smoke` OK.

**Pozostaje w P0/P1:**
- [ ] Wpiąć hooki w `.codex-plugin/plugin.json` (schemat Codex różni się — osobno).
- [ ] Dodać TTL/okno czasowe do stanu sesji (dziś czyszczone tylko przez tmp).
- [ ] Traktować kompakcję jako reset zawartości kontekstu, nie pełny reset sesji:
      hook na `PreCompact`/odpowiednik hosta powinien wyczyścić `readDocs` i
      `denies`, zostawić `semanticRequired`, a przy wcześniej załadowanym kliencie
      ponownie wymagać `set_current_client`. Po kompakcji model mógł stracić pełną
      treść artykułów i notatek, nawet jeśli `session_id` pozostało bez zmian.

**P1 — jakość dopasowania**
- [ ] Migracja istniejących ~19 docsów na frontmatter v2 (`trigger_tools`,
      `priority`, `inject`).
- [ ] Mapa narzędzie→dokument (przegląd wszystkich `prepare_*`/`confirm_*` z
      google-ads-baby i meta-ads-baby, przypisanie do docsów).
- [ ] Rozszerzyć scoring o dopasowanie `trigger_tools` (duża waga na etapie pre).
- [ ] Klasyfikacja zdarzeń post (mutation/stats/review) + dedupe po hash(tool+akcja).

**P2 — skala i wygoda**
- [ ] `knowledge/.index.json` budowany przy buildzie (szybki lookup tool→doc, gdy
      docsów > ~100).
- [ ] Narzędzie debug/status: pokaż, co hook wstrzyknąłby dla danego promptu/toola.
- [ ] Telemetria trafień (które docsy realnie się wstrzykują) → czyszczenie martwych.

## Próg pewności — wskaźnik vs. pełna treść

Domyślnie hook wstrzykuje **wskaźnik** (`summary` + `Źródło` + `Powiązane`) i zostawia
modelowi decyzję, czy doczytać całość przez `read_knowledge`. Gdy jednak trafienie
jest **dominujące i wysokopewne** (~>90%), hook wstrzykuje **pełne body** dokumentu
inline (przycięte do `BODY_TRUNC`), bo koszt niepotrzebnego wstrzyknięcia jest wtedy
niski, a zysk (model ma liczby/tabele od razu, bez round-tripu) wysoki.

Warunek `confident` (`retrieval.ts › selectForPromptScored`): trafienie strukturalne —
słowo z zapytania w **tytule** i ≥2 różne termy zapytania trafione gdziekolwiek,
**albo** wysoki wynik bezwzględny (`≥16`). Każde trafienie spełniające próg dostaje
pełne body, do **`CONFIDENT_LIMIT` = 5** dokumentów (typowo 1-3 trafienia przechodzą
próg; na pierwszym promkcie dochodzi generyk startowy, więc w całości ląduje ~2-5
artykułów). Słabsze trafienia zostają wskaźnikami. Budżet `INJECT_BUDGET` = 6000
znaków mieści te 2-5 pełnych treści.

Plik może też wymusić body flagą `inject: body` w frontmatterze (niezależnie od
pewności) — dla krótkich, zawsze-relewantnych dokumentów. Etap `pre_tool` nie używa
progu pewności (trafienia i tak są wąskie, wiązane przez `trigger_tools`), zostaje
przy wskaźnikach + ewentualnym `inject: body`.

## Polityka linkowania (`related`) i higiena grafu

`related` buduje graf, po którym model dociąga wiedzę (`read_knowledge`) i który
hook pokazuje jako `Powiązane:` przy injekcie. Zasady:

- **Bez sierot**: każdy plik ma ≥1 link przychodzący (inaczej jest nieodkrywalny
  przez graf).
- **Case studies dwukierunkowo**: `general/case-studies.md` linkuje do plików
  strategicznych, których dotyczy dany case, a te pliki linkują z powrotem — dzięki
  temu przy pracy nad tematem (np. Andromeda) model widzi relewantny case.
- **Pary detail/skrót i setup/strategia dwukierunkowo**: np.
  `product-bucketing ↔ product-bucketing-detailed`,
  `merchant-center-feed ↔ feed-optimization-detailed`,
  `analytics/consent-mode ↔ analytics/consent-mode-gtm-operational`,
  `analytics/meta-pixel-capi ↔ meta-ads/pixel-capi-signal-quality`.
- **Jednokierunkowe są OK** tam, gdzie powrót nie ma wartości nawigacyjnej
  (np. benchmark → strategia bez powrotu).
- **Weryfikacja**: `node scripts/knowledge-audit.mjs` — sprawdza martwe linki,
  sieroty, braki `summary`/`source` i pokrycie linkowania case studies; exit ≠ 0
  przy martwych linkach lub brakach frontmatter. Uruchamiać po każdej zmianie
  biblioteki.

## Limit harnessa i model injectu (decyzja 0.6.0)

Claude Code twardo ucina `additionalContext` pojedynczego wywołania hooka przy
**10 000 znaków** (większy output ląduje w pliku tymczasowym, model widzi ~2 KB
podglądu; limit niekonfigurowalny — zmierzony empirycznie, per wywołanie).

- **Model domyślny: link + niemechaniczne summary.** Każdy wpis to ścieżka +
  ręcznie napisany brief (2-4 zdania z kluczowymi progami/liczbami), nigdy nie
  ucinany. Pełną treść model dociąga przez `read_knowledge`; hook nie inline'uje
  body artykułów, bo jeden pełny tekst potrafi zużyć większość limitu 10k.
- **TOC startowy:** pełne summary wszystkich artykułów ma dziś ~23k znaków, więc
  startowy spis treści używa skróconych hintów (~7-8k znaków dla całej biblioteki).
  Pełne `summary` w frontmatter powinno zawierać zarówno "kiedy czytać", jak i
  najważniejsze progi/ryzyka, bo służy jako materiał do TOC, search i pointerów.
- **Workaround shardingu (dostępny, ale niepraktyczny):** hook wspiera argumenty
  `--shard=k --shards=N`. Rejestrując go N razy per zdarzenie w `plugin.json`,
  każde wywołanie ma własny limit 10k — lider (shard 1) liczy całość, tnie na
  kawałki i podaje je followerom przez pliki tmp; kolejność bloków w kontekście
  to kolejność UKOŃCZENIA hooków, więc followery emitują z opóźnieniem, a każdy
  kawałek ma etykietę `(część k/N)`. Działa (zweryfikowane sondami), ale mnoży
  procesy przy każdym prompcie i opiera się na timingu — dlatego domyślnie
  wyłączone (pojedynczy hook, bez argumentów).

## Ryzyka / decyzje do podjęcia
- **Prywatność wstrzyknięć** zależna od hosta (Claude vs Codex) — trzymać treść
  neutralną, bez sekretów, na wypadek gdyby host ją pokazał.
- **Hałas kontekstowy**: agresywny inject psuje prompt. Zacząć od N=3 i limitu
  ~2000 znaków, iterować po obserwacji.
- **`execute_gaql` na PreToolUse** może się odpalać bardzo często — rozważyć węższy
  matcher lub mocniejszy dedupe, żeby nie wstrzykiwać przy każdym odczycie.
