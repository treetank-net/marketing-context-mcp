---
keywords: [task catalog, katalog zadan, rutyny, workflowy, co robic, menu zadan, harmonogram, cadence, dzienne tygodniowe miesieczne kwartalne, jakie taski]
applies_to: [google-ads, meta-ads, analytics]
task_type: [reference]
trigger_stage: [prompt]
priority: 5
inject: summary
related: [general/task-operating-model.md, google-ads/google-ads-daily-check.md, google-ads/google-ads-monthly-review.md, google-ads/google-ads-search-terms-review.md, google-ads/google-ads-creative-refresh.md, google-ads/google-ads-bidding-review.md, google-ads/google-ads-feed-health.md, google-ads/google-ads-quarterly-audit.md, meta-ads/meta-ads-health-check.md, meta-ads/meta-ads-creative-review.md, meta-ads/meta-ads-signal-quality.md, meta-ads/meta-ads-catalog-health.md, analytics/tracking-consent-health.md, policies/policy-disapproval-sweep.md, reporting/monthly-client-review.md, reporting/reporting-refresh.md]
source: ["knowledge/*/ workflow articles (task_type: workflow)"]
summary: "Ludzko-przeglądalne menu wszystkich rutyn (task_type: workflow) dostępnych do instancjonowania jako powtarzalne zadania — pogrupowane po rytmie (weekly/monthly/quarterly) i platformie. Marketingowiec zaczyna tutaj: wybiera rutyny pasujące do klienta, potem list_task_templates → instantiate_task_template / setup_client_tasks tworzą taski pod clients/<slug>/tasks/. Każda pozycja to workflow-artykuł z progami i krokami; to jest odpowiedź na pytanie 'jakie taski mogę w ogóle robić'."
---

# Katalog zadań (task templates)

To menu wszystkich rutyn, które da się włączyć klientowi. Każda pozycja to
artykuł `task_type: workflow` — instancjonujesz ją przez `instantiate_task_template`
(pojedynczo) albo `setup_client_tasks` (paczką). `list_task_templates` zwraca to
samo maszynowo, z filtrem po platformie/intencji. Model bytu: patrz
`general/task-operating-model.md`.

Progi w workflowach są **domyślne** — nadpisujesz je per klient w `procedures/`.

## Google Ads

| Rutyna | Rytm | Robi |
|---|---|---|
| `google-ads/google-ads-daily-check.md` | weekly | Anomalie: zero-spend, niski util, spadki konwersji/ROAS, wyciek PMax |
| `google-ads/google-ads-search-terms-review.md` | weekly | Mining wyszukiwanych haseł → negatywy + nowe intencje |
| `google-ads/google-ads-feed-health.md` | weekly | Merchant Center: odrzucenia, pokrycie, jakość tytułów/atrybutów |
| `google-ads/google-ads-monthly-review.md` | monthly | Negatywy (cross-check 90d), kandydaci do skalowania, frequency |
| `google-ads/google-ads-creative-refresh.md` | monthly | Odświeżenie RSA: Ad Strength, nagłówki, pokrycie intencji |
| `google-ads/google-ads-bidding-review.md` | monthly | Dopasowanie strategii stawek, realizm targetów tCPA/tROAS |
| `google-ads/google-ads-quarterly-audit.md` | quarterly | Audyt struktury i higieny konta, always/never |

## Meta Ads

| Rutyna | Rytm | Robi |
|---|---|---|
| `meta-ads/meta-ads-health-check.md` | weekly | Faza uczenia, delivery, częstotliwość, wydajność zestawów |
| `meta-ads/meta-ads-creative-review.md` | weekly | Testowanie kreacji: kill/scale, pipeline, zmęczenie |
| `meta-ads/meta-ads-signal-quality.md` | monthly | EMQ, deduplikacja pixel+CAPI, pokrycie zdarzeń |
| `meta-ads/meta-ads-catalog-health.md` | monthly | Katalog produktowy / DPA / Advantage+ |

## Analityka i pomiar (cross-cutting)

| Rutyna | Rytm | Robi |
|---|---|---|
| `analytics/tracking-consent-health.md` | monthly | Czy konwersje spływają, Consent Mode v2, jakość sygnału — fundament reszty |

## Zgodność

| Rutyna | Rytm | Robi |
|---|---|---|
| `policies/policy-disapproval-sweep.md` | weekly | Sweep odrzuceń/ograniczeń reklam i kont (GA + Meta) |

## Reporting i klient

| Rutyna | Rytm | Robi |
|---|---|---|
| `reporting/reporting-refresh.md` | weekly | Higiena dashboardów (data source'y, okna dat, blended, widgety) |
| `reporting/monthly-client-review.md` | monthly | Cross-platformowy przegląd na poziomie klienta + deliverable |

## Jak włączyć klientowi

1. Wybierz rutyny pasujące do kanałów i dojrzałości klienta (nie wszystkie na raz).
2. `setup_client_tasks(client_slug, [ścieżki wybranych workflowów])` — utworzy taski
   (recurring, jeśli workflow ma `default_schedule`).
3. Progi per klient → `clients/<slug>/procedures/` nadpisują domyślne.
4. Rytm życia: `list_due_tasks` pokazuje co zaległe, `mark_task_run` domyka cykl.

Sugerowany baseline dla nowego klienta e-commerce (GA + Shopping): daily-check,
search-terms-review, feed-health (weekly) + monthly-review, creative-refresh,
tracking-consent-health (monthly). Dla klienta z Meta dołóż meta-ads-health-check
i meta-ads-creative-review (weekly).
