# Restyling dell’avventura

Base: `main`, commit `d8e4c80`. Branch: `codex/restyling-avventura`.

## Stato: revisione grafica, immagine principale ancora da integrare

L’illustrazione approvata dei protagonisti è visibile nella conversazione ma non è stata esposta come file scaricabile nell’ambiente. Non è stata ricreata, sostituita con una sua imitazione o dichiarata integrata. La home usa ancora `assets/hero.svg`, l’illustrazione provvisoria della Fase 1. Occorre fornire il file PNG/JPG/WebP dell’illustrazione approvata prima di completare questa attività.

Lo spazio è pronto: `js/artwork.js` centralizza sorgente, testo alternativo e dimensioni. Quando il file sarà disponibile, salvarne una versione WebP in `assets/hero-approved.webp`, aggiornare `HERO_ART.src`, il testo alternativo e `approved`, quindi rigenerare la cache e ripetere i controlli su telefono/tablet. Nessun caricamento remoto a runtime. La hero usa `object-fit: contain`, senza crop e senza sovrapporre testo ai volti: il ritratto completo resta nel proprio pannello anche su schermi piccoli.

## Interventi

- Hero con titolo «EHY AMICO!», sottotitolo «Il Mistero del Tempo Perduto», pulsante «Inizia l’avventura», cornice oro, verde giungla e luce del portale.
- Mappa a percorso con dodici tappe numerate e ambientazioni distinte, alternate su tablet/desktop e in sequenza su telefono; pulsanti per alternare percorso e griglia di link accessibili. Nessuno sblocco fittizio.
- Atlante originale di dodici illustrazioni generato per il progetto, ispirato alla palette e alla luce del riferimento: `assets/adventure-atlas.webp` (4 colonne × 3 righe, ordine del catalogo). Riutilizzato su home, percorso, griglia e schede; singola risorsa condivisa, inclusa nel precache. Non è una mappa geografica o un diagramma scientifico didattico.
- «Out Run» è il nuovo nome visibile; ID `car`, posizione nel catalogo e archivio restano compatibili. Nessun logo, musica o asset importato dal videogioco omonimo.
- Diario come taccuino con dorso, carta rigata e pagine; tesori con medaglia SVG originale e dodici frammenti navigabili intorno alla bussola. Medaglie e frammenti conquistati dipendono esclusivamente dai salvataggi già esistenti.
- Radio con pannello di frequenza, spia e altoparlante; saluto «Ehy Amico!», dialogo nativo, chiusura Escape e titolo accessibile.
- Animazioni brevi, rispetto di `prefers-reduced-motion`, pulsanti grandi e layout responsive.

## Privacy e perimetro

Nessuna fotografia o informazione personale aggiunta. La risorsa generata raffigura solo ambienti e oggetti. Nessuna modifica a `sala-giochi-nipotini`. Nessuna implementazione di giochi, modifica dello schema dei progressi, merge o deploy. Il generatore storico `scripts/create-art.py` produce soltanto gli SVG provvisori della Fase 1; non ricrea l’atlante generato o l’immagine approvata.

## Verifiche

- `npm run build`: precache aggiornato con impronta dei contenuti, inclusi atlante, medaglia e configurazione della hero.
- `npm test`: 7 test logica/PWA superati.
- `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`: 12 scenari browser superati, compresi offline, aggiornamento reale del worker, persistenza, compatibilità dell’ID `car`, 12 frammenti, medaglie, cambio percorso/griglia, touch emulato e responsive.
- Screenshot home a 360/768/1280 px; mappa, diario e tesori a 360/768/1024 px, senza overflow della pagina. Controllo visivo delle schermate tablet e telefono.
- `git diff --check`.

I test utilizzano Chromium su Linux e touch emulato. Da verificare su dispositivi reali: installazione iOS/Android, modalità standalone, rotazione e ripresa dal background. Da verificare dopo aver ricevuto il file: resa e visibilità effettiva dei protagonisti dell’illustrazione definitiva. Le meccaniche di gioco restano fuori dall’attività.
