---
title: Exécuter Gemma 4 Heretic en local avec Ollama et Claude Code sur Ubuntu
description: Installer Gemma 4 Heretic Q8 sur NVIDIA avec Ollama Snap, connecter Claude Code en 64K et diagnostiquer les limites du modèle.
---

# Exécuter Gemma 4 Heretic en local sur Ubuntu avec Ollama et Claude Code

<div class="kb-doc-meta"><span>Linux · Ubuntu</span><span>IA locale</span><span>Ollama · Gemma 4</span><span>NVIDIA CUDA</span><span>Claude Code</span></div>

## Objectif

Installer et exécuter **Gemma 4 Heretic 12B**, un modèle communautaire dit *ablitéré* (mécanismes de refus modifiés), directement sur une carte graphique NVIDIA. Le modèle est servi par **Ollama** et peut être interrogé dans le terminal ou à travers l'interface **Claude Code**, sans clé API payante pour l'inférence locale.

Cette procédure distingue volontairement **Ollama installé avec Snap** de l'installation classique : les noms des services et les commandes de configuration ne sont pas identiques.

**Accès rapide :** [mémento des commandes de démarrage, d'arrêt, de vérification et de dépannage](#10-memento-des-commandes-utiles).

## Informations générales

| Élément | Configuration utilisée pour la vérification |
| --- | --- |
| Système | Ubuntu 26.04.1 LTS, 64 bits |
| Carte graphique | NVIDIA GeForce RTX 4090, 24 Go de VRAM |
| Pilote | NVIDIA 595.99.02, CUDA 13.2 |
| Ollama | 0.40.2, paquet Snap (révision 141) |
| Claude Code | 2.1.317 |
| Modèle | <code>igorls/gemma-4-12B-it-heretic-GGUF:Q8_0</code> |
| Taille du modèle | Environ 13 Go |
| Contextes testés | 32 768 tokens (GPU confirmé) et 65 536 tokens (analyse Claude Code) |
| Vérification pratique | 8 novembre 2026 |

La version **Q4_K_M** du même modèle occupe environ **7,4 Go**. La version **Q8_0**, retenue ici, utilise davantage de mémoire mais préserve plus fidèlement la précision numérique des poids.

!!! warning "Ce que signifie « ablitéré »"
    Une ablitération cherche à diminuer les refus du modèle. **Elle n'améliore pas automatiquement son raisonnement, sa fiabilité ou sa capacité à programmer.** Le créateur annonce 0 refus sur 100 tests et une divergence KL de 0,0284 : ces résultats proviennent de ses propres essais et ne constituent ni une garantie universelle ni une validation indépendante. Les réponses doivent être vérifiées, surtout pour le code exécuté, les données sensibles et les usages à risque.

!!! info "Confidentialité et coût"
    Un modèle téléchargé et exécuté par **Ollama en local**, sur <code>127.0.0.1:11434</code>, ne nécessite pas l'API facturée d'Anthropic. Les poids et l'inférence restent sur la machine. Cela ne garantit pas que **Claude Code**, ses extensions ou les commandes qu'il exécute n'accéderont jamais au réseau. Éviter d'activer des outils cloud ou des intégrations externes si la confidentialité intégrale est recherchée. Le matériel et l'électricité ont également un coût.

## 1. Vérifier la carte NVIDIA et Ollama

Ouvrir un terminal et vérifier la carte graphique :

~~~bash
nvidia-smi
~~~

Vérifier l'installation d'Ollama et la liste des modèles :

~~~bash
ollama --version
command -v ollama
ollama list
~~~

Pour savoir si Ollama provient de Snap :

~~~bash
snap list ollama
sudo snap services ollama
~~~

Dans l'installation vérifiée, <code>command -v ollama</code> renvoyait <code>/snap/bin/ollama</code>. Il était **normal** que cette commande ne trouve aucun service :

~~~bash
sudo systemctl status ollama --no-pager
~~~

Le message <code>Unit ollama.service could not be found</code> **ne signifie pas qu'Ollama est arrêté** lorsque le serveur est géré par Snap.

Contrôler le serveur HTTP :

~~~bash
curl -i --max-time 5 http://127.0.0.1:11434/api/version
sudo ss -lntp '( sport = :11434 )'
~~~

**Résultat attendu :** le port <code>11434</code> écoute sur l'adresse locale et l'API répond avec sa version.

### Si Ollama n'est pas installé

Choisir **une seule** méthode d'installation. Pour reproduire le parcours Snap :

~~~bash
sudo snap install ollama
sudo snap services ollama
~~~

Le paquet Snap rencontré lors de cette procédure est publié par <code>mz2</code> : ce n'est pas nécessairement le même circuit de publication que l'installateur officiel d'Ollama. Vérifier l'éditeur, les permissions et la politique de mises à jour avant installation.

L'alternative officielle est :

~~~bash
curl -fsSL https://ollama.com/install.sh | sh
~~~

Ce script installe normalement Ollama avec son propre service système. **Ne pas installer les deux méthodes en parallèle** : deux serveurs et deux emplacements de modèles compliqueraient le diagnostic.

## 2. Télécharger Gemma 4 Heretic

Pour la version **Q8_0** :

~~~bash
ollama pull igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
~~~

Pour une configuration disposant de moins de VRAM, utiliser plutôt **Q4_K_M** :

~~~bash
ollama pull igorls/gemma-4-12B-it-heretic-GGUF:Q4_K_M
~~~

La suite de ce guide utilise **Q8_0**. Il n'est pas nécessaire de télécharger les deux variantes.

Vérifier que le modèle est disponible :

~~~bash
ollama list
ollama show igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
~~~

## 3. Tester Gemma 4 sans Claude Code

Démarrer une session interactive :

~~~bash
ollama run igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
~~~

Dans l'invite du modèle, désactiver le mode de raisonnement :

~~~text
/set nothink
~~~

Puis envoyer une question simple. La commande <code>/set nothink</code> s'applique à cette **session interactive** ; elle n'impose pas à elle seule cette option à tous les clients API.

Pour une requête directe à l'API native Ollama, le désactiver explicitement avec <code>"think": false</code> :

~~~bash
curl http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "igorls/gemma-4-12B-it-heretic-GGUF:Q8_0",
    "messages": [{"role": "user", "content": "Explique le rôle de Vulkan en français."}],
    "think": false,
    "stream": false
  }'
