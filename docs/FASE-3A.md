# Fase 3A — spedizioni paleontologiche e macchina del tempo

Base: `main` alla revisione `0b70661`, merge della Fase 2B verificato tramite ascendenza del commit prima dello sviluppo. Branch: `codex/fase-3a-educativi`. ID confermati e conservati: `jurassic` e `time`.

## Le due avventure

Jurassic unisce terreno stratificato da scavare, strumenti da cambiare, ricostruzioni con pezzi realmente collocabili e confronto degli indizi. La Macchina del Tempo richiede di costruire circuiti, distribuire cristalli, dosare liquidi e regolare strumenti: non presenta risposte numeriche fra cui scegliere. In entrambe, visitare una schermata o chiedere un indizio non completa la missione.

| Missione | Jurassic — La Spedizione Perduta | La Macchina del Tempo |
|---|---|---|
| 1 | **Il primo fossile:** tre reperti, strato compatto rimosso con pala e rifinitura con pennello; entrambi gli strumenti devono essere usati correttamente. | **Accendi il motore:** tre circuiti, somma con due pile, sottrazione con due connettori segnati e somma di tre pile. |
| 2 | **Le ossa misteriose:** cinque reperti recuperati e cinque incastri dello Stegosauro completati. | **Gli ingranaggi impazziti:** due costruzioni di gruppi uguali e una distribuzione in un numero di ruote richiesto. |
| 3 | **Il predatore e l’erbivoro:** sei reperti, due modelli da tre parti e due etichette alimentari basate su denti e cranio. | **Il carburante temporale:** tre dosaggi in mL/L; l’ultima riserva parte sovrariempita e richiede di togliere l’eccesso. |
| 4 | **La valle dimenticata:** tre siti con tracce da osservare, sette parti del modello del Diplodoco e identificazione finale. | **Le coordinate perdute:** orologio da regolare dopo un viaggio, sequenza numerica da ordinare e rotta da percorrere su una griglia. |
| 5 | **Il Museo del Tempo:** tre siti, otto parti di due modelli, distinzione dinosauro/pterosauro e inaugurazione del museo. | **Il grande salto temporale:** cinque strumenti collegati nello stesso viaggio: circuito, divisione in gruppi, serbatoio, orologio e coordinate. |

Le cinque spedizioni richiedono complessivamente 29 recuperi, 26 collocamenti e cinque classificazioni. I viaggi comprendono 17 meccanismi da costruire e verificare. Ogni missione ha anche un comando finale esplicito: Concludi la spedizione oppure Avvia il portale. Le condizioni sono controllate dai motori, non dal router o dal pulsante di avvio.

## Interazione e didattica

### Jurassic

Il trascinamento sul terreno agisce sulle zone attraversate, una rimozione per zona in ciascun gesto. Lo strato compatto richiede la pala; vicino al reperto si passa al pennello. I livelli superiori aggiungono terreno da rimuovere. L’uso impreciso riduce la valutazione ma non distrugge il reperto o blocca il gioco: anche un fossile recuperato con la pala può essere rifinito con il pennello.

I pezzi si trascinano sulla sagoma con aggancio soltanto nell’incastro corrispondente. L’alternativa è selezionare il pezzo e poi il posto; tutti sono pulsanti accessibili con tastiera. Le etichette si applicano alle schede degli indizi con lo stesso sistema. Nei siti avanzati la traccia deve essere osservata prima dello scavo.

Il Museo del Tempo è consultabile dalla spedizione e dal Diario. Include schede dei cinque animali, reperti trovati, periodo e conoscenze sbloccate. I reperti incompleti compaiono come **ipotesi in studio**, non come identificazioni già confermate. La quinta missione inaugura la collezione completa. Il museo non dipende dal mantenimento in memoria dell’ultima partita.

### Macchina del Tempo

- Pile locali, ciascuna utilizzabile una sola volta nel circuito; i connettori indicano + o −, e il totale cambia con la costruzione. Sono accettate tutte le combinazioni valide, non una singola risposta predefinita.
- Ruote e cristalli: si creano i gruppi e si distribuisce una unità alla volta, con somma, moltiplicazione e divisione rese visibili. Tutta la riserva deve essere distribuita in gruppi uguali.
- Dosatori da 250/500 mL e serbatoio graduato fino a 2500 mL, con scarico reversibile. Il volume non può essere negativo o superare la capacità.
- Lancette analogiche e indicazione digitale, controlli di un’ora/cinque minuti, compreso il passaggio all’ora successiva; segnali ordinabili e cursore su coordinate intere positive.
- Il portale si apre soltanto dopo tutti i meccanismi corretti. Seguono animazione leggera e breve arrivo in una destinazione fantastica, registrata nel Diario.

