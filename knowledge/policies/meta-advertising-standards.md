---
keywords: [meta advertising standards, polityki reklamowe, ad standards, prohibited, restricted, zabronione, ograniczone, odrzucenie reklamy, ad rejected, restricted content, community standards, dsa, transparency]
applies_to: [meta-ads]
task_type: [review, mutation]
risk_level: high
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_create, prepare_ad_creative, prepare_ad_update, prepare_carousel_creative, prepare_video_creative, prepare_lead_creative, prepare_advantage_creative]
priority: 4
inject: summary
related: [policies/google-ads-policies.md]
source: ["https://transparency.meta.com/policies/ad-standards/"]
summary: "Prohibited m.in. profanity, misinformation i personal attributes — reklama nie może sugerować rasy, religii, zdrowia ani statusu finansowego odbiorcy («Ty, jako [atrybut]»). Restricted wymagają prior written permission (crypto, gambling, dating; addiction treatment dodatkowo LegitScript) i targetowania 18+ (alkohol, finance, weight loss). Housing/employment/credit = Special Ad Category; reklamy w EU muszą podawać beneficiary i payor (DSA). Review automatyczny do 24h, możliwy re-review po publikacji; skutek: odrzucenie lub restrykcja Business Account."
---

# Meta Advertising Standards — kanon polityk reklamowych

Źródło oficjalne: https://transparency.meta.com/policies/ad-standards/ (Meta Transparency Center, „Introduction to the Advertising Standards"). To Tier 1 — cytuj wiernie, nie zmyślaj. Reklamy muszą spełniać zarówno **Advertising Standards**, jak i **Community Standards**.

## Klasyfikacja treści (co robi enforcement)

| Kategoria | Znaczenie | Skutek naruszenia |
|---|---|---|
| Prohibited / Unacceptable content | Treść całkowicie zabroniona | Odrzucenie reklamy; restrykcje na Business Account/asset |
| Restricted goods & services | Dozwolone warunkowo (wiek, kraj, zgoda, certyfikat) | Odrzucenie, jeśli brak spełnionych warunków |
| Objectionable content | Treść pogarszająca doświadczenie użytkownika | Odrzucenie |
| Business-asset policies | Zachowanie konta (integrity, spam, cybersecurity) | Restrykcja konta/asset, nie tylko reklamy |

- Review głównie **automatyczny**, zwykle do 24h; reklamy mogą być re-reviewed także **po** publikacji i odrzucone w dowolnym momencie.
- Odrzucenie → edytuj reklamę (liczy się jako nowa) lub złóż appeal w **Account Quality**.
- Minimalny wiek targetowania dla wielu kategorii restricted: **18+** (alkohol, hazard, weight loss/cosmetics, financial products).

## Prohibited / Unacceptable content (zabronione)

Community Standards violations, child sexual exploitation, coordinating harm & promoting crime, dangerous organisations and individuals, discriminatory practices, hateful conduct, human exploitation, locally illegal content, misinformation (w tym debunked by fact-checkers), vaccine discouragement. Dodatkowo objectionable: adult nudity & sexual activity, adult sexual solicitation, bullying & harassment, **profanity** (wulgaryzmy zabronione), privacy violations & personal attributes, violent & graphic content, suicide/self-injury/eating disorders. Fraud/scams/deceptive practices oraz unacceptable business practices — zabronione.

- **Discriminatory practices**: nie wolno używać audience tools do dyskryminacji ani wykluczania grup. Reklamy dot. housing, employment, financial products (US oraz targetujące US/Canada/część Europy) muszą deklarować się jako **Special Ad Category** z ograniczonym targetowaniem.
- **Personal attributes**: reklama nie może twierdzić/sugerować (wprost lub pośrednio) rasy, religii, wieku, orientacji, tożsamości płciowej, niepełnosprawności, stanu zdrowia, statusu finansowego, karalności ani imienia osoby (klasyczny błąd „Ty, jako [atrybut]...").

## Restricted goods & services (dozwolone warunkowo)

- **Alcohol**: zgodność z prawem lokalnym, targetowanie wiek/kraj; w niektórych krajach zakaz.
- **Tobacco/nicotine/e-cigarettes/vaping**: sprzedaż/użycie zabronione; dozwolone tylko produkty rzucania (cessation) zatwierdzone przez WHO/FDA.
- **Drugs & pharmaceuticals**: illicit/recreational zabronione; prescription/OTC/cannabis-derived tylko wg wymogów polityki.
- **Financial & insurance** (karty, pożyczki, ubezpieczenia): target 18+, brak żądania PII/danych finansowych wprost; możliwa weryfikacja biznesu/autoryzacja regulatora.
- **Cryptocurrency**: platformy tradingowe/monetyzacja tylko za **prior written permission**.
- **Online gambling & games**: tylko za prior written permission, target 18+, zgodność z prawem.
- **Dating**: tylko za prior written permission (aplikacja + wytyczne dating).
- **Drug/alcohol addiction treatment** (US): wymaga certyfikacji **LegitScript** + permission.
- **Health & wellness**: weight loss/cosmetics target 18+; **zakaz** treści sugerującej negatywny obraz siebie / „idealne ciało".
- Zakazy bezwzględne sprzedaży: broń/amunicja/materiały wybuchowe, hazardous materials, historic artefacts, human body parts/fluids, endangered species (i P2P sprzedaż żywych zwierząt).

## Intellectual property, format i biznesowe

- **IP**: zakaz counterfeit goods i naruszania cudzych praw (copyright, trademark). Trademark/copyright egzekwowane po zgłoszeniu uprawnionego.
- **Relevance**: reklama musi jasno reprezentować markę; produkt w reklamie = produkt na landing page.
- **Lead ads**: bez prior written permission nie wolno pytać o określone wrażliwe typy danych.
- **Branded content**: musi być otagowane narzędziem branded content (partner/marka).
- **Video ads**: zakaz disruptive tactics (np. migające ekrany); entertainment (trailery) tylko za permission, target 18+.
- **Data use restrictions**: Meta advertising data tylko do oceny efektywności własnych kampanii (aggregate/anonymous); zakaz budowania/wzbogacania profili userów i transferu danych do ad networks/data brokerów.

## Transparentność DSA (EU) — wymóg prawny

Dla userów w EU reklamodawca MUSI podać w polach tekstowych:
- **Beneficiary**: pełna nazwa prawna podmiotu, w imieniu którego prezentowana jest reklama.
- **Payor** (jeśli różny): pełna nazwa prawna podmiotu płacącego za reklamę.

Dane muszą być kompletne, aktualne i prawdziwe przez cały czas emisji.

## Implikacje dla meta-ads-baby

- Przy `prepare_ad_create`/`prepare_*_creative`: pre-flight check treści pod prohibited (profanity, personal attributes, misleading claims) — ostrzeżenie przed mutacją, nie ciche przepuszczenie.
- Kategorie restricted (alkohol, finance, hazard, crypto, dating, addiction) → flaga „wymaga permission/certyfikatu/targetowania 18+" jako info przy prepare.
- Housing/employment/credit → przypomnienie o Special Ad Category (ograniczony targeting).
- Reklamy w EU → walidacja obecności beneficiary/payor (wymóg DSA), inaczej ryzyko odrzucenia.
