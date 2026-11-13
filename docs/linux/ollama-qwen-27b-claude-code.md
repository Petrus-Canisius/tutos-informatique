---
title: Exécuter Qwen 3.8 27B en local avec Ollama et Claude Code sur RTX 4090
description: Installer Qwen 27B Q5 sur Ubuntu, optimiser le contexte 64K avec Flash Attention et le cache KV Q8, mesurer les performances et utiliser Claude Code.
---

# Qwen 3.8 27B en local sur RTX 4090 avec Ollama et Claude Code

<div class="kb-doc-meta"><span>Linux · Ubuntu</span><span>IA locale · Qwen 27B</span><span>NVIDIA RTX 4090</span><span>Claude Code</span></div>

## Objectif

Exécuter le modèle communautaire **Qwen 3.8 27B Uncensored Q5_K_M** avec Ollama sur une RTX 4090 de 24 Go, puis utiliser Claude Code comme agent de développement local. Le modèle est hébergé sur la machine : aucune clé API payante ni abonnement Claude n'est nécessaire pour l'inférence locale.

Ce tutoriel conserve la configuration vérifiée le **13 novembre 2026** : 65 536 tokens de contexte, 100 % GPU, Flash Attention et cache KV Q8_0. Voir aussi le [tutoriel Gemma 4 Heretic](ollama-gemma4-heretic-claude-code.md).

!!! warning "Modèle communautaire et confidentialité"
    « Uncensored » désigne une modification visant à réduire les refus, pas une garantie de réponses correctes ou d'absence totale de refus. Vérifier le code produit. L'inférence reste locale lorsque Claude Code pointe vers Ollama ; ses outils, extensions, MCP et commandes peuvent néanmoins accéder au réseau. La désactivation du trafic non essentiel n'est pas un pare-feu. Le matériel et l'électricité ont un coût.

## 1. Vérifier ou installer Ollama

Configuration testée : Ubuntu 26.04.1 LTS, RTX 4090 24 Go, pilote NVIDIA 595.99.02, Ollama installé via Snap (révision 141). Vérifier :

~~~bash
nvidia-smi
command -v ollama
ollama --version
snap list ollama
sudo snap services ollama
command -v claude
claude --version
~~~

Si Ollama est déjà installé via Snap, le démarrer et, si nécessaire, le mettre à jour :

~~~bash
sudo snap start ollama
ollama list

# Mise à jour du paquet Snap
sudo snap refresh ollama
~~~

Si Ollama n'est pas installé, choisir **une seule** méthode. Pour reproduire ce guide :

~~~bash
sudo snap install ollama
sudo snap start ollama
~~~

Le paquet Snap est distribué par un éditeur distinct : vérifier l'éditeur et les permissions. L'alternative native officielle est :

~~~bash
curl -fsSL https://ollama.com/install.sh | sh
~~~

Ne pas cumuler les installations Snap et native. Avec une installation native gérée par systemd, remplacer les commandes de service Snap par :

~~~bash
sudo systemctl enable --now ollama
sudo systemctl status ollama --no-pager
~~~

Contrôler le serveur local :

~~~bash
curl --fail --silent --show-error http://127.0.0.1:11434/api/version
ss -lnt '( sport = :11434 )'
~~~

Si l'erreur « could not connect to ollama server » apparaît, redémarrer le service correspondant à l'installation. Ne pas lancer un deuxième serveur avec ollama serve si le service écoute déjà.

## 2. Télécharger Qwen 27B Q5

~~~bash
ollama pull orcarouter/Qwen3.8-27B-Uncensored:q5_K_M
ollama list
ollama show orcarouter/Qwen3.8-27B-Uncensored:q5_K_M
~~~

Le téléchargement observé est d'environ 20 Go. Les poids Q5_K_M constituent un compromis entre précision et mémoire. La VRAM nécessaire inclut aussi le cache de contexte et les allocations du moteur.

## 3. Optimiser le serveur : Flash Attention et cache KV Q8

Sans optimisation, le profil 64K a été chargé à 92 % GPU et 8 % CPU, avec 27,71 tokens/s. Le profil 32K a atteint 42,42 tokens/s à 100 % GPU. Pour retrouver le contexte 64K, activer Flash Attention et quantifier le cache KV.

### Installation Snap (configuration vérifiée)

~~~bash
sudo snap set ollama flash-attention=1 kv-cache-type=q8_0
sudo snap restart ollama
sudo snap get ollama
~~~