Tre difficoltà globali variano quantità, lunghezze e terreno. Gli errori restano recuperabili e non esiste un timer obbligatorio. La riserva sovrariempita introduce una sottrazione concreta; le missioni finali combinano più azioni invece di ripetere una sola operazione. Le valutazioni non scendono sotto un minimo positivo e gli aiuti non sottraggono tesori.

La radio offre prima un indizio operativo, poi un riferimento visivo, infine un aiuto esplicito. Non colloca pezzi, non costruisce il circuito e non assegna ricompense. Le quinte missioni includono una battuta speciale dello Zio, visibile nell’arrivo e disponibile via radio.

## Contenuti scientifici

Le illustrazioni delle ossa sono originali, **schematiche e non in scala**, non ricostruzioni anatomiche professionali. I denti seghettati del carnivoro e quelli per lavorare vegetali hanno rappresentazioni diverse. Le schede confrontano più indizi e non insegnano a identificare una specie da un singolo frammento generico.

- Stegosauro e Diplodoco: dinosauri erbivori del Giurassico superiore.
- Tirannosauro e Triceratopo: dinosauri del Cretaceo superiore; carnivoro il primo, erbivoro con becco e dentizione per vegetali il secondo.
- Pteranodonte: pterosauro del Cretaceo superiore, non dinosauro; dito alare allungato a sostegno della membrana.
- Le impronte sono tracce fossili; non sempre permettono un’identificazione di specie. La postura del collo dei sauropodi non è trattata come una certezza immutabile. Gli uccelli sono dinosauri viventi.

La valle narrativa mescola epoche attraverso il tema temporale: il museo dichiara espressamente che Tirannosauro e Triceratopo non vissero nel Giurassico. I testi sono locali e non contengono ricostruzioni pseudoscientifiche o dati dimensionali incerti presentati come esatti. Riferimenti divulgativi utili per revisione editoriale: Dino Directory del Natural History Museum, materiali introduttivi di Smithsonian e UCMP su dinosauri e pterosauri; non sono servizi o dipendenze runtime.

## Architettura e archivio

- `js/education-data.js`: missioni, schede, quantità e destinazioni locali.
- `js/jurassic-engine.js`, `js/time-engine.js`: stato e validazione indipendenti dal DOM.
- `js/jurassic-game.js`, `js/time-game.js`: interazioni e viste, museo compreso.
- `js/education-dom.js`: selezione, drag pointer, cancellazione dei gesti e conservazione del focus.
- SVG `assets/fossil-*.svg`: reperti e traccia originali; sfondi, facce del museo e intestazioni riusano l’atlante approvato senza modificarlo.

Router, catalogo, `createGameSession`, `store.complete`, Tesori e radio restano il sistema comune. I motori dei sei classici non sono stati modificati. Le quattro avventure successive restano in preparazione.

L’archivio centrale, **nella stessa chiave `ehy-amico:progress`**, migra dalla versione 1 alla 2: conserva completamenti, record, preferenze e visite, aggiungendo `adventures.jurassic` e `adventures.time` con un checkpoint per missione. I vecchi client che riconoscono soltanto la versione 1 trattano la 2 come futura e non la sovrascrivono. Non viene creato un archivio parallelo per i tesori.

Scavo, strumenti, incastri, tracce e configurazioni vengono salvati dopo le azioni; l’uscita salva nuovamente lo stato. La ripresa conserva anche la difficoltà originale di quella missione. Riprova avvia deliberatamente una nuova esecuzione della missione corrente, applicando la difficoltà attuale; non azzera i tesori. Una missione già completata si rigioca da zero, senza duplicare premi. Le configurazioni matematiche pregresse vengono rivalidate al ripristino, non accettate come semplici flag di successo.

Dieci nuovi tesori e due frammenti: fino a **40/60 tesori e 8/12 frammenti** con le prime sei avventure complete. I dati scientifici e tutti gli asset sono inclusi nel precache con hash aggiornato. Manifest, icone, home e dodici tessere approvate restano invariati. Nessun framework, account, tracciamento o servizio remoto. I nuovi giochi sono silenziosi; l’impostazione audio esistente continua a gestire i classici.

## Test e risultati

Comandi: `npm run build`, `npm test`, `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`, `git diff --check`.

