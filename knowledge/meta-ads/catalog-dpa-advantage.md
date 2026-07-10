---
keywords: [katalog, catalog, feed produktowy, product feed, DPA, dynamic product ads, dynamiczne reklamy produktowe, Advantage+ catalog, ACA, content_ids, contents, product set, zestaw produktowy, retargeting, prospecting, match rate, Commerce Manager, ViewContent, AddToCart, Purchase]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_creative, prepare_advantage_creative, prepare_campaign_create]
priority: 3
inject: summary
related: [meta-ads/creative-formats.md, meta-ads/pixel-capi-signal-quality.md, meta-ads/audiences-targeting.md, meta-ads/objectives-optimization-events.md, google-ads/merchant-center-feed.md]
source: ["https://www.facebook.com/business/help/120325381656392", "https://developers.facebook.com/docs/meta-pixel/get-started/advantage-catalog-ads", "praktycy: aishoppingfeeds, adlibrary, adnabu, Vizup"]
summary: "Feed katalogu wymaga 9 pól (id, title, description, availability, condition, price, link, image_link, brand); wiersz z brakiem wypada z delivery. Pole id musi dokładnie (case-sensitive) równać się content_ids z eventów ViewContent/AddToCart/Purchase — match rate ≥95%, <90% = Advantage+ «optymalizuje po ciemku». Obraz min 500×500 px, cena w formacie «9.99 USD», jedna waluta/feed. DPA = jawne reguły retargetingu; Advantage+ Catalog = auto-dobór odbiorcy włącznie z zimnym prospectingiem. Do product setów internal_label, nie custom_label (ryzyko re-review policy)."
---

# Katalog produktowy Meta, DPA i Advantage+ Catalog Ads

Warstwa **operacyjna** reklam katalogowych Meta: co musi być w feedzie, jak feed łączy się z eventami Pixela/CAPI i kiedy stosować DPA vs Advantage+ Catalog. To odpowiednik `google-ads/merchant-center-feed.md`, ale dla Meta — zamiast Merchant Center masz katalog w Commerce Manager, zamiast `offer_id` masz `id` dopasowywane do `content_ids`.

Dobór formatu kreacji (DPA vs collection vs carousel) jest w `creative-formats.md`; ten plik dotyczy tego, co pod kreacją: feedu, katalogu i sygnału. Bez zdrowego sygnału (Pixel+CAPI) katalog nie ruszy — patrz `pixel-capi-signal-quality.md`.

Źródła: Meta Business Help (product data specifications), Meta for Developers (Pixel for Advantage+ Catalog Ads), destylacja praktyków (aishoppingfeeds, adlibrary). Pola i limity — z dokumentacji oficjalnej Meta; progi jakościowe (match rate) — praktycy, oznaczone.

## Wymogi feedu (progi na górze)

| Element | Wymóg / wartość | Źródło |
|---|---|---|
| Pola wymagane (produkty) | `id`, `title`, `description`, `availability`, `condition`, `price`, `link`, `image_link`, `brand` | Meta (oficjalne) |
| Braki w wierszu | wiersz z brakującym polem wymaganym **wypada z delivery** | Meta / praktycy |
| `id` ↔ Pixel | `id` w feedzie musi **dokładnie** równać się `content_ids` z Pixela (case-sensitive) | Meta (oficjalne) |
| Match rate katalog↔Pixel | cel ≥ **95%**; < 90% = Advantage+ „optymalizuje po ciemku" | praktycy (1 źródło) |
| Obraz | JPEG/PNG, min **500×500 px**, < 8 MB | Meta (oficjalne) |
| Tytuł | limit 200 zn., rekom. < 65 zn. (żeby nie ucinało) | Meta (oficjalne) |
| Cena | liczba + spacja + kod ISO 4217 (np. `9.99 USD`), kropka dziesiętna, bez symboli walut | Meta (oficjalne) |
| Format pliku | CSV, TSV, XLSX, Google Sheets, XML (RSS/ATOM) | Meta (oficjalne) |
| Feed planowany (scheduled) | < 4 GB; jednorazowy upload < 100 MB; rekom. ≤ 1 mln itemów/feed | Meta (oficjalne) |

## Pola feedu — wymagane i najważniejsze opcjonalne

- **Wymagane (9)**: `id`, `title`, `description`, `availability` (`in stock`/`out of stock` — `out of stock` nie pokazuje się w reklamach), `condition` (`new`/`refurbished`/`used`), `price`, `link` (http/https, domena Twojego biznesu przy Shops), `image_link`, `brand`. Dla Shops w niektórych kategoriach (odzież, obuwie) dochodzi `size`.
- **`id`** — unikalny, najlepiej SKU, ≤ 100 zn., **case-sensitive** (`abc123` ≠ `ABC123`), różny od `item_group_id`. To pole spina feed z Pixelem — patrz niżej.
- **`item_group_id`** — grupuje warianty tego samego produktu (rozmiar/kolor/wzór). Musi być różny od każdego `id`.
- **`google_product_category`** / **`fb_product_category`** — mocno rekomendowane: bez kategorii Advantage+ zgaduje kategorię z tytułu (szum). Ustaw najbardziej szczegółową.
- **`sale_price`** + **`sale_price_effective_date`** — cena promocyjna i jej okno; `sale_price` musi być niższa od `price`.
- **`internal_label`** (rekomendowane) vs **`custom_label_0..4`** — do budowy product setów. Meta zaleca `internal_label`, bo zmiana nie wymaga ponownej weryfikacji policy (custom_label wymaga — może wstrzymać delivery).
- **`custom_number_0..4`** — do filtrowania product setów po zakresach liczbowych (np. rok).
- **`video[0..19].url`** — wideo w DPA/Advantage+ Catalog; `video[0]` domyślne, rekom. 4:5.

