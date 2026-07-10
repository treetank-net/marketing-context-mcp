---
keywords: [benchmark, polska, poland, eu, europa, europe, cpc, cpm, ctr, cvr, roas, cpl, meta ads, facebook, google ads, branza, industry, kraj, country, sotrender, smec]
applies_to: [google-ads, meta-ads]
task_type: [reference]
trigger_stage: [prompt]
priority: 2
inject: summary
related: [general/benchmarks-index.md, general/benchmarks/meta-ads-ecommerce.md, general/benchmarks/google-ads-shopping-pmax.md, general/benchmarks/google-ads-search.md]
source: ["https://www.sotrender.com/blog/pl/2025/01/reklamowe-podsumowanie-2024-roku-w-ekosystemie-meta/", "https://smarter-ecommerce.com/en/smec-market-observer/", "https://smarter-ecommerce.com/en/smec-market-observer/metrics/cpc/", "https://www.adamigo.ai/blog/meta-ads-cpm-cpc-benchmarks-by-country-2026", "https://www.statista.com/statistics/1409916/meta-cpm-europe/"]
summary: "Meta Polska (Sotrender 2024, realne dane): CPM 2,82 zł (r/r −28%), CPC 0,93 zł (r/r +8%), najtaniej w sierpniu (CPM 2,02 zł); per branża tylko CPM — Edukacja >11 zł, Żywność 1,67 zł. Meta per kraj EU (AdAmigo 2026, projekcje USD): PL $5,50 CPM / $0,75 CPC vs Niemcy $10,05 i US $23,00. Google e-com EU (smec 2026): CPC Search €0,45 / Shopping €0,38 / PMax €0,40, ROAS ~5,0, AOV ~€98. Brak danych CVR/ROAS/CPL per branża PL — wskaźniki względne bierz z US, koszty absolutne koryguj w dół."
---

# Benchmarki — rynek PL / EU

**Referencja, nie cel.** Koszty w PL/EU są zwykle wyraźnie niższe niż w US (na Meta
CPM potrafi być ~4× niżej), więc benchmarki US zawyżają koszty absolutne dla polskiego
klienta. Cel wynika z ekonomii klienta (marża, LTV, AOV), nie ze średniej rynkowej.
Zasady czytania kubełków: `benchmarks-index.md`.

## Kubełek

- **Region:** Polska (Sotrender) + kraje EU per kraj (AdAmigo) + Europa zagregowana (smec).
- **Platformy:** Meta (Facebook/Instagram) — najlepsze dane PL; Google Ads e-commerce — EU.
- **Metryki:** CPC, CPM, CTR (Meta PL); CPM/CPC per kraj (Meta EU); CPC/ROAS/AOV (Google EU).
- **Główna luka:** dla PL dostępne są głównie **koszty (CPC/CPM)**, a per branża tylko
  **CPM**. Twardych danych per branża dla CVR/ROAS/CPL na rynku PL brak — patrz sekcja
  „Czego brakuje". Nie zmyślam ich.

## Meta (Facebook/Instagram) — Polska, poziom ogólny (Sotrender 2024)

Najmocniejsze źródło **polskie**: Sotrender, „Reklamowe podsumowanie 2024 roku
w ekosystemie Meta" (dane z własnej bazy analitycznej, cały rok 2024). Waluta: PLN.
To realne dane z rynku PL, nie recykling US ani projekcja.

| Metryka | Wartość | Platforma | Region | Rok | Źródło |
|---|---|---|---|---|---|
| CPM (średni) | 2,82 zł | Meta (FB+IG) | Polska | 2024 | Sotrender 2024 (ekosystem Meta) |
| CPC (średni) | 0,93 zł | Meta (FB+IG) | Polska | 2024 | Sotrender 2024 |
| CPM (najniższy miesiąc — sierpień) | 2,02 zł | Meta | Polska | 2024 (sierpień) | Sotrender 2024 |
| CPC (najniższy miesiąc — sierpień) | 0,75 zł | Meta | Polska | 2024 (sierpień) | Sotrender 2024 |