~~~

**Résultat attendu :** une réponse JSON avec le contenu généré.

## 4. Adapter la fenêtre de contexte : passer de 32K à 64K

Claude Code consomme du contexte pour ses instructions, les définitions d'outils, la conversation et les fichiers lus. Un modèle peut fonctionner correctement en conversation simple mais manquer de place pendant une analyse de code.

### Première configuration : 32 768 tokens

Cette configuration a bien fonctionné pour **l'inférence sur GPU** :

~~~bash
cat > "$HOME/Modelfile.gemma4-heretic" <<'EOF'
FROM igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
PARAMETER num_ctx 32768
EOF

ollama create gemma4-heretic-32k \
  -f "$HOME/Modelfile.gemma4-heretic"
~~~

Cependant, sur le projet Python de test, Claude Code a interrompu une première analyse avec :

~~~text
Autocompact is thrashing: the context refilled to the limit
within 3 turns of the previous compact, 3 times in a row.
Try reading in smaller chunks, or use /clear to start fresh.
~~~

Ce message signale des compressions répétées de l'historique : les sorties d'outils ou les instructions remplissent à nouveau le contexte. **Il ne prouve pas, à lui seul, que la fenêtre de 32K est l'unique cause**.

### Deuxième configuration : 65 536 tokens (64K)

Conserver le profil 32K et créer un nouvel alias réutilisant les mêmes poids :

~~~bash
cat > "$HOME/Modelfile.gemma4-heretic-64k" <<'EOF'
FROM igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
PARAMETER num_ctx 65536
EOF

ollama create gemma4-heretic-64k \
  -f "$HOME/Modelfile.gemma4-heretic-64k"
~~~

Le message <code>success</code> indique que l'alias a été créé, sans retélécharger 13 Go de poids.

Le second test, après <code>/clear</code> et avec des limites explicites de lecture, a pu lancer **une recherche, lire quatre fichiers et produire un rapport** sans nouvelle erreur Autocompact observée. **Il ne s'agit que d'un test court** ; cela ne démontre pas qu'un contexte de 64K supprimera toute saturation dans un projet plus important.

!!! note "Mémoire vidéo"
    Les relevés <code>100% GPU</code> et <code>14 205 Mio</code> ont été obtenus avec **32K**, pas avec 64K. Le cache de contexte plus long peut accroître sensiblement l'utilisation de VRAM. Il faut contrôler <code>ollama ps</code> et <code>nvidia-smi</code> **pendant une inférence 64K** avant d'affirmer que cette configuration tient intégralement dans la RTX 4090.

