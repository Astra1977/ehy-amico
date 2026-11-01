# EHY AMICO!

**Il Mistero del Tempo Perduto** — PWA statica di avventure per piccoli esploratori.

La Fase 1 include base, mappa delle dodici avventure, radio, struttura del diario, collezione e progressi locali. La Fase 2A aggiunge Acchiappa la Cucaracha, Salta la Cacca e Tetris giocabili, con 15 tesori e tre frammenti. La Fase 2B aggiunge Labirinto, Memory e Out Run: sei avventure giocabili, fino a 30 tesori e sei frammenti. La Fase 3A aggiunge Jurassic e La Macchina del Tempo: otto avventure giocabili, fino a 40 tesori e otto frammenti. Le ultime quattro avventure restano in preparazione.

Avvio locale: `npm run serve`, quindi aprire `http://localhost:8000/ehy-amico/` (la cartella deve chiamarsi `ehy-amico`). Nessun account, server applicativo, pubblicità, telemetria, font o asset remoti.

- `npm run build`: rigenera il worker e la versione della cache.
- `npm test`: verifica archivio e ricompense con Node.
- `npm ci && npx playwright install chromium && npx playwright test`: verifiche browser.

Analisi, architettura, stato delle licenze e limiti: [Fase 1](docs/FASE-1.md). Risultati e controlli su dispositivi: [Test](docs/TEST.md). File: [Inventario](docs/FILES.md).

Non pubblicare la versione finale e non effettuare merge senza approvazione.

Restyling grafico: [stato, asset e verifiche](docs/RESTYLING.md).

Giochi disponibili, provenienza, regole e risultati: [Fase 2A](docs/FASE-2A.md).

Provenienza e autorizzazione della guida, regole, test e collaudo manuale: [Fase 2B](docs/FASE-2B.md).

Missioni educative, contenuti, migrazione dei salvataggi, test e collaudo: [Fase 3A](docs/FASE-3A.md).
