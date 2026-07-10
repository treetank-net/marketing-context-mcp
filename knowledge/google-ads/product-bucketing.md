---
keywords: [segmentacja produktow, product bucketing, custom labels, grupy produktow, listing groups, Shopping, Performance Max]
applies_to: [google-ads]
task_type: [reference]
intent: segment_products
trigger_stage: [prompt]
priority: 3
inject: summary
related: [google-ads/product-bucketing-detailed.md, google-ads/merchant-center-feed.md, google-ads/google-ads-monthly-review.md]
source: ["https://support.google.com/google-ads/answer/6275295?hl=en", "https://support.google.com/google-ads/answer/3517331?hl=en", "https://support.google.com/google-ads/answer/10682377?hl=en"]
summary: "Neutralna segmentacja asortymentu oparta na hipotezie biznesowej, jakości danych i wystarczającej ilości obserwacji. Custom labels przenoszą stabilne cechy do grup produktów/listing groups; wpływ zmian ocenia się eksperymentem, bez stałych tierów i uniwersalnych progów."
---

# Segmentacja produktów w Google Ads

Segmentacja ma odpowiedzieć na konkretne pytanie decyzyjne: które produkty wymagają osobnego raportowania,
budżetu, stawki, wykluczenia lub testu. Nie jest celem samym w sobie.

## Prosty workflow

1. Zapisz hipotezę i decyzję, którą segment ma umożliwić.
2. Wybierz cechę dostępną i stabilną w danych: kategoria, typ produktu, marka, stan, identyfikator lub własna
   etykieta. Dla cech biznesowych użyj `custom_label_0`–`custom_label_4`.
3. Zdefiniuj wartości etykiety rozłącznie i w sposób możliwy do odtworzenia. Brak danych oznacz osobno;
   nie przypisuj go automatycznie do „słabego” segmentu.
4. Przekaż etykiety w źródle danych Merchant Center, sprawdź synchronizację i dopiero potem zbuduj
   product groups w Shopping albo listing groups w Performance Max.
5. Zachowaj grupę obejmującą pozostałe produkty, chyba że świadomie je wykluczasz. Sprawdź, czy każdy
   produkt trafia dokładnie tam, gdzie zakłada definicja.
6. Uruchom segmentację początkowo do raportowania. Zmiany emisji lub stawek wprowadzaj dopiero, gdy dane
   wspierają hipotezę i nie rozbijają nadmiernie uczenia kampanii.
7. Jeśli zmiana ma istotny wpływ, zastosuj odpowiedni eksperyment Google Ads z jasno określoną hipotezą,
   miernikiem sukcesu i porównywalnym wariantem bazowym.

Nie używaj uniwersalnych nazw tierów ani stałych progów ROAS, kosztu lub liczby konwersji. Granice segmentów
powinny wynikać z ekonomiki klienta, jakości pomiaru, sezonowości i ilości dostępnych danych.
