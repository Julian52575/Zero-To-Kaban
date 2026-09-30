# Registre des activités de traitement — Zero-to-Kanban

**Version : [VERSION]**  
**Dernière mise à jour : [DATE]**  
**Responsable du traitement : [NOM / ORGANISATION]**  
**Contact : [EMAIL]**

## 1. Objet du registre

Ce document recense les principaux traitements de données personnelles réalisés dans le cadre de Zero-to-Kanban.

Il doit être maintenu à jour lorsque l'application, son infrastructure ou ses traitements évoluent.

---

## 2. Gestion des comptes utilisateurs

| Élément | Description |
|---|---|
| Traitement | Gestion des comptes utilisateurs |
| Finalité | Création, authentification et gestion des comptes |
| Base légale | Exécution du contrat |
| Personnes concernées | Utilisateurs de l'application |
| Données | Email, pseudo, identifiant utilisateur, mot de passe haché |
| Source | Utilisateur |
| Destinataires | Backend, base de données, [PRESTATAIRES] |
| Conservation | Pendant la durée du compte, puis suppression/anonymisation |
| Mesures de sécurité | Hachage des mots de passe, authentification, contrôle d'accès, validation des entrées |
| Sous-traitants | [À COMPLÉTER] |

---

## 3. Gestion des projets

| Élément | Description |
|---|---|
| Traitement | Gestion des projets |
| Finalité | Permettre aux utilisateurs de créer et gérer des projets Kanban |
| Base légale | Exécution du contrat |
| Personnes concernées | Utilisateurs |
| Données | Identifiant utilisateur, nom du projet, description, membres/propriétaires |
| Source | Utilisateurs |
| Destinataires | Utilisateurs autorisés du projet, backend, base de données |
| Conservation | [À COMPLÉTER] |
| Mesures de sécurité | Contrôle d'accès aux projets, authentification, autorisation |
| Sous-traitants | [À COMPLÉTER] |

---

## 4. Gestion des tâches

| Élément | Description |
|---|---|
| Traitement | Gestion des tâches |
| Finalité | Permettre la création et le suivi des tâches |
| Base légale | Exécution du contrat |
| Personnes concernées | Utilisateurs |
| Données | Identifiant utilisateur, titre, description, statut, priorité, deadline, assignation |
| Source | Utilisateurs |
| Destinataires | Utilisateurs autorisés du projet, backend, base de données |
| Conservation | [À COMPLÉTER] |
| Mesures de sécurité | Autorisation par projet, authentification, validation des données |
| Sous-traitants | [À COMPLÉTER] |

> **Attention :** les titres, descriptions et commentaires sont considérés comme des champs de contenu libre et peuvent contenir des données personnelles saisies par les utilisateurs.

---

## 5. Notifications

| Élément | Description |
|---|---|
| Traitement | Notifications |
| Finalité | Informer les utilisateurs des événements les concernant |
| Base légale | Exécution du contrat |
| Personnes concernées | Utilisateurs |
| Données | Identifiant utilisateur, événement, informations nécessaires à la notification |
| Source | Application / événements backend |
| Destinataires | Utilisateur concerné |
| Conservation | [À COMPLÉTER] |
| Mesures de sécurité | Contrôle d'accès, authentification |
| Sous-traitants | [À COMPLÉTER] |

---

## 6. Journalisation et sécurité

| Élément | Description |
|---|---|
| Traitement | Logs techniques et sécurité |
| Finalité | Sécurité, diagnostic, maintenance et détection d'incidents |
| Base légale | [À COMPLÉTER] |
| Personnes concernées | Utilisateurs et visiteurs, selon les logs |
| Données | [IP, timestamps, événements techniques, erreurs, identifiants techniques — À CONFIRMER] |
| Destinataires | Équipe technique, hébergeur / fournisseur de logs |
| Conservation | [À COMPLÉTER] |
| Mesures de sécurité | Accès restreint, [chiffrement, rotation, etc.] |
| Sous-traitants | [À COMPLÉTER] |

---

## 7. Gestion des demandes d'exercice des droits

| Élément | Description |
|---|---|
| Traitement | Gestion des demandes RGPD |
| Finalité | Répondre aux demandes d'accès, rectification, effacement, limitation ou opposition |
| Base légale | Obligation légale |
| Personnes concernées | Utilisateurs |
| Données | Identité, coordonnées, contenu de la demande, éléments nécessaires à la vérification |
| Destinataires | Responsable du traitement / équipe autorisée |
| Conservation | [À COMPLÉTER] |
| Mesures de sécurité | Accès restreint aux personnes habilitées |
| Sous-traitants | [À COMPLÉTER] |

---

## 8. Suppression et anonymisation des comptes

Lorsqu'un compte est supprimé, les traitements suivants sont appliqués :

- suppression des données personnelles directement associées au compte ;
- anonymisation ou suppression des assignations aux tâches ;
- traitement des données personnelles présentes dans les notifications ;
- traitement des données personnelles présentes dans les contenus libres lorsque cela est prévu ;
- traitement des projets dont l'utilisateur était propriétaire selon la règle définie par l'application.

**Règle de gestion des projets :** [À COMPLÉTER]

**Méthode d'anonymisation :** [À COMPLÉTER]

---

## 9. Infrastructure et sous-traitants

| Service | Fournisseur | Finalité | Données accessibles | Pays | Contrat / DPA |
|---|---|---|---|---|---|
| Hébergement | [À COMPLÉTER] | Hébergement de l'application | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |
| Base de données | [À COMPLÉTER] | Stockage | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |
| Messagerie / notifications | [À COMPLÉTER] | Notifications | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |
| Logs / monitoring | [À COMPLÉTER] | Sécurité et maintenance | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |

---

## 10. Mesures générales de sécurité

Les mesures suivantes sont mises en œuvre :

- authentification des utilisateurs ;
- contrôle des autorisations ;
- hachage des mots de passe ;
- validation des données entrantes ;
- séparation des responsabilités entre routes, contrôleurs, services et repositories ;
- utilisation de variables d'environnement pour les secrets ;
- [HTTPS/TLS] ;
- [sauvegardes] ;
- [monitoring] ;
- [rotation des secrets] ;
- [gestion des accès à l'infrastructure].

**Mesures supplémentaires : [À COMPLÉTER]**

---

## 11. Revue du registre

Le registre doit être revu :

- lors de l'ajout d'une nouvelle fonctionnalité traitant des données personnelles ;
- lors d'un changement d'hébergeur ou de prestataire ;
- lors d'un changement important de l'architecture ;
- lors de l'introduction d'une nouvelle catégorie de données ;
- au minimum **[PÉRIODE À COMPLÉTER]**.
