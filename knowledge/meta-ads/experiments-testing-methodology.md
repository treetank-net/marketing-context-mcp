---
keywords: [eksperyment, experiment, test kampanii, A/B test, split test, test podzielony, conversion lift, brand lift, incrementality, inkrementalność, holdout, grupa kontrolna, control group, overlap, nakladanie audytoriow, istotnosc statystyczna, power, metodologia testow]
applies_to: [meta-ads]
task_type: [review, diagnosis]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_campaign_create, prepare_ad_set_create]
priority: 3
inject: summary
related: [meta-ads/creative-testing-scaling.md, meta-ads/insights-interpretation.md, meta-ads/pixel-capi-signal-quality.md, meta-ads/account-structure-learning-phase.md, meta-ads/budgeting-abo-cbo-advantage.md]
source: ["https://www.facebook.com/business/help/1738164643098669", "https://www.facebook.com/business/help/1159714227408868", "praktycy: AdAmigo, Triple Whale, Elevar, Tatvic, Hunchads"]
summary: "A/B (split) test odpowiada «która strategia wygrywa»: rozłączne grupy, jedna zmienna, równy budżet, power ≥80%. Conversion/brand lift z holdoutem ≥ ~10% audytorium mierzy inkrementalność — ile reklama dołożyła ponad baseline; brand lift trwa 2 tyg.–90 dni. Audytorium testu wyklucz z innych kampanii (przy lift także 28 dni po zakończeniu); nie zmieniaj budżetu/kreacji/targetu w trakcie i nie testuj nieformalnym on/off ad setów. Do decyzji «ciąć czy nie retargeting» potrzebny lift, nie A/B ani surowy ROAS z view-through."
---

# Metodologia testów kampanii Meta (Experiments)

Testy na poziomie **kampanii/strategii** — odrębne od testowania kreacji. Testowanie kreacji (ile wariantów, kill criteria, refresh) jest w `creative-testing-scaling.md`; tu chodzi o **metodę** porównania dwóch strategii (audytorium, placement, ASC vs manual) i o mierzenie **inkrementalności** (czy reklama faktycznie coś dodała).

Dwie różne rzeczy: **A/B/split test** mówi „która wersja wygrywa"; **lift test (holdout)** mówi „ile reklama faktycznie dołożyła ponad to, co i tak by się stało". Nie myl ich — patrz tabela.

Źródła: Meta Business Help („About A/B testing", „A/B test types available"), destylacja praktyków (AdAmigo, Triple Whale, Elevar, Tatvic, Hunchads). Progi liczbowe od Meta chyba że oznaczono „praktycy".

## Wybór testu (progi na górze)

| Test | Pytanie | Mechanika | Kiedy | Kluczowe wymogi |
|---|---|---|---|---|
| A/B (split) test | Która wersja strategii wygrywa? | audytorium dzielone na **rozłączne** grupy, nikt nie widzi obu wersji | porównanie 2 strategii (audytorium/placement/ASC vs manual/kreacja) | równy budżet obu wersji, power ≥ 80% |
| Conversion lift | Ile konwersji **dołożyła** reklama (inkrementalność)? | Meta losuje **exposed** vs **holdout** (nie widzi reklam), mierzy różnicę konwersji | gdy podejrzewasz, że retargeting/broad zbiera „i tak-kupujących" | holdout ≥ ~10% audytorium, wolumen konwersji |
| Brand lift | Wzrost recall / awareness / intencji? | holdout + **ankiety** w FB/IG do obu grup | cele górnego lejka (świadomość), duże budżety | wystarczające wyświetlenia, czas 2 tyg.–90 dni |

## A/B (split) test — co i jak

