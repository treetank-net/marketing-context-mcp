---
keywords: [benchmark, benchmarki, cpc, cpm, ctr, cvr, cpa, cpl, roas, branza, industry, kubelek, bucket, srednia, average]
applies_to: [google-ads, meta-ads]
task_type: [reference]
trigger_stage: [prompt]
priority: 2
inject: summary
related: [general/benchmarks/google-ads-search.md, general/benchmarks/meta-ads-lead-gen.md, general/benchmarks/meta-ads-ecommerce.md, general/case-studies.md]
source: ["WordStream", "Triple Whale", "AdAmigo.ai"]
summary: "Benchmarki (CPC/CPM/CTR/CVR/CPA/ROAS) to referencja, nie cel — dopasuj kubełek platforma × branża × region × rok; liczba bez roku i źródła jest bezwartościowa. Dane domyślnie US (WordStream ~18 tys. kampanii Google, Triple Whale ~35 tys. marek e-com); dla PL koszty absolutne istotnie niższe (Meta CPM PL ~$5,5 vs US ~$23, ~4×), wskaźniki względne (CTR/CVR/ROAS) przenoszą się lepiej. Zmienność r/r duża: Google CPC rósł w ~86% branż (śr. +10%), Meta CPM +~20% (2025 vs 2024). Nigdy nie zaszywaj tych liczb jako progów ani KPI."
---

# Benchmarki reklamowe — indeks i instrukcja czytania

**To materiał REFERENCYJNY, nie reguły i nie cele.** Benchmark odpowiada na pytanie
„gdzie mniej więcej jest rynek", a nie „ile powinno wyjść u tego klienta". Właściwy cel
zależy od oferty, LTV, marży, AOV, sezonu i etapu konta — nie od średniej branżowej.
Nigdy nie zaszywaj tych liczb jako progów w kodzie ani jako twardych KPI w rozmowie
z klientem. Używaj ich jako punktu odniesienia i argumentu kierunkowego.

## Ostrzeżenie o zmienności

Benchmarki zmieniają się **rok do roku, per region i per branża** — czasem o dziesiątki
procent. Przykłady zaobserwowanej zmienności w źródłach:
- CPC w Google Ads rósł r/r dla ~86% branż (średnio +10%, część >25%).
- Meta CPM rósł r/r o ~+20% (dane Triple Whale, 2025 vs 2024).
- CPM na Meta różni się ~4× między krajami (Polska ~$5.5 vs USA ~$23).

Dlatego **każda liczba ma przy sobie ROK i ŹRÓDŁO**. Liczba bez daty i źródła jest
bezwartościowa i nie została zapisana. Zanim zacytujesz benchmark, sprawdź, czy jego
kubełek (platforma × branża × region × rok) pasuje do sytuacji klienta.

## Legenda kubełków

Kubełek = przecięcie czterech wymiarów. Dopasowuj benchmark do sytuacji po wszystkich:

| Wymiar | Wartości w tym pakiecie |
|---|---|
| **Platforma** | Google Search, Meta (Facebook/Instagram) |
| **Cel / typ** | Google Search; Meta: traffic, lead gen, e-commerce (sprzedaż) |
| **Branża / wertykał** | ~23 branże WordStream (usługi/lead gen), ~15 wertykałów e-commerce Triple Whale |
| **Region** | Domyślnie **USA** (WordStream, Triple Whale); osobno CPM/CPC per kraj (w tym Polska) |
| **Rok** | 2024, 2025 (part.), 2026 (projekcje) — zawsze podany w tabeli |

**Uwaga o regionie:** większość tabel poniżej to dane **US**. Dla polskiego klienta
koszty absolutne (CPC, CPM, CPA, CPL) są zwykle **istotnie niższe** — patrz tabela
CPM/CPC per kraj w `meta-ads-ecommerce.md`. Wskaźniki względne (CTR, CVR, ROAS) przenoszą
się lepiej między regionami niż koszty absolutne, ale i tak traktuj je ostrożnie.

## Pliki w tym katalogu

| Plik | Kubełek | Źródło / rok |
|---|---|---|
| `benchmarks/google-ads-search.md` | Google Search, per branża (US) | WordStream 2024 + 2025/2026 agregaty |
| `benchmarks/meta-ads-lead-gen.md` | Meta lead gen + traffic, per branża (US) | WordStream 2024 |
| `benchmarks/meta-ads-ecommerce.md` | Meta e-commerce (ROAS/CPA/CPM), per wertykał (US) + CPM/CPC per kraj | Triple Whale 2025; AdAmigo 2026 (kraje) |

## Jak używać w praktyce

1. **Zidentyfikuj kubełek klienta**: platforma, cel kampanii, branża, region, aktualny rok.
2. **Znajdź najbliższy wiersz** w odpowiednim pliku. Jeśli brak dokładnej branży — użyj
   najbliższej i zaznacz to klientowi.
3. **Skoryguj o region**: dla PL/EU obniż koszty absolutne względem danych US (rząd
   wielkości: PL CPM ~4× niżej niż US na Meta).
4. **Zaznacz rok danych** i to, że rynek mógł się zmienić od publikacji.
5. **Nie mieszaj benchmarku z celem**: „rynek robi X" ≠ „celujemy w X". Cel wynika
   z ekonomii klienta (marża, LTV, próg opłacalności), nie ze średniej.

## Metodologia źródeł (w skrócie)

- **WordStream (LocaliQ)** — dane z własnej platformy, próbki liczone, mediany/średnie
  per branża, głównie rynek US. Google: ~18 tys. kampanii (kwi 2023–mar 2024).
  Facebook: ~2,9 tys. kampanii (luty 2023–kwi 2024), mediany.
- **Triple Whale** — dane pierwotne z platformy analytics e-commerce, ~35 tys. marek,
  pełny rok 2025, mediany. Najmocniejsze źródło dla ROAS/CPA/CPM w e-commerce.
- **AdAmigo.ai** — projekcje CPM/CPC per kraj (2026 na bazie danych z końca 2025);
  analiza własna, nie oficjalne dane Meta — traktować jako rząd wielkości, nie precyzję.
