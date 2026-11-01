# Fase 2A — primi tre giochi giocabili

Base: `main` alla revisione `98f4354`. Branch: `codex/fase-2a-giochi`.

## Verifica preliminare e provenienza

Il repository sorgente è stato letto tramite API, senza clone modificabile e senza alcuna scrittura. Revisione verificata: `6e941f7197b183b05e20cdaeb689ef2aaef45408`. Accesso, file previsti e situazione licenze sono stati comunicati prima delle modifiche al codice.

| Gioco | File sorgente e dipendenze effettive | Adattamento |
|---|---|---|
| Cucaracha | `js/games/challenges.js`, funzione `roach`; `random` e `shuffle` da `js/core.js`; servizi di sessione `delay`, `every`, punteggi e completamenti | Regole estratte in `RoachEngine`, rendering touch e tastiera con pulsanti. Le immagini dei diversivi non sono state importate: coccinelle generiche, penalità 15/30 moltiplicate per missione. |
| Salti | `js/games/legacy.js`, solo ramo `runner`; generatore casuale locale, tempo/animazioni, sessione e salvataggi | Fisica sinusoidale del salto (720 ms, 125 unità), dimensioni, collisioni, accelerazione e durate adattate in `RunnerEngine`; conservato il gatto SVG generico in un asset locale. Non è stato importato il ramo frutta. |
| Tetris | `js/games/tetris.js`, `js/games/tetris-engine.js`; `button` da core e servizi di sessione | Motore copiato senza modifiche in `js/tetris-engine.js`; UI adattata al tema, controlli, pausa e archivio della nuova app. Il test verifica l’identità con il blob sorgente `b1741583aa0fee3730c086ee67e847012b33b4e3`. |

Gli stili e la navigazione sono locali alla nuova app. Nessun import di storage, manifest, worker, fotografie o asset nominativi del progetto sorgente. Nessun file del gioco di guida di terzi è coinvolto.

### Condizioni di riutilizzo

Nell’albero della revisione sorgente non è presente una licenza generale esplicita; anche il README e i file selezionati non espongono condizioni di licenza aggiuntive. L’adattamento è stato richiesto espressamente dall’utente per questi due repository. Questa autorizzazione circoscritta non viene presentata come licenza pubblica generale e non certifica la titolarità di eventuali contributi precedenti: prima di distribuire con una licenza generale, il titolare deve confermare i diritti sui contributi riutilizzati. Non sono state inventate licenze o attribuzioni, né rimossi avvisi di licenza dai file selezionati.

## Regole e progressione

- **Cucaracha:** 35 secondi di gioco attivo; obiettivi 8/12/16/20/24 catture, massimo 4/3/2/1/0 errori. Il quinto richiede anche un boss sconfitto. Il boss resta lo stesso bersaglio per cinque colpi; combo e bonus originali. Le coccinelle sono diversivi da evitare, con penalità più alta per quelle dorate. I tre livelli globali accorciano la permanenza e aumentano la frequenza dei bersagli.
- **Salti:** supera 12/18/24/30/36 secondi senza collisioni; ostacoli di quattro dimensioni, velocità crescente, punti solo per quelli superati. Tocca il campo o Salta; tastiera Spazio/Freccia su. La larghezza logica si adatta al campo iniziale, con minimo 480 unità per mantenere leggibili personaggio e ostacoli su telefono; il ridimensionamento CSS mantiene la simulazione e le collisioni coerenti. I tre livelli globali aumentano la velocità.
- **Tetris:** cinque tesori a 10/20/30/40/50 righe nella stessa partita. Motore originale 10×20, 7-bag, rotazione con spostamenti laterali, caduta morbida/istantanea, collisioni, cancellazione simultanea e game over. Dopo 50 righe si può continuare per il record. La difficoltà globale accelera la gravità. Cinque controlli touch, ripetizione tenendo premuti sinistra/destra/scendi, frecce, Spazio e P.

I tre percorsi assegnano al massimo 15 tesori e tre frammenti. Gli altri nove restano in preparazione; lo schema resta versione 1 e gli ID non cambiano. Entrare, scegliere un obiettivo o iniziare la partita non assegna tesori. I record sono salvati quando migliorano; i completamenti sono ordinati, persistenti e idempotenti. Ripetere un obiettivo non duplica premi. La pagina Tesori e il Diario derivano direttamente dallo stesso archivio e mostrano le conquiste alla riapertura.

Ogni sessione rilascia il proprio animation frame e i listener all’uscita o al riavvio. Perdita di focus, background e apertura della radio mettono in pausa; il ritorno richiede Riprendi. L’orologio e la fisica non avanzano in pausa. La radio offre tre suggerimenti specifici per gioco. Il menu permette di ripetere le missioni e scegliere quella successiva sbloccata.

## Verifiche

Comandi: `npm run build`, `npm test`, `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`, `git diff --check`.

### Logica

15 test passati: motore Tetris identico al sorgente, 7-bag, muri, rotazione, caduta, game over, cancellazione di quattro righe e cinque soglie; boss/catture/penalità e condizioni di vittoria; collisione e salto della corsa, punteggio e accelerazione. Tutti i cinque percorsi della corsa sono simulati integralmente con salti temporizzati ai tre livelli di difficoltà. Restano incluse le verifiche dell’archivio, compatibilità, 60 tesori/12 frammenti, manifest e cache riproducibile.

### Browser Chromium

23 scenari: 15 di regressione PWA/restyling e 8 dedicati ai giochi. Comprendono:

- apertura dei dodici percorsi: tre giocabili e nove ancora in preparazione;
- partita Cucaracha di 35 secondi attivi con clock controllato, catture tramite input e vittoria; partita senza catture e fallimento; boss touch di cinque colpi sullo stesso bersaglio, errore sul diversivo;
- corsa con Spazio, salto, collisione naturale, pausa, ripresa, riavvio e uscita senza completamenti tardivi;
- Tetris con frecce/Spazio, cancellazione di una riga tramite caduta reale, game over e riavvio; controlli touch nei tre formati;
- percorso di 15 tesori/3 frammenti, record, Diario e persistenza dopo ricarica;
- avvio e input dei tre giochi offline dopo precache, nessun errore JavaScript nel percorso offline, responsive 360×800, 768×1024 e 1024×768;
- aggiornamento reale del worker senza perdita dei progressi, isolamento delle cache e conservazione dell’illustrazione approvata.

**Distinzione:** la partita completa Cucaracha usa casualità deterministica e tempo di gioco simulato nel browser. Il test dei 15 tesori e il test di cancellazione Tetris preparano, solo nel contesto di test, stati vicini al traguardo e poi usano i motori e gli input reali per terminarli: non rappresentano quindici partite umane complete. Non esiste un comando di test o una scorciatoia per i premi nell’app pubblicata. Le simulazioni unitarie della corsa non sono prove con un giocatore umano.

Schermate delle tre partite in `docs/screenshots/fase-2a/`.

## Limiti e prove manuali residue

Il touch è emulato da Chromium su Linux: restano da provare tablet fisici iOS/Android, installazione standalone, rotazione e ripresa dopo sospensione reale, tastiera esterna e screen reader. I canvas hanno etichette e controlli HTML ma non offrono una rappresentazione non visiva completa della partita. Il bilanciamento dei livelli richiede anche gioco umano su tablet. Nessun audio è stato aggiunto; l’impostazione esistente resta compatibile.

La cache è rigenerata con tutti i nuovi moduli e SVG locali. Nessun framework, dipendenza runtime, server, tracciamento, pubblicità o servizio esterno. Nessun merge, deploy, Fase 2B o Fase 3.
