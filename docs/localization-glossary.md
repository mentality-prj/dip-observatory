# QDIP localization policy

QDIP uses one translation policy across Marketing, Observatory and Studio.

## Canonical product names

These names are product identifiers and are never translated:

- QDIP
- Studio
- Observatory
- Core
- Resource Allocation
- GTM Lab

Descriptions, questions, CTA verbs and explanatory copy around these names are localized.

## Technical tokens kept as-is

The following tokens are data formats, standards or domain identifiers and may remain unchanged in localized UI:

- JSON
- GDPR

Backend IDs, plugin IDs, capability IDs, schema property names and raw API values are data, not UI copy, and are not translated.

## UI terminology

Ordinary user-facing terminology must be localized. Do not mix English UI nouns into Ukrainian or Polish sentences.

Examples:

| English               | Ukrainian                        | Polish                           |
| --------------------- | -------------------------------- | -------------------------------- |
| dimension / criterion | критерій                         | kryterium                        |
| dimensions / criteria | критерії                         | kryteria                         |
| runtime               | під час виконання                | w czasie wykonania               |
| score                 | оцінка                           | ocena                            |
| framework / ruleset   | набір правил                     | zestaw reguł                     |
| evaluator             | модуль оцінювання                | moduł oceny                      |
| baseline              | базовий сценарій / базова модель | scenariusz bazowy / model bazowy |
| audit trace           | аудит / історія рішення          | ślad audytowy / ślad decyzji     |
| deterministic replay  | детерміноване відтворення        | deterministyczne odtworzenie     |
| research              | дослідження                      | badania                          |
| plugin                | плагін                           | wtyczka                          |

## Release rule

Localized copy must pass the automated product-language gate. New untranslated UI terminology should either be translated or explicitly added to this policy when it is a genuine immutable technical identifier.
