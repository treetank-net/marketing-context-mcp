---
keywords: [creative testing, testowanie kreacji, meta, skalowanie kreacji, zmeczenie, creative fatigue, ugc, format, kill scale, hook rate]
applies_to: [meta-ads]
task_type: [workflow]
intent: meta_ads_creative_review
default_schedule: weekly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [meta-ads/creative-testing-scaling.md, meta-ads/creative-formats.md, general/copywriting-principles.md, general/task-catalog.md]
source: ["knowledge/meta-ads/creative-testing-scaling.md", "knowledge/meta-ads/creative-formats.md"]
summary: "Cotygodniowy przegląd testowania i rotacji kreacji Meta: decydujesz, które kreacje skalować, a które wygaszać (kill), pilnujesz ciągłego pipeline'u nowych wariantów i wychwytujesz zmęczenie kreacji. Oceniasz wg progów z creative-testing-scaling.md (≥48h i 50+ eventów/wariant na sygnał, 100+ na pewność; nie zabijaj przed progiem istotności), skalujesz zwycięzców stopniowo (+20% co 3-5 dni) i sprawdzasz dywersyfikację formatów. Wynik: decyzje kill/scale + brief na nowe kreacje przez append_task, mutacje przez prepare_* z potwierdzeniem, zapis w append_review."
---

# Workflow: cotygodniowy przegląd kreacji Meta (creative review)

Powtarzalne zadanie: raz w tygodniu przejrzyj testowanie i rotację kreacji na koncie Meta. Cel to trzy decyzje — **które kreacje skalować, które wygaszać (kill), oraz czy pipeline nowych testów jest ciągły** — plus wychwycenie zmęczenia kreacji (creative fatigue), zanim odbije się na wyniku. Kreacja odpowiada za ~56-80% efektu i po Andromedzie to nią targetujesz, więc higiena kreacji jest ważniejsza niż drobne korekty budżetu.

Progi liczbowe bierz z `creative-testing-scaling.md` (nie wymyślaj własnych). Specyfikacje i dobór formatów z `creative-formats.md`. Ocenę tekstów rób wg `general/copywriting-principles.md`.

## Kroki

1. **Zbierz dane z ostatniego tygodnia** per kreacja: wydatek, eventy, CTR, hook rate / thumb-stop (3-sek. view), frequency, CPM, CPA/ROAS. Odfiltruj kreacje, które nie osiągnęły jeszcze progu wiarygodnego testu.
2. **Oceń dojrzałość testu** wg progów: kreacja jest oceniana dopiero po **≥48h (MIN_TEST_RUNTIME)** i **50+ eventach/wariant (sygnał kierunkowy)**; do pewnej decyzji dąż do **100+ eventów/wariant**. Poniżej progu — zostaw, nie decyduj.
3. **Decyzje kill / scale**:
   - **Kill** — kreacja dojrzała (po progu) i wyraźnie przegrywa na CTR/CPA/hook rate względem reszty. Nie zabijaj kreacji przed osiągnięciem progu istotności.
   - **Scale** — zwycięzca po walidacji (dąż do 100+ eventów). Skaluj **stopniowo: +20% budżetu co 3-5 dni (SCALE_STEP)**, monitorując ROAS/CPA/frequency. Nie pauzuj starych kreacji przy dodawaniu nowych; alternatywa to skalowanie horyzontalne (duplikacja ad setu).
4. **Wychwyć zmęczenie kreacji (fatigue)**: sygnały to rosnąca frequency, spadający CTR, rosnący CPM/CPA przy tej samej kreacji. Rotuj kreacje **co 3-4 tygodnie (CREATIVE_REFRESH)** — odświeżaj hooki i propozycje wartości, nie tylko drobne zmiany wizualne.
5. **Sprawdź dywersyfikację formatów** wg `creative-formats.md`: czy w rotacji są różne formaty (video/UGC, statyki, karuzele, Advantage+ Creative), czy każda kreacja ma **4:5 (feed) i 9:16 (Stories/Reels)**, czy video ma hook w 1. sekundzie i napisy. Po Andromedzie liczy się dywersyfikacja hooków/formatów/kątów, nie „głupi wolumen" wariacji tego samego przekazu. Celuj w **15-20 aktywnych reklam różnych hooków (ACTIVE_ADS_ANDROMEDA)**.
6. **Zapewnij ciągły pipeline nowych wariantów**: sprawdź tempo testów wg budżetu — **10-15 wariantów/tydz. przy ≤$100/dzień**, **30+ przy ≥$1000/dzień** — oraz alokację **10-15% budżetu dziennego na testy (TEST_BUDGET_SHARE)**. Utrzymuj podział **60-30-10** (zwycięzcy / wariacje zwycięzców / nowe koncepty). Jeśli pipeline pusty — zaplanuj brief na nowe kreacje.
7. **Oceń teksty** kreacji wg `general/copywriting-principles.md` (hook, jasność propozycji wartości, CTA), zanim zaproponujesz nowe warianty.

## Wynik

- **Decyzje kill/scale** oraz **brief na nowe kreacje** (formaty, hooki, kąty, teksty) zapisz jako zadania przez `append_task` — to feeder do kolejnego cyklu testów.
- **Mutacje na koncie** (kill, zmiana budżetu zwycięzcy, nowe kreacje) wykonuj przez odpowiednik `prepare_*` w pluginie meta-ads-baby (`prepare_ad_create`, `prepare_ad_creative`, `prepare_video_creative`, `prepare_carousel_creative`, `prepare_advantage_creative`, `prepare_budget_change`) — **zawsze z potwierdzeniem** przed `confirm_*`.
- Zapisz podsumowanie przeglądu przez `append_review` (co skalowano, co zabito, stan pipeline'u, sygnały fatigue, następne kroki).
