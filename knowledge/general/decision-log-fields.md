---
keywords: [decision log, pamiec klienta, client memory, marketing-knowledge, profil klienta, client profile, audiences]
applies_to: [google-ads, meta-ads]
task_type: [reference]
trigger_stage: [prompt]
priority: 2
inject: summary
related: [general/account-management-philosophy.md]
source: ["własny design marketing-context-mcp"]
summary: "Schemat per-klienckiej pamięci w marketing-knowledge: profil (model biznesowy, platforma e-com + tracking-quirki, ID kont Google/Meta, flaga «automatyzacja niezalecana» z powodem), stan optymalizacji (etap bidding ladder + data zmiany, próg konwersji do przeskoku, % budżetu brand vs total), audiences z etapem lejka, kalendarz sezonowy, append-only log decyzji strukturalnych (kiedy/co/dlaczego/wynik). Status: google-ads-baby ma wpięty marketing-knowledge (v0.13.0), meta-ads-baby jeszcze nie — dopisać server z tym samym MARKETING_KNOWLEDGE_DIR."
---

# Co zapamiętywać per klient — pola decision logu (platform-agnostic)

Skonsolidowane z sekcji "warte zapamiętania" we wszystkich plikach `google-ads/*`. To jest propozycja schematu dla per-klienckiej pamięci w `marketing-knowledge` (memory-bank-mcp) — niezależna od tego, czy klient ma kampanie w Google Ads, Meta Ads, czy obu.

## Profil klienta

- Model biznesowy: usługi / e-commerce / B2B / zdrowie / deweloperzy / sezonowy.
- Flaga "automatyzacja niezalecana" (np. PMax dla usług, Advantage+ dla niskobudżetowych lokalnych kampanii) — z powodem.
- Platforma e-commerce (Shoper/WooCommerce/Shopify/IdoSell/PrestaShop/inna) + jej znane tracking-quirki.
- Konta reklamowe per platforma (Google Ads CID, Meta Ad Account ID) + czy są pod jednym MCC/Business Manager.

## Stan optymalizacji (per platforma, per konto)

- Aktualny etap "bidding ladder"/poziom automatyzacji + data ostatniej zmiany.
- Próg konwersji, przy którym nastąpi kolejny przeskok poziomu.
- % budżetu na kampanię marki własnej (brand) vs total + data ostatniej weryfikacji limitu.

## Audiences / remarketing

- Lista grup remarketingowych/retargetingowych z przypisanym etapem lejka i celem konwersji — żeby nie zdublować/pomieszać przy kolejnych kampaniach.
- Minimalne rozmiary list wymagane przez platformę (jeśli dotyczy) — sprawdzone i odnotowane.

## Kalendarz i sezonowość

- Kalendarz sezonowy klienta (szczyty sprzedażowe, Black Friday, branżowe sezony) z przypomnieniem o harmonogramie przygotowań (patrz `account-management-philosophy.md`).
- Top konwertujące frazy/tematy z kampanii search/intencyjnych — wejście do targetowania kampanii "odkrywczych" (Demand Gen / Meta Feed-Reels).

## Append-only log decyzji

Każda istotna zmiana strukturalna (nie pojedyncza mutacja budżetu, ale np. zmiana poziomu automatyzacji, restrukturyzacja kampanii, nowa segmentacja produktowa) — kiedy, co, dlaczego, jaki był wynik po określonym czasie. To jest naturalne rozszerzenie planowanego mechanizmu "`confirm_mutation` hook auto-appenduje do per-klienckiego decision logu" wspomnianego w CLAUDE.md google-ads-baby — ten sam mechanizm powinien działać identycznie dla meta-ads-baby, jeśli/gdy zostanie tam podłączony `marketing-knowledge`.

## Status w obu pluginach

- **google-ads-baby**: `marketing-knowledge` MCP server już wpięty w manifesty (`.mcp.json`, `plugin.json`), v0.13.0. Hook auto-zapisu do decision logu — zaplanowany, nie zaimplementowany.
- **meta-ads-baby**: `marketing-knowledge` **nie jest jeszcze wpięty** w manifesty tego pluginu (sprawdzone: brak `marketing-knowledge`/`MARKETING_KNOWLEDGE_DIR` w `meta-ads-baby/.mcp.json`/`.claude-plugin/plugin.json`). Żeby kolega (czy Ty) miał tę samą pamięć przy pracy z Meta Ads, trzeba powtórzyć tam ten sam krok co w google-ads-baby v0.13.0 — dopisać drugi MCP server `marketing-knowledge` do manifestów meta-ads-baby, wskazując ten sam `MARKETING_KNOWLEDGE_DIR` (wspólny dla obu platform, bo wiedza o kliencie nie powinna być podzielona wg tego, w którym repo akurat pracujesz).