Ces paramètres sont globaux : ils affectent aussi les autres modèles. Le redémarrage interrompt les inférences actives. Le cache Q8_0 réduit la mémoire du cache par rapport au FP16, avec une possible légère perte de précision ; il ne change pas la quantification Q5 des poids.

### Installation native systemd (alternative)

Si Ollama est géré par le service natif, utiliser un fichier de surcharge plutôt que les commandes Snap :

~~~bash
sudo systemctl edit ollama
~~~

Ajouter :

~~~ini
[Service]
Environment="OLLAMA_FLASH_ATTENTION=1"
Environment="OLLAMA_KV_CACHE_TYPE=q8_0"
~~~

Puis :

~~~bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl show ollama --property=Environment
~~~

Cette alternative n'a pas été testée sur la machine de référence, qui utilise Snap. Ne pas appliquer les deux méthodes.

## 4. Créer les profils 32K et 64K

Les deux alias réutilisent les mêmes poids téléchargés.

~~~bash
cat > "$HOME/Modelfile-qwen-4090" <<'EOF'
FROM orcarouter/Qwen3.8-27B-Uncensored:q5_K_M
PARAMETER num_ctx 32768
EOF
ollama create qwen4090 -f "$HOME/Modelfile-qwen-4090"

cat > "$HOME/Modelfile-qwen-4090-64k" <<'EOF'
FROM orcarouter/Qwen3.8-27B-Uncensored:q5_K_M
PARAMETER num_ctx 65536
EOF
ollama create qwen4090-64k -f "$HOME/Modelfile-qwen-4090-64k"
~~~

Lancer le profil final :

~~~bash
ollama stop qwen4090
ollama run qwen4090-64k --verbose
~~~

Si le profil 32K n'était pas chargé, son arrêt n'est pas nécessaire. Dans un autre terminal :

~~~bash
ollama ps
nvidia-smi
~~~

Résultat mesuré :

~~~text
NAME                   SIZE    PROCESSOR    CONTEXT    RUNNER
qwen4090-64k:latest    21 GB   100% GPU     65536      llamacpp
~~~

Le placement GPU dépend aussi de la mémoire utilisée par les autres applications. Si le processeur CPU apparaît dans la colonne PROCESSOR, essayer le profil 32K, fermer les autres charges GPU ou utiliser une quantification de poids plus légère.

## 5. Connecter Claude Code

Si Claude Code n'est pas installé, suivre sa [documentation officielle](https://code.claude.com/docs/en/setup). L'intégration Ollama propose :

~~~bash
ollama launch claude --model qwen4090-64k
~~~

Avec Snap, ce lanceur peut ne pas trouver Claude Code installé côté hôte. Dans ce cas, créer le lanceur manuel suivant. Le mode par défaut demande les autorisations nécessaires ; pour un dossier de test isolé, le mode acceptEdits est disponible explicitement.

~~~bash
mkdir -p "$HOME/.local/bin"

cat > "$HOME/.local/bin/claude-4090" <<'EOF'
#!/usr/bin/env bash
set -e
if [ "$PWD" = "/" ]; then
    echo "Placez-vous dans un dossier de projet avant de lancer Claude Code." >&2
    exit 1
fi

export ANTHROPIC_BASE_URL="http://127.0.0.1:11434"
export ANTHROPIC_AUTH_TOKEN="ollama"
unset ANTHROPIC_API_KEY
export ANTHROPIC_DEFAULT_OPUS_MODEL="qwen4090-64k"
export ANTHROPIC_DEFAULT_SONNET_MODEL="qwen4090-64k"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="qwen4090-64k"
export CLAUDE_CODE_SUBAGENT_MODEL="qwen4090-64k"
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=65536
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=8192
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

exec claude --model qwen4090-64k "$@"
EOF

chmod +x "$HOME/.local/bin/claude-4090"
~~~

Le jeton ollama est fictif et n'est pas une clé Anthropic. Les variables restent dans le processus du lanceur et ses enfants. Le raisonnement n'est pas désactivé dans ce lanceur : il peut être utile en programmation. Les paramètres de contexte du client doivent être vérifiés avec /status et /context ; le contexte réellement alloué par Ollama est visible dans ollama ps.

Pour travailler dans un projet :

