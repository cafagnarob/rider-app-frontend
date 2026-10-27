<div align="center">

<img src="./public/icon-192.png" alt="Rider App" width="96" />

# 🏍️ RIDER APP

**L'app social per chi la domenica mattina ha già il casco in mano.**

Organizza uscite, traccia i tuoi giri, disegna percorsi e condividi la strada con la tua community.

[**▶ PROVA LA DEMO**](https://rider-app-frontend-ten.vercel.app/) · [Backend](https://github.com/cafagnarob/BE_capstone)

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre-396CB2?style=for-the-badge&logo=maplibre&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

</div>

---

## 🛣️ Di cosa si tratta

Rider App nasce da una domanda semplice: perché per organizzare un giro in moto servono un gruppo WhatsApp, un link di Google Maps, un'app per registrare il percorso e Instagram per le foto?

Qui c'è tutto in un posto solo. Crei l'uscita, scegli il percorso, inviti gli amici, registri il giro e alla sera pubblichi le foto con il tracciato attaccato.

È una **Progressive Web App**: si apre dal browser e si installa sul telefono come un'app vera, senza passare dagli store.

> ⏳ Il backend gira su un piano gratuito di Render: la prima richiesta dopo un po' di inattività può impiegare qualche secondo. Come una moto a freddo.

---

## 🔥 Cosa puoi fare

### 📅 Eventi

Tre tipi di uscita, per ogni tipo di rider:

| Tipo                    | Per chi                                                                        |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Standard**            | il giro classico: partenza, percorso, rientro. La fine si calcola dal percorso |
| **Raduno**              | ci si trova in un punto, il percorso è facoltativo                             |
| **Viaggio multigiorno** | un evento con più tappe, ognuna con il suo giorno                              |

E tre livelli di privacy: **pubblico**, **con codice di accesso** o **solo su invito**.

### 🗺️ Percorsi

Un editor in stile Kurviger e Calimoto: cerchi un indirizzo, aggiungi e trascini le tappe, scegli se evitare autostrade, pedaggi e traghetti. Il percorso si apre su Google Maps o si esporta in **GPX**.

### 📍 Ride tracking

Premi start e vai. L'app registra il tracciato via GPS, calcola distanza, velocità e soste, e alla fine ti mostra il giro su mappa con i **grafici della velocità**.

### 📸 Social

- **Feed** con tre tab: Seguiti, Esplora e il tuo profilo
- **Storie** in stile Instagram, fino a 6 slide, con widget trascinabili per collegare un giro, un percorso, un evento o la tua moto
- Commenti con risposte, like, follow e notifiche

### 🏍️ Garage e catalogo

Un catalogo di marche e modelli con ricerca e filtri. Aggiungi le tue moto al garage, scegli quella attiva e collegala ai post e ai giri.

### 🛡️ Area admin

Una sezione separata per gestire utenti, catalogo, eventi e segnalazioni, con dashboard e invio di notifiche a tutti gli utenti.

---

## 🚀 Avvio in locale

**Requisiti:** Node.js 18+ e npm.

```bash
git clone https://github.com/cafagnarob/rider-app-frontend.git
cd rider-app-frontend
npm install
npm run dev
```

Poi apri [http://localhost:5173](http://localhost:5173).

### 🔑 Variabili d'ambiente

Crea un file `.env.development` nella cartella principale:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_MAPTILER_KEY=la_tua_chiave_maptiler
```

| Variabile           | A cosa serve                                                               |
| ------------------- | -------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | indirizzo del backend. In produzione punta a Render                        |
| `VITE_MAPTILER_KEY` | chiave [MapTiler](https://www.maptiler.com/) per mappe e ricerca indirizzi |

Per usare l'app in locale serve anche il [backend](https://github.com/cafagnarob/BE_capstone) in esecuzione: trovi le istruzioni nel suo README.

### 🧰 Comandi

| Comando           | Cosa fa                        |
| ----------------- | ------------------------------ |
| `npm run dev`     | avvia il server di sviluppo    |
| `npm run build`   | crea la build di produzione    |
| `npm run preview` | prova la build in locale       |
| `npm run lint`    | controlla il codice con ESLint |

---

## ⚙️ Sotto il serbatoio

|                      |                                                                  |
| -------------------- | ---------------------------------------------------------------- |
| **Interfaccia**      | React 19 con React Compiler · React-Bootstrap · React Icons      |
| **Stato e API**      | Redux Toolkit · RTK Query                                        |
| **Navigazione**      | React Router 7 con rotte protette                                |
| **Mappe**            | MapLibre GL · MapTiler · Supercluster per raggruppare gli eventi |
| **Grafici**          | Recharts                                                         |
| **Drag & drop**      | dnd-kit, per riordinare tappe e giorni                           |
| **App installabile** | vite-plugin-pwa                                                  |
| **Deploy**           | Vercel                                                           |

### 📁 Struttura

```text
src/
├── api/          tutte le chiamate al backend (RTK Query)
├── app/          configurazione dello store Redux
├── components/   componenti condivisi: layout, navigazione, mappa
├── features/     un dominio per cartella
│   ├── auth/           login, registrazione, recupero password
│   ├── catalog/        marche e modelli
│   ├── events/         eventi, inviti, partecipazioni
│   ├── notification/   notifiche
│   ├── rides/          tracciamento e grafici
│   ├── routesMap/      percorsi
│   ├── social/         feed, post, storie, commenti
│   ├── users/          profili e sicurezza
│   └── vehicles/       garage
├── pages/        le pagine dell'app, ognuna con il suo CSS
├── routes/       rotte e protezione delle pagine
├── styles/       tema e stili condivisi
└── utils/        geolocalizzazione, GPX, date, polilinee
```

---

## 🛞 Prossime uscite

- [ ] App mobile nativa con Capacitor, per registrare i giri anche con lo schermo spento
- [ ] Gamification: trofei e obiettivi sbloccati automaticamente
- [ ] Chat di gruppo per gli eventi e messaggi diretti
- [ ] Posizione condivisa in tempo reale durante le uscite di gruppo
- [ ] Pulsante SOS con contatti di emergenza

---

<div align="center">

Sviluppata da **Roberto Cafagna** · [@cafagnarob](https://github.com/cafagnarob)

_Casco allacciato, visiera abbassata. Buon giro._ 🏁

</div>
