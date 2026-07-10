---
keywords: [benchmark, shopping, pmax, performance max, google ads, cpc, roas, cvr, ctr, cpa, cpm, ecommerce, e-commerce, sklep, wertykal, feed, produktowa, zakupowa]
applies_to: [google-ads]
task_type: [reference]
trigger_stage: [prompt]
priority: 2
inject: summary
related: [general/benchmarks-index.md, general/benchmarks/google-ads-search.md, general/benchmarks/meta-ads-ecommerce.md, general/benchmarks/poland-eu.md, google-ads/bidding-strategies.md]
source: ["https://www.wordstream.com/blog/2024-google-ads-benchmarks", "https://www.wordstream.com/blog/ws/2019/04/01/shopping-ads-benchmarks", "https://smarter-ecommerce.com/en/smec-market-observer/", "https://smarter-ecommerce.com/en/smec-market-observer/metrics/cpc/", "https://www.triplewhale.com/blog/google-ads-benchmarks"]
summary: "Shopping US: CPC $0,50-$0,95 (~40-55% taniej niż Search), CVR 2,81% (WordStream 2024). Google e-com globalnie (Triple Whale 2025, mediany): ROAS 3,68 (r/r −10%), CPA $23,74, CPM $12,79. EU (smec, €650M spendu, 2026): CPC Search €0,45 / Shopping €0,38 / PMax €0,40, ROAS ~5,0, AOV ~€98. PMax vs Shopping: praktycy raportują +10-20% ROAS dla PMax — szacunek 1-źródłowy, weryfikować testem A/B. Referencja, nie cel — docelowy ROAS wynika z marży, AOV i kosztu zwrotów."
---

# Benchmarki — Google Shopping i Performance Max

**Referencja, nie cel.** ROAS docelowy w kampaniach produktowych wynika z marży, AOV
i kosztu zwrotów danego sklepu, nie ze średniej rynkowej. Sklep z marżą 25% potrzebuje
wyraźnie wyższego ROAS niż sklep z marżą 65%. Te liczby mówią „gdzie jest rynek", nie
„ile musi wyjść". Zasady czytania kubełków: `benchmarks-index.md`.

## Kubełek

- **Platforma:** Google Ads — kampanie Shopping (Standard/PLA) i Performance Max (PMax).
  W obu wypadkach nośnikiem jest feed produktowy z Merchant Center.
- **Metryki:** CPC, ROAS, CVR (współczynnik konwersji), CTR, CPA, CPM.
- **Region:** US (WordStream, Triple Whale — głównie US/globalnie) oraz EU (smec — dane
  europejskie). Rozdzielone w tabelach poniżej, bo koszty absolutne różnią się istotnie.
- **Uwaga metodologiczna:** Google rzadko publikuje osobne benchmarki dla samego PMax.
  Większość „PMax vs Shopping" to szacunki praktyków — oznaczone niżej jako takie.

## Shopping — poziom ogólny (US, WordStream)

Shopping (kampanie produktowe) różnią się od Search: niższy CPC, niższy CVR w ujęciu
per klik, bo ruch jest szerszy i wcześniejszy w lejku.

| Metryka | Wartość | Platforma | Region | Rok | Źródło |
|---|---|---|---|---|---|
| CVR (Shopping/e-commerce search) | 2,81% | Google Shopping | US | 2024 (kwi 2023–mar 2024) | WordStream 2024 Google Ads Benchmarks |
| CPC (Shopping) | $0,50–$0,95 | Google Shopping | US | 2024 | WordStream 2024 (Shopping ~40–55% taniej niż Search) |
| CTR (Shopping, retail) | ~0,86% | Google Shopping | Global | 2024–2025 | agregat rynkowy (rząd wielkości; niska baza, bo ekspozycja szeroka) |

**Kontekst:** CPC w Shopping jest zwykle o **40–55% niższy** niż w Search dla tej samej
branży (WordStream). CVR per klik jest niższy niż w Search, bo klik w kartę produktową
pada wcześniej w procesie decyzyjnym.

## Google Ads e-commerce — poziom ogólny (Triple Whale, realne dane)

Triple Whale mierzy marki e-commerce, więc ich agregat „Google Ads" jest w praktyce
zdominowany przez Shopping/PMax (tam trafia większość budżetu produktowego sklepów).
To najmocniejsze dostępne źródło z realnych danych dla ROAS/CPA e-commerce w Google.

| Metryka | Wartość | Platforma | Region | Rok | Źródło |
|---|---|---|---|---|---|
| ROAS (mediana) | 3,68 | Google Ads (e-com) | Global (przewaga US) | 2025 | Triple Whale 2025 (18 tys.+ marek) |
| CPA (mediana) | $23,74 | Google Ads (e-com) | Global | 2025 | Triple Whale 2025 |
| CPM (mediana) | $12,79 | Google Ads (e-com) | Global | 2025 | Triple Whale 2025 |