Pour voir le contexte effectivement utilisé :

~~~bash
ollama ps
~~~

Le nombre de tokens du contexte demandé doit apparaître dans la colonne <code>CONTEXT</code> **lorsque le modèle est chargé**. Dans Claude Code, <code>/context</code> aide à examiner l'occupation de la fenêtre.

!!! note "Installation Ollama classique, hors Snap"
    Avec l'installateur natif, <code>OLLAMA_CONTEXT_LENGTH</code> peut se configurer dans le service systemd. Modifier une variable dans un terminal ne reconfigure pas un serveur déjà lancé comme service. Le Modelfile ci-dessus fixe le contexte pour un alias précis, sans toucher à la configuration globale.

## 5. Connecter Claude Code au serveur Ollama local

Vérifier d'abord que Claude Code est installé :

~~~bash
command -v claude
claude --version
command -v curl
~~~

Si Claude Code est absent, son installation officielle est :

~~~bash
curl -fsSL https://claude.ai/install.sh | bash
~~~

Si la commande n'est pas immédiatement reconnue, rouvrir le terminal ou vérifier le dossier <code>~/.local/bin</code>.

### Cas particulier : Ollama installé avec Snap

Le lanceur suivant existe :

~~~bash
ollama launch claude --model gemma4-heretic-64k
~~~

Mais il peut afficher :

~~~text
Error: claude is not installed and required dependencies are missing
Install the following first:
  curl: https://curl.se/
~~~

**Ne pas réinstaller Claude Code si <code>command -v claude</code> fonctionne.** L'application confinée dans Snap peut ne pas voir les mêmes exécutables que le terminal hôte.

Utiliser alors la **connexion manuelle**, en conservant l'installation existante de Claude Code :

~~~bash
env -u ANTHROPIC_API_KEY \
  ANTHROPIC_BASE_URL=http://127.0.0.1:11434 \
  ANTHROPIC_AUTH_TOKEN=ollama \
  ANTHROPIC_DEFAULT_OPUS_MODEL=gemma4-heretic-64k \
  ANTHROPIC_DEFAULT_SONNET_MODEL=gemma4-heretic-64k \
  ANTHROPIC_DEFAULT_HAIKU_MODEL=gemma4-heretic-64k \
  CLAUDE_CODE_SUBAGENT_MODEL=gemma4-heretic-64k \
  CLAUDE_CODE_MAX_CONTEXT_TOKENS=65536 \
  CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096 \
  MAX_THINKING_TOKENS=0 \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
  claude --model gemma4-heretic-64k
~~~

**Signification des paramètres essentiels :**

| Paramètre | Rôle |
| --- | --- |
| <code>ANTHROPIC_BASE_URL</code> | Dirige Claude Code vers l'API Anthropic compatible d'Ollama en local |
| <code>ANTHROPIC_AUTH_TOKEN=ollama</code> | Jeton fictif requis par l'interface ; pas une clé payante |
| <code>env -u ANTHROPIC_API_KEY</code> | Évite la présence simultanée de deux mécanismes d'authentification |
| <code>ANTHROPIC_DEFAULT_*_MODEL</code> | Oriente les différents rôles de modèles vers l'alias local |
| <code>CLAUDE_CODE_MAX_CONTEXT_TOKENS</code> | Empêche Claude Code de supposer un contexte de 200K pour un modèle inconnu |
| <code>MAX_THINKING_TOKENS=0</code> | Désactive la demande explicite de réflexion de Claude Code ; vérifier le comportement effectif du modèle |
| <code>CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1</code> | Désactive une partie du trafic non essentiel de Claude Code, pas toutes les communications possibles |

Ces variables ne sont appliquées **qu'à cette exécution** de Claude Code. Elles ne modifient pas ses paramètres permanents.

!!! warning "Éviter les deux variables d'authentification en même temps"
    Si <code>ANTHROPIC_AUTH_TOKEN</code> et <code>ANTHROPIC_API_KEY</code> sont tous deux renseignés, Claude Code peut afficher : <code>Both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY set</code>. Choisir une méthode seulement. Si une configuration sauvegardée dans Claude Code impose un autre serveur ou une autre clé, vérifier <code>/status</code> et corriger cette configuration avant de continuer.

