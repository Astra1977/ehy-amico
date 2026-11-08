# Fase 3B — Avventura 09: L’Atlante Segreto

## Integrazione

Base verificata: `main` a `414fa028f2bfbf5b3a427ee6d05b8e260bd7ea8d` (merge Fase 3A). Nessuna PR aperta rilevata prima dell’implementazione. ID interno `atlas`, numero 09. Nessun motore delle altre avventure è modificato; i punti di ingresso comuni registrano il nuovo gioco.

Il salvataggio v2 mantiene la chiave `ehy-amico:progress`, backup e namespace esistenti e aggiunge `adventures.atlas[1..5]`. Ogni missione conserva posizione, modalità, souvenir, record distinti e checkpoint dei minigiochi. Un viaggio interrotto riparte dall’ultimo nodo raggiunto. La guida e l’azione di football si riprendono dalla simulazione salvata. Riprova riavvia la missione conservando souvenir e record. Le ricompense passano esclusivamente per `createGameSession.complete`: cinque tesori e un frammento, condivisi dalle due modalità. I souvenir non entrano nei 60 tesori.

## Cinque missioni

1. **La partenza da New York**: Stati confinanti, bussola rotante, costruzione dell’itinerario New York → Philadelphia → Washington, camper animato e guida con collisioni/carburante.
2. **La Lega delle Città**: New York, Miami, Dallas, Kansas City, Denver e Seattle. Arrivo sul nodo, collocazione libera del segnaposto, associazione allo Stato, sintonia radio e collegamento della scheda della squadra alla conference. Per New York si usa la scheda Giants (NFC); i Jets (AFC) sono spiegati nella scheda.
3. **Il Deserto delle 1000 Miglia**: Seattle → Denver → Albuquerque → Flagstaff. Il Veterano passa anche da Kansas City. Navigazione, orientamento a ovest, orologio di luglio New Mexico/Arizona, guida arcade con almeno tre taniche e 1000 unità di gioco.
4. **Il Playbook Segreto**: posizionamento laterale di quarterback e due ricevitori, traiettorie verticali/incrociate, avvio, passaggio temporizzato, ricezione, difensori in inseguimento, intercetti, placcaggi e corsa fino alla end zone.
5. **Destination: Los Angeles**: Flagstaff → Las Vegas → Los Angeles → Inglewood; ingrandimento locale, stadio originale, sfida di football, pubblico, fulmine blu/oro e messaggio finale dello Zio.

Esploratore: collocazione geografica più tollerante, suggerimenti espliciti, un difensore più lento. Veterano NFL: deviazione aggiuntiva, collocazione e sintonia più precise, tre difensori più rapidi e raggio d’intercetto maggiore. Le stesse missioni e ricompense; record separati per modalità e missione. Il punteggio del football combina yard conquistate, profondità del passaggio (più rischiosa se si aspetta) e bonus Veterano. Nessun conto alla rovescia nella guida: il carburante è una risorsa da raccogliere, la sconfitta consente di riprovare senza perdere tesori.

## Controlli e accessibilità

Mappa: mouse/touch per tap e trascinamento, due dita per zoom, comandi di zoom/pan e pulsanti destinazione alternativi. Stati SVG accessibili con Tab/Invio/Spazio; selettore nativo per tutti i 50 Stati e DC. Segnaposto con tap oppure controlli cardinali e conferma da tastiera. Radio con cursore e pulsanti conference, anche drag-and-drop con mouse.

Guida: frecce sinistra/destra oppure pulsanti mantenuti premuti; rilascio, annullamento puntatore, pausa e perdita di focus azzerano lo sterzo. Football: selezione giocatore + posizione sul campo oppure cursori accessibili; traiettorie e passaggi da pulsanti. Comandi dell’azione vicini al campo e barra persistente su smartphone. Pausa/ripresa e radio usano la sessione condivisa. `prefers-reduced-motion` elimina animazioni decorative e interpolazione visiva del camper.

## Geografia, dati e licenze

Confini locali dei 50 Stati e DC derivati da **us-atlas 3.0.1**, dati US Census Bureau: https://github.com/topojson/us-atlas. Proiezione equirettangolare semplificata per i 48 Stati contigui; Alaska e Hawaii in riquadri dichiarati. Percorsi illustrati tra coordinate di città, senza promesse di distanze stradali reali. Script opzionale di rigenerazione: `scripts/create-atlas-map.py`. Licenza ISC e copyright completi in [US-ATLAS-LICENSE.txt](US-ATLAS-LICENSE.txt).

