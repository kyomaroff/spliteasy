# SplitEasy 💸 — Version Firebase

Application de partage de dépenses avec comptes utilisateurs et synchronisation cloud.

## 🔥 Fonctionnalités
- 🔐 Connexion email/mot de passe + Google
- ☁️ Données sauvegardées dans Firebase (cloud)
- 👥 Groupes partageables entre amis
- 📱 Installable sur Android et iPhone (PWA)
- 🌍 7 langues : FR, EN, IT, ES, PT, AR, ZH

## 🚀 Déployer sur Vercel

### Étape 1 — Installer les dépendances
Ouvre un terminal dans ce dossier et tape :
```
npm install
```

### Étape 2 — Tester en local (optionnel)
```
npm run dev
```
Ouvre http://localhost:5173 dans ton navigateur.

### Étape 3 — Mettre sur GitHub
1. Va sur github.com → New repository → "spliteasy"
2. Upload tous les fichiers de ce dossier
3. Commit changes

### Étape 4 — Déployer sur Vercel
1. vercel.com → Sign up with GitHub
2. Add New Project → sélectionne "spliteasy"
3. Deploy → ton app est en ligne !

## ⚙️ Configuration Firebase (déjà faite)
Le fichier src/firebase.js contient déjà ta config Firebase.

## 🔒 Règles de sécurité Firestore
Dans la console Firebase → Firestore → Règles, colle ces règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /groups/{groupId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.sharedWith;
      allow create: if request.auth != null;
    }
  }
}
```

## 📱 Installer sur Android
Chrome → menu ⋮ → "Ajouter à l'écran d'accueil"

## 🍎 Installer sur iPhone  
Safari → bouton partage → "Sur l'écran d'accueil"
