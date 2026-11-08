# Fase 3B — Avventura 10: Il Mistero della Grotta

## Base e integrazione

La PR #6 «Road to Los Angeles» è stata verificata come integrata in `main` prima di modificare il codice: merge `c528cb2a8773f0d1ad349d9b911380a442a5763e`. Branch: `codex/fase-3b-mistero-grotta`, da quel commit. Nessuna PR aperta risultava presente alla verifica iniziale. ID interno conservato: **`cave`**, numero **10**.

La nuova avventura usa catalogo, selettore delle cinque missioni, sessione, pausa/ripresa, Radio dello Zio, archivio locale con backup, diario, tesori e Bussola esistenti. Nessun motore delle avventure precedenti è modificato. La Fase 3C non è inclusa.

L’archivio v2 mantiene la chiave `ehy-amico:progress` e aggiunge `adventures.cave[1..5]`, senza cancellare namespace o ricompense esistenti. La lettura della sessione accetta ora un numero di missione facoltativo, sempre all’interno dell’avventura corrente e con copia dei dati: la chiamata senza argomenti conserva il comportamento precedente. Questo permette al tempio di leggere i quattro reperti reali delle missioni precedenti.

## Cinque missioni giocabili

### 1. L’ingresso proibito

Tre zone esplorabili custodiscono incisione, radici e sigillo. Il giocatore osserva i tre oggetti luminosi, raccoglie tre indizi nel taccuino e ricompone un ordine di rune mediante selezione/inserimento o trascinamento. La leva del portone verifica indizi e ordine; non esiste un pulsante per saltare l’enigma.

Esploratore: tre rune, descritte come prima/centrale/ultima. Investigatore: quattro rune e tre relazioni «precede» che definiscono un ordine completo. La configurazione ruota con il seme, quindi gli indizi e la soluzione cambiano insieme. Il calco dell’ordine corretto resta nel diario.

### 2. La sala dei cristalli

