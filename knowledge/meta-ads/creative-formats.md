---
keywords: [format kreacji, creative format, single image, video, carousel, karuzela, collection, kolekcja, DPA, katalog, Advantage+ catalog, lead form, instant form, specyfikacja, aspect ratio, dlugosc video, wymogi kreacji]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_creative, prepare_carousel_creative, prepare_video_creative, prepare_lead_creative, prepare_advantage_creative]
priority: 3
inject: summary
related: [meta-ads/placements-advantage-plus.md, meta-ads/creative-testing-scaling.md, meta-ads/objectives-optimization-events.md, meta-ads/audiences-targeting.md, general/case-studies.md, meta-ads/catalog-dpa-advantage.md]
source: ["Meta Business Help (specyfikacje formatów)", "praktycy: adsuploader, superscale, theoptimizer"]
summary: "Każda kreacja musi mieć asset 4:5 (feed) i 9:16 (Stories/Reels), inaczej Meta serwuje przycięty obraz; safe zone 9:16 = tekst poza górnymi ~14% i dolnymi ~20-35%. Limity: obraz min 1080 px / ≤30 MB, video MP4 H.264 ≤4 GB (optimum 15-60 s, Reels ≤ ~30 s, hook w 1. sekundzie + napisy), carousel 2-10 kart z tym samym aspect ratio, primary ~125 zn., headline ~40 zn. Collection i DPA wymagają katalogu i zdrowego Pixel/CAPI; lead form (Instant Form) daje więcej, ale słabszych leadów — dodaj pola kwalifikujące."
---

# Formaty kreacji Meta

Kiedy który format, jego mocne strony i zwięzłe specyfikacje. Format dobierasz do celu (patrz `objectives-optimization-events.md`) i placementu (patrz `placements-advantage-plus.md`) — niezależnie od formatu **dostarcz pion 9:16 i feed 4:5**, inaczej Meta serwuje przycięty asset.

Źródła: Meta Business Help (specyfikacje formatów/placementów per objective), destylacja praktyków (adsuploader, superscale, theoptimizer). Liczby specyfikacyjne bywają aktualizowane przez Meta — traktuj tabelę jako punkt wyjścia, weryfikuj w Ads Manager przy dużych budżetach.

## Specyfikacje techniczne (zwięźle)

| Format | Proporcje (główne) | Rozmiar / długość | Copy (limity widoczne) | Plik |
|---|---|---|---|---|
| Single image | 1:1, 4:5 (feed), 9:16 (Stories/Reels), 1.91:1 (link) | min 1080 px na krótszym boku | primary ~125 zn., headline ~40 zn., description ~25-30 zn. | JPG/PNG, ≤ 30 MB |
| Video | 4:5 / 1:1 (feed), 9:16 (Stories/Reels) | 1 s–241 min (optimum 15-60 s; Reels ≤ ~30 s, Stories ≤ ~15 s/kartę) | jw. | MP4/MOV, H.264+AAC, ≤ 4 GB, ≤ 30 fps |
| Carousel | 1:1 (bezpieczny domyślny), 4:5 na feedzie; **wszystkie karty ten sam ratio** | 2-10 kart; wideo w karcie ≤ ~60 s (rekom. ~15 s) | headline ~40 zn./karta, description ~20 zn./karta, primary ~125 zn. (cała karuzela) | obraz ≤ 30 MB, wideo ≤ 4 GB / karta |
| Collection | cover 1:1 (lub wideo) nad siatką produktów | cover jak image/video | primary ~125 zn. | produkty z katalogu |
| DPA / Advantage+ catalog | dziedziczy z single/carousel | zależne od feedu produktowego | szablony z tokenami katalogu | obrazy z katalogu |
| Lead form (Instant Form) | jak single image/video (kreacja) + formularz na Meta | — | CTA np. SIGN_UP; pola formularza | — |

## Formaty — kiedy który

- **Single image** — najprostszy, najszybszy do produkcji, dobry baseline i do szybkich testów hooków. Mocna strona: skala testów (dużo wariantów tanio). Słabość: mniej „miejsca" na narrację niż wideo/karuzela. Narzędzie: `prepare_ad_creative`.
- **Video** — najsilniejszy do świadomości i storytellingu; algorytm po Andromedzie dobrze czyta wideo. Mocne strony: hook w 1. sekundzie, hold rate, pełny ekran w Reels/Stories. Wymóg: dźwięk (choćby muzyka), pion 9:16 pod Reels. Narzędzie: `prepare_video_creative`.
- **Carousel** — wiele kart (produkty, kroki, cechy, „before/after"). Mocne strony: więcej powierzchni na jednej reklamie, unikalny URL per karta, dobry do e-commerce i edukacji. Wymóg twardy: **spójny aspect ratio wszystkich kart**. Narzędzie: `prepare_carousel_creative`.
- **Collection** — cover (obraz/wideo) nad siatką produktów, otwiera Instant Experience na pełny ekran mobilny. Do e-commerce z katalogiem, mobile-first przeglądanie oferty. Wymaga katalogu.
- **DPA / Advantage+ catalog (dynamiczne reklamy produktowe)** — Meta automatycznie dobiera produkty z katalogu per użytkownik (retargeting „porzucony koszyk" i prospecting). Mocna strona: personalizacja w skali bez ręcznej kreacji per produkt. Warunek: sprawny feed produktowy + sygnał (Pixel/CAPI, patrz `pixel-capi-signal-quality.md`).
- **Lead form / Instant Form** — formularz natywnie na Meta (bez wychodzenia na stronę), niższe tarcie → więcej leadów, ale często niższa jakość. Do celu Leads z conversion location Instant Forms (patrz `objectives-optimization-events.md`). Rozważ pola kwalifikujące / „higher intent form", gdy liczy się jakość. Narzędzie: `prepare_lead_creative`.
- **Advantage+ Creative (asset_feed_spec)** — wiele wariantów obrazu/wideo/tekstu/nagłówka w jednej kreacji; Meta składa i optymalizuje kombinacje per użytkownik i placement (image_crops). Do dywersyfikacji i automatycznej adaptacji do placementu (patrz `placements-advantage-plus.md`, `creative-testing-scaling.md`). Narzędzie: `prepare_advantage_creative`.

## Zasady operacyjne

- **Zawsze dostarcz 4:5 (feed) i 9:16 (Stories/Reels)** na kreację — inaczej Advantage+ Placements serwuje przycięty asset i traci wolumen (patrz `placements-advantage-plus.md`).
- **Safe zone 9:16**: tekst/logo poza górnymi ~14% i dolnymi ~20-35% (tam UI) — dotyczy wideo, single image i kart karuzeli w pionie.
- **Video**: hook w 1. sekundzie, napisy (dużo oglądań bez dźwięku), optimum 15-60 s (Reels krócej).
- **Carousel**: jeden ratio dla wszystkich kart; najlepszą kartę Meta może pokazać jako pierwszą (jeśli włączysz automatyczną kolejność).
- **DPA/Collection**: bez zdrowego katalogu i sygnału nie ruszaj — to warunek konieczny, nie kosmetyka.
- Format dobieraj pod cel i placement, nie „bo ładny"; wariantowość formatów zwiększa dywersyfikację kreacji, na której zależy Andromedzie (patrz `creative-testing-scaling.md`).