## content_ids / contents — połączenie feedu z eventami (rdzeń)

DPA/Advantage+ Catalog działa tylko, gdy **eventy Pixela/CAPI niosą ID produktów zgodne z feedem**. Meta wymaga trzech standardowych eventów, każdy z parametrem produktu:

| Event | Wymagany parametr | Uwaga |
|---|---|---|
| `ViewContent` | `content_ids` **lub** `contents` | odsłona karty produktu |
| `AddToCart` | `content_ids` **lub** `contents` | dodanie do koszyka |
| `Purchase` | `content_ids` **lub** `contents` | zakup (+ `value`, `currency`) |

- `content_ids`: pojedynczy ID albo tablica ID, np. `content_ids: ['201','301']`. **ID muszą dokładnie odpowiadać `id` w katalogu.**
- `contents`: tablica obiektów `{ id, quantity }` — używaj, gdy potrzebujesz ilości (koszyk/zakup).
- Dobra praktyka: dołączaj `content_type` (`product` dla wariantu = `id`; `product_group` dla `item_group_id`) oraz `value`+`currency` przy `Purchase`.
- **Match rate** = % eventów Pixela dopasowanych do znanego itemu katalogu. Cel ≥ 95% (praktycy); niski match rate = Advantage+ nie ma na czym optymalizować, mimo że EMQ może wyglądać dobrze (jakość dopasowania osoby to osobna sprawa — patrz `pixel-capi-signal-quality.md`).

## DPA vs Advantage+ Catalog Ads (ACA)

- **DPA (dawniej Dynamic Product Ads)** — ty definiujesz **jawne reguły audytorium**: retarget „obejrzał produkt w ostatnich 30 dniach", „dodał do koszyka bez zakupu", cross-sell/upsell z konkretnego product setu. Pełna kontrola nad tym, komu który produkt.
- **Advantage+ Catalog Ads** — Meta zdejmuje ręczne kontrole audytorium i sama decyduje, komu który produkt pokazać, **włącznie z zimnym prospectingiem** (broad). Do skali, gdy sygnał jest zdrowy i katalog duży.
- Zasada: **retargeting katalogowy** (ciepły) domyka intencję (porzucony koszyk, viewed-not-purchased) — węższe reguły, wyższy ROAS, niższy wolumen. **Prospecting katalogowy** (zimny, broad/ACA) buduje wolumen — szerzej, niższy ROAS, większy zasięg. Nie myl ich metryk (patrz `insights-interpretation.md`).

## Product sets (zestawy produktowe)

- Filtr reguł na katalogu → segment produktów do konkretnej reklamy/audytorium. Buduj po: kategorii (`google_product_category`/`product_type`), marce, cenie/marży (`custom_number`), etykiecie (`internal_label`).
- Wzorce: bestsellery → osobny set z priorytetem; nowości; „porzucony koszyk" (retarget z setu obejrzanych); cross-sell (set komplementarny do zakupionego).
- Pusty/za mały product set = brak delivery — częsta pułapka po zmianie reguły feedu.

## Typowe błędy (feed i eventy katalogowe)

- **`content_ids` ≠ `id` w feedzie** — najczęstszy killer DPA. Sklep wysyła variant ID, feed ma group ID (albo odwrotnie), albo różnica wielkości liter. Efekt: reklamy nie mają co pokazać, mimo poprawnego Pixela.
- **Braki w polach wymaganych** — wiersz wypada z delivery po cichu; sprawdzaj Diagnostykę katalogu w Commerce Manager, nie zakładaj że „jest w feedzie = jest w reklamie".
- **Placeholder image** („Image coming soon") — Meta cache'uje po URL; podmiana obrazu bez zmiany URL nie odświeży się. Nie wstawiaj placeholderów.
- **Cena z symbolem waluty / przecinkiem** albo wiele walut w jednym feedzie — błąd parsowania. Jedna waluta per feed; do innych krajów osobny country feed.
- **`out of stock` traktowane jak błąd** — to norma, nie błąd; te produkty po prostu się nie wyświetlają. Nie „naprawiaj" availability na siłę.
- **Brak `google_product_category`** — Advantage+ zgaduje z tytułu; słabsze dopasowanie. Uzupełnij.
- **Zmiana `custom_label` tuż przed kampanią** — może wywołać re-review policy i wstrzymać delivery; do product setów preferuj `internal_label`.
- **Ocena „zły ROAS DPA" przy niskim match rate / duplikacji eventów** — najpierw sprawdź match rate katalogu i deduplikację (`event_id`), potem obwiniaj kampanię (patrz `pixel-capi-signal-quality.md`).

## Zasady operacyjne

- Warunek konieczny przed uruchomieniem DPA/ACA: **zdrowy feed** (9 pól, match rate ≥ 95%) **+ zdrowy sygnał** (ViewContent/AddToCart/Purchase z content_ids, deduplikacja) — to nie kosmetyka.
- Przy zmianie feedu/reguł: sprawdź Diagnostykę katalogu (odrzucone wiersze), match rate i czy product sety nie są puste — **zanim** ruszysz budżet.
- Retargeting i prospecting katalogowy trzymaj rozdzielone (osobne kampanie/ad sety), bo mają inne benchmarki i inne role w lejku.
