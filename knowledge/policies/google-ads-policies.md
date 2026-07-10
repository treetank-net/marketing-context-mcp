---
keywords: [google ads policies, polityki reklamowe, prohibited content, prohibited practices, restricted content, editorial, zabronione, ograniczone, odrzucenie reklamy, disapproved, misrepresentation, malware, trademark, editorial requirements]
applies_to: [google-ads]
task_type: [review, mutation]
risk_level: high
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_responsive_search_ad, prepare_responsive_display_ad, prepare_ad_group, prepare_display_ad_group, prepare_search_campaign, prepare_display_campaign, prepare_performance_max_campaign, prepare_asset_group_assets]
priority: 4
inject: summary
related: [policies/meta-advertising-standards.md]
source: ["https://support.google.com/adspolicy/answer/6008942"]
summary: "Cztery obszary: prohibited content (podróbki, broń, narkotyki, tytoń, hate), prohibited practices (malware, cloaking, phishing, ukrywanie kosztów i opłat), restricted content (alcohol, gambling, healthcare, finance, crypto, dating — wymagają certyfikacji Google, dozwolonych krajów i disclosure; nigdy nie targetować małoletnich) oraz editorial/technical (zakaz vague phrases typu «Buy products here» i gimmicków «F-R-E-E»; display URL zgodny z landing page). Naruszenie = disapproval, powtórzenia = suspension konta (strike system)."
---

# Google Ads Policies — kanon polityk reklamowych

Źródło oficjalne: https://support.google.com/adspolicy/answer/6008942 („Welcome to the Google Advertising Policies Center"). Tier 1 — cytuj wiernie. Wersja angielska jest oficjalna do egzekwowania (tłumaczenia nie zmieniają treści). Enforcement: Google AI + human review; strike system dla powtarzających się naruszeń.

## Cztery obszary polityk

| Obszar | Co obejmuje | Skutek naruszenia |
|---|---|---|
| Prohibited content | Treść, której NIE wolno reklamować w Google Network | Disapproval; suspension przy powtórzeniach/rażących |
| Prohibited practices | Zachowania zabronione reklamodawcy | Disapproval / suspension konta |
| Restricted content & features | Treść dozwolona z ograniczeniami | Ograniczona emisja; wymóg certyfikacji/targetowania |
| Editorial & technical | Standardy jakości reklam/stron/aplikacji | Disapproval |

- Naruszenie → napraw reklamę lub złóż appeal (wymaga zalogowania do konta Google Ads).
- Reklamodawca zawsze odpowiada za zgodność z prawem lokalnym we WSZYSTKICH targetowanych lokalizacjach.

## Prohibited content (całkowicie zabronione)

- **Counterfeit goods** — sprzedaż/promocja podróbek (trademark/logo identyczne lub nieodróżnialne).
- **Dangerous products or services** — narkotyki (chemiczne/ziołowe), substancje psychoaktywne, sprzęt do zażywania, broń/amunicja/materiały wybuchowe/fajerwerki, instrukcje wytwarzania, wyroby tytoniowe.
- **Enabling dishonest behavior** — hacking software/instrukcje, sztuczne zawyżanie ruchu, fałszywe dokumenty, usługi ściągania/oszustw akademickich.
- **Inappropriate content** — treść szokująca, hate/dyskryminacja/przemoc, bullying, okrucieństwo wobec zwierząt, self-harm, profanity, sexual exploitation of minors.

## Prohibited practices (zabronione zachowania)

- **Abusing the ad network** — malware, **cloaking** (ukrywanie prawdziwej destynacji), arbitrage, bridge/gateway pages, manipulowanie ustawieniami by obejść review, wyłudzanie endorsementów społecznościowych.
- **Data collection and use** — nieodpowiedzialne zbieranie danych (np. karta kredytowa po non-secure server), obietnice znajomości orientacji/statusu finansowego usera; przy personalized advertising (remarketing, custom audiences) obowiązują dodatkowe polityki.
- **Misrepresentation** — ukrywanie kosztów/warunków rozliczeń, oprocentowania i opłat; brak wymaganego tax/licence number/kontaktu/adresu; oferty niedostępne; nierealne obietnice weight loss/financial gain; zbiórki pod fałszywym pretekstem; **phishing**.

## Restricted content & features (dozwolone warunkowo)

Wymagają certyfikacji Google, targetowania dozwolonych krajów, ograniczeń wiekowych i/lub landing page z odpowiednimi disclosure. **Nigdy nie targetować małoletnich.**

- **Sexual content** — ograniczone, zależne od zapytania/wieku/prawa lokalnego.
- **Alcohol** — brak targetowania minors; tylko dozwolone kraje.
- **Copyrights** — tylko autoryzowana treść; wymagana certyfikacja.
- **Gambling and games** — certyfikacja Google, dozwolone kraje, landing page z responsible gambling, nie minors.
- **Healthcare and medicines** — część niedozwolona całkowicie; reszta wymaga certyfikacji domeny i dozwolonej lokalizacji (label „Eligible (limited)").
- **Political content** — zgodność z prawem wyborczym, w tym „silence periods".
- **Financial products and services** — zgodność z regulacjami lokalnymi, wymagane disclosure (koszty/oprocentowanie).
- **Cryptocurrencies** — większość wymaga certyfikacji Google (exchanges, wallets, coin trusts); część nie (np. akceptacja płatności w krypto, sprzęt do miningu).
- **Dating and companionship** — certyfikacja Google, brak userów <18, ograniczenia wg kategorii/SafeSearch.
- **Trademarks** — polityki działają po złożeniu ważnego complaint przez właściciela znaku.
- Dodatkowo: ad protections for children and teens (wyłączenie personalizacji, ograniczenie kategorii), other restricted businesses, restricted ad formats/features, **limited ad serving** (limit wyświetleń dla ryzykownych reklam; brak limitu tylko dla „qualified advertisers").

## Editorial & technical requirements

- **Editorial** — reklamy jasne i relewantne; zakaz vague phrases („Buy products here") i gimmicków (FREE, f-r-e-e, F₹€€!!).
- **Destination requirements** — landing page funkcjonalny, użyteczny; display URL musi odpowiadać URL landing page; strona nie „pod konstrukcją", działa w popularnych przeglądarkach, nie blokuje przycisku wstecz.
- **Technical requirements** — nie przekraczać limitów konta; obsługiwany język targetowania; poprawny HTML5.
- **Ad format requirements** — limity znaków headline/body, wymogi rozmiaru/wagi obrazu, długości wideo, aspect ratio; zakaz Non-family safe w image/video/non-text.

## Implikacje dla google-ads-baby

- `prepare_responsive_search_ad`/`prepare_responsive_display_ad`: pre-flight lint headline/description pod editorial (vague phrases, gimmicki, ALL CAPS, powtórzone znaki) — ostrzeżenie przed mutacją.
- Kategorie restricted (finance, healthcare, gambling, crypto, alcohol, dating) → flaga „wymaga certyfikacji / dozwolonych krajów / disclosure" przy prepare.
- Final URL / landing page: przypomnienie o destination requirements (display URL zgodny z landing, strona działająca).
- Format limits (znaki, rozmiary) już egzekwowane przez schema — polityki potwierdzają, że to hard requirement, nie soft.
