---
keywords: [cel kampanii, campaign objective, ODAX, awareness, traffic, engagement, leads, sales, app promotion, optimization event, zdarzenie optymalizacji, performance goal, conversion location, delivery, optymalizacja pod zly event]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_campaign_create, prepare_ad_set_create]
priority: 3
inject: summary
related: [meta-ads/account-structure-learning-phase.md, meta-ads/pixel-capi-signal-quality.md, meta-ads/budgeting-abo-cbo-advantage.md, meta-ads/audiences-targeting.md, meta-ads/catalog-dpa-advantage.md]
source: ["https://www.facebook.com/business/help/1438417719786914", "praktycy: Jon Loomer, Social Media Examiner"]
summary: "6 celów ODAX (Awareness/Traffic/Engagement/Leads/App/Sales) + performance goal i conversion location determinują delivery mocniej niż budżet: algorytm szuka ludzi pod dokładnie ten optimization event. Do sprzedaży wybieraj Sales/Purchase, nie Traffic/Link Clicks (tanie kliki bez zakupów). Przy < ~50 zakupach/tydz. optymalizuj wyżej w lejku (Add to Cart/Initiate Checkout), bo Purchase wpada w Learning Limited. Zmiana eventu na żywym ad secie resetuje fazę uczenia — ustal go przed startem; Sales/Leads na Website wymagają zdrowego Pixel+CAPI."
---

# Cel kampanii → zdarzenie optymalizacji (ODAX)

Wybór celu na poziomie **kampanii** + performance goal / conversion location na poziomie **ad setu** determinuje, kogo Meta szuka i co liczy jako sukces. To ustawienie steruje deliverem mocniej niż budżet i targetowanie — algorytm optymalizuje pod dokładnie ten event, który podasz. Optymalizacja pod zły event to najczęstsza przyczyna „drogiej kampanii, która niby działa".

Źródła: Meta Business Help — „Choosing Meta Ads Manager advertising objectives" (help/1438417719786914, tabela oficjalna), destylacja praktyków (Jon Loomer, Social Media Examiner). Model ODAX = 6 celów (wcześniej 11).

## Mapa: cel → conversion location / performance goal → event optymalizacji

| Cel (ODAX) | Conversion location | Typowy performance goal (event) | Kiedy |
|---|---|---|---|
| Awareness | na wyświetleniach | Zasięg, Impressions, Ad recall lift, ThruPlay / 2-sec video views | budowa świadomości, brak sygnału konwersji |
| Traffic | strona / profil / app | Landing Page Views, Link Clicks, Impressions, Daily Unique Reach | ruch na destynację (LPV > Link Clicks dla jakości) |
| Engagement | na reklamie / Messenger / WhatsApp / strona | Post engagement, video views, page likes, konwersje wiadomości, ThruPlay | interakcje, otwarcia rozmów, tani wolumen sygnału |
| Leads | Instant Forms / Website / Messenger / Calls / App | Leads (submit formularza), konwersje na stronie, rozpoczęte rozmowy | zbieranie kontaktów wieloma kanałami |
| App promotion | aplikacja | App installs, App events (np. rejestracja/zakup), Value | instalacje i akcje in-app |
| Sales | Website / App / Messenger / WhatsApp / Catalog | Purchase (lub Add to Cart / Initiate Checkout), Value (ROAS), Catalog sales | najwyższa intencja; wymaga Pixela/CAPI |

Mapowanie ze starych celów (dla odtwarzania kampanii): Conversions → Sales/Leads/Engagement (zależnie od conversion location), Catalogue sales → Sales (wybór katalogu), Messages → Engagement/Traffic/Leads/Sales (conversion location = Messenger/WhatsApp), Video views → Awareness (ThruPlay) lub Engagement.

## Dlaczego wybór celu i eventu determinuje delivery

- Meta buduje aukcję i predykcję pod **dokładnie ten optimization event**. Cel „Traffic/Link Clicks" znajdzie klikaczy — niekoniecznie kupujących. Cel „Sales/Purchase" znajdzie kupujących, ale wymaga wystarczającego wolumenu eventów, by wyjść z fazy uczenia.
- Event optymalizacji to **ten sam event, który liczy się do ~50/7 dni** wymaganych do wyjścia z fazy uczenia (patrz `account-structure-learning-phase.md`). Zbyt rzadki event = ad set utyka w Learning Limited.
- Sales/Leads na conversion location „Website" wymagają zdrowego Pixela + CAPI — bez sygnału Meta nie ma na czym optymalizować (patrz `pixel-capi-signal-quality.md`).
- Conversion location decyduje, gdzie „liczy się" konwersja. Leads przez Instant Forms (lead na Meta) vs Website (lead na stronie) to dwie różne kampanie o innej jakości leada i innym sygnale.

## Typowe błędy (optymalizacja pod zły event)

- **Cel Traffic/Link Clicks, gdy chodzi o sprzedaż.** Dostajesz tanie kliknięcia i wysoki CTR, zero (albo drogie) zakupy. Do sprzedaży wybieraj Sales/Purchase, nie Traffic.
- **Optymalizacja pod zbyt rzadki event przy małym wolumenie.** Purchase przy < ~50 zakupów/tydz. → Learning Limited. Zejdź wyżej w lejku: Add to Cart / Initiate Checkout jako event optymalizacji (patrz `account-structure-learning-phase.md`), a Purchase raportuj.
- **Engagement zamiast Sales „bo taniej".** Engagement daje tani wolumen interakcji, które nie przekładają się na przychód — mylący „sukces".
- **Awareness/ThruPlay oceniany po CPA sprzedaży.** Cele górnego lejka nie optymalizują pod zakup — nie porównuj ich CPA z kampaniami Sales.
- **Zmiana eventu optymalizacji na żywym ad secie** (np. Purchase → Add to Cart) **resetuje fazę uczenia** (patrz `account-structure-learning-phase.md`) — planuj event przed startem, nie po.
- **Leads przez Instant Forms bez kwalifikacji** → wolumen tanich, słabych leadów. Rozważ formularz „higher intent" lub conversion location Website, jeśli liczy się jakość.

## Zasady operacyjne

- Wybieraj cel od **dołu lejka w górę**: masz sygnał zakupu i wolumen → Sales/Purchase; brak wolumenu → event wyżej w lejku (ATC/IC) i raportuj zakup osobno.
- Jeden event optymalizacji = jedna definicja sukcesu. Ustal go przed startem; zmiana = reset nauki.
- Dopasuj conversion location do tego, gdzie realnie konwertujesz (Website vs Instant Form vs Messenger) — to nie kosmetyka, to inny model delivery.
- Cel i event dobieraj razem z jakością sygnału (`pixel-capi-signal-quality.md`) i wolumenem (`account-structure-learning-phase.md`) — inaczej „dobry cel" i tak utknie.
