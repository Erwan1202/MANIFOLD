# MANIFOLD ENGINE : ARCHITECTURE ET LOGIQUE DÉFINITIVE

Ce document sert de spécification technique complète pour la version finale du projet MANIFOLD. Il détaille la structure, les mécanismes algorithmiques et les choix d'ingénierie qui soutiennent le moteur de résolution de contraintes topologiques.

---

## I. FONDATIONS ARCHITECTURALES

### STACK TECHNIQUE

| Composant      | Technologie              | Rôle Principal                                                  | Niveau    |
| :------------- | :----------------------- | :-------------------------------------------------------------- | :-------- |
| **Core Logic** | **Rust/WASM**           | Moteur WFC, Graphe Topologique, Instrumentation.               | Critique  |
| **Binding**    | `wasm-bindgen`          | Transfert de données optimisé entre le Host (JS) et le Guest (WASM). | Critique  |
| **Frontend**   | React / TypeScript / Zustand | État applicatif global, gestion des transitions.           | Principal |
| **Rendu 3D**   | React Three Fiber (R3F) | Pipeline de rendu et gestion des événements 3D.                 | Principal |

### DÉPLOIEMENT MÉMOIRE ET STABILITÉ

L'état de la grille est centralisé côté Rust/WASM pour l'intégrité et la performance :

- **Capacité :** La mémoire est allouée pour **486 cellules** (`Vec<u8>`), permettant 6 Sudokus complets (6 faces × 81 cellules) de coexister dans un unique segment de mémoire.
- **WASM Bridge Optimisé :** Les fonctions d'accès (`get_grid`, `get_fixed_cells`) renvoient des `Vec<u8>` (convertis en `Uint8Array` côté JS) qui sont compacts et rapides à transférer.
- **Garde Strict Mode :** Un verrou d'initialisation (`isWasmLoaded` / `isInitializing`) est utilisé pour garantir que les ressources globales WASM ne sont chargées qu'une seule fois, prévenant les corruptions de mémoire et les erreurs de *recursive use* fréquentes avec React 18.

---

## II. LE MOTEUR TOPOLOGIQUE ET ALGORITHMIQUE

Le cœur du projet repose sur la modélisation mathématique du problème de contraintes, et non sur le rendu visuel.

### A. CONSTRAINTE (TOPOLOGIE MANIFOLD)

Le moteur gère un objet unique, non 6 grilles indépendantes, grâce à un graphe.

- **Graphe d'Adjacence (`constraints`) :** Cette structure (`Vec<Vec<usize>>`) est pré-calculée au démarrage de l'application et agit comme l'unique source de contraintes pour le solveur. Elle stocke, pour chaque index de cellule, la liste des autres index qui ne peuvent pas avoir la même valeur.
- **Contraintes Inter-Faces (Stitching) :** La fonction `generate_cube_topology` implémente un algorithme de couture d'arêtes. Elle relie les bords homologues entre les 6 faces (ex : Bord Droit de la Face 0 est contraint par le Bord Gauche de la Face 2).
- **Validation O(1) :** La fonction `is_safe` ne fait qu'un scan linéaire de la liste de voisins pré-calculée, garantissant une vérification de contrainte extrêmement rapide.

### B. LE SOLVEUR (WAVE FUNCTION COLLAPSE)

Le solveur utilise le WFC avec l'heuristique MRV (Minimum Remaining Values), démontrant une gestion avancée des CSP.

- **Domaines (`domains: Vec<Vec<bool>>`) :** Chaque cellule possède un domaine de possibilités (1–9). Ce domaine est stocké *eagerly* (mis à jour immédiatement) par la fonction `propagate` après chaque placement de valeur.
- **Heuristique MRV :** La fonction récursive `solve_wfc` choisit toujours la case vide avec le moins de possibilités restantes (entropie minimale).
- **Backtracking Instrumenté :** Pour gérer le retour arrière, le moteur utilise la technique `backup_affected_domains` pour sauvegarder et restaurer **uniquement** les domaines des voisins impactés. Cela rend le backtracking plus efficace en évitant les réinitialisations globales coûteuses.

---

## III. INSTRUMENTATION ET COMPRESSION DES DONNÉES

### BENCHMARKING CPU

Le solveur `solve()` est instrumenté pour prouver la supériorité du code Rust.

- **Mesure WASM :** Utilisation de l'API `web_sys::performance().now()` pour mesurer le temps de calcul brut en **microsecondes (µs)** avant tout transfert JS/WASM.
- **Rapport Complet :** Le rapport `SolveStats` inclut `iterations` (nœuds explorés), `backtracks` (qualité de l'heuristique), et `time_us`, fournissant une preuve tangible de l'efficacité du WFC sur des structures à 486 cellules.

### SÉRIALISATION COMPACTE

- **Bitpacking Math :** Le moteur expose une fonction `export_state` qui compresse chaque valeur (0–9) en 4 bits. Ceci réduit le besoin de stockage de l'état complet de 486 octets à 243 octets.
- **Permalinks :** L'état compressé est transféré sous forme de `Uint8Array` à la couche JS, encodé en Base64url et injecté dans le hash de l'URL. Cela permet le partage d'état complet sans utiliser de base de données.

---

## IV. RENDU VISUEL ET GÉOMÉTRIE

Le design final est celui d'un diagramme technique minimaliste pour maximiser la lisibilité des contraintes.

### LISIBILITÉ ET ESTHÉTIQUE

- **Thème :** "Editorial Brutalism" (Papier, Encre Noire, Serif/Mono).
- **Rendu 3D :** La solution finale utilise des **Plans 2D** (`planeGeometry`) pour les tuiles, collés sur un noyau solide de couleur Paper. Ce rendu simule une surface blanche et lisse avec des traits d'encre gravés.
- **Contraste :** Le texte est en **Noir Profond** sur la surface blanche, et les lignes de la grille sont dessinées par des `Edges` noirs.
- **Stabilité Rendu :** L'optimisation `useLayout` / `React.memo` a découplé le calcul géométrique (statique) de l'actualisation des données (dynamique), éliminant les lags du navigateur (Chrome/Firefox) lors des mises à jour de la grille.

---

## V. DÉMARRAGE RAPIDE

Clonez le repository.

### PRÉREQUIS

- `Node.js` (LTS)
- `Rust` (toolchain stable)
- `wasm-pack`

### INSTRUCTIONS

```bash
# 1. Installer les dépendances
npm install

# 2. Compiler le Core Rust/WASM
npm run build:wasm

# 3. Lancer le serveur
npm run dev
