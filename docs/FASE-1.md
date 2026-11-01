# Fase 1 — fondazioni dell’avventura

## Analisi prima dell’implementazione

Esaminato il riferimento pubblico `sala-giochi-nipotini`, revisione `6e941f7197b183b05e20cdaeb689ef2aaef45408`: catalogo, core, app, storage, progressi, adattatore guida, manifest e service worker. Struttura statica a moduli ES, nessun framework. Il core centralizza listener, timer, animazioni e pulizia delle sessioni; il sistema di progressi valida gli obiettivi in sequenza; il worker precarica atomicamente le risorse e isola la cache per percorso.

La nuova app riprende questi criteri con implementazione originale: catalogo dichiarativo, sessioni con AbortController, salvataggi versionati, cache con impronta dei contenuti. Non è stato copiato codice o materiale grafico dal riferimento. Non sono state eseguite scritture sul riferimento.

## Licenze e guida: verifica ancora aperta

Nell’albero esaminato non è presente un file LICENSE. La documentazione della guida indica una fonte terza, `klide1010/ChildGames`. Esaminati anche radice e README di quella fonte: nessuna licenza esplicita rilevata. Essere pubblico non costituisce una licenza di riutilizzo. Prima della Fase 2 occorre documentare l’autorizzazione del titolare per codice e asset da adattare e quella specifica per la guida originale. Conservare gli avvisi e i crediti richiesti in una forma compatibile con la privacy; eventuali conflitti vanno risolti prima dell’importazione. Non attribuiamo al progetto una licenza di terzi non verificata.

## Realizzato

- Home illustrata, mappa con dodici schede, pagine delle avventure esplicitamente in preparazione.
- Radio «Chiedi allo Zio», tre suggerimenti, dialogo accessibile e chiusura Escape.
- Diario predisposto senza conoscenze o ricompense inventate; collezione 0/60 e bussola 0/12.
- Preferenze audio e tre difficoltà. Nessun suono nella base.
- Archivio `ehy-amico:progress` indipendente: normalizzazione, obiettivi sequenziali e idempotenti, record, backup, protezione dei dati di versioni future e segnalazioni di errore.
- Manifest, icone PNG e SVG originali, percorsi relativi, cache atomica versionata tramite hash. Aggiornamento esplicito tramite pulsante; nessun deploy automatico.
- Navigazione tramite hash, focus sul contenuto dopo cambio schermata, controlli di almeno 48 px, layout adattivo, reduced motion.

## Contratto per i giochi futuri

Il catalogo mantiene ID stabili per tutte le dodici avventure. Un modulo esporta `mount(session)` e usa `session.host`, `session.listen`, `session.frames`, `session.onCleanup`, `session.settings`, `session.complete(mission, score)`. L’host chiama `dispose` quando chiude il gioco. Le sessioni emettono `game:pause` quando la pagina perde visibilità o focus; ogni motore dovrà rilasciare i puntatori e mettere in pausa la simulazione. Gli obiettivi vengono validati dal motore del singolo gioco, mai dalla UI della collezione. Cinque missioni completate assegnano cinque ricompense e un frammento; i record non decrescono.

Per Tetris la Fase 2 definirà cinque soglie verificabili di righe/livelli; non ereditare implicitamente le dieci soglie del riferimento. Jurassic richiederà scavo e ricostruzione; matematica alimenterà il motore; atlante utilizzerà mappe interattive; grotta oggetti/codici; laboratorio ipotesi e simulazioni; pallanuoto movimento, passaggi, difensori e tiro. Nessun motore di gioco è incluso nella Fase 1.

## Grafica

Una home e dodici vignette SVG, icona bussola originale. La hero funge anche da ingresso illustrato, senza attesa artificiale. Questi asset definiscono la direzione visiva della Fase 1; non equivalgono alla finitura illustrativa richiesta nella Fase 4. Da realizzare in Fase 4: personaggi cartoon rifiniti e animazioni, splash dedicata, ambienti di gioco, schede premio, pagine del diario e illustrazioni finali delle dodici tessere. Nessuna fotografia, emoji sostitutiva o risorsa remota.

## Distribuzione

Nessun merge, modifica delle impostazioni Pages o pubblicazione eseguiti. Dopo approvazione: abilitare Pages sul branch approvato, cartella root. La destinazione prevista è il sottopercorso `/ehy-amico/`. `npm run build` deve essere eseguito prima di ogni commit che cambia le risorse runtime. Nessuna dipendenza runtime; Playwright è solo per i test di sviluppo.