Trend r/r (2024 vs 2023): CPM **spadł o ~28%** (z 3,92 zł do 2,82 zł), CPC **wzrósł
o ~8%**. Sezon: sierpień najtańszy (i CPC, i CPM). Uwaga: to średnie po wszystkich
celach kampanii i grupach — realny CPC e-commerce z szeroką grupą bywa niższy
(praktycy PL: nawet 0,20–0,30 zł przy dobrym remarketingu), a precyzyjny B2B wyższy.

## Meta — Polska per branża (Sotrender 2024, tylko CPM)

Sotrender ujawnił rozbicie branżowe **tylko dla CPM** (nie dla CPC/CTR/CVR). Zapisuję
to, co ma twardą wartość i rok; brak CVR/ROAS per branża PL to realna luka źródeł.

| Branża | CPM | Platforma | Region | Rok | Źródło |
|---|---|---|---|---|---|
| Edukacja | ponad 11 zł | Meta | Polska | 2024 | Sotrender 2024 |
| Alkohol | ponad 8 zł | Meta | Polska | 2024 | Sotrender 2024 |
| Nieruchomości | ponad 5 zł | Meta | Polska | 2024 | Sotrender 2024 |
| Nauka i technologie | 2,30 zł | Meta | Polska | 2024 | Sotrender 2024 |
| Catering i dostawa żywności | 1,85 zł | Meta | Polska | 2024 | Sotrender 2024 |
| Jedzenie i żywność | 1,67 zł | Meta | Polska | 2024 | Sotrender 2024 |

Wzorzec: droga uwaga (edukacja, alkohol, nieruchomości — regulowane/nisze) vs tania
uwaga (żywność, gastronomia — szerokie grupy, dużo ekspozycji).

## Meta — CPM/CPC per kraj EU (AdAmigo 2026, projekcje)

Rozpiętość kosztu dotarcia w EU jest duża (~2× między najtańszą Hiszpanią/Polską
a najdroższą Szwajcarią). Waluta: USD. **Uwaga:** to projekcje jednego źródła
(analiza własna narzędzia, nie oficjalne dane Meta) — rząd wielkości, nie precyzja.
Nie zaszywać jako próg. (Ta tabela częściowo pokrywa się z `meta-ads-ecommerce.md`;
tam jest węższy wybór — tu pełniejszy przekrój EU.)

| Kraj | CPM (USD) | CPC (USD) | Typowy zakres CPM | Region | Rok | Źródło |
|---|---|---|---|---|---|---|
| Polska | $5,50 | $0,75 | $4,50–$6,80 | PL | 2026 (proj.) | AdAmigo.ai |
| Hiszpania | $5,80 | $0,85 | $4,50–$7,00 | ES | 2026 (proj.) | AdAmigo.ai |
| Grecja | $5,90 | $0,85 | $4,80–$7,20 | GR | 2026 (proj.) | AdAmigo.ai |
| Portugalia | $6,10 | $0,90 | $5,00–$7,50 | PT | 2026 (proj.) | AdAmigo.ai |
| Czechy | $6,20 | $0,95 | $5,00–$7,50 | CZ | 2026 (proj.) | AdAmigo.ai |
| Włochy | $7,20 | $1,05 | $6,00–$8,50 | IT | 2026 (proj.) | AdAmigo.ai |
| Francja | $8,05 | $1,15 | $6,50–$9,50 | FR | 2026 (proj.) | AdAmigo.ai |
| Belgia | $8,40 | $1,20 | $7,00–$10,00 | BE | 2026 (proj.) | AdAmigo.ai |
| Szwecja | $9,10 | $1,30 | $7,50–$11,00 | SE | 2026 (proj.) | AdAmigo.ai |
| Holandia | $9,20 | $1,35 | $7,50–$11,00 | NL | 2026 (proj.) | AdAmigo.ai |
| Austria | $9,50 | $1,40 | $7,80–$11,20 | AT | 2026 (proj.) | AdAmigo.ai |
| Dania | $9,80 | $1,45 | $8,00–$11,50 | DK | 2026 (proj.) | AdAmigo.ai |
| Niemcy | $10,05 | $1,45 | $8,00–$12,00 | DE | 2026 (proj.) | AdAmigo.ai |
| Wielka Brytania | $10,31 | $1,95 | $8,50–$12,50 | UK | 2026 (proj.) | AdAmigo.ai |
| Irlandia | $10,80 | $1,70 | $9,00–$12,80 | IE | 2026 (proj.) | AdAmigo.ai |
| Szwajcaria | $14,80 | $2,40 | $12,00–$17,50 | CH | 2026 (proj.) | AdAmigo.ai |
| USA (kontrola) | $23,00 | $2,69 | $18,00–$28,00 | US | 2026 (proj.) | AdAmigo.ai |