~~~bash
mkdir -p "$HOME/Projets/benchmark-qwen-cpp"
cd "$HOME/Projets/benchmark-qwen-cpp"
pwd
claude-4090 --permission-mode default
~~~

Si ~/.local/bin ne figure pas dans PATH, employer "$HOME/.local/bin/claude-4090" ou rouvrir un terminal après avoir ajouté ce dossier au PATH.

Pour un projet de test isolé :

~~~bash
claude-4090 --permission-mode acceptEdits
~~~

!!! warning "Permissions"
    Le mode Auto exige une vérification côté serveur Anthropic que l'API locale ne fournit pas. Si Claude Code affiche « Auto mode can't check actions in this session », Entrée permet de rester en Auto avec approbation manuelle ; Shift+Tab passe en acceptEdits et interrompt le tour en attente. Renvoyer ensuite la mission. Ce dernier mode autorise des modifications et certaines commandes de fichiers, notamment rm et mv, sans demande. Il ne constitue pas un bac à sable. Ne jamais lancer Claude Code avec sudo pour contourner un refus d'accès.

## 6. Mesurer les performances

### A. Vitesse de génération et surveillance du GPU

~~~bash
ollama run qwen4090-64k --verbose
~~~

Prompt de test : « Explique en détail comment fonctionne un moteur de jeu vidéo moderne en C++. Décris le rendu graphique, la mémoire, le multithreading, les shaders et les optimisations GPU. Donne une réponse d'au moins 1000 mots. »

La sortie verbose contient eval rate (génération en tokens/s), prompt eval rate (lecture), load duration et total duration. Utiliser le même prompt et les mêmes paramètres pour comparer les profils.

~~~bash
watch -n 1 ollama ps
~~~

Dans un autre terminal :

~~~bash
nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw --format=csv -l 1
~~~

### B. Benchmark de contexte long reproductible

Ce script utilise Python 3 et l'API locale sans dépendance externe. Il mesure les tailles réellement lues, la vitesse de préremplissage et la récupération d'une référence aléatoire au milieu d'un document. Les prompts sont calibrés pour rester sous 64K sur ce modèle ; le raisonnement est désactivé uniquement pour ce test. Les résultats de chronométrage varient avec la charge et le cache.

~~~bash
cat > "$HOME/benchmark-qwen-64k.py" <<'PY'
import json
import subprocess
import time
import urllib.request
import uuid

MODEL = "qwen4090-64k"
URL = "http://127.0.0.1:11434/api/generate"

