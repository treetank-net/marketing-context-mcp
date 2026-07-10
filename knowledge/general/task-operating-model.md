---
keywords: [task, zadanie, workflow, backlog, source_type, recurring, review, follow-up]
applies_to: [general, google-ads, meta-ads, analytics, reporting]
task_type: [reference, workflow]
trigger_stage: [prompt, preflight, postflight]
priority: 5
inject: summary
related: [general/task-catalog.md, general/decision-log-fields.md, reporting/monthly-client-review.md]
source: ["src/storage.ts", "knowledge/general/task-catalog.md", "knowledge/general/decision-log-fields.md"]
summary: "Repozytoryjny model pracy z zadaniami: zadanie jest trwałym zapisem intencji, zakresu i pochodzenia, a nie samą notatką. Jednorazowe zadania przechodzą przez stan wykonania, cykliczne zachowują harmonogram i kolejny termin; przeglądy tworzą konkretne follow-upy z dowodem, priorytetem i właścicielem. Zmiana statusu nie zastępuje weryfikacji wyniku ani dziennika decyzji."
---

# Model operacyjny zadań

## Czym jest zadanie

Zadanie zapisuje pracę, do której należy wrócić w kontekście konkretnego klienta. Powinno wyjaśniać intencję, powód, zakres i pochodzenie. Luźna obserwacja staje się zadaniem dopiero wtedy, gdy da się wskazać oczekiwany rezultat lub następną decyzję.

Minimalny użyteczny zapis obejmuje:

- tytuł opisujący działanie lub decyzję;
- klienta i, gdy dotyczy, platformę oraz konto;
- priorytet wynikający z wpływu i pilności;
- powód oraz dowód źródłowy;
- właściciela lub osobę, od której zależy dalszy krok;
- termin albo harmonogram;
- właściwy workflow i wiedzę potrzebną przed wykonaniem.

Pole źródła zachowuje pochodzenie zadania: ręczne zgłoszenie, przegląd, raport albo inny proces. Nie wpisuj w nim wniosku; wniosek umieść w treści wraz z kontekstem.

## Cykl życia

Zadanie jednorazowe jest otwarte do czasu wykonania, odrzucenia lub świadomego zamknięcia. Zadanie cykliczne pozostaje aktywne, a każde wykonanie zapisuje datę, wynik i kolejny termin. Nie twórz nowej kopii cyklicznego zadania przy każdym przebiegu, jeżeli system potrafi przesunąć `next_due`.

Status informuje o stanie pracy, lecz nie dowodzi efektu. Zamykając zadanie, dopisz krótki rezultat i odwołanie do artefaktu, zmiany albo decyzji. Jeżeli wykonanie ujawniło osobny problem, utwórz nowe, węższe zadanie zamiast rozszerzać pierwotny zakres bez końca.

## Od przeglądu do follow-upu

Przegląd powinien kończyć się uporządkowaną listą ustaleń:

1. potwierdzone nieprawidłowości wymagające działania;
2. hipotezy wymagające dalszej analizy lub eksperymentu;
3. decyzje potrzebne od klienta;
4. obserwacje bez działania, które wystarczy zapisać w raporcie.

Twórz zadanie tylko dla pozycji z następnym krokiem. W tytule unikaj „sprawdzić konto”; wskaż obiekt i intencję, na przykład „zweryfikować utratę zdarzenia zakupu po zmianie CMP”. Dołącz zakres dat, identyfikator obiektu i link lub ścieżkę do dowodu, jeśli są dostępne.

## Priorytet i zależności

Najpierw obsługuj problemy z dostępem, bezpieczeństwem, niekontrolowanym wydatkiem i wiarygodnością pomiaru, ponieważ mogą unieważnić dalszą analizę. Pozostałe zadania porządkuj według wpływu na cel, kosztu zwłoki, pewności diagnozy i odwracalności działania. Priorytet nie powinien wynikać wyłącznie z tego, że platforma wyświetla ostrzeżenie.

Zapisuj zależności wprost. Jeśli rekomendacja optymalizacyjna wymaga naprawy trackingu lub decyzji o ofercie, zadanie wykonawcze nie jest jeszcze gotowe.

## Dyscyplina wykonania

Przed rozpoczęciem odczytaj aktualny kontekst klienta i treść zadania. Po wykonaniu zweryfikuj stan docelowy. Mutacje reklamowe przeprowadzaj zgodnie z mechanizmem przygotowania i potwierdzenia właściwego pluginu; utworzenie zadania nie jest zgodą na zmianę konta.

Nie usuwaj historii, gdy zmienia się kierunek. Notatki wykonania i dziennik decyzji pozwalają później odróżnić błędną hipotezę od błędnego wdrożenia.