!!! warning "Ne pas confondre Claude Code et le modèle Claude"
    **Claude Code** fournit l'interface, les permissions et les outils. **Gemma 4 Heretic** génère les réponses via Ollama. Il ne s'agit pas du modèle Claude hébergé par Anthropic. Le libellé « API Usage Billing » dans l'interface n'établit pas à lui seul qu'une requête payante a été effectuée ; vérifier l'URL effective du fournisseur dans <code>/status</code>.

## 6. Vérifier l'inférence sur le GPU NVIDIA

Dans Claude Code, taper :

~~~text
/status
~~~

Contrôler que le modèle sélectionné est <code>gemma4-heretic-64k</code> et que la base API est <code>http://127.0.0.1:11434</code>.

Envoyer une requête courte pour déclencher une inférence. Dans un **autre terminal** :

~~~bash
ollama ps
nvidia-smi
~~~

Sur la RTX 4090 utilisée pour cette procédure, les mesures suivantes ont été observées **avec la configuration 32K** :

| Mesure | Résultat observé |
| --- | --- |
| Modèle chargé | <code>igorls/gemma-4-12B-it-heretic-GGUF:Q8_0</code> |
| Taille annoncée par <code>ollama ps</code> | 13 Go |
| <code>PROCESSOR</code> | **100% GPU** |
| <code>CONTEXT</code> | **32768 (test 32K)** |
| Mémoire NVIDIA totale utilisée | **14 205 Mio / 24 564 Mio** |
| Activité GPU instantanée | 94 % |
| Puissance instantanée | 444 W |
| Température instantanée | 54 °C |

Ces valeurs sont un **instantané de la configuration 32K**, pas un résultat de benchmark reproductible. Aucune mesure GPU équivalente n'a encore été communiquée pour 64K. Le modèle peut apparaître sous son nom d'origine dans <code>ollama ps</code> même lorsqu'il a été appelé par son alias personnalisé.

### Valider les outils de Claude Code

Dans un dépôt de test ou un projet dont les fichiers sont sauvegardés, nettoyer d'abord le contexte :

~~~text
/clear
~~~

Puis utiliser une consigne **en lecture seule**, avec des sorties bornées :

> Analyse le projet dans le répertoire courant, en lecture seule. Commence par identifier le langage et les fichiers de configuration principaux. Limite les listes à 60 fichiers et les lectures à 100 lignes par fichier. Ignore .git, node_modules, les dépendances installées et les fichiers générés. Examine ensuite uniquement les fichiers nécessaires. Ne modifie aucun fichier. Présente un rapport technique concis.

Cette limitation des lectures réduit la quantité de texte renvoyée par les outils. **Ne pas confier immédiatement des modifications irréversibles à un modèle 12B** : l'appel d'outils, la compréhension et le texte généré sont trois capacités distinctes.

## 7. Retour d'expérience : essai réel avec Claude Code 64K

Test effectué sur un projet local de configuration HDR pour un téléviseur LG C4, placé dans <code>~/lg-c4-hdr</code>. Ce dossier sert uniquement de banc d'essai ; il n'est pas nécessaire à l'installation d'Ollama.

| Observation | Résultat du test |
| --- | --- |
| Profil initial 32K | Erreur <code>Autocompact is thrashing</code> pendant l'exploration |
| Profil utilisé pour le second essai | <code>gemma4-heretic-64k</code> |
| Nouvelle conversation | <code>/clear</code> exécuté |
| Consigne | Analyse en lecture seule, listes et fichiers limités |
| Exécution visible | 36 secondes de réflexion affichées, 1 recherche, 4 fichiers lus |
| Résultat | Rapport technique produit, sans nouvelle erreur Autocompact visible |
| Qualité | Rapport partiellement incohérent, phrases tronquées et affirmation non vérifiées |

Le rapport a correctement identifié un **projet Python** utilisant notamment <code>asyncio</code> et la bibliothèque <code>bscpylgtv</code>, selon sa propre sortie. Toutefois, certaines phrases étaient altérées :

~~~text
Le moteur principal conte, de connexion, de validation etd'application des paramètres.
Répertoire de persistance stockann), les rapports de résultats...
~~~

Ces extraits établissent un **défaut de qualité de sortie**. Les affirmations concernant le fonctionnement détaillé du code ne peuvent pas être considérées comme vérifiées sans lire les fichiers sources.

