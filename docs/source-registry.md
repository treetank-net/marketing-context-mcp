# Rejestr źródeł wiedzy

Rejestr źródeł rozważanych do biblioteki wiedzy `marketing-context-mcp`. Uzupełnia
`knowledge-library-plan.md` (tiery, pipeline) o konkretną ewaluację per źródło:
wiarygodność, pokrycie, scrapeowalność, rekomendacja.

Legenda:
- **Tier**: 0 = własna wiedza, 1 = oficjalne first-party, 2 = praktycy/agencje, 3 = community/referencyjne. Patrz `knowledge-library-plan.md`.
- **Typ**: oficjalne / praktyk / community / case-study.
- **Wiarygodność**: wysoka / średnia / niska (dla oficjalnych: wysoka na „co platforma robi", nie na „jak zarabiać"; dla producenta danych o własnym produkcie: oznaczone jako „interesariusz").
- **Rekomendacja**: używać / obserwować / odrzucić.
- **Scrape**: sitemap / RSS / API / za loginem / ręcznie.

Stan: pierwsza iteracja (2026-07). Kolumna „wykorzystane" wskazuje, czy źródło już zasiliło pliki wiedzy w tym przebiegu.

## Tier 1 — oficjalne first-party

| Źródło | URL | Typ | Wiarygodność | Pokrywa | Scrape | Rekomendacja | Wykorzystane |
|---|---|---|---|---|---|---|---|
| Meta Business Help — Learning Phase | facebook.com/business/help/112167992830700 | oficjalne | wysoka (mechanika) | faza uczenia, definicje | ręcznie (JS-heavy, WebFetch nie renderuje) | używać | tak (via praktyków, doc się nie wyrenderował) |
| Meta Advertising Standards | transparency.meta.com/policies/ad-standards | oficjalne | wysoka | polityki reklamowe | scrape | używać (→ `policies/`) | nie |
| Google Ads Help | support.google.com/google-ads | oficjalne | wysoka (mechanika) | mechanika, definicje, limity | sitemap → scrape | używać | nie |
| Google Ads Policies | support.google.com/adspolicy | oficjalne | wysoka | polityki | scrape | używać (→ `policies/`) | nie |
| Google Ads API Release Notes | developers.google.com/google-ads/api/docs/release-notes | oficjalne | wysoka | zmiany API, wersjonowanie, deprecje | ręcznie/RSS | używać (monitoring zmian) | częściowo (kontekst gapów) |
| Google Ads Developer Blog | ads-developers.googleblog.com | oficjalne | wysoka | zapowiedzi API, harmonogram wersji | RSS | obserwować (sygnał zmian) | nie |
| Meta Blueprint / Skillshop | Blueprint / skillshop.withgoogle.com | oficjalne | wysoka | szkolenia certyfikacyjne | za loginem → ręcznie | obserwować (koszt wejścia wysoki) | nie |

## Tier 2 — praktycy i agencje

| Źródło | URL | Typ | Wiarygodność | Pokrywa | Scrape | Rekomendacja | Wykorzystane |
|---|---|---|---|---|---|---|---|
| Motion (motionapp.com/blog) | motionapp.com/blog | praktyk | wysoka | creative testing, benchmarki kreacji, Andromeda | ręcznie | używać | tak (creative-testing) |
| AdEspresso | adespresso.com | praktyk | średnia-wysoka | eksperymenty Meta, formaty, audytoria | ręcznie | używać (wg planu; nie użyte w tym przebiegu) | nie |
| WordStream | wordstream.com | praktyk | wysoka | benchmarki branżowe CPC/CTR/CVR | ręcznie | używać (wg planu; Google-centryczne) | nie |
| Search Engine Land / Journal | searchengineland.com / searchenginejournal.com | praktyk | wysoka | analizy zmian, strategia | RSS | używać | nie |
| Niblin (blog) | niblin.com/blog | praktyk | średnia | faza uczenia Meta — dobra destylacja | ręcznie | używać | tak (learning phase) |
| RebootIQ | rebootiq.com | praktyk | średnia | ABO/CBO, scaling playbook | ręcznie | używać | tak (ABO/CBO) |
| AdAmigo.ai (blog) | adamigo.ai/blog | praktyk | średnia | benchmarki Meta, ABO/CBO, CPM/CPC per kraj | ręcznie | używać (weryfikować liczby — część od Meta) | tak (benchmarki, CBO) |
| SuperScale | superscale.ai/learn | praktyk | średnia | CBO/ABO/Advantage+ | ręcznie | używać | tak (kontekst) |
| jetfuel.agency (blog) | jetfuel.agency | praktyk | średnia | Andromeda, algorytm 2025/26 | ręcznie | używać (liczby 1-źródłowe) | tak (case-study) |
| AdStellar / VibeMyAd | adstellar.ai/blog / vibemyad.com/blog | praktyk | niska-średnia | creative testing frameworks | ręcznie | obserwować (dużo SEO-waty, sprawdzać case-by-case) | częściowo |
| Triple Whale (blog) | triplewhale.com/blog | praktyk | wysoka | benchmarki FB z realnych danych klientów | ręcznie | używać (dane pierwotne z platformy analytics) | nie |
| Marpipe | marpipe.com/blog | praktyk | średnia | Advantage+ Shopping, DPA | ręcznie | obserwować | częściowo (kontekst ASC) |
| Foxwell Digital / Foxwell Founders | foxwelldigital.com | praktyk | wysoka | społeczność 450+ media buyerów, $300M/mies. spend | za loginem (płatna społeczność) | obserwować (top sygnał, ale za paywallem) | nie |
| Building Ads With Barry (Barry Hott) | buildingadswithbarry.com | praktyk | wysoka | creative-first media buying, scaling kreacji | newsletter/kurs | obserwować | nie |
| The Andrew Faris Podcast | podcasts (Apple/Spotify) | praktyk | wysoka | zaawansowane zasady media buying Meta/Google | ręcznie (transkrypty) | obserwować (transkrypcja = koszt) | nie |

## Tier 3 — community / referencyjne

| Źródło | URL | Typ | Wiarygodność | Pokrywa | Scrape | Rekomendacja | Wykorzystane |
|---|---|---|---|---|---|---|---|
| r/PPC | reddit.com/r/PPC | community | zmienna | gotchas, świeże zmiany zachowania platform | API/ręcznie | obserwować (kuracja ręczna do keywords) | nie |
| r/FacebookAds | reddit.com/r/FacebookAds | community | zmienna | gotchas Meta | API/ręcznie | obserwować | nie |
| Meta Ad Library | facebook.com/ads/library | referencyjne | wysoka (fakty o kreacjach) | przykłady kreacji per branża | API (SerpApi/Apify) | używać (przykłady, nie „jak") | nie |
| Google Ads Transparency Center | adstransparency.google.com | referencyjne | wysoka | przykłady reklam konkurencji | scrape/API | obserwować | nie |
| AdExchanger | adexchanger.com | community/prasa | wysoka | analiza zmian platform (np. Andromeda — trzeźwa) | RSS | obserwować (dobra do weryfikacji hype'u) | nie |

## Odrzucone / pominięte (i dlaczego)

- **Generyczne „X Facebook Ads tips 2025" blogi agencyjne** (masa wyników w SERP) — SEO-wata, powtarzają te same liczby bez źródła pierwotnego; nie dodają ponad to, co już zdestylowane. Odrzucić hurtowe scrapowanie SERP-a.
- **Treści sprzedażowe narzędzi (blogi z CTA do własnego SaaS)** — użyteczne fragmenty tak, ale bias ku „nasze narzędzie to rozwiązuje". Traktować jako Tier 2 z dużą ostrożnością, nie jako kanon.
- **Liczby „dane wewnętrzne Meta"** (CBO +17% ROAS, ASC -17% koszt/zakup) — NIE odrzucone, ale oznaczone jako 1 źródło/interesariusz w `case-studies.md`; nie zaszywać jako progi w kodzie.
- **Medium (medium.com/@...) posty** — jakość skrajnie zmienna, brak redakcji; użyć tylko gdy autor to zidentyfikowany praktyk, inaczej pominąć.

## Uwagi weryfikacyjne (dla kolejnych iteracji)

- Meta Help Center jest JS-heavy — `WebFetch` zwraca sam nagłówek. Do scrapa Tier 1 Meta potrzebny headless browser (skill `kimi-webbridge`) lub ręczne przeklejenie.
- Liczby fazy uczenia (~50 eventów/7 dni, reset przy edycji >20%, pauza ≥7 dni) potwierdzone w ≥3 niezależnych źródłach praktyków — traktowane jako pewne mimo braku wyrenderowanego doca oficjalnego.
- Benchmarki (CPM/CPC/CTR/CPA) różnią się rok do roku i per region/branża — NIE destylować jako twarde progi; trzymać jako materiał referencyjny z datą i źródłem, gdyby wchodziły do biblioteki.

## Iteracja 2 — dopisane źródła i zmiany

**Rozwiązany blocker:** JS-heavy strony (Meta/Google Help) scrapujemy przez globalny `playwright-cli` (`open` → `goto <url>` → `eval "() => document.body.innerText"` → `close`). Zweryfikowane: 6-7 oficjalnych URL-i wyrenderowało pełną treść. `kimi-webbridge` już niepotrzebny do tego celu.

**Wykorzystane w tej iteracji (status: tak):** Meta Advertising Standards, Google Ads Policies, Google Consent Mode (answer/10000067), import konwersji GA4→Ads (answer/2375435), Meta Conversions API + deduplication + event match quality, WordStream/LocaliQ (benchmarki), Triple Whale (benchmarki e-commerce).

**Nowe źródła zgłoszone przez agentów (do rozważenia):**

| Źródło | URL | Tier | Pokrywa | Rekomendacja |
|---|---|---|---|---|
| Meta Business Help — CAPI/dedup/EMQ | facebook.com/business/help/... | 1 | Pixel+CAPI, event_id, EMQ | używać (scrape via playwright) |
| Google Ads Help — Consent Mode / GA4 import | support.google.com/google-ads | 1 | consent mode, import konwersji | używać |
| skai.io/blog | skai.io/blog | 2 | sizing lookalike (seed/%) | rozważyć (rzeczowe) |
| theoptimizer.io/blog | theoptimizer.io/blog | 2 | Andromeda, specyfikacje placementów | rozważyć |
| taggrs.io/docs | taggrs.io/docs | 2 | deduplikacja CAPI (event_id) | rozważyć (techniczne) |
| PPC Hero | ppchero.com | 2 | struktura/konsolidacja | obserwować |
| fiveninestrategy.com | fiveninestrategy.com | 2 | konsolidacja w erze Andromedy | obserwować |
| adsuploader.com/blog | adsuploader.com/blog | 2 | spec sheet formatów Meta | referencyjnie (sprawdzać rok) |
| AdAmigo.ai | adamigo.ai/blog | 2 | benchmarki CPM/CPC per kraj (w tym PL) | używać z ostrożnością (analiza własna) |

**Luki na iterację 3:** benchmarki PL/EU per branża (CTR/CVR/ROAS — mamy tylko US); Google Shopping/PMax benchmarki; mapowanie cel kampanii → event optymalizacji (Meta objectives); formaty kreacji Meta szczegółowo (carousel/DPA/collection/lead forms); interpretacja insightów Meta (atrybucja/okna) jako osobny plik `task_type: interpretation`.

## Iteracja 3 — dopisane źródła

**Wykorzystane (status: tak):** Meta Business Help „Choosing advertising objectives" (help/1438417719786914, kanoniczna tabela ODAX), Meta Business Help „About actions attributed to your ad" (help/458681590974355), Search Engine Land „read Meta metrics like a system", Jon Loomer (atrybucja), Social Media Examiner (ODAX).

**Zapis historyczny:** w tej iteracji wykorzystano również lokalny seed o
niejednoznacznym provenance. Decyzja została wycofana; materiał został zastąpiony
niezależnymi opracowaniami ze źródeł pierwotnych. Patrz audyt provenance.

**Uwagi scrape:** adsuploader.com zwraca 403 na WebFetch — pobierać przez `playwright-cli`. Meta Business Help ogólnie: playwright renderuje, WebFetch zwraca sam nagłówek.

**Luki na iterację 4:** benchmarki PL/EU per branża + Google Shopping/PMax; katalog produktowy/feed dla Meta DPA i Advantage+ catalog (operacyjnie); metodologia testów Meta (Experiments/lift/split — odrębne od creative-testing); najgłębsze detale branżowe kompendium §19/§23.

## Iteracja 4 — provenance + nowe źródła

**Provenance:** dodano pole `source` do frontmatter wszystkich 48 plików wiedzy.
Pierwsza wersja dopuszczała odwołania do lokalnego seeda; obecna polityka wymaga
bezpośrednich publicznych URL-i, jawnie licencjonowanego materiału albo specyfikacji
repo-native. Hook renderuje `Źródło:` przy każdej injekcie.

**Nowe źródła (do dopisania jako pełne pozycje):**

| Źródło | URL | Tier | Pokrywa | Rekomendacja |
|---|---|---|---|---|
| Sotrender | sotrender.com/blog | 2 | benchmarki Meta **Polska** (realne dane, roczne) | używać — najlepsze źródło PL |
| smec Market Observer | smarter-ecommerce.com/en/smec-market-observer | 2 | Google e-com **EU** (Search/Shopping/PMax, realne €650M) | używać — mocne EU |
| Meta Business Help — A/B testing | facebook.com/business/help/1738164643098669, /1159714227408868 | 1 | metodologia split testów | używać |
| Meta — Product data specs / Advantage+ Catalog | facebook.com/business/help/120325381656392, developers.facebook.com/docs/meta-pixel/.../advantage-catalog-ads | 1 | feed katalogu, eventy DPA | używać |
| Elevar / Tatvic / Hunchads | getelevar.com, tatvic.com, hunchads.com | 2 | conversion/brand lift methodology | rozważyć |
| aishoppingfeeds / adnabu / tryvizup | *.com/blog | 2 | feed/katalog Meta (spec) | referencyjnie, sprawdzać rok |

**Aktualizacja:** Triple Whale pokrywa teraz też dane Google (nie tylko Meta).

**Luki na iterację 5:** CVR/ROAS/CTR **per branża dla samej Polski** (brak wiarygodnego źródła pierwotnego — Sotrender daje per branża tylko CPM); rekomendacja tymczasowa w `poland-eu.md`: wskaźniki względne z US, koszty absolutne korygować tabelami PL/EU. Nie uzupełniać luki materiałem o niepewnym prawie redystrybucji.
