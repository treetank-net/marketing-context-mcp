---
keywords: [google ads api, keyword planner, keyword ideas, forecast, historical metrics, cache]
applies_to: [google-ads-api, google-ads]
task_type: [research, implementation, planning]
trigger_stage: [prompt]
priority: 3
inject: summary
related: [google-ads/google-ads-api-gotchas.md, google-ads/search-keywords-copywriting.md, google-ads/bidding-strategies.md]
source: ["https://developers.google.com/google-ads/api/docs/keyword-planning/overview", "https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas", "https://developers.google.com/google-ads/api/docs/keyword-planning/generate-ad-group-themes"]
summary: "KeywordPlanIdeaService generuje pomysły i metryki historyczne z fraz, URL-a lub obu źródeł; plan nie jest wymagany dla GenerateKeywordIdeas. Ustaw jawnie język, lokalizacje i sieć, obsłuż paginację oraz cache, bo usługi planowania mają ostrzejsze limity."
---

# Keyword Planner przez Google Ads API

## Do czego służy

API planowania może generować pomysły na słowa, metryki historyczne, prognozy i propozycje grupowania. To dane do planowania, nie obietnica emisji ani wyniku.

## GenerateKeywordIdeas

**Fakt platformowy:** `KeywordPlanIdeaService.GenerateKeywordIdeas` nie wymaga utworzonego `KeywordPlan`. Jako seed można podać:

- frazy (`KeywordSeed`),
- konkretny URL (`UrlSeed`),
- frazy i URL (`KeywordAndUrlSeed`),
- domenę (`SiteSeed`).

W żądaniu ustaw jawnie `customer_id`, zasób języka, `geo_target_constants`, sieć i zasady dotyczące treści dla dorosłych. Nie zakładaj, że domyślne ustawienia odpowiadają briefowi. Wynik jest stronicowany.

## Workflow

1. Zbuduj mały, reprezentatywny zestaw seedów z oferty i stron docelowych.
2. Pobierz pomysły oraz metryki historyczne dla właściwego rynku.
3. Usuń semantyczne duplikaty, marki i intencje poza zakresem.
4. Grupuj według wspólnej intencji i strony docelowej; API może zwrócić propozycje tematów grup reklam.
5. Dla krótkiej listy uruchom prognozę przy jawnych założeniach kampanii.
6. Zachowaj parametry zapytania razem z wynikiem, aby analiza była odtwarzalna.

## Limity i interpretacja

**Fakt platformowy:** usługi Keyword Planning mają niższe limity częstotliwości niż wiele innych usług Google Ads API. Google zaleca cache, ponieważ odpowiedzi zmieniają się rzadko, a metryki historyczne odświeżają się miesięcznie.

**Rekomendacja:** cache kluczuj co najmniej klientem, seedem, językiem, lokalizacją, siecią i zakresem dat. Stosuj backoff po błędzie limitu. Wolumen i konkurencja z planera są agregatami planistycznymi; końcową decyzję podejmuj z uwzględnieniem intencji, ekonomiki i danych z działającej kampanii.
