# KOLO Platforma — izvorni kod

Izvorni kod platforme [ekolo.rs](https://ekolo.rs), koju vodi KOLO Fondacija (Sombor).

KOLO je alternativni ekonomski sistem zasnovan na uzajamnosti i doprinosu zajedničkom dobru,
sa dve interne jedinice evidencije:

- **POEN** — interna obračunska jedinica kojom se evidentira doprinos (nije novac)
- **ZRNO** — beleži položaj učesnika; iz aktiviranog ZRNA proizlazi glas u Gornjem Kolu

Ovaj repozitorijum sadrži izvorni kod verzije koja radi na ekolo.rs, u smislu čl. 13
licence AGPL-3.0, i važeće akte (`dokumentacija 4.1/`). Osvežava se pri svakoj objavi.

## Tech stack

Next.js 16 (App Router), TypeScript, PostgreSQL + Prisma 7, NextAuth, Tailwind CSS v4, next-intl.

## Pokretanje

```bash
cp .env.example .env   # popuniti DATABASE_URL i NEXTAUTH_SECRET
npm install
npx prisma migrate deploy
npm run dev
```

## Licenca

Copyright (C) 2026 Nikola Šarić

- **Softverski kod** — [AGPL-3.0-only](./LICENSE)
- **Sadržaj i dokumentacija** — [CC BY-SA 4.0](./LICENSE-CONTENT)

Naziv i znak „KOLO" nisu deo zajedničkog dobra (vidi [`CONTRIBUTING.md`](./CONTRIBUTING.md)).