**Interprétation :** une exécution d'outils réussie ne suffit pas à démontrer la fiabilité de l'agent. Le second essai a modifié **deux facteurs à la fois** — le contexte de 32K à 64K et les limites des lectures — et ne permet donc pas d'attribuer l'amélioration au seul changement de fenêtre. Pour comparer proprement, reproduire les mêmes demandes et limites sur les deux profils.

## 8. Dépannage

| Symptôme | Cause ou vérification |
| --- | --- |
| <code>ollama.service could not be found</code> | Ollama peut être installé via Snap ; utiliser <code>sudo snap services ollama</code> |
| <code>claude is not installed</code> depuis <code>ollama launch</code> | Vérifier <code>command -v claude</code> côté hôte, puis utiliser la connexion manuelle |
| Avertissement sur deux clés API | Supprimer <code>ANTHROPIC_API_KEY</code> de l'environnement de lancement |
| Modèle inconnu, contexte supposé à 200K | Définir <code>CLAUDE_CODE_MAX_CONTEXT_TOKENS=65536</code> pour le profil 64K et vérifier <code>ollama ps</code> |
| <code>Autocompact is thrashing</code> | Exécuter <code>/clear</code>, limiter taille et nombre des lectures ; essayer 64K en surveillant la VRAM |
| Rapport incohérent ou tronqué | Réduire les sorties, demander des références précises aux fichiers et contrôler les affirmations dans le code source |
| <code>ollama ps</code> affiche du CPU | Le modèle ou son cache dépasse la VRAM disponible ; fermer d'autres charges, réduire le contexte ou essayer Q4 |
| Claude Code n'exécute pas correctement ses outils | Vérifier l'API locale, la taille du contexte, les capacités <code>tools</code> et essayer un modèle spécialisé pour le code |
| Le modèle ne répond pas | Vérifier <code>curl -i http://127.0.0.1:11434/api/version</code> et l'état du service Snap |

## 9. Gestion et retour arrière

Afficher les modèles :

~~~bash
ollama list
~~~

Arrêter un modèle chargé en mémoire :

~~~bash
ollama stop gemma4-heretic-64k
~~~

Supprimer **uniquement le nouvel alias 64K** si celui-ci n'est plus nécessaire (le profil 32K peut être conservé) :

~~~bash
ollama rm gemma4-heretic-64k
~~~

Pour supprimer également le modèle d'origine (après s'être assuré qu'aucun alias ne l'utilise plus) :

~~~bash
ollama rm igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
~~~

Ne pas exécuter de commande de désinstallation globale si d'autres modèles locaux sont encore utilisés. Quitter Claude Code avec <code>/exit</code>, puis le relancer normalement depuis un nouveau terminal pour retrouver sa configuration habituelle.

## 10. Mémento des commandes utiles

Les commandes ci-dessous correspondent à la configuration utilisée dans ce tutoriel : **Ollama installé via Snap**, **Gemma 4 Heretic Q8_0** et **Claude Code installé séparément**. Les commandes <code>sudo snap</code> agissent sur le **service Ollama** ; les commandes <code>ollama</code> agissent sur les **modèles** ; les commandes avec <code>claude</code> agissent sur **Claude Code**.

### A. Démarrer, arrêter et redémarrer le serveur Ollama (Snap)

| Action | Commande |
| --- | --- |
| Vérifier les services Ollama | <code>sudo snap services ollama</code> |
| **Démarrer le serveur** | <code>sudo snap start ollama</code> |
| **Arrêter le serveur** | <code>sudo snap stop ollama</code> |
| Redémarrer le serveur | <code>sudo snap restart ollama</code> |
| Voir les journaux récents | <code>sudo snap logs -n 50 ollama</code> |
| Consulter la version installée | <code>snap list ollama</code> |
| Actualiser le paquet Snap | <code>sudo snap refresh ollama</code> |

~~~bash
# Arrêter le serveur Ollama (et donc les inférences en cours)
sudo snap stop ollama

# Vérifier l'état après arrêt
sudo snap services ollama

# Le redémarrer ultérieurement
sudo snap start ollama
~~~

!!! important "Arrêt du serveur ≠ suppression des modèles"
    <code>sudo snap stop ollama</code> **ne supprime aucun modèle**. Il arrête le service. Pour le laisser désactivé après le prochain démarrage d'Ubuntu, une opération distincte existe : <code>sudo snap stop --disable ollama</code>, puis <code>sudo snap start --enable ollama</code> pour rétablir le démarrage automatique. **Ne pas utiliser <code>--disable</code> pour un simple arrêt temporaire.**

