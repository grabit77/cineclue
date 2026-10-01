# CineClue

Un puzzle al giorno per indovinare il film segreto. Stesso film per tutti, sei tentativi, un nuovo puzzle a mezzanotte UTC.

A daily puzzle to guess the secret movie. The same movie for everyone, six guesses, and a new puzzle at midnight UTC.

## Italiano

Cerchi un film per titolo. Ogni tentativo mostra anno, paese, regista, genere, cast e durata, confrontati con il film segreto:

- verde: dato uguale
- giallo: dato parziale (paese, genere o qualche attore in comune)
- rosso: dato diverso
- frecce: il film segreto è uscito prima o dopo, oppure dura di più o di meno

Dal quarto tentativo compare un suggerimento su una categoria ancora non indovinata. Se vinci, il punteggio è `(7 − tentativi) × 100 + streak × 10`.

Puoi giocare senza account: la partita resta su quel browser e non entra in classifica. Con un account, statistiche e partita del giorno si salvano e valgono anche da un altro dispositivo.

La lingua si cambia con le bandiere in alto. Italiano e inglese cambiano i testi e anche titoli e dati dei film.

### Avvio in locale

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Apri l’indirizzo indicato da Next.js (di solito `http://localhost:3000`).

`TMDB_API_KEY` è obbligatoria. Una chiave gratuita si richiede su [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

Account, classifica e calendario admin usano Supabase. Nel progetto Supabase abilita Authentication → Providers → Email, poi esegui `supabase/schema.sql` nella SQL Editor. Le variabili sono in `.env.local.example`.

Il pannello `/admin` usa `ADMIN_PASSWORD` (almeno 8 caratteri, solo lato server).

## English

Search for a movie by title. Each guess shows year, country, director, genre, cast and runtime, compared with the secret movie:

- green: exact match
- yellow: partial match (shared country, genre, or some actors)
- red: different
- arrows: the secret movie was released earlier or later, or runs longer or shorter

From the fourth guess, a hint appears for a category you have not solved yet. A win scores `(7 − guesses) × 100 + streak × 10`.

You can play without an account: the game stays in that browser and does not enter the leaderboard. With an account, stats and today’s game are saved and follow you to another device.

The flags at the top switch the language. Italian and English change the interface and the movie titles and details.

### Run locally

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Open the address Next.js prints (usually `http://localhost:3000`).

`TMDB_API_KEY` is required. Request a free key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

Accounts, the leaderboard and the admin calendar use Supabase. In the Supabase project, enable Authentication → Providers → Email, then run `supabase/schema.sql` in the SQL Editor. The variables are listed in `.env.local.example`.

The `/admin` panel uses `ADMIN_PASSWORD` (at least 8 characters, server-side only).

## Stack

Next.js, React, Tailwind CSS, [TMDb](https://www.themoviedb.org/), Supabase.

This product uses the TMDb API but is not endorsed or certified by TMDb.