- **30 test logica/PWA:** tutti i precedenti e sette nuovi gruppi di verifiche. Tutte le cinque missioni di ciascun motore sono costruite e completate ai tre livelli. Verificati strumenti sbagliati, scavo progressivo, tracce obbligatorie, incastri errati/corretti, classificazione, rigioco, unicità delle pile, gruppi, capienza, misure, orologio e coordinate, cronologie malformate, ripresa e migrazione v1→v2 con record `car` conservato.
- **44 scenari Chromium:** 34 regressioni e dieci scenari educativi/aggiornamento. Completate tutte le dieci missioni con azioni reali nel browser: nessun salto al traguardo. Scavo trascinato, cambio strumenti, trascinamento reale di ossa, pile e dosatore; alternative con selezione, tastiera e touch. Museo, ipotesi parziali, Diario, battute finali, 40 tesori, otto frammenti, rigioco senza duplicazione e persistenza verificati.
- Aggiornamento con il vecchio modulo dell’archivio della Fase 2B e worker dedicato, seguito dall’aggiornamento reale al modulo versione 2: restano 30 tesori, record e impostazioni, e uno scavo appena iniziato si riprende dopo ricarica. Il test distingue i timestamp dei file sul server locale per evitare risposte 304 spurie quando due build avvengono nello stesso secondo; ripristina i file in `finally`.
- Funzionamento offline dei nuovi dati/asset e interazioni a 360×800, 768×1024 e 1024×768. Regressione dei sei classici, aggiornamento cache e illustrazione principale inclusi nella suite. Nessun errore JavaScript nei percorsi offline controllati.

**Limiti delle prove automatiche:** gli aiutanti di test leggono i dati delle missioni per scegliere mosse corrette, poi costruiscono davvero le soluzioni tramite gli input; non sono valutazioni dell’apprendimento di un bambino. I progressi iniziali dei sei classici sono dati di test per la compatibilità. Alcune vecchie regressioni mantengono clock controllati e fixture già documentati. Nessuna scorciatoia di test viene aggiunta all’app pubblicata.

Screenshot principali in `docs/screenshots/fase-3a/`. Non sono state eseguite prove su tablet fisici, Safari/iPadOS, installazione standalone o lettori di schermo reali. Servono collaudo umano dell’ergonomia e revisione didattica con bambini: i pulsanti e le alternative al drag sono presenti, ma la qualità d’uso assistita non equivale alla sola verifica automatica. Su smartphone i modelli e i pannelli richiedono scorrimento; la selezione seguita dal tocco permette di collocare pezzi anche fra aree non contemporaneamente visibili.

## Collaudo manuale su tablet

1. Avviare `npm ci` e `npm run serve`, aprire `http://localhost:8000/ehy-amico/`. Usare un profilo separato per prove da zero, senza cancellare progressi abituali. Aspettare «Zaino pronto» prima di scollegare la rete.
2. Entrare nella tessera 07 dalla mappa. Nella prima missione passare la pala sul terreno, poi cambiare strumento e rifinire. Provare una volta lo strumento errato: il reperto deve restare recuperabile. Uscire a metà e riprendere, controllando strato e strumento.
3. Nelle missioni successive trascinare un osso nell’incastro sbagliato e poi in quello corretto. Ripetere usando soltanto selezione e tocco. Osservare le tracce in tutti i siti, ricostruire e confrontare i denti/cranio. Visitare il museo a metà e dopo l’inaugurazione.
4. Entrare nella tessera 08. Costruire più di una somma valida, poi una sottrazione. Nei gruppi provare una distribuzione sbilanciata, correggerla e completare la divisione. Nei serbatoi superare una tacca e scaricare; leggere 1 L = 1000 mL.
5. Regolare l’orologio, ordinare i segnali e seguire la rotta. Lasciare un circuito a metà, visitare Diario e tornare: le pile devono restare nei connettori. Avviare il portale soltanto a strumenti riparati e leggere la destinazione.
6. Provare i tre livelli e i due orientamenti. La radio deve mostrare aiuti progressivi senza completare da sola il compito. Dopo le quinte missioni controllare battuta, frammenti e Museo/Diario. Rigiocare e ricaricare: nessun tesoro aggiuntivo.
7. Ripetere offline e ricontrollare i sei classici e i loro record. Per un aggiornamento installato verificare anche sospensione/ripresa e riapertura dalla Home del dispositivo.

Nessun merge o deploy. Fasi 3B e 3C non avviate; nessuna modifica a repository sorgente esterni.
