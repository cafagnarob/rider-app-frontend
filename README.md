# Rider App — Frontend

Rider App è un'applicazione social e di ride-tracking per motociclisti: profilo e garage moto, organizzazione di eventi/raduni, tracciamento dei percorsi in moto su mappa, feed social (post, commenti, like, follow) e notifiche. Progetto realizzato come capstone del corso Full Stack Developer.

Questo repository contiene il frontend (React + Vite). Il backend (Spring Boot) vive in un repository separato, non incluso in questa consegna — vedi la sezione Backend più sotto per come accedervi.

# Demo live

Frontend: https://rider-app-frontend-ten.vercel.app/
Backend API: https://be-capstone-kyub.onrender.com

Nota: il backend è ospitato su un piano gratuito Render, quindi dopo un periodo di inattività la prima richiesta può richiedere qualche secondo in più (cold start).

# Stack tecnologico

React 19 + Vite
Redux Toolkit & RTK Query (stato globale e comunicazione con le API)
React Router v7
React-Bootstrap / Bootstrap 5
MapLibre GL (mappe e visualizzazione percorsi)
Recharts (grafici/statistiche)
styled-components
vite-plugin-pwa (app installabile / PWA)
Funzionalità principali
Autenticazione (registrazione, login, verifica email, reset password)
Profilo utente e garage moto (marche, modelli, veicoli)
Eventi/raduni: creazione, ricerca, partecipazione, inviti, codici di accesso
Ride tracking con percorsi su mappa
Feed social: post, commenti, like, follow
Notifiche
Installabile come PWA

# Struttura del progetto

src/
├── api/ # RTK Query: comunicazione con il backend (apiSlice.js)
├── app/ # configurazione dello store Redux
├── assets/
├── components/ # componenti condivisi (common, layout, map)
├── features/ # auth, catalog, events, follow, notification, rides, routesMap, social, users, vehicles
├── hook/ # custom hook
├── pages/ # pagine dell'applicazione
├── routes/ # definizione delle rotte
├── styles/
└── utils/

# Requisiti

Node.js 18+ e npm
Installazione e avvio in locale
Clonare il repository:
bash
git clone https://github.com/cafagnarob/rider-app-frontend.git
cd rider-app-frontend
Installare le dipendenze:
bash
npm install
Verificare/creare il file .env.development nella root (vedi tabella sotto).
Avviare l'app in modalità sviluppo:
bash
npm run dev
Aprire http://localhost:5173.

# Variabili d'ambiente

Variabile Descrizione Sviluppo (.env.development) Produzione (.env.production)
VITE_API_BASE_URL URL base delle API del backend http://localhost:8080 https://be-capstone-kyub.onrender.com
VITE_MAPTILER_KEY Chiave API MapTiler per mappe/geocoding già presente nel file .env.production incluso nel repo idem

# Script disponibili

Comando Descrizione
npm run dev Avvia il server di sviluppo Vite
npm run build Crea la build di produzione
npm run preview Serve localmente la build di produzione
npm run lint Esegue ESLint

# Backend

Questo frontend comunica con un'API REST Spring Boot che vive in un repository separato, non incluso in questa consegna. Per provare l'applicazione end-to-end o consultare il codice del backend:

API live (già configurata come default in produzione): https://be-capstone-kyub.onrender.com — non serve avviare nulla in locale per usare la demo pubblicata su Vercel.
Repository backend: https://github.com/cafagnarob/BE_capstone
Documentazione completa del backend (stack, variabili d'ambiente, avvio in locale, endpoint, Docker): README nel repository sopra.

Se il repository backend risulta privato al momento della valutazione, contattare l'autore (cafagna.rob@gmail.com) per essere aggiunti come collaboratori, oppure fare riferimento esclusivamente alla demo live indicata sopra, già collegata al backend in produzione.

# Deploy

Il frontend è pubblicato su Vercel (vedi vercel.json, con rewrite per il routing SPA).

# Autore

Roberto Cafagna — Progetto capstone, corso Full Stack Developer.
