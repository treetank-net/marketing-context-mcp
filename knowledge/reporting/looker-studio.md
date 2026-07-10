---
keywords: [looker studio, dashboard, raport, data source, credentials, freshness, blend]
applies_to: [reporting, analytics, google-ads, meta-ads]
task_type: [reference, implementation, audit]
trigger_stage: [prompt, review]
priority: 3
inject: summary
related: [reporting/monthly-client-review.md, reporting/reporting-refresh.md, analytics/tracking-consent-health.md]
source: ["https://docs.cloud.google.com/looker/docs/studio/manage-data-freshness", "https://docs.cloud.google.com/looker/docs/studio/data-credentials", "https://docs.cloud.google.com/looker/docs/studio/share-reports", "https://docs.cloud.google.com/looker/docs/studio/create-edit-and-manage-data-sources"]
summary: "Standard raportu w Looker Studio: każda strona odpowiada na pytanie decyzyjne, źródła i poświadczenia mają jawnego właściciela, definicje metryk są spójne, a świeżość danych i filtry są widoczne. Przed udostępnieniem trzeba sprawdzić zakres dat, łączenia, kontrolki, dostęp odbiorcy i zgodność sum kontrolnych ze źródłem."
---

# Looker Studio — projektowanie i utrzymanie raportu

## Raport jako narzędzie decyzji

Zanim dodasz wykres, zapisz pytanie, na które ma odpowiadać dana strona. Dobieraj wizualizację do relacji: karta pokazuje stan, szereg czasowy zmianę, tabela szczegół i możliwość kontroli, a wykres udziałów tylko rzeczywistą strukturę całości. Nie powielaj tej samej liczby w kilku formach bez dodatkowej funkcji.

Typowy porządek raportu:

- podsumowanie celu i najważniejszych zmian;
- wynik biznesowy oraz jakość pomiaru;
- wkład kanałów i kampanii;
- diagnoza elementów wymagających decyzji;
- działania, właściciele i terminy.

## Źródła i definicje

Dla każdego źródła zapisz właściciela, konektor, zakres danych, poświadczenia, strefę czasową i ograniczenia. Nazwy pól w raporcie powinny odzwierciedlać ich znaczenie, a nie techniczną nazwę z konektora. Pola obliczeniowe tworzone na poziomie źródła stosuj dla definicji wspólnych; pole wykresu pozostaw dla lokalnego wyjątku.

Przy łączeniu danych określ klucze i oczekiwaną liczność relacji. Sprawdź, czy blend nie zwielokrotnia wierszy ani nie usuwa rekordów bez dopasowania. Metryk z różnych systemów atrybucji nie sumuj tak, jakby były jednym źródłem prawdy.

## Świeżość i wiarygodność

Looker Studio może obsługiwać zapytania z pamięci do czasu przekroczenia ustawienia świeżości źródła. Ręczne odświeżenie raportu resetuje świeżość źródeł użytych w raporcie, ale nie naprawia opóźnienia w systemie źródłowym. Wyświetlaj zakres dat i moment aktualizacji, gdy wpływają na interpretację.

Przed publikacją porównaj sumy kontrolne z interfejsem lub eksportem źródłowym dla ustalonego zakresu. Sprawdź osobno wartości po zastosowaniu filtrów, ponieważ poprawny wynik globalny nie dowodzi poprawności wszystkich przekrojów.

## Dostęp i poświadczenia

Poświadczenia źródła decydują, czy dane są pobierane z uprawnieniami właściciela, czy widza. Wybór ma konsekwencje dla dostępu i poufności. Stosuj najmniejszy potrzebny zakres uprawnień, używaj konta należącego do organizacji i testuj widok jako docelowy odbiorca. Samo udostępnienie raportu nie gwarantuje dostępu do wszystkich źródeł.

Nie umieszczaj w filtrach, parametrach ani opisach informacji, których odbiorca raportu nie powinien zobaczyć. Przy zmianie właściciela konta lub konektora zaplanuj przekazanie poświadczeń i test ciągłości.

## Odbiór raportu

Sprawdź:

- domyślny zakres dat, porównanie i strefę czasową;
- działanie kontrolek na każdej stronie;
- definicje i formaty walut, procentów oraz wartości brakujących;
- zgodność filtrów między wykresami;
- sumy kontrolne i przypadki brzegowe blendów;
- świeżość i błędy konektorów;
- widok na typowym ekranie oraz eksport do PDF, jeżeli jest używany;
- uprawnienia na koncie bez praw edytora.

Każda istotna zmiana definicji metryki powinna mieć datę, autora i krótkie uzasadnienie. Bez tego ciągłość wykresu może być pozorna.