Trend r/r (Triple Whale, 2025 vs 2024): ROAS **−10%** (spadek mediany do 3,68), CVR
**−9,3%**, CTR **+7,5%** — użytkownicy klikają więcej, konwertują rzadziej. CPA +12,4%,
CPM +10%. To sygnał presji kosztowej, nie błędu konta.

### Wybrane wertykały (Triple Whale, 2025, wartości bezwzględne ujawnione w źródle)

Źródło podało pełne wartości bezwzględne tylko dla części wertykałów; reszta była
opublikowana jako zmiany r/r. Zapisuję tylko to, co ma twardą wartość i rok.

| Wertykał | Metryka | Wartość | Region | Rok | Źródło |
|---|---|---|---|---|---|
| Pets & Animals | ROAS | 2,84 | Global | 2025 | Triple Whale 2025 |
| Pets & Animals | CVR | 4,43% | Global | 2025 | Triple Whale 2025 |
| Pets & Animals | CPA | $25,15 | Global | 2025 | Triple Whale 2025 |
| Health & Wellness | CPM | $19,69 | Global | 2025 | Triple Whale 2025 |
| Automotive | CPM | $13,15 | Global | 2025 | Triple Whale 2025 |
| Automotive | CTR | 1,65% | Global | 2025 | Triple Whale 2025 |
| Apparel | CPM | $11,23 | Global | 2025 | Triple Whale 2025 (najniższy CPM z wertykałów) |

## EU — Shopping / PMax / Search (smec, realne dane europejskie)

Najmocniejsze źródło **europejskie** dla kampanii produktowych: smec Market Observer,
zbudowane na €650 mln rocznego spendu e-commerce w Europie (w tym 4000+ kampanii PMax),
odświeżane tygodniowo. Waluta: EUR. To realne dane rynku EU, nie recykling US.

| Metryka | Wartość | Platforma | Region | Rok | Źródło |
|---|---|---|---|---|---|
| CPC (mediana) | €0,45 | Search | Europa | 2026 (dane 365-dniowe) | smec Market Observer |
| CPC (mediana) | €0,38 | Shopping | Europa | 2026 | smec Market Observer |
| CPC (mediana) | €0,40 | Performance Max | Europa | 2026 | smec Market Observer |
| AOV (śr. wartość zamówienia) | ~€98 | e-com (Google) | Europa | 2026 (maj) | smec Market Observer |
| ROAS (mediana) | ~5,0 | e-com (Google) | Europa | 2026 (maj) | smec Market Observer |

**To ważny kontrapunkt:** CPC w EU (Shopping €0,38, PMax €0,40) jest zbieżny co do rzędu
wielkości z zakresem US Shopping ($0,50–0,95), ale niższy — a mediana ROAS EU (~5,0) jest
wyższa niż globalny agregat Triple Whale (3,68), bo próbka smec to sklepy prowadzone przez
agencje (dodatnia selekcja). Nie zestawiaj ROAS smec z ROAS Triple Whale jak „to samo".

Trend r/r (smec, Q2 2026): Shopping CPC +6% (spowolnienie z +16% w Q3 2025), PMax CPC +5%,
Search CPC +1%. Sezonowość: szczyty CPC w PMax i Shopping w Q4 (Black Friday/Cyber Monday),
dołki w Q1.

## PMax vs Standard Shopping (szacunki praktyków — ostrożnie)

Brak oficjalnych benchmarków Google rozdzielających PMax od Shopping. Praktycy raportują,
że PMax dowozi zwykle **+10–20% wyższy ROAS** niż Standard Shopping dla większości
kategorii e-commerce, przy niższym CPC i wyższym CVR. To jest **1-źródłowy szacunek
agencyjny**, nie dane pierwotne — nie zaszywać jako próg, traktować jako hipotezę do
zweryfikowania na koncie klienta (test A/B PMax vs Shopping). CPC smec wyżej (Shopping
€0,38 vs PMax €0,40) tej różnicy nie potwierdza jednoznacznie — to zależy od konta i feedu.

## Zastrzeżenia

- **ROAS ≠ cel.** Docelowy ROAS = f(marża, AOV, koszt zwrotu, LTV). Mediana rynkowa
  (3,68 globalnie / ~5,0 EU) to punkt odniesienia, nie próg opłacalności Twojego sklepu.
- **Region ma znaczenie:** dane US (WordStream, Triple Whale) zawyżają koszty absolutne
  dla PL/EU. Dla rynku europejskiego preferuj tabelę smec. Dla PL patrz `poland-eu.md`.
- **Shopping ≠ Search:** nie porównuj CPC Shopping z CPC Search tej samej branży wprost —
  Shopping jest strukturalnie tańszy i ma niższy CVR per klik.
- **PMax to czarna skrzynka:** brak twardych benchmarków; liczby „PMax vs Shopping" są
  szacunkami praktyków. Weryfikuj eksperymentem, nie cytatem.
- **Jakość feedu** (tytuły, atrybuty, ceny, dostępność) wpływa na wyniki Shopping/PMax
  bardziej niż na Search — słaby feed psuje benchmark niezależnie od stawek.