def benchmark(lines):
    secret = "REFERENCE-" + uuid.uuid4().hex[:12]
    document = [
        f"Record {i:05d}: status=ready; category=hardware; "
        f"temperature=42; checksum={i * 17:08d}."
        for i in range(lines)
    ]
    document[lines // 2] = f"CONFIDENTIAL_REFERENCE: {secret}"
    prompt = (
        f"Benchmark {uuid.uuid4().hex[:8]}\n"
        "Lis attentivement le document suivant.\n\n"
        + "\n".join(document)
        + "\n\nRetrouve la valeur exacte de CONFIDENTIAL_REFERENCE. "
        "Commence par cette valeur, puis explique en 150 mots "
        "comment fonctionne la gestion de la mémoire GPU."
    )
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "think": False,
        "keep_alive": "10m",
        "options": {
            "num_ctx": 65536,
            "num_predict": 256,
            "temperature": 0,
            "seed": 42
        }
    }
    req = urllib.request.Request(
        URL, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    print(f"\n=== {lines} lignes ===", flush=True)
    start = time.perf_counter()
    with urllib.request.urlopen(req, timeout=1800) as response:
        result = json.load(response)

    def rate(count, duration):
        return count * 1e9 / duration if duration else 0

    count = result.get("prompt_eval_count", 0)
    read = rate(count, result.get("prompt_eval_duration", 0))
    gen = rate(result.get("eval_count", 0),
               result.get("eval_duration", 0))
    elapsed = time.perf_counter() - start
    found = secret in result.get("response", "")
    print(f"Tokens lus: {count} | Lecture: {read:.2f} t/s")
    print(f"Generation: {gen:.2f} t/s | Temps: {elapsed:.2f}s")
    print(f"Reference retrouvee: {'OUI' if found else 'NON'}")
    subprocess.run(["ollama", "ps"], check=False)
    subprocess.run([
        "nvidia-smi",
        "--query-gpu=memory.used,memory.total,temperature.gpu",
        "--format=csv"
    ], check=False)
    return count, read, gen, elapsed, found

results = [benchmark(n) for n in [200, 700, 1400, 1800, 1900]]
print("\nTokens | Lecture t/s | Generation t/s | Temps | Reference")
for count, read, gen, elapsed, found in results:
    print(f"{count:6} | {read:11.2f} | {gen:14.2f} | "
          f"{elapsed:6.2f}s | {'OK' if found else 'ECHEC'}")
PY

python3 "$HOME/benchmark-qwen-64k.py"
~~~

Un test initial à 2 200 lignes dépassait environ 72 000 tokens et a échoué à retrouver la référence. Il ne faut pas confondre un contexte alloué avec un document effectivement lu sans troncature. Le protocole corrigé plafonne à 1 900 lignes.

## 7. Résultats mesurés sur la RTX 4090

### Comparaison des réglages

| Configuration | Placement | Vitesse de génération |
| --- | --- | ---: |
| Q5, 64K avant optimisation | 92 % GPU / 8 % CPU | 27,71 t/s |
| Q5, 32K | 100 % GPU | 42,42 t/s |
| Q5, 64K, Flash Attention et KV Q8 | 100 % GPU | 42,05 t/s |

### Contexte long

| Tokens lus | Lecture (t/s) | Génération (t/s) | Durée | Référence retrouvée |
| ---: | ---: | ---: | ---: | --- |
| 6 657 | 2 810,70 | 41,39 | 8,25 s | Oui |
| 23 159 | 2 774,81 | 40,76 | 13,64 s | Oui |
| 46 256 | 2 581,55 | 38,31 | 24,16 s | Oui |
| 59 456 | 2 483,87 | 36,96 | 29,74 s | Oui |
| 62 759 | 2 455,21 | 36,99 | 32,28 s | Oui |

Sur ces tests, Ollama a affiché 100 % GPU, 65 536 tokens alloués, 21 Go de taille du modèle chargé. La mémoire NVIDIA relevée était de 22 096 MiB sur 24 564 MiB, avec une température maximale observée de 55 °C (instantanés en fin de requête, pas des maxima enregistrés en continu).

Ces mesures sont un retour d'expérience sur une seule machine, pas un classement universel. La récupération d'une référence ne démontre pas une compréhension parfaite de tout le contexte.

## 8. Tester les capacités de développement dans Claude Code

Installer les outils de compilation :

~~~bash
sudo apt update
sudo apt install -y build-essential cmake python3
mkdir -p "$HOME/Projets/benchmark-qwen-cpp"
cd "$HOME/Projets/benchmark-qwen-cpp"
claude-4090 --permission-mode acceptEdits
~~~

Donner cette mission :

> Crée un projet C++20 qui calcule le CRC32 IEEE de fichiers binaires sans bibliothèque externe. Lecture par blocs, fichiers volumineux, erreurs de lecture, CMake, -Wall -Wextra -Werror, au moins 20 tests CTest distincts et README. L'exécutable build/crc32 doit afficher uniquement huit caractères hexadécimaux minuscules suivis d'un retour à la ligne. Un fichier inexistant doit produire un code d'erreur non nul. Travaille uniquement dans le dossier courant ; compile, exécute les tests et corrige les erreurs.

Une fois terminé, quitter avec /exit puis vérifier :

~~~bash
cd "$HOME/Projets/benchmark-qwen-cpp"
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
printf '123456789' > test.bin
./build/crc32 test.bin
~~~

Résultat attendu : cbf43926. Sur la machine de référence, la première version compilait mais affichait aussi le nom du fichier et n'enregistrait qu'un test CTest. Après correction demandée, **28/28 tests CTest ont réussi**, et la sortie était exactement cbf43926. Il s'agissait de tests écrits par le modèle.

Pour vérifier indépendamment contre la bibliothèque Python zlib :

~~~bash
python3 - <<'PY'
import os
import pathlib
import subprocess
import tempfile
import zlib

with tempfile.TemporaryDirectory() as tmp:
    cases = [b"", b"123456789", bytes(range(256)),
             os.urandom(1024 * 1024), os.urandom(10 * 1024 * 1024)]
    for i, data in enumerate(cases):
        path = pathlib.Path(tmp) / f"case-{i}.bin"
        path.write_bytes(data)
        expected = f"{zlib.crc32(data) & 0xffffffff:08x}\n"
        r = subprocess.run(["./build/crc32", str(path)],
                           capture_output=True, text=True)
        assert r.returncode == 0 and r.stdout == expected, (i, r)
        print(f"Test {i+1}: OK")
    r = subprocess.run(["./build/crc32", tmp + "/absent"],
                       capture_output=True)
    assert r.returncode != 0
    print("Fichier inexistant: OK")
print("6/6 vérifications indépendantes réussies")
PY
~~~

Cette vérification indépendante est proposée pour compléter le retour d'expérience ; son résultat n'a pas été communiqué lors des mesures initiales.

## 9. Dépannage et commandes utiles

| Action ou erreur | Commande / solution |
| --- | --- |
| Démarrer Ollama Snap | <code>sudo snap start ollama</code> |
| Arrêter Ollama Snap | <code>sudo snap stop ollama</code> |
| Redémarrer Ollama Snap | <code>sudo snap restart ollama</code> |
| Démarrage automatique | <code>sudo snap start --enable ollama</code> |
| Désactiver le démarrage automatique | <code>sudo snap stop --disable ollama</code> |
| État / journaux Snap | <code>sudo snap services ollama</code> / <code>sudo snap logs -n 50 ollama</code> |
| Mise à jour Snap | <code>sudo snap refresh ollama</code> |
| Vérifier le serveur | <code>curl http://127.0.0.1:11434/api/version</code> |
| Modèles installés | <code>ollama list</code> |
| Modèle chargé, GPU, contexte | <code>ollama ps</code> |
| Lancer le modèle 64K | <code>ollama run qwen4090-64k --verbose</code> |
| Décharger le modèle | <code>ollama stop qwen4090-64k</code> |
| Quitter Ollama interactif | <code>/bye</code> |
| Désactiver la réflexion dans Ollama interactif | <code>/set nothink</code> (session uniquement) |
| Lancer Claude Code local | <code>claude-4090 --permission-mode default</code> |
| Reprendre la dernière session du dossier | <code>claude-4090 --continue --permission-mode default</code> |
| Choisir une session précédente | <code>claude-4090 --resume</code> |
| Claude Code : état / contexte | <code>/status</code> / <code>/context</code> |
| Claude Code : effacer la conversation | <code>/clear</code> |
| Claude Code : quitter | <code>/exit</code> |
| Retour à Claude Code habituel | <code>claude</code> depuis un terminal sans variables locales exportées |
| Erreur EACCES sur /CMakeLists.txt ou /src | Se placer dans un dossier du projet avec <code>cd</code>, vérifier <code>pwd</code> ; ne pas utiliser sudo |
| Auto mode can't check actions | Utiliser le mode default ou acceptEdits dans un dossier de test |
| Contexte saturé / Autocompact is thrashing | Limiter lectures et sorties, utiliser <code>/clear</code> ou reprendre une nouvelle session |
| VRAM insuffisante | Décharger les autres modèles, essayer <code>qwen4090</code> (32K) |

Pour arrêter proprement :

~~~bash
# Après /exit dans Claude Code :
ollama stop qwen4090-64k
sudo snap stop ollama
~~~

L'arrêt ne supprime aucun fichier de modèle. Au prochain démarrage, sudo snap start ollama puis claude-4090 depuis le projet.

Pour supprimer un alias devenu inutile (opération volontaire) :

~~~bash
ollama rm qwen4090
# ou : ollama rm qwen4090-64k
~~~

Ne supprimer le modèle d'origine que si aucun profil ne doit le conserver ; les couches partagées restent sur disque tant qu'elles sont utilisées.

## Références

- [Qwen 3.8 27B Uncensored — variantes Ollama](https://ollama.com/orcarouter/Qwen3.8-27B-Uncensored/tags)
- [Ollama — configuration et FAQ](https://docs.ollama.com/faq)
- [Ollama — intégration Claude Code](https://docs.ollama.com/integrations/claude-code)
- [Ollama — API de génération](https://docs.ollama.com/api/generate)
- [Claude Code — modes de permission](https://code.claude.com/docs/en/permission-modes)
- [Snapcraft — contrôle des services](https://snapcraft.io/docs/how-to-guides/manage-snaps/control-services/)

## Historique

| Date | Modification |
| --- | --- |
| 2026-11-13 | Première publication : configuration Qwen 27B Q5 64K, optimisation du cache, benchmarks et test C++ CRC32 |
