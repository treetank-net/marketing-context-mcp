---
keywords: [placements, umiejscowienia, Advantage+ placements, manual placements, Reels, Stories, feed, aspect ratio, format, 4:5, 9:16, safe zone]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_set_create, prepare_ad_creative, prepare_ad_set_update, prepare_advantage_creative]
priority: 3
inject: summary
related: [meta-ads/creative-testing-scaling.md, meta-ads/campaign-consolidation-andromeda.md, meta-ads/audiences-targeting.md]
source: ["praktycy: adsuploader, marpipe, superscale, theoptimizer, billo", "Tinuiti 2025"]
summary: "Domyślnie Advantage+ Placements (~10-20% przewagi efektywności vs zła konfiguracja manual); manual tylko z powodu popartego danymi (brand safety, placement systematycznie palący budżet). Na każdą kreację dostarcz 4:5 (1080×1350, feed) i 9:16 (1080×1920, Stories/Reels — ~30-44% wyświetleń); safe zone 9:16: tekst poza górnymi ~14%, dolnymi ~20-35% i ~6% boków. Przy słabym wyniku sprawdź breakdown per placement zanim go wyłączysz — często winny jest brak formatu 9:16, nie placement."
---

# Placements i Advantage+ Placements

Advantage+ Placements vs manual, kiedy warto ograniczać, jakie formaty dostarczyć per placement. Zasada: **domyślnie Advantage+ Placements**, manual tylko z powodu popartego danymi — ale niezależnie od trybu **dostarcz właściwe formaty** (pionowe pod Stories/Reels), inaczej Meta serwuje przycięty asset i traci wolumen.

Źródła: destylacja praktyków (adsuploader, marpipe, superscale, theoptimizer, billo) + benchmark Tinuiti 2025. Progi w ≥2 źródłach chyba że zaznaczono.

## Progi liczbowe (formaty i safe zone)

| Element | Wartość | Zastosowanie |
|---|---|---|
| FEED_RATIO | 4:5 (1080×1350) | Facebook/Instagram Feed, Threads — główny format |
| VERTICAL_RATIO | 9:16 (1080×1920) | Stories, Reels — pełny ekran |
| SQUARE_RATIO | 1:1 (1080×1080) | uniwersalny fallback, słabszy niż 4:5 na feedzie |
| SAFE_ZONE_TOP | ~14% góry | 9:16 — nie umieszczaj tam tekstu/logo |
| SAFE_ZONE_BOTTOM | ~20-35% dołu | 9:16 — strefa UI (CTA, opis) |
| SAFE_ZONE_SIDES | ~6% boków | 9:16 — margines boczny |
| ADV_PLACEMENTS_LIFT | ~10-20% efektywności | przewaga Advantage+ vs zła konfiguracja manual |

## Advantage+ Placements vs manual

- **Advantage+ Placements = domyślne.** Meta rozdziela kreację po wszystkich powierzchniach (Feed, Reels, Stories, Marketplace, Audience Network, Search, Messenger) i alokuje wyświetlenia tam, gdzie tanio konwertuje. Daje więcej wolumenu i danych do nauki — spójne z konsolidacją (patrz `campaign-consolidation-andromeda.md`).
- **Manual placements** tylko z konkretnego, popartego danymi powodu:
  - marka wymaga wykluczenia Audience Network / określonych powierzchni (jakość/brand safety),
  - dane historyczne pokazują, że dany placement systematycznie pali budżet bez konwersji,
  - kreacja fizycznie nie pasuje do placementu (np. tekstowa reklama nie działa w Reels).
- Nie ograniczaj placementów „na wyczucie" — zawężenie zwykle podnosi CPM i zabiera algorytmowi pole optymalizacji. Rozkład wolumenu bywa ~60-70% feed, 20-30% Reels, 10-20% Stories, ale to wynik, nie cel do ręcznego wymuszania.

## Formaty per placement (dostarcz oba)

- **Feed (4:5)**: pionowy 4:5 zajmuje najwięcej ekranu na feedzie FB/IG — preferowany nad 1:1 i 16:9. Jeden asset 4:5 pokrywa większość placementów feedowych.
- **Stories / Reels (9:16)**: pełnoekranowy pion. To ~30-44% wyświetleń (benchmark 2025) — zbyt duży wolumen, by serwować przyciętym assetem feedowym. Przy Advantage+ Placements niemal na pewno serwujesz w Reels/Stories, więc **musisz** dodać 9:16.
- **Safe zone 9:16**: trzymaj tekst i logo poza górnymi ~14% i dolnymi ~20-35% (tam siedzi UI: nick, CTA, opis) oraz ~6% boków. Inaczej przekaz zasłania interfejs.
- Praktyka: użyj **Advantage+ Creative / „adapt to placement"** albo dostarcz osobne assety 4:5 i 9:16 na kreację, zamiast jednego kwadratu na wszystko.

## Zasady operacyjne

- Domyślnie Advantage+ Placements + oba formaty (4:5 i 9:16) na każdą kreację.
- Manual = decyzja poparta danymi z insightów (breakdown per placement), nie założeniem.
- Przy diagnozie słabego wyniku sprawdź breakdown per placement w `get_insights` zanim wyłączysz placement — może problem jest w braku formatu 9:16, nie w samym placemencie.