Kontrola: Statista podaje CPM Meta w Europie ~$9,18–$10,85 (2024) — zbieżne co do rzędu
wielkości z krajami zachodnimi wyżej; Polska/południe EU są poniżej tej średniej.

## Google Ads e-commerce — Europa (smec 2026, realne dane)

Najmocniejsze źródło **europejskie** dla Google (Search/Shopping/PMax): smec Market
Observer, €650 mln rocznego spendu e-commerce w EU, odświeżane tygodniowo. Waluta: EUR.
Pełna wersja dla Shopping/PMax: `google-ads-shopping-pmax.md`.

| Metryka | Wartość | Platforma | Region | Rok | Źródło |
|---|---|---|---|---|---|
| CPC (mediana) | €0,45 | Google Search | Europa | 2026 | smec Market Observer |
| CPC (mediana) | €0,38 | Google Shopping | Europa | 2026 | smec Market Observer |
| CPC (mediana) | €0,40 | Performance Max | Europa | 2026 | smec Market Observer |
| ROAS (mediana) | ~5,0 | Google (e-com) | Europa | 2026 (maj) | smec Market Observer |
| AOV | ~€98 | Google (e-com) | Europa | 2026 (maj) | smec Market Observer |

## Zastrzeżenia

- **Region PL ≠ EU zachód ≠ US.** Koszty rosną z zachodu/północy; PL i południe EU są
  najtańsze. Nie stosuj benchmarku US ani niemieckiego do wyceny kampanii PL.
- **Źródła mieszają walutę i rok:** Sotrender = PLN/2024 (realne), AdAmigo = USD/2026
  (projekcja), smec = EUR/2026 (realne EU). Nie licz między nimi kursu 1:1 — porównuj
  rzędy wielkości, nie grosze.
- **Benchmark ≠ cel.** Niski CPM branży spożywczej w PL nie znaczy „tak ma być" — liczy
  się koszt pozyskania klienta względem jego wartości (LTV, marża).
- **AdAmigo to projekcja 1-źródłowa** (analiza własna narzędzia, nie oficjalne dane Meta)
  — rząd wielkości, nie próg.

## Czego dla PL/EU nadal brakuje (uczciwie)

- **CVR, ROAS, CPL per branża dla PL** — brak wiarygodnego źródła pierwotnego. Sotrender
  daje per branża tylko CPM. Nie znaleziono publicznego raportu PL z CVR/ROAS per branża.
- **CTR per branża PL** — Sotrender publikuje agregaty kosztowe, nie CTR branżowy.
- **Google Ads Search/Shopping per branża dla samej Polski** — smec daje Europę
  zagregowaną (8 wertykałów za rejestracją), nie rozbicie PL. Brak per-branża PL.
- **Rekomendacja praktyczna:** dla PL zacznij od kubełka US (`google-ads-search.md`,
  `meta-ads-ecommerce.md`) dla wskaźników **względnych** (CTR/CVR/ROAS — przenoszą się
  lepiej), a koszty **absolutne** (CPC/CPM/CPL) skoryguj w dół tabelami PL/EU wyżej.