!!! note "Le serveur doit fonctionner pour les commandes Ollama"
    Après <code>sudo snap stop ollama</code>, les commandes <code>ollama ps</code>, <code>ollama list</code> ou <code>ollama run</code> peuvent échouer avec une erreur de connexion : c'est normal. Redémarrer d'abord le service.

### B. Consulter, lancer et arrêter les modèles

~~~bash
# Version du client
ollama --version

# Modèles disponibles
ollama list

# Modèles actuellement chargés en mémoire
ollama ps

# Détails du modèle Q8 téléchargé
ollama show igorls/gemma-4-12B-it-heretic-GGUF:Q8_0

# Lancer le profil 64K
ollama run gemma4-heretic-64k

# Lancer le profil 32K
ollama run gemma4-heretic-32k
~~~

Dans une conversation <code>ollama run</code>, utiliser <code>/set nothink</code> pour désactiver la réflexion, puis <code>/bye</code> pour quitter l'interface.

~~~bash
# Décharger l'alias 64K de la mémoire GPU
ollama stop gemma4-heretic-64k

# Décharger l'alias 32K
ollama stop gemma4-heretic-32k

# Si la commande indique que l'alias n'est pas chargé,
# relever le nom exact dans « ollama ps » et l'utiliser ici :
ollama ps
~~~

Lors de la validation, <code>ollama ps</code> affichait parfois le **nom d'origine** <code>igorls/gemma-4-12B-it-heretic-GGUF:Q8_0</code> plutôt que l'alias. Dans ce cas, arrêter le nom réellement affiché :

~~~bash
ollama stop igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
~~~

**Différence :** <code>ollama stop</code> libère un modèle chargé en mémoire ; <code>sudo snap stop ollama</code> arrête le serveur entier.

### C. Télécharger et créer les profils 32K / 64K

~~~bash
# Télécharger Gemma 4 Heretic Q8_0
ollama pull igorls/gemma-4-12B-it-heretic-GGUF:Q8_0

# Recréer le profil 32K (Modelfile déjà créé dans ce guide)
ollama create gemma4-heretic-32k \
  -f "$HOME/Modelfile.gemma4-heretic"

# Recréer le profil 64K (Modelfile déjà créé dans ce guide)
ollama create gemma4-heretic-64k \
  -f "$HOME/Modelfile.gemma4-heretic-64k"
~~~

