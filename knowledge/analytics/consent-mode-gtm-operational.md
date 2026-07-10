---
keywords: [consent mode, consent mode v2, gtm, cmp, zgody, tag assistant, wdrozenie]
applies_to: [analytics, google-ads]
task_type: [workflow, implementation, audit]
trigger_stage: [prompt, preflight]
priority: 5
inject: summary
related: [analytics/consent-mode.md, analytics/ga4-gtm-operational.md, analytics/tracking-consent-health.md]
source: ["https://developers.google.com/tag-platform/security/guides/consent", "https://developers.google.com/tag-platform/security/guides/consent-debugging", "https://developers.google.com/tag-platform/tag-manager/templates/consent-apis"]
summary: "Operacyjny standard wdrożenia Consent Mode v2 przez GTM: stan domyślny przed tagami, aktualizacja po decyzji użytkownika, cztery sygnały zgody, kontrola wbudowanych i dodatkowych wymagań tagów oraz testy wszystkich ścieżek w Tag Assistant i żądaniach sieciowych. Zgoda ma odzwierciedlać decyzję użytkownika i politykę organizacji; Consent Mode nie zastępuje bannera ani oceny prawnej."
---

# Consent Mode v2 w GTM — wdrożenie i odbiór

## Zakres odpowiedzialności

Consent Mode przekazuje tagom Google stan zgody. Nie zbiera zgody, nie projektuje bannera i nie rozstrzyga, jaki stan jest zgodny z prawem. Te decyzje należą do właściciela serwisu i osób odpowiedzialnych za prywatność. Zadaniem wdrożenia jest wierne i terminowe odwzorowanie wyboru użytkownika.

Obsługuj cztery sygnały:

- `analytics_storage` — przechowywanie danych na potrzeby analityki;
- `ad_storage` — przechowywanie danych reklamowych;
- `ad_user_data` — wysyłanie danych użytkownika do Google w celach reklamowych;
- `ad_personalization` — użycie danych do personalizacji reklam.

## Kolejność wdrożenia

1. Ustal mapę kategorii CMP do czterech sygnałów. Każda wartość musi wynikać z rzeczywistego wyboru, a nie z wygody konfiguracji.
2. Ustaw stan domyślny zanim uruchomi się tag wysyłający dane. W GTM korzystaj z mechanizmów Consent Initialization i interfejsów zgód szablonów, nie z przypadkowego zdarzenia dodanego później do `dataLayer`.
3. Po zatwierdzeniu lub zmianie preferencji wyślij aktualizację na tej samej stronie. Nie odkładaj jej do przeładowania ani następnej odsłony.
4. Zachowaj wybór po stronie CMP i odtwórz właściwy stan przy kolejnych odsłonach.
5. W tagach sprawdź wbudowane kontrole zgody. Dodatkowe wymagania ustawiaj tylko wtedy, gdy wynikają z funkcji danego tagu; nadmiarowe blokady mogą zmienić zamierzony tryb pracy Consent Mode.
6. Opublikuj kontener dopiero po odbiorze wariantów zgody i udokumentowaniu wersji.

Jeżeli CMP działa asynchronicznie, oceń mechanizm oczekiwania na aktualizację. Nie dobieraj czasu „na oko”: test powinien potwierdzić, że wartość domyślna pojawia się przed tagami, a aktualizacja dociera przed przejściem na inną stronę.

## Matryca testów

Przeprowadź osobną sesję w czystym profilu przeglądarki dla każdej ścieżki:

| Ścieżka | Co potwierdzić |
|---|---|
| brak wcześniejszego wyboru | stan domyślny jest dostępny przed uruchomieniem tagów |
| akceptacja wszystkich kategorii | wszystkie odpowiadające sygnały przechodzą na `granted` bez przeładowania |
| odrzucenie | sygnały pozostają `denied`, a tagi zachowują się zgodnie z ustawieniami |
| wybór częściowy | mapowanie kategorii nie przyznaje szerszej zgody niż wybrana |
| ponowne otwarcie ustawień | cofnięcie i ponowne nadanie zgody aktualizuje stan |
| kolejna odsłona | CMP odtwarza zapisany wybór i nie powoduje wyścigu z tagami |

W Tag Assistant sprawdź kartę zgód dla najwcześniejszego zdarzenia oraz zdarzenia aktualizacji. Następnie sprawdź żądania sieciowe, by upewnić się, że zachowanie tagów odpowiada stanowi widocznemu w debuggerze. Sam komunikat o uruchomieniu tagu nie jest pełnym dowodem poprawności.

## Kryteria odbioru

- stan domyślny poprzedza zdarzenia pomiarowe;
- aktualizacja następuje bez utraty pierwszej odsłony i bez wymuszonej nawigacji;
- wszystkie cztery sygnały mają udokumentowane mapowanie;
- użytkownik może zmienić decyzję, a zmiana jest respektowana;
- nie ma dwóch niezależnych implementacji zgody konkurujących o stan;
- wersja kontenera, CMP, scenariusze i wyniki testów są zapisane w notatce wdrożeniowej.

Nie uznawaj wdrożenia za poprawne wyłącznie dlatego, że w raportach pojawiają się dane. Odbiór dotyczy zarówno pomiaru, jak i poprawnego respektowania odmowy.
