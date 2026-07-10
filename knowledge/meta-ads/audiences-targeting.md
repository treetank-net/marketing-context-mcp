---
keywords: [audytoria, audiences, custom audience, lookalike, LAL, seed, broad targeting, interest targeting, wykluczenia, exclusions, overlap, Advantage+ audience]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_lookalike_audience, get_audiences, prepare_ad_set_create, prepare_ad_set_update]
priority: 4
inject: summary
related: [meta-ads/account-structure-learning-phase.md, meta-ads/pixel-capi-signal-quality.md, meta-ads/campaign-consolidation-andromeda.md]
source: ["Meta for Developers (Lookalike Audiences)", "praktycy: jetfuel, skai, adligator, adsuploader"]
summary: "Lookalike: seed min 100 osób z jednego kraju, optimum ~1000-5000 (najlepiej ~2000), budowany z top 20-25% klientów wg wartości — jakość seeda bije rozmiar. Start LAL od 1%, po walidacji rozszerzaj do 3-5%, potem 10%. Po Andromedzie/Advantage+ domyślny prospecting to broad + custom audience jako suggestion, nie warstwy interest/LAL. Zawsze wykluczaj obecnych klientów z prospectingu; overlap audytoriów > ~20-30% = auction overlap i sztucznie wyższy CPM — konsoliduj ad sety zamiast mnożyć wąskie warstwy."
---

# Audytoria i targetowanie (Meta)

Custom Audiences, Lookalike (seed, %), broad vs interest po przejściu na Advantage+, wykluczenia i overlap audytoriów. Rdzeń zmiany: po Andromedzie/Advantage+ targetowanie robisz przez **kreację i sygnał** (patrz `creative-testing-scaling.md`, `pixel-capi-signal-quality.md`), a nie przez wąskie warstwy audytoriów.

Źródła: Meta for Developers (Lookalike Audiences), destylacja praktyków (jetfuel, skai, adligator, adsuploader). Progi cytowane w ≥2 źródłach chyba że zaznaczono „1 źródło".

## Progi liczbowe

| Próg | Wartość | Zastosowanie |
|---|---|---|
| LAL_SEED_MIN | ≥ 100 osób z jednego kraju | twarde minimum Meta na źródło lookalike |
| LAL_SEED_TARGET | ~1 000-5 000 (optimum ~2 000) | rekomendowany rozmiar seeda dla jakości |
| LAL_PCT_TIGHT | 1% | najwęższy, najbardziej podobny; start |
| LAL_PCT_MID | 3-5% | rozszerzenie po walidacji zwycięzcy |
| LAL_PCT_BROAD | 10% | maks. zasięg, najniższe podobieństwo |
| CA_ENGAGEMENT_WINDOW | 1-365 dni | okno retencji custom audience (video/IG/FB engagement) |
| SEED_QUALITY_RULE | top 20-25% klientów wg wartości/częstości | jakość seeda > rozmiar seeda |

## Custom Audiences (CA)

- **Źródła własne (najsilniejsze)**: lista klientów (CRM), Pixel/CAPI (odwiedziny, add-to-cart, zakup), aktywność w apce. Sygnał first-party — jakość zależy od Event Match Quality (patrz `pixel-capi-signal-quality.md`).
- **Źródła Meta (engagement)**: obejrzenia wideo, interakcje z profilem IG/FB, otwarcia formularzy lead. Dobre gdy brak ruchu na stronie.
- Typowe zastosowania: **retargeting** (wąskie okno, np. 7-30 dni od add-to-cart), **wykluczenia** (obecni klienci), **seed do lookalike**.
- Jakość seeda dominuje nad rozmiarem: 500 płacących klientów bije 5 000 zapisów do newslettera jako seed. Buduj lookalike z **top 20-25%** klientów (wartość koszyka / częstość zakupu), nie z całej bazy.

## Lookalike (LAL)

- **Seed**: min. 100 osób z jednego kraju (twarde minimum), ale sensowna jakość zaczyna się ~1 000; optimum ~2 000, do ~5 000. Za duży/niejednorodny seed pogarsza wynik — algorytm nie znajduje wspólnego wzorca.
- **Procent** = podobieństwo do seeda w danym kraju: 1% = ~najwęższy, najbardziej podobny 1% populacji; 10% = najszerszy, najmniej podobny. Klasyczny trade-off skala vs trafność.
- **Taktyka**: start 1% (najwyższy match), po walidacji rozszerzaj do 3-5%, potem 10%. Możesz testować 1% / 5% / 10% w osobnych ad setach z równym budżetem i pozwolić danym rozstrzygnąć — ale po Andromedzie preferuj konsolidację (patrz niżej).
- LAL na kraj — lookalike jest zawsze per lokalizacja seeda; multi-kraj = osobne warstwy.

## Broad vs interest po Advantage+

- **Zmiana kierunku**: przy Advantage+ Audience i po Andromedzie warstwy interest/LAL tracą przewagę — algorytm sam znajduje odbiorcę na podstawie kreacji i sygnału konwersji. Wąskie interesty często ograniczają delivery i podnoszą CPM bez zysku na trafności.
- **Rekomendacja praktyków (2025/26)**: zamiast budować lookalike, podaj listę klientów / zaangażowanych jako **custom audience-suggestion** do Advantage+ i pozwól systemowi rozszerzyć. To zastąpiło stary schemat „zbuduj 1% LAL i puść".
- **Broad** (szeroki, minimum ograniczeń) jest dziś domyślną strategią prospectingu przy zdrowym sygnale; interest targeting zostaw dla nisz, gdzie broad nie ma jak trafić (bardzo specyficzne B2B, mały rynek).

## Wykluczenia i overlap

- **Zawsze wykluczaj obecnych klientów** z ad setów prospectingu/lookalike — nie płać za konwersję kogoś, kto już kupił.
- **Overlap audytoriów** (nakładające się audytoria w jednym koncie) powoduje **auction overlap**: własne ad sety licytują przeciw sobie, sztucznie windując CPM. Objaw: kilka wąskich ad setów o podobnym targecie równolegle.
- Diagnoza: narzędzie Audience Overlap w Ads Manager (nakładanie > ~20-30% = ryzyko). Lekarstwo: **konsolidacja** ad setów zamiast mnożenia wąskich warstw (patrz `campaign-consolidation-andromeda.md`).
- Wykluczenia definiuj przez custom audience (np. „kupili w 180 dni"), nie przez ręczne listy interesów.