Un raggio discreto percorre realmente una griglia. Ogni passo conserva una direzione tra est, sud, ovest e nord; gli specchi `/` e `\` la riflettono con tabelle coerenti. Rocce e bordi interrompono il fascio, e gli stati già visitati impediscono cicli infiniti. Il sensore è terminale e accetta solo un raggio che abbia attraversato tutti i cristalli.

Esploratore: griglia 7×6, tre specchi e due cristalli. Investigatore: griglia 9×7, quattro specchi e tre cristalli. La torcia si accende/spegne e il percorso si ricalcola a ogni rotazione. Il taccuino registra l’ordine dei colori lungo il raggio. Ruotare specchi e dirigere la luce è distinto dall’attraversare la porta del sensore.

### 3. Il pavimento misterioso

Un motivo inciso definisce il ritmo dei simboli. Le piastrelle si attraversano una riga alla volta, restando nella stessa colonna o passando a una adiacente. Il simbolo giusto deriva dalla ripetizione del motivo; in ciascuna riga esiste una sola piastrella del simbolo richiesto e il percorso generato è raggiungibile.

Esploratore: cinque passi su un motivo di tre simboli. Investigatore: sette passi e un motivo di quattro elementi, anche ripetuti. Dopo il terzo passo si attiva un checkpoint: uno sbaglio successivo riporta lì, senza cancellare indizi o tesori. Nuove configurazioni cambiano motivo, percorso e simboli alternativi. Il giocatore si muove visivamente sulle piastrelle; il motivo scoperto resta nel diario.

### 4. Il ponte dimenticato

Le ruote hanno numeri di denti e assi a distanze definite. Due ruote si accoppiano solo quando la distanza è pari a metà della somma dei denti; una stessa ruota non può occupare due assi. La leva muove il motore; gli altri ingranaggi trasmettono il moto solo quando la catena è completa. Verso e velocità delle rotazioni rispecchiano alternanza e rapporto dei denti.

I contrappesi consumano una scorta limitata di pietre, spostabili tra argani. Ogni sezione sale con il peso fino alla propria tacca; un peso eccessivo la sbilancia. Senza trasmissione il ponte non si solleva, e senza allineamento completo non si attraversa. Funi, masse e sezioni rappresentano lo stato calcolato.

Esploratore: due ruote da montare, due sezioni e cinque pietre. Investigatore: tre ruote da montare, tre sezioni e nove pietre; le sagome suggerite non sono mostrate. Il diario annota il numero di ingranaggi montati, escludendo il motore già presente.

### 5. Il cuore della montagna

Il tempio richiede i quattro reperti effettivamente archiviati:

1. Il codice prende posizioni specifiche dal calco della porta e dal motivo del pavimento. Investigatore usa una runa in più.
2. Le rune corrette sbloccano il prisma, che richiede un nuovo percorso reale di riflessioni e cristalli.
3. Si ripete l’ordine dei colori del reperto della missione 2 tante volte quanti sono gli ingranaggi montati nella missione 4.
4. Il santuario apre le ante; il tesoro deve poi essere raccolto esplicitamente, tramite il cuore nella scena o il comando alternativo.

Il finale illumina il tempio e contiene il messaggio: «Ehy Amico! Hai risolto tutti gli enigmi della montagna! Io ero ancora fermo al primo lucchetto… e avevo pure perso la chiave!».

Non si sostituiscono reperti mancanti con soluzioni predefinite. Difficoltà e configurazioni delle quattro missioni possono essere mescolate: il tempio usa i dati delle partite realmente completate.

## Difficoltà, record e ricompense

Le modalità **Esploratore** e **Investigatore** condividono le cinque ricompense ufficiali e lo stesso frammento. Record per modalità salvati separatamente in ogni missione, basati sulle mosse e sui tentativi, senza cronometro. `createGameSession.complete` assegna i tesori in ordine e una sola volta; ripetere un enigma o cambiare difficoltà non aumenta il totale oltre cinque.

Riprova/Nuova configurazione avviano un nuovo enigma conservando record, scoperte già archiviate e ricompense. Le scoperte precedenti restano disponibili anche mentre si rigioca; vengono aggiornate con il nuovo reperto solo alla successiva vittoria. La scelta della difficoltà è disponibile prima delle manipolazioni, così non cambia le regole a metà enigma.

## Controlli, radio e accessibilità

- Zone selezionabili con tre pulsanti, oggetti evidenziati nella scena e inventario/taccuino consultabile.
- Rune: selezione + alloggiamento, oppure trascinamento con mouse/touch. Pulsanti nativi utilizzabili con Tab, Invio e Spazio.
- Specchi: caselle interattive e comandi grandi alternativi «Ruota specchio N».
- Pavimento: tap sulle piastrelle vicine oppure frecce ← → per selezionare una colonna e ↑ per avanzare; anche pulsanti cardinali alternativi.
- Ingranaggi: selezione della ruota e dell’alloggiamento; contrappesi con aggiunta/rimozione delle pietre, senza gesti obbligatori.
- Radio condivisa con **tre aiuti progressivi e contestuali**: osservazione, relazione da cercare, metodo di ragionamento. Nessun codice letterale regalato al primo aiuto. Consultarla mette in pausa la sessione.
- Feedback testuali, visivi e brevi note sintetiche solo se l’audio globale è attivo. Audio sospeso in pausa e rilasciato all’uscita.
- Nessun timer, perdita di vite o messaggio umiliante. Gli errori non cancellano tesori o indizi raccolti.
- `prefers-reduced-motion` disattiva movimenti decorativi, rotazioni, apertura animata e finale, conservando lo stato finale visibile. Le animazioni si fermano in pausa.

## Persistenza e offline

Ogni azione rilevante salva zona, indizi, rune, specchi, torcia, passo/checkpoint, ingranaggi, pesi, leva, ritmo del tempio e aperture. La ripresa conserva lo stato dell’enigma; nessuna simulazione temporale deve avanzare in background. I reperti archiviati e i record sopravvivono alla rigiocabilità. Anche gli stati intermedi della missione 2 e del ponte sono verificati dopo ricaricamento.

Tutti gli asset sono locali e il build li include nel precache: illustrazioni SVG originali di grotta, tempio ed esploratore; griglie, simboli e meccanismi generati localmente. Nessuna API, dipendenza runtime esterna, account, raccolta di dati personali o modifica a repository esterni.

## Collaudo manuale

1. `npm ci && npm run build && npm run serve`; aprire `http://localhost:8000/ehy-amico/#game/cave`.
2. Missione 1: visitare tutte le zone, osservare gli oggetti e leggere gli indizi. Tentare una sequenza sbagliata, poi quella derivata dagli indizi. Prima di tutti gli indizi la porta non si apre.
3. Missione 2: accendere la torcia e raggiungere gli specchi. Seguire il fascio casella per casella e cambiarne la direzione. Controllare che ostacoli, bordi e cristalli influiscano sul sensore; attraversare solo quando tutti i cristalli sono attivi.
4. Missione 3: leggere la stele, entrare nel pavimento e seguire il motivo. Provare uno sbaglio dopo il quarto passo: si torna al checkpoint del terzo. Riprendere con touch o frecce e raggiungere l’uscita.
5. Missione 4: provare la leva senza ruote e senza pesi. Montare la catena secondo distanze e denti, poi distribuire le pietre fino alle tacche. Aggiungere una pietra di troppo e osservare lo sbilanciamento. Ripristinare l’equilibrio e attraversare.
6. Missione 5: consultare i quattro reperti. Ricostruire le rune, guidare il prisma e ripetere il ritmo indicato. Aprire le ante e raccogliere esplicitamente il quinto tesoro. Verificare frammento e diario.
7. Ricaricare a metà di un enigma; verificare che gli oggetti conservino lo stato. Pausare e consultare tutti e tre gli aiuti della radio.
8. Rigiocare in altra difficoltà o con nuova configurazione: i record restano distinti, le scoperte precedenti non spariscono, i tesori restano cinque.
9. Dopo «Zaino pronto» e un ricaricamento sotto controllo del worker, togliere la rete e riaprire mappa, grotta e missione dei cristalli.
10. Controllare che Road to Los Angeles e le altre avventure mantengano progressi e comandi.