Les chemins des deux Modelfiles ci-dessus supposent que les étapes de création de la [section 4](#4-adapter-la-fenetre-de-contexte-passer-de-32k-a-64k) ont déjà été exécutées.

### D. Lancer Claude Code sur le modèle local 64K

Se placer dans le projet à analyser, puis exécuter la commande dans le terminal **hôte** (et non dans le shell confiné du Snap) :

~~~bash
cd /chemin/vers/mon-projet

env -u ANTHROPIC_API_KEY \
  ANTHROPIC_BASE_URL=http://127.0.0.1:11434 \
  ANTHROPIC_AUTH_TOKEN=ollama \
  ANTHROPIC_DEFAULT_OPUS_MODEL=gemma4-heretic-64k \
  ANTHROPIC_DEFAULT_SONNET_MODEL=gemma4-heretic-64k \
  ANTHROPIC_DEFAULT_HAIKU_MODEL=gemma4-heretic-64k \
  CLAUDE_CODE_SUBAGENT_MODEL=gemma4-heretic-64k \
  CLAUDE_CODE_MAX_CONTEXT_TOKENS=65536 \
  CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096 \
  MAX_THINKING_TOKENS=0 \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
  claude --model gemma4-heretic-64k
~~~

Remplacer <code>/chemin/vers/mon-projet</code> par **un dossier existant**. La commande n'installe pas Claude Code et ne modifie pas sa configuration permanente. Le serveur Ollama doit être **actif**.

Pour revenir au profil 32K, utiliser la même commande en remplaçant **toutes** les occurrences de <code>gemma4-heretic-64k</code> par <code>gemma4-heretic-32k</code> et <code>65536</code> par <code>32768</code>.

### E. Commandes dans Claude Code

Ces commandes se tapent **dans Claude Code**, pas dans le shell Bash :

| Action | Commande |
| --- | --- |
| Vérifier le modèle et le fournisseur configurés | <code>/status</code> |
| Examiner l'occupation de la fenêtre de contexte | <code>/context</code> |
| Réinitialiser la conversation avant une nouvelle analyse | <code>/clear</code> |
| **Quitter Claude Code** | <code>/exit</code> |

Si l'invite du terminal affiche un avertissement d'authentification, vérifier qu'il n'y a pas simultanément <code>ANTHROPIC_AUTH_TOKEN</code> et <code>ANTHROPIC_API_KEY</code>. La commande de la section D retire cette dernière variable **pour ce lancement seulement**.

### F. Vérifier le GPU NVIDIA et le serveur HTTP

~~~bash
# Informations instantanées du GPU
nvidia-smi

# Suivi GPU toutes les secondes (Ctrl+C pour interrompre)
nvidia-smi -l 1

# Vérifier le placement et le contexte des modèles
ollama ps

# Vérifier que le serveur répond sur l'interface locale
curl --fail --silent --show-error \
  http://127.0.0.1:11434/api/version

# Vérifier l'écoute sur le port local 11434
sudo ss -lntp '( sport = :11434 )'

# Si nécessaire, vérifier l'état du service et ses journaux
sudo snap services ollama
sudo snap logs -n 50 ollama
~~~

**Résultat attendu :** une réponse d'API, un processus à l'écoute sur <code>127.0.0.1:11434</code> et, pendant l'inférence, un modèle visible dans <code>ollama ps</code>. <code>100% GPU</code> confirme que les couches du modèle sont placées sur le GPU. Le contexte <code>65536</code> doit être contrôlé séparément pour le profil 64K.

### G. Libérer de l'espace disque (suppression volontaire)

!!! danger "Ces commandes suppriment des modèles locaux"
    Elles ne sont **pas nécessaires** pour arrêter Ollama ni pour libérer temporairement de la VRAM. Ne les exécuter que si les profils ou les poids ne sont plus utiles.

~~~bash
# Supprimer l'alias 64K
ollama rm gemma4-heretic-64k

# Supprimer l'alias 32K
ollama rm gemma4-heretic-32k

# Supprimer le modèle téléchargé (si aucun alias ne doit le conserver)
ollama rm igorls/gemma-4-12B-it-heretic-GGUF:Q8_0
~~~

Supprimer un alias n'implique pas nécessairement de libérer 13 Go : les couches communes restent sur disque tant qu'un autre modèle en dépend.

### H. Arrêt normal d'une session de travail

1. Dans Claude Code, saisir <code>/exit</code>.
2. Dans le terminal Ubuntu, décharger le modèle avec <code>ollama stop gemma4-heretic-64k</code> (ou le nom indiqué par <code>ollama ps</code>).
3. Pour **arrêter également le serveur** : <code>sudo snap stop ollama</code>.
4. À la prochaine utilisation : <code>sudo snap start ollama</code>, puis relancer Claude Code avec la commande de la section D.

L'arrêt de Claude Code ne supprime aucun modèle. Ollama peut garder un modèle en mémoire pendant une courte durée après la dernière requête, jusqu'à son expiration automatique ou un <code>ollama stop</code>.

## Références

- [Ollama — site officiel et installation](https://ollama.com/)
- [Snapcraft — contrôler les services Snap](https://snapcraft.io/docs/how-to-guides/manage-snaps/control-services/)
- [Ollama — Gemma 4 Heretic, variantes Q4 et Q8](https://ollama.com/igorls/gemma-4-12B-it-heretic-GGUF/tags)
- [Ollama — intégration de Claude Code](https://docs.ollama.com/integrations/claude-code)
- [Ollama — compatibilité avec l'API Anthropic](https://docs.ollama.com/api/anthropic-compatibility)
- [Claude Code — installation officielle](https://code.claude.com/docs/en/setup)
- [Google — conditions d'utilisation de Gemma](https://ai.google.dev/gemma/terms)

## Historique

| Date | Modification |
| --- | --- |
| 2026-11-08 | Ajout d'un mémento des commandes : démarrer et arrêter Ollama Snap, modèles, Claude Code, GPU, API et gestion du disque |
| 2026-11-08 | Mise à jour : essai Claude Code à 64K, arrêt des erreurs Autocompact dans un test court, limites du rapport et précautions VRAM documentés |
| 2026-11-08 | Première publication : Gemma 4 Heretic Q8_0, contexte 32K et inférence RTX 4090 validés sur Ollama Snap ; connexion manuelle à Claude Code documentée |
