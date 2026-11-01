# EHY AMICO!

**Il Mistero del Tempo Perduto** — PWA statica di avventure per piccoli esploratori.

La Fase 1 include base, mappa delle dodici avventure, radio, struttura del diario, collezione e progressi locali. I giochi sono in preparazione per le fasi successive: le schede non sono minigiochi dimostrativi.

Avvio locale: `npm run serve`, quindi aprire `http://localhost:8000/ehy-amico/` (la cartella deve chiamarsi `ehy-amico`). Nessun account, server applicativo, pubblicità, telemetria, font o asset remoti.

- `npm run build`: rigenera il worker e la versione della cache.
- `npm test`: verifica archivio e ricompense con Node.
- `npm ci && npx playwright install chromium && npx playwright test`: verifiche browser.

Analisi, architettura, stato delle licenze e limiti: [Fase 1](docs/FASE-1.md). Risultati e controlli su dispositivi: [Test](docs/TEST.md). File: [Inventario](docs/FILES.md).

Non pubblicare la versione finale e non effettuare merge senza approvazione.
