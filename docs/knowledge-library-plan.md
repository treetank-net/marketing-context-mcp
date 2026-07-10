# Plan budowy biblioteki wiedzy (scraping + kuracja)

Cel: kompletna, aktualna encyklopedia wiedzy o prowadzeniu kont Google/Meta Ads,
zgodna z formatem `marketing-context-mcp` (Markdown + frontmatter v2), gotowa do
auto-injectu. Osobny track od pracy nad softem (patrz `auto-inject-plan.md`).

## Zasada nadrzędna

Dla „jak dobrze prowadzić konto" **nie istnieje jedno kanoniczne źródło** (inaczej
niż dla dokumentacji bibliotek w context7). Oficjalne docsy opisują *co platforma
robi i co wolno*, nie *jak zarabiać*. Dlatego biblioteka = **kurowany blend**, a nie
masowy scrape. Rdzeniem są jawnie udokumentowane źródła pierwotne, własne
workflow i logi klienckie; materiały zewnętrzne dokładamy selektywnie wg roli
i zgodnie z `knowledge-provenance-policy.md`.

Każdy tier ma inną metodę pozyskania i inny cel — nie traktować jednakowo.

## Tier 0 — własna wiedza (najwyższy priorytet, zero scrapingu)

- **Własne workflow**: procedury wynikające z interfejsów tego repo, z domyślnymi
  parametrami wyraźnie oznaczonymi jako decyzje projektowe.
- **Luki platformowe**: uzupełniane z dokumentacji first-party i niezależnie
  napisanych syntez praktyk (patrz Tier 1 i Tier 2).
- **Logi klienckie**: generowane przez `append_*`; nie scrape — to najwyższy sygnał
  kontekstowy, którego nie da żadne źródło zewnętrzne.

## Tier 1 — oficjalne first-party (kanon faktów; scrape + refresh)

Cel: mechanika produktu, polityki, limity, definicje — tam gdzie halucynacja jest
kosztowna. `risk_level: high`, `inject: summary`.

| Źródło | URL | Metoda |
|---|---|---|
| Google Ads Help | support.google.com/google-ads | sitemap → scrape → destylacja |
| Google Ads Policies | support.google.com/adspolicy | scrape sekcji polityk |
| Meta Advertising Standards | transparency.meta.com/policies/ad-standards | scrape |
| Google Ads / Meta blogi produktowe | (oficjalne blogi) | RSS/scrape, monitoring zmian |
| Skillshop / Meta Blueprint | skillshop.withgoogle.com / Blueprint | za loginem → półautomat/ręcznie |

Uwaga: **ani Google, ani Meta nie mają `llms.txt`** dla docsów pomocy. Live-fetch
w stylu context7 odpada — trzeba scrape sitemap → oczyścić → zdestylować. To robota
jednorazowa + **refresh cykliczny** (docsy się starzeją, blogi to sygnał zmian).

## Tier 2 — praktycy i agencje (właściwa wiedza „jak prowadzić")

Cel: strategia, progi, sekwencje decyzji. **Kuracja, nie masowy scrape** — jakość
skrajnie różna, dużo SEO-waty i powtórzeń.

Metoda: na temat wybrać 5-8 artykułów-filarów → przeczytać → **zdestylować do
jednego pliku MD** z frontmatter v2. Ręczna kuracja > 100 zescrapowanych postów.

Źródła referencyjne:
- **WordStream** — benchmarki branżowe (CPC/CTR/CVR), frameworki budżetowe → progi.
- **Search Engine Land / Search Engine Journal** — analizy, zmiany, strategia.
- **AdEspresso** — data-driven eksperymenty Meta (formaty, audytoria).
- **Audyt-frameworki** — checklisty (hierarchia konta → conversion setup → negative
  keyword hygiene; ~8 kategorii). → `task_type: [review, diagnosis]`.
- **Meta struktura** — ABO vs CBO, learning phase (~50 eventów/7 dni, edycja >20%
  resetuje), testowanie → skalowanie. → wypełnia lukę `meta-ads/`.

Priorytet dziur do zdestylowania: Meta ABO/CBO/scaling, audyt-checklisty, GA4/GTM/
Consent Mode szczegóły, Looker Studio.

## Tier 3 — community / tacit + materiał referencyjny

- **r/PPC, r/FacebookAds** — „gotchas", świeże zmiany zachowania platform. Kuracja
  ręczna do plików `keywords`-owanych.
- **Ad Library / Transparency Center** (Meta + Google) — mają API/scrapery (SerpApi,
  Apify). To **nie wiedza „jak"**, ale materiał na przykłady kreacji per branża/klient.

## Pipeline scrapingu → biblioteka

```
[źródło] → [pobranie] → [oczyszczenie] → [destylacja do MD+frontmatter v2]
        → [gate jakości/dedup] → knowledge/<sekcja>/ → [refresh cron]
```

1. **Pobranie**: sitemap/RSS (Tier 1), ręczny wybór URL (Tier 2/3), API (Ad Library).
2. **Oczyszczenie**: usunięcie nawigacji/marketingu (jak `llms.txt` — czysta treść).
3. **Destylacja**: skrót do konkretu operacyjnego, tabele progów na górze, `summary`
   1-zdaniowe, `keywords` PL+EN, przypisanie `applies_to`/`task_type`/`trigger_tools`.
4. **Gate jakości**: dedup względem istniejących docsów (podobieństwo tytuł+keywords),
   odrzucenie treści bez konkretu. Log tego, co pominięto (bez cichych obcięć).
5. **Zapis**: do właściwej sekcji `knowledge/`, PR-owalny diff.
6. **Refresh**: cron per tier — Tier 1 (polityki/docsy) co kwartał + monitoring
   blogów; Tier 2/3 ad hoc.

## Struktura docelowa katalogów

```
knowledge/
  general/     # cross-platform: copywriting, filozofia, komunikacja z klientem
  google-ads/  # dokumentacja i workflow Google Ads
  meta-ads/    # dokumentacja i workflow Meta Ads
  analytics/   # GA4/GTM/Consent Mode (dziś rozproszone/skrótowe)
  reporting/   # Looker Studio, język raportów
  policies/    # Tier 1: polityki Google/Meta, risk_level: high
  clients/     # per-klient, generowane przez append_*
```

## Kolejność wg ROI

1. **Zamknięcie audytu provenance** i independent-source rewrite plików legacy.
2. **Rozbudowa `meta-ads/`** (Tier 1 + Tier 2 ABO/CBO/scaling).
3. **Tier 1 kanon** do `policies/` + `analytics/` (scrape + destylacja, refresh).
4. **Tier 2 kuracja** dziur (audyt, GA4/GTM/Consent Mode, Looker Studio).
5. **Tier 3** — Ad Library jako źródło przykładów kreacji (API), community ad hoc.

## Zależność od softu

Biblioteka jest bezużyteczna bez auto-injectu i odwrotnie. Kolejność łączona:
najpierw dokończyć **P0 z `auto-inject-plan.md`** (żeby wiedza żyła), równolegle
Tier 0 (bo i tak trzeba treści do testów injectu), potem reszta tierów pod gotowy
mechanizm i frontmatter v2.
