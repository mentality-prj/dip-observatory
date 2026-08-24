# Contributing Guide

## Branching rule: every new feature in its own branch

Кожна нова фіча (feature) розробляється **в окремій гілці (feature branch)**, а не безпосередньо в основній гілці (`main`).

Every new feature must be developed in a dedicated **feature branch** — never committed directly to the main branch (`main`).

### Workflow

1. Оновіть локальну основну гілку:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Створіть нову гілку для фічі. Використовуйте префікс `feature/` та короткий описовий kebab-case суфікс:

   ```bash
   git checkout -b feature/short-description
   ```

3. Розробляйте фічу, роблячи невеликі, зрозумілі коміти.

4. Запуштіть гілку та відкрийте Pull Request у `main`:

   ```bash
   git push -u origin feature/short-description
   ```

5. Після рев'ю та проходження CI гілку зливають (merge) у `main`.

### Branch naming conventions

| Type          | Prefix      | Example                        |
| ------------- | ----------- | ------------------------------ |
| New feature   | `feature/`  | `feature/user-authentication`  |
| Bug fix       | `fix/`      | `fix/broken-login-redirect`    |
| Documentation | `docs/`     | `docs/update-readme`           |
| Refactor      | `refactor/` | `refactor/data-layer`          |
| Chore / infra | `chore/`    | `chore/upgrade-dependencies`   |

### Rules

- ❌ Не пуште напряму в `main`.
- ✅ Одна фіча — одна гілка — один Pull Request.
- ✅ Тримайте гілку зосередженою на одній задачі.
- ✅ Тримайте feature-гілку в актуальному стані з `main` (rebase або merge) перед злиттям.
