---
keywords: [creative refresh, odswiezenie reklam, RSA, responsive search ad, naglowki, ad strength, copywriting, rotacja kreacji, zmeczenie reklamy]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_creative_refresh
default_schedule: monthly
trigger_stage: [prompt]
priority: 3
inject: summary
related: [google-ads/search-keywords-copywriting.md, general/copywriting-principles.md, google-ads/always-never-checklist.md, general/task-catalog.md]
source: ["knowledge/google-ads/search-keywords-copywriting.md", "knowledge/general/copywriting-principles.md"]
summary: "Comiesięczny przegląd i odświeżenie kreacji RSA: wyłap reklamy o niskim Ad Strength, słabe lub nieużywane nagłówki, luki w pokryciu intencji i zmęczenie kreacji. Oceń obecne assety wg zasad copywritingu (AIDA, benefit nie cecha, zakaz duplikatów >60% wspólnych słów), zaproponuj nowe warianty i sprawdź spójność z landing page. Mutacje tylko przez prepare_* + safe-word i dopiero po zatwierdzeniu; starej reklamy nie usuwaj, zanim nowa się nie nauczy."
---

# Workflow: Comiesięczne odświeżenie kreacji RSA

Powtarzalne zadanie marketingowca (co miesiąc): przejrzeć responsywne reklamy w sieci wyszukiwania (RSA) i wyłapać te, które wymagają odświeżenia — niski Ad Strength, słabe lub nieużywane nagłówki i opisy, brak pokrycia intencji/USP oraz zmęczenie kreacji (spadający CTR przy stabilnych wyświetleniach). Celem nie jest masowa wymiana wszystkiego, tylko chirurgiczne poprawienie kreacji, które faktycznie osłabiają konto. Reguły oceny i tworzenia treści pochodzą z `general/copywriting-principles.md` i `google-ads/search-keywords-copywriting.md` — ten workflow tylko układa je w procedurę.

## Kroki

1. **Zidentyfikuj RSA do przeglądu.** Wyciągnij obecne kreacje read-toolami z google-ads-baby: `list_ads_entities` (lista reklam w grupach) oraz `get_ad_blueprint` (pełny zrzut nagłówków, opisów, pinów i statusów assetów dla konkretnej reklamy). Priorytet: reklamy o niskim Ad Strength, grupy z mniej niż 3 RSA, oraz reklamy z długim stażem bez zmian.
2. **Oceń obecne nagłówki i opisy.** Dla każdej reklamy sprawdź wg zasad copywritingu:
   - Struktura AIDA na 15 nagłówkach: Attention (1-3) / Interest (4-8) / Desire (9-12) / Action (13-15); rozkład typów — CTA min 3, liczby/dane min 3, dowód społeczny min 2, bezpieczeństwo zakupu min 2, problem/pytanie min 2, logistyka min 2. Brak liczb/finansów/bezpieczeństwa = reklama słaba.
   - Test "co z tego mam?" na każdej linii (benefit, nie cecha); hierarchia benefitów: finansowe > czasowe > bezpieczeństwo > komfort > status > emocjonalne; min. 2 różne typy benefitów w zestawie.
   - Zakaz ogólników bez treści ("Wysoka Jakość", "Profesjonalna Obsługa", "Lider Rynku").
   - Duplikaty: dwa nagłówki o >60% wspólnych słów — jeden do wymiany. Brand 1x, każda kategoria 1x, każde CTA 1x.
   - 4 opisy, każdy inny aspekt (obietnica+CTA / bezpieczeństwo+zaufanie / logistyka+wygoda / dowód+pilność), bez powtarzania nagłówków.
   - Formatowanie: Title Case (wyjątek krótkie przyimki), zakaz długiego myślnika `—`, max 1 wykrzyknik na cały zestaw.
3. **Sprawdź pokrycie intencji i słowa kluczowe.** Czy nagłówki pokrywają USP i najważniejsze intencje grupy? Nagłówek 1 = Keyword Insertion przypięty na pozycji 1 (`{KeyWord:Domyślny Tekst}`, limit 30 zn. bez nawiasów) — tylko dla non-brand/generic/wysoka konkurencja; pomiń dla brand/exact/long-tail/B2B niszowych. W grupach obejmujących wiele kategorii unikaj nagłówków zbyt szczegółowych produktowo.
4. **Zaproponuj nowe warianty.** Wymień lub dopisz nagłówki/opisy tak, by domknąć braki z kroku 2-3: dołóż brakujące typy (liczby, CTA, dowód, bezpieczeństwo), wpleć słowa kluczowe w nagłówki, dopracuj wyraźne CTA. Każdy nowy wariant wnosi nową informację (nie duplikuj istniejących).
5. **Sprawdź spójność z landing page.** Obietnica z nagłówka/opisu musi mieć pokrycie na stronie docelowej. Kliknięcia bez konwersji zwykle oznaczają niedopasowanie obietnicy reklamy do LP — dodaj pre-kwalifikację lub urealnij przekaz. Darmowa dostawa/promocja jako USP tylko przy niskim progu lub bez progu.

## Wynik

- Propozycje zmian zapisz jako `append_task` (co, w której grupie, dlaczego) — do decyzji marketingowca/klienta.
- Nowe lub zmienione RSA twórz **dopiero po zatwierdzeniu** przez `prepare_responsive_search_ad` (nowa reklama) lub `prepare_clone_entity` (klon istniejącej pod modyfikację). Reklama, która działa dobrze, zostaje — nowy wariant testuj równolegle (A/B), nie zamiast.
- **Nie usuwaj starej reklamy, zanim nowa się nie nauczy** (nie zbierze danych) — inaczej tracisz historię i uczenie systemu.
- Podsumowanie przeglądu zapisz przez `append_review` (co przejrzano, co odświeżono, co zostawiono i dlaczego).
- Mutacje wyłącznie przez narzędzia `prepare_*` z potwierdzeniem safe-word; żadnych zmian na koncie bez jawnej akceptacji.
