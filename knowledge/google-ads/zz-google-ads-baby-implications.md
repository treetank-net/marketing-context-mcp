---
keywords: [google-ads-baby, marketing-context-mcp, implikacje, bezpieczenstwo mutacji, zadania, review]
applies_to: [google-ads]
task_type: [reference]
intent: google_ads_baby_implications
trigger_stage: [prompt, pre_tool]
priority: 5
inject: summary
related: [google-ads/google-ads-daily-check.md, google-ads/google-ads-monthly-review.md, general/task-catalog.md]
source: ["src/hook.ts", "src/retrieval.ts", "src/tools/knowledge.ts", "src/tools/tasks.ts", "src/tools/write.ts", "https://support.google.com/google-ads/answer/19888?hl=en"]
summary: "Granica odpowiedzialności: marketing-context-mcp dostarcza wiedzę, zadania i trwałe logi, a operacje Google Ads wymagają narzędzi platformowych i ich protokołu potwierdzenia. Najpierw odczyt właściwego workflow i diagnoza, potem preview, świadoma zgoda, weryfikacja oraz zapis wyniku."
---

# Implikacje dla pracy z google-ads-baby

`marketing-context-mcp` przechowuje wiedzę operacyjną, kontekst klienta, zadania i logi. Nie należy traktować
go jako dowodu, że zmiana została wykonana w Google Ads. Stan platformy trzeba odczytać i zmieniać za pomocą
właściwych narzędzi Google Ads, zgodnie z ich aktualnym kontraktem bezpieczeństwa.

## Przed działaniem

1. Ustal klienta i konto; nie zgaduj identyfikatora konta ani zakresu kampanii.
2. Odczytaj przez `read_knowledge` workflow odpowiadający intencji. Hook może wymagać wskazanych artykułów
   przed narzędziem potwierdzającym.
3. Odczytaj aktualny stan platformy. Dane zapisane w review lub zadaniu są kontekstem historycznym, nie
   zamiennikiem ponownej weryfikacji.
4. Oddziel diagnozę od mutacji. `append_task` zapisuje zamiar i powód; nie zmienia Google Ads.

## Mutacja

- Użyj operacji przygotowującej właściwej dla narzędzia platformowego i pokaż użytkownikowi konkretny
  zakres, stan przed i po oraz ważne skutki uboczne.
- Potwierdzenie musi dotyczyć tego samego przygotowanego zakresu. Nie rozszerzaj go po zgodzie i nie traktuj
  wcześniejszej ogólnej deklaracji jako potwierdzenia bieżącej operacji.
- Jeżeli narzędzie wymaga safe-word lub innego dwustopniowego protokołu, wykonaj go dokładnie według
  odpowiedniej umiejętności bezpieczeństwa pluginu.
- Po wykonaniu ponownie odczytaj stan. Google Ads Change history może pomóc powiązać zmianę z użytkownikiem
  lub narzędziem i osią wyników, ale nie zastępuje walidacji rezultatu.

## Trwały ślad

- `append_mutation` zapisuje potwierdzoną operację wraz z preview i wynikiem.
- `append_review` zapisuje wnioski z kontroli lub przeglądu.
- `update_task_status` albo `mark_task_run` aktualizuje cykl życia zadania; szczegółowy rezultat nadal należy
  zapisać w review lub logu mutacji.

Jeżeli stan po wykonaniu różni się od preview, zatrzymaj kolejne zmiany, zapisz rozbieżność i zdiagnozuj ją
przed następną mutacją.