Dopo una vittoria, un ricaricamento propone la prossima missione sbloccata, secondo il comportamento della PWA: per rivedere un finale precedente selezionare esplicitamente quell’obiettivo.

## Screenshot da partite reali

[Ingresso smartphone](screenshots/grotta/ingresso-smartphone.png) · [Cristalli smartphone](screenshots/grotta/cristalli-smartphone.png) · [Cristalli Esploratore](screenshots/grotta/cristalli-esploratore.png) · [Cristalli Investigatore](screenshots/grotta/cristalli-investigatore.png) · [Pavimento tablet](screenshots/grotta/pavimento-tablet.png) · [Ponte Esploratore](screenshots/grotta/ponte-esploratore.png) · [Ponte Investigatore](screenshots/grotta/ponte-investigatore.png) · [Ponte tablet](screenshots/grotta/ponte-tablet.png) · [Tempio Esploratore](screenshots/grotta/tempio-esploratore.png) · [Tempio Investigatore](screenshots/grotta/tempio-investigatore.png).

I test catturano le immagini dopo aver manipolato davvero gli enigmi. Non usano flag di vittoria o assegnazione diretta dei cinque tesori della Grotta.

## Limiti noti

Esplorazione a zone, con spostamenti e azioni ambientali, senza movimento libero in un mondo continuo. Luce su griglia e meccanica degli ingranaggi/contrappesi sono modelli didattici deterministici, senza inerzia o ottica fisica continua. Configurazioni generate da una famiglia finita e verificata; nessuna generazione illimitata di stanze. Test automatici su Chromium con emulazione smartphone/tablet; Safari, Firefox e dispositivi fisici restano da collaudare. Nessun multiplayer o servizio remoto.

## Risultati delle verifiche

- `npm run build`: **76 risorse locali** nel precache, build riproducibile verificata dal test PWA.
- `npm test`: **44/44 passati**, inclusi otto nuovi test della Grotta. I motori completano tutte e cinque le missioni in entrambe le difficoltà su otto configurazioni; verificano anche riflessioni nei quattro versi, ostacoli/cicli, checkpoint, trasmissione, masse, tempio con difficoltà miste e ricompense idempotenti.
- `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`: **55/55 passati** in 6,8 minuti, includendo i percorsi completi della Grotta da zero in entrambe le difficoltà, Road to Los Angeles in entrambe le modalità, PWA e regressioni dei giochi precedenti.
- È stato aggiunto il caso tablet: **1/1 passato**, per **56 scenari browser distinti verificati**. La suite attuale elenca 56 test.
- Dopo le rifiniture della trasmissione animata e la rimozione di un ciclo di rendering non necessario, l’intera suite specifica della Grotta è stata rieseguita: **7/7 passati**, inclusi tablet, touch, tastiera, offline, checkpoint, ripristino e replay senza duplicazione.
- Controllo visivo degli screenshot di ingresso, cristalli smartphone e ponte tablet. I rotori girano sui propri assi, e le funi non generano superfici piene.
- `git diff --check`: nessun errore.

Le partite complete della Grotta non modificano lo stato interno del motore o invocano direttamente l’assegnazione dei suoi tesori: usano i controlli della UI. Le fixture iniziali conservano invece un Atlante già completato, di cui si verificano record e souvenir dopo la conclusione della Grotta. I test dei motori esercitano direttamente propagazione, passi e meccanismi prima di chiedere l’apertura dei passaggi.
