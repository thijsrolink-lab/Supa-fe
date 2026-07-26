# Setup: Supabase (login + database) + Netlify

## 1. Supabase-project aanmaken
1. Ga naar supabase.com → maak (gratis) een account/project aan.
2. Ga naar **SQL Editor** → New query → plak de inhoud van `supabase-schema.sql` → Run.
   Dit maakt de tabellen `families`, `children`, `growth_entries` aan met de juiste
   beveiliging (elke gebruiker ziet alleen zijn eigen gezin).
3. Ga naar **Authentication → Providers** → zorg dat "Email" aan staat (staat standaard aan).
   - Optioneel: zet onder Authentication → Settings "Confirm email" uit als je geen
     bevestigingsmail wilt tijdens het testen.
4. Ga naar **Project Settings → API** → kopieer:
   - **Project URL** → dit wordt `VITE_SUPABASE_URL`
   - **anon public key** → dit wordt `VITE_SUPABASE_ANON_KEY`
     (dit is een publieke sleutel, veilig om in de frontend te gebruiken samen met
     de Row Level Security policies uit het schema)

## 2. Lokaal testen
```
cp .env.example .env
# vul de twee waarden in .env in
npm install
npm run dev
```

## 3. Netlify
- Site instellingen → **Environment variables** → voeg toe:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Build command / publish directory staan al goed in `netlify.toml`.
- Redeploy (of trigger via een nieuwe `git push`).

## Wat er nu werkt
- Account aanmaken / inloggen (e-mail + wachtwoord), werkt op elk apparaat.
- Bij eerste keer: gezinssituatie invullen (vader, moeder, kind(eren) met geboortedatum).
- Later aan te passen via het tandwiel-icoon (kind toevoegen/verwijderen, namen wijzigen).
- Bij meerdere kinderen: tabbladen bovenin om te wisselen; de "niet-actieve" kinderen
  worden automatisch als broer/zus getoond bij het gekozen kind.
- Groeimetingen per kind, opgeslagen in de database — overal opvraagbaar na inloggen.

## Bekende beperkingen (POC-niveau)
- Teksten gebruiken voornaam-tokens ({kind}/{sibling}/{partner}) maar behouden de
  oorspronkelijke Nederlandse voornaamwoorden (hij/hem/zijn voor het broer/zus-stuk,
  haar/ze voor het kind). Bij een jongen of meerdere broers/zussen kan dat wat
  wringen — prima voor een POC, zou ik bij verdere productisering herschrijven naar
  neutraler taalgebruik.
- Geen wachtwoord-reset-flow, geen e-mailverificatie-UI (Supabase regelt de e-mail
  zelf, maar er is geen "check je mail"-scherm met herzend-knop).
- WHO-referentielijnen zijn nog steeds handmatig ingeschatte waarden (zie eerdere
  toelichting), niet live opgehaald.
