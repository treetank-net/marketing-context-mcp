---
keywords: [search terms, wyszukiwane hasla, negatywy, negative keywords, mining fraz, dopasowania, marnowanie, intencja]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_search_terms
default_schedule: weekly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/search-keywords-copywriting.md, google-ads/google-ads-monthly-review.md, google-ads/google-ads-api-gotchas.md, general/task-catalog.md]
source: ["knowledge/google-ads/search-keywords-copywriting.md", "knowledge/google-ads/google-ads-api-gotchas.md"]
summary: "Cotygodniowy mining raportu wyszukiwanych haseł: znajdź frazy wysokokosztowe bez konwersji i nietrafione intencyjnie (kandydaci na negatywy) oraz frazy-perełki warte wydzielenia do własnej grupy/kampanii. Punkt startu to read-tool get_search_terms_waste_candidates (cross-check 90d). Negatywy dopiero przez prepare_negative_keywords PO zatwierdzeniu, nowe intencje przez append_task, zapis przez append_review. Uwaga na pułapki API (negative=FALSE, shared_criterion.text)."
---

# Workflow: cotygodniowy przegląd wyszukiwanych haseł (search terms review)

Cotygodniowy mining raportu wyszukiwanych haseł ma dwa cele naraz: wyłapać marnowanie budżetu (nowe negatywy) i wychwycić nowe intencje, które konwertują i zasługują na własną grupę reklam lub kampanię. To zadanie powtarzalne — uruchamiane co tydzień na aktywnych kampaniach Search.

## Kroki

1. **Pobierz kandydatów na negatywy.** Punkt startu to read-tool `get_search_terms_waste_candidates` z google-ads-baby — liczy kandydatów na negatywy z cross-checkiem 90-dniowym (frazy, które konsekwentnie kosztują bez zwrotu, a nie jednorazowy szum). Traktuj to jako listę wejściową, nie werdykt.
2. **Frazy wysokokosztowe bez konwersji.** Przejrzyj hasła generujące koszt bez żadnej konwersji. Próg wykluczenia: fraza generuje ~2x więcej kliknięć niż potrzeba do konwersji przy aktualnym CVR konta (patrz `search-keywords-copywriting.md`).
3. **Frazy nietrafione intencyjnie.** Wyłap hasła, które w ogóle nie pasują do oferty (zła intencja, praca/darmowe/DIY/konkurencja) — kandydaci na negatywy nawet bez wysokiego kosztu.
4. **Frazy-perełki.** Zaznacz hasła, które konwertują i mają spójną własną intencję — kandydaci do wydzielenia do osobnej grupy reklam lub kampanii z dedykowanym RSA i landingiem.
5. **Sprawdź typy dopasowań.** Zweryfikuj, czy match type keywordów łapiących te frazy jest właściwy: CPC > 10 zł → exact, CPC < 10 zł → phrase; negatywy 1 słowo → broad, 2+ słowa → phrase, Brand → exact.

## Pułapki API (patrz google-ads-api-gotchas.md)

- Listowanie search terms / keywordów przez `ad_group_criterion` miesza positive i negative — zawsze filtruj `ad_group_criterion.negative = FALSE`, inaczej dostaniesz fałszywe „słabe frazy do wstrzymania".
- Istniejące negatywy z `shared_criterion` czytaj przez pole `text`, nie `keyword_text`; account-level negative lists (`shared_set` type=4) sprawdź, żeby nie proponować duplikatu.

## Wynik

- **Negatywy** — przygotuj przez `prepare_negative_keywords` **dopiero PO zatwierdzeniu** listy przez marketingowca. Nigdy nie dodawaj negatywów automatycznie na podstawie samego raportu.
- **Nowe intencje** — frazy-perełki warte wydzielenia zapisz jako `append_task` (np. „wydzielić frazę X do własnej grupy/kampanii"), nie mutuj struktury w tym przebiegu.
- **Zapis przeglądu** — udokumentuj wynik tygodniowego przeglądu przez `append_review` (co przejrzano, co zatwierdzono, co odłożono).
- **Mutacje** tylko przez narzędzia `prepare_*` + safe-word — żadnych zmian bez potwierdzenia.