Coordinate città in `js/atlas-data.js`; i dati distinguono città rappresentata e comune dello stadio: Giants/Jets → East Rutherford (NJ); Dolphins → Miami Gardens (FL); Cowboys → Arlington (TX); Chiefs → Kansas City (MO); Broncos → Denver (CO); Seahawks → Seattle (WA); Chargers/Rams → SoFi Stadium a Inglewood (CA). Riferimenti per il controllo editoriale: [NFL Teams](https://www.nfl.com/teams/), [MetLife Stadium](https://www.metlifestadium.com/), [Hard Rock Stadium](https://www.hardrockstadium.com/), [AT&T Stadium](https://attstadium.com/), [SoFi Stadium](https://www.sofistadium.com/). Il collegamento Giants/NFC e Jets/AFC è intenzionale, non una squadra combinata.

Il cambio d’ora è ambientato esplicitamente in **luglio**, da Albuquerque (MDT) a Flagstaff (MST): si porta indietro di un’ora. Non si generalizza a tutto l’anno o alla Nazione Navajo. Il titolo «1000 Miglia» è narrativo: distanza e velocità della guida sono unità di gioco. Nessuna API geografica o fonte esterna durante il gioco.

Illustrazione dello stadio, camper e campo originali. Nessun logo NFL, Chargers, uniforme ufficiale o asset proprietario. Progetto indipendente, senza affiliazione o sponsorizzazione NFL o delle squadre citate.

## Collaudo manuale

1. `npm ci`, `npm run build`, `npm run serve`; aprire `/ehy-amico/#game/atlas`.
2. In missione 1 provare un ordine sbagliato nel navigatore, svuotarlo e impostare Philadelphia/Washington; scegliere anche una destinazione fuori rotta. Verificare che non avanzi.
3. Toccare i tre Stati confinanti, orientarsi a ovest, viaggiare e raccogliere taniche evitando i coni. Pausare durante la guida, ricaricare e riprendere.
4. In missione 2 posare un segnaposto lontano e vicino; scegliere uno Stato sbagliato prima di quello giusto, sintonia lontana da 70 e conference errata prima della corretta. Ripetere per sei città.
5. Missione 3: raggiungere Flagstaff; prima di correggere bussola e orologio la guida non si apre. Portare l’orologio a 11 e guidare.
6. Missione 4: spostare i giocatori e cambiare traiettorie; osservare un intercetto/tentativo senza passaggio. Per una prima vittoria portare ricevitore 1 sulla fascia destra, scegliere verticale e passare presto. Riprovare da Veterano e confrontare i tre difensori.
7. Missione 5: osservare la distinzione Los Angeles/Inglewood, entrare nel campo e segnare. Controllare quinto tesoro, frammento e cartolina di Inglewood/Los Angeles nel diario.
8. Rigiocare in altra modalità: il totale non aumenta oltre cinque. Ricaricare, controllare record e altri giochi.
9. Attendere «Zaino pronto», ricaricare almeno una volta sotto controllo del service worker, disattivare la rete e riaprire: mappa, stadio e minigiochi restano disponibili.

## Screenshot

[Mappa desktop](screenshots/fase-3b/mappa-desktop.png) · [Mappa smartphone](screenshots/fase-3b/mappa-smartphone.png) · [Playbook desktop](screenshots/fase-3b/playbook-desktop.png) · [Playbook smartphone](screenshots/fase-3b/playbook-smartphone.png) · [Finale desktop](screenshots/fase-3b/finale-desktop.png) · [Finale smartphone](screenshots/fase-3b/finale-smartphone.png).

Le immagini della missione 5 sono catturate usando una fixture che sblocca le prime quattro missioni; tragitto finale, passaggio e touchdown vengono poi giocati realmente. I test end-to-end separati completano tutte le cinque missioni da zero in entrambe le modalità.

## Limiti deliberati

Mappa didattica, strade schematiche e riquadri non in scala reciproca. Football arcade originale con due traiettorie selezionabili e posizionamento laterale, senza simulazione NFL completa. Nessun multiplayer, cronaca o dati NFL dal vivo. Test automatici con Chromium; altri browser e dispositivi fisici restano da collaudare. Nessuna Fase 3C inclusa.

## Verifiche eseguite

- `npm run build`: precache locale di 69 risorse, generazione riproducibile.
- `npm test`: **36/36 passati**, inclusi geografia, collocazioni degli stadi, simulazione delle cinque missioni in entrambe le modalità, carburante/collisioni, intercetto/touchdown, passaggi profondi, salvataggi, invarianti dei 60 tesori e motori precedenti.
- `CHROMIUM_PATH=/usr/bin/chromium npx playwright test`: **48/48 passati** in 6,4 minuti, inclusi completamento da zero delle cinque missioni in Esploratore e Veterano, diario, cinque tesori, ripristino, PWA offline, touch emulato, pausa e tutte le regressioni già presenti.
- Test aggiunto dello zoom/pan: **1/1 passato**. Sono quindi **49 scenari browser distinti verificati**; la suite attuale ne elenca 49.
- Dopo gli ultimi ritocchi a zoom e punteggio: ulteriore esecuzione mirata **2/2 passata** per zoom/pan e touch sui minigiochi, salvataggio/ripresa e ripetizione del touchdown senza duplicare il tesoro.
- `git diff --check`: nessun errore. Rigenerazione della mappa con hash identico.

Gli input dei percorsi completi agiscono sui controlli della UI: non impostano flag di vittoria o chiamano il metodo di assegnazione delle ricompense. I test di regressione preesistenti mantengono le loro fixture originali.
