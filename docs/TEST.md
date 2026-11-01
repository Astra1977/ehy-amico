# Verifiche della Fase 1

Eseguite il 1 novembre 2026 su Linux, Node 24 e Chromium di sistema tramite Playwright.

## Automatizzate

- `npm test`: 7 verifiche, catalogo 12 giochi, 60 ricompense/12 frammenti, obiettivi sequenziali, idempotenza, record, normalizzazione, separazione dal vecchio archivio, salvataggio/recupero, storage negato, backup, protezione di dati corrotti e versioni future; manifest, risorse precache e build riproducibile.
- `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`: 7 scenari browser, navigazione delle dodici schede, radio ed Escape, preferenze dopo ricaricamento, offline dopo caricamento completo, progressi, isolamento delle cache, aggiornamento reale del worker con conferma e pulizia della vecchia cache, touch emulato, rotazione simulata e reduced motion.
- Screenshot a 360, 768 e 1280 px; controllata l’assenza di overflow della pagina. Il menu mobile scorre orizzontalmente.
- Nessun errore JavaScript nel percorso di navigazione/offline controllato.
- `git diff --check`; revisione dei file destinati al commit per evitare informazioni personali, immagini private e dipendenze runtime remote.

Il test dell’aggiornamento modifica temporaneamente la versione di `sw.js`, forza `registration.update`, verifica il worker in attesa, attiva tramite il pulsante e controlla che due ricompense salvate rimangano e che una cache estranea non sia cancellata. Il file originale viene ripristinato in `finally`; eseguire i test browser con un solo worker.

## Verifiche manuali eseguite

Ispezione delle schermate mobile e desktop generate dai test. Corretti la visibilità dei controlli con attributo hidden e il messaggio di aggiornamento durante la prima installazione.

## Da fare su dispositivi reali

- Installazione Android e iOS/iPadOS, icona, safe area e splash del sistema operativo.
- Modalità standalone, riapertura dall’icona e offline con rete realmente spenta.
- Rotazione fisica, ripresa dopo sospensione, tastiera esterna, screen reader e zoom del testo.
- Aggiornamento da una precedente versione pubblicata, su un’installazione reale con progressi.

## Non ancora applicabili

I dodici giochi non sono implementati nella Fase 1. Sono state testate le loro schede e l’API dei progressi, non le meccaniche di gioco, i record ottenuti da partite, le missioni educative, la pallanuoto o i controlli touch dei motori. Le ricompense del test sono dati sintetici, mai assegnati dalla navigazione dell’app.

Nessuna installazione reale, certificazione PWA o pubblicazione su Pages è stata eseguita. Il download del Chromium fornito da Playwright è stato negato dalla policy di rete; i test usano il Chromium già installato, senza aggirare quel blocco.
