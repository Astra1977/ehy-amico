# Fase 2B — Labirinto, Memory e Out Run

Base: `main` alla revisione `899816e`. Branch: `codex/fase-2b-giochi`.

## Verifica preliminare e condizioni di riutilizzo

Entrambi i repository sorgente sono stati letti tramite API, senza modificarli. File, dipendenze e condizioni di riutilizzo sono stati verificati e comunicati prima dello sviluppo.

- Super Nipotini: `Astra1977/sala-giochi-nipotini`, revisione `6e941f7197b183b05e20cdaeb689ef2aaef45408`. Labirinto da `js/games/exploration.js` (`createMaze`, `maze`); Memory da `js/games/challenges.js` (`memory`). Le dipendenze effettive sono mescolamento, griglia, controlli, sessioni e servizi di progressione. Non sono state copiate immagini personali, altri giochi, archivio o menu. Come nella Fase 2A, il repository non espone una licenza generale; l’adattamento di questi moduli è richiesto dall’utente per questo progetto, senza presentarlo come una licenza generale verso terzi.
- Guida: [`klide1010/ChildGames/js/games/road.js`](https://github.com/klide1010/ChildGames/blob/cd10ec80f604a3105a1f7b2274f3c1adb72900f0/js/games/road.js), revisione `cd10ec80f604a3105a1f7b2274f3c1adb72900f0`, blob `4b88da0d15b44b3d66fb4208ad5c22762a1df829`. Esaminati anche README, dipendenze Sound/U del core e adattatore `js/games/road.js` di Super Nipotini. Nessun file LICENSE esplicito rilevato.

**Autore originale del motore di guida: Andrea.** L’utente ha confermato l’autorizzazione del titolare al riutilizzo e all’adattamento nel repository pubblico `Astra1977/ehy-amico`, inclusa la pubblicazione tramite GitHub Pages. Il codice di guida è stato copiato solo dopo questa conferma. L’autorizzazione specifica non viene trasformata in una licenza pubblica generale. Il credito è presente nel sorgente e nell’interfaccia della corsa. Non sono riportate altre informazioni personali.

## Implementazione

### Labirinto — Tempio del Tempo

`js/puzzle-engines.js` adatta l’algoritmo originale di scavo ricorsivo dei corridoi con ordine casuale. Cinque missioni: dimensioni base 9/11/13/15/17; le difficoltà globali aggiungono 0/2/4 caselle per lato. Ingresso (1,1), uscita sempre collegata all’interno opposto. Nessun salto attraverso le pareti; frecce, pulsanti direzionali con pressione prolungata e swipe muovono una cella alla volta.

Contatore dei passi validi, pareti incontrate e cronometro di gioco attivo. La vittoria avviene solo sull’uscita; punteggio derivato dalla formula originale `max(20, missione × 300 − passi × 2)`. I percorsi sono avviati separatamente tramite il selettore condiviso, anziché accumulare i punti di cinque mappe in un’unica sessione. Pedina originale locale dell’Esploratore; uscita illustrata con la bussola.

### Memory — ricordi perduti

Cinque mazzi da 4/6/8/10/12 coppie, mescolati a ogni partita. Una carta già scoperta non può essere contata due volte. Le coppie corrette restano visibili; quelle errate bloccano temporaneamente tutti gli input e poi si ricoprono. Il ritardo di verifica è 950/750/550 ms secondo difficoltà e si arresta durante la pausa.

Mosse contate solo dopo due carte valide, cronometro e punteggio originale `max(1, missione × 300 − mosse × 3)`. Il record usa lo stesso campo `best` degli altri giochi, senza creare un secondo sistema di salvataggi. Le facce usano le dodici illustrazioni originali già approvate dell’atlante locale; il dorso usa la bussola. Carte HTML utilizzabili con tap, clic o Tab/Invio/Spazio.

Labirinto e Memory non avevano una sconfitta a tempo nella sorgente: non è stato aggiunto un fallimento artificiale. I test verificano invece pareti bloccanti, coppie errate, input respinti e riavvio senza premi.

### Out Run — ID persistente `car`

`js/road-original.js` contiene il corpo del file originale senza cambiamenti, dentro una funzione che riceve le dipendenze. Il test ricostruisce il blob e ne verifica l’hash. Restano originali proiezione pseudo-3D, curve/salite, forza centrifuga, accelerazione automatica, fuoristrada, veicoli, sterzo, traffico e cambi di corsia, collisioni, sorpassi, checkpoint, bonus temporali decrescenti, timer, distanza, punteggio e fine corsa.

L’adattatore `js/road-game.js` modifica l’integrazione, non la fisica:

- nome visibile Out Run, navigazione e salvataggio esclusivamente con ID `car`; il metadato storico privato del motore non viene registrato nel catalogo dell’app;
- schermata di scelta di moto, auto o camion, countdown, schermata finale e comandi Riprova/mappa condivisi;
- frame e timer differiti alimentati dal tempo attivo della sessione: nessun avanzamento in pausa o background, nessun listener o animazione residui dopo uscita/riavvio;
- sterzo originale su metà campo e frecce; grandi pulsanti dedicati inoltrano gli eventi al medesimo controllo; rilascio dei comandi su pausa e ridimensionamento;
- canvas con ResizeObserver e densità pixel limitata a 2; il bitmap viene conservato durante il ridimensionamento in pausa;
- dipendenze U/Sound locali e minime; suoni sintetizzati soltanto se abilitati nelle impostazioni, nessun file musicale o font remoto; vibrazione disattivata;
- fabbrica di canvas per la scenografia: palme, alberi e cactus vettoriali locali al posto dei glifi di sistema originali, senza modificare il corpo del motore;
- un tesoro per ciascuno dei primi cinque checkpoint realmente attraversati nella stessa corsa. Il livello 1 iniziale non premia. Dopo il quinto checkpoint il frammento è assegnato, ma si può continuare fino al termine del timer per migliorare il record, come nell’originale.

Nessun logo, musica, sprite o altro asset del videogioco commerciale omonimo è stato importato.

## Progressione, privacy e PWA

Riutilizzati `createGameSession`, `store.complete` e l’archivio versione 1. Nessuna modifica a `js/progress.js`, alle chiavi, agli ID o ai dati dei primi tre giochi. Il solo ampliamento delle sessioni è il cleanup di risorse specifiche e l’accesso alla preferenza audio. I completamenti sono sequenziali e idempotenti. La navigazione o il pulsante Inizia non assegnano premi.

Quindici nuovi tesori e tre frammenti, fino a **30/60 tesori e 6/12 frammenti** nelle Fasi 2A+2B. Diario e Tesori derivano dallo stesso archivio. Radio con tre suggerimenti per ciascun gioco e saluto «Ehy Amico!».

Home approvata e dodici illustrazioni non modificate; nessuna fotografia o informazione personale aggiuntiva. Manifest e icone invariati. Nuovi moduli e pedina locali inclusi nel precache atomico con nuova versione deterministica. Nessuna dipendenza runtime, CDN, account, pubblicità o telemetria.

## Risultati dei test

Comandi eseguiti: `npm run build`, `npm test`, `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`, `git diff --check`.

- **23 test di logica/PWA:** regressioni Fase 2A, archivio e cache; 500 labirinti con uscita raggiungibile, pareti, cinque missioni, passi e tempo; Memory con cinque mazzi, coppie errate, blocco, mescolamento e completamento; hash del motore automobilistico, cinque checkpoint originali con tutti e tre i veicoli, collisioni, penalità e termine per scadenza.
- **34 scenari Chromium:** 23 di regressione, sei per i puzzle e cinque per la guida. Tutti e cinque i labirinti e tutti i mazzi Memory sono risolti con input reali; errori, pausa, ripresa, riavvio e persistenza verificati. Guida fino a cinque checkpoint con conteggio di 30 tesori/sei frammenti, precedente progresso dei primi tre giochi preservato; sterzo con tastiera, fuoristrada, tempo scaduto senza premi, riavvio. Input touch e offline a 360×800, 768×1024, 1024×768; pausa e ridimensionamento della corsa; nessun errore JavaScript nei percorsi offline controllati.
- Build riproducibile e inventario locale completo; aggiornamento reale della cache e conservazione dei progressi coperti dalla regressione PWA.

**Limiti dei test:** i risolutori dei puzzle leggono la mappa o le facce nel DOM per determinare la sequenza, ma eseguono tutte le mosse reali, senza saltare al traguardo. La corsa completa usa casualità deterministica (strada dritta/traffico prevedibile) e clock controllato; non è una prova di abilità umana su curve casuali. Nei test unitari di guida il disegno è sostituito da un contesto fittizio; i test browser renderizzano il canvas reale. Alcune verifiche di regressione della Fase 2A continuano a usare le fixture di traguardo già documentate. Nessuna scorciatoia di test è aggiunta all’app.

Il touch è emulato da Chromium, incluso un gesto prolungato inoltrato tramite CDP. Restano da verificare tablet fisici iOS/Android, standalone, prestazioni su dispositivi meno potenti, sospensione reale, bilanciamento con giocatori umani e screen reader. I canvas non forniscono una rappresentazione non visiva completa della corsa. Screenshot in `docs/screenshots/fase-2b/`.

## Collaudo manuale

1. Eseguire `npm ci` e `npm run serve`, aprire `http://localhost:8000/ehy-amico/`. Usare eventualmente un profilo browser separato per prove da zero, senza cancellare i progressi abituali. Aspettare «Zaino pronto» prima di disconnettere la rete.
2. **Labirinto**, tessera 04: Inizia, provare una parete, poi frecce, pressione prolungata e swipe. Trovare l’uscita, controllare il tesoro e selezionare l’obiettivo successivo. Riprova deve generare un nuovo percorso.
3. **Memory**, tessera 05: scoprire due carte diverse, verificare blocco e ricopertura. Trovare una coppia e controllare che resti visibile. Completare il mazzo, controllare mosse e premio, proseguire fino a dodici coppie. Provare anche Tab/Invio.
4. **Out Run**, tessera 06: scegliere veicolo, aspettare il countdown, sterzare con metà campo, pulsanti e frecce. Provare fuoristrada, urto, checkpoint, pausa/radio e ripresa. Dopo il quinto checkpoint controllare il frammento; lasciare scadere il tempo e riavviare. Ripetere con i tre veicoli.
5. Consultare Diario e Tesori, ricaricare e riaprire: record, ricompense e progressi precedenti devono restare. Provare i tre giochi senza rete e nelle due orientazioni; ricontrollare Cucaracha, Salti e Tetris.

Nessun merge, deploy, Fase 3 o modifica ai repository sorgente.