- **Idea**: dwie wersje różniące się **jedną zmienną** (kreacja, audytorium albo placement); Meta dzieli audytorium na **losowe, rozłączne** grupy i gwarantuje, że nikt nie widzi obu. Wynik na bazie „cost per result" lub „cost per conversion lift".
- **Tworzenie** (Meta): pasek narzędzi Ads Manager (zaznacz kampanię/ad set → A/B test), narzędzie Experiments, albo duplikacja kampanii/ad setu/reklamy z jedną zmianą. `Custom` = duplikat + dowolna edycja zmiennej.
- **Hipoteza najpierw**: „custom audience pobije interest-based" — potem dobierasz zmienną. Bez hipotezy test nie ma metryki sukcesu.
- **Równy budżet obu wersji** — inaczej porównanie nie jest fair.
- **Power ≥ 80%** (Meta): kalkulacja mocy sugeruje szansę na wynik przyczynowy; celuj w ≥ 80%. Za mały budżet/audytorium → power spada, wynik nierozstrzygalny.
- **NIE testuj nieformalnie** (ręczne włączanie/wyłączanie ad setów) — prowadzi do nakładania audytoriów i niewiarygodnych wyników; po to jest narzędzie, żeby audytoria były równo i rozłącznie podzielone.

## Conversion lift / brand lift (holdout)

- **Holdout** = grupa, której **celowo nie pokazujesz** reklam; różnica konwersji exposed vs holdout to inkrement. To odróżnia lift od A/B — w A/B **nie** wstrzymujesz żadnego segmentu.
- **Conversion lift**: Meta automatycznie randomizuje test/control, mierzy różnicę w konwersjach. Odpowiada na „czy w ogóle warto" (np. czy retargeting nie płaci za osoby, które i tak by kupiły).
- **Brand lift**: holdout + ankiety (ad recall, brand awareness, purchase intent) — do górnego lejka. Wymaga dużych wyświetleń, żeby ankiety zebrały istotność.
- **Holdout ≥ ~10%** audytorium dla istotności (praktycy); split utrzymywany przez cały okres testu.

## Wymogi wspólne

- **Rozłączność audytoriów**: audytorium testowe **nie może być używane w innych aktywnych kampaniach** w trakcie testu — nakładanie „skaża" wynik i psuje delivery. Przy lift/brand lift wyklucz audytorium testu również do **28 dni po** zakończeniu.
- **Budżet**: dość duży, by test zebrał istotność (power ≥ 80%); równy między wersjami.
- **Czas**: nie oceniaj przedwcześnie. Brand lift: 2 tygodnie–90 dni. Ogólnie daj testowi wyjść z fazy uczenia i zebrać wolumen (patrz `account-structure-learning-phase.md`).
- **Stabilność w trakcie**: nie zmieniaj targetowania, kreacji ani budżetu podczas testu — każda zmiana psuje porównywalność (i resetuje fazę uczenia).
- **Sygnał**: lift/conversion mierzy konwersje — najpierw upewnij się, że sygnał jest czysty (deduplikacja, EMQ), inaczej mierzysz szum (patrz `pixel-capi-signal-quality.md`).

## Pułapki (najczęstsze)

- **Overlap audytoriów** — ta sama grupa w teście i w innej kampanii; klasyczna przyczyna „test nic nie pokazał". Wyklucz audytorium testu z reszty konta.
- **Za krótki okres / za mały budżet** — power < 80%, wynik statystycznie nierozstrzygalny; „wygrana" to szum. Sprawdź power przed startem, nie po.
- **Zła metryka** — porównywanie po surowym ROAS z view-through zamiast po cost per result / conversion lift zawyża i myli (patrz `insights-interpretation.md`). Do lift patrz na inkrement, nie na raportowane konwersje.
- **Testowanie wielu zmiennych naraz** w A/B — nie wiesz, co zadziałało; jedna zmienna na test.
- **Zmiana w trakcie** (budżet/kreacja/audytorium) — unieważnia porównanie i resetuje fazę uczenia.
- **Mylenie A/B z lift** — A/B: „która lepsza"; lift: „czy w ogóle działa ponad baseline". Do decyzji „ciąć czy nie retargeting" potrzebny lift, nie A/B.
- **Nieformalne on/off zamiast narzędzia** — nakładanie audytoriów, nierówny podział, wynik bezwartościowy.

## Zasady operacyjne

- Najpierw zdefiniuj hipotezę i metrykę sukcesu, potem wybierz test (A/B vs lift) wg pytania z tabeli.
- Sprawdź power ≥ 80% i budżet **przed** startem; wyklucz audytorium testu z pozostałych kampanii.
- Nie dotykaj ustawień w trakcie; oceniaj dopiero po zebraniu wolumenu i wyjściu z fazy uczenia.
- Do inkrementalności (czy warto dany kanał/etap lejka) używaj conversion lift, nie porównania ROAS między kampaniami.
