# Procédure de gestion des violations de données — Zero-to-Kanban

**Version : [VERSION]**  
**Dernière mise à jour : [DATE]**  
**Responsable de la procédure : [NOM / RÔLE]**  
**Contact : [EMAIL / TÉLÉPHONE]**

## 1. Objectif

Cette procédure décrit les actions à effectuer lorsqu'une violation de données personnelles est suspectée ou confirmée dans Zero-to-Kanban.

Une violation peut notamment correspondre à :

- un accès non autorisé à des données personnelles ;
- une divulgation accidentelle ou malveillante ;
- une perte de données ;
- une destruction accidentelle ou malveillante ;
- une modification non autorisée ;
- un vol de données ;
- une compromission d'un compte ou d'une infrastructure.

---

## 2. Détection et signalement

Toute personne constatant ou suspectant une violation doit la signaler immédiatement à :

**[CONTACT INCIDENT / EMAIL]**

Le signalement doit contenir, dans la mesure du possible :

- date et heure de découverte ;
- personne ayant découvert l'incident ;
- système concerné ;
- description de l'incident ;
- données potentiellement concernées ;
- utilisateurs potentiellement concernés ;
- premières mesures prises.

Ne pas supprimer ou modifier les preuves techniques avant leur collecte lorsque cela est possible.

---

## 3. Contenir l'incident

La première priorité est de limiter l'impact de la violation.

Selon le type d'incident, les mesures peuvent comprendre :

- désactiver un compte compromis ;
- révoquer des sessions ou identifiants ;
- changer un secret compromis ;
- isoler un service compromis ;
- bloquer un accès réseau ;
- corriger une vulnérabilité ;
- suspendre temporairement une fonctionnalité ;
- préserver les logs et autres éléments utiles à l'analyse.

**Responsable technique : [À COMPLÉTER]**

---

## 4. Évaluer la violation

L'équipe responsable doit déterminer :

### Nature de la violation

- [ ] Confidentialité : accès ou divulgation non autorisée
- [ ] Intégrité : modification non autorisée
- [ ] Disponibilité : perte ou destruction de données

### Données concernées

- [ ] Email
- [ ] Pseudo
- [ ] Données de compte
- [ ] Données de projets
- [ ] Données de tâches
- [ ] Commentaires / descriptions
- [ ] Données techniques
- [ ] Autres : [À COMPLÉTER]

### Personnes concernées

Nombre estimé : **[À COMPLÉTER]**

### Gravité potentielle

Évaluer notamment :

- nature des données ;
- volume de données ;
- nombre de personnes ;
- facilité d'identification des personnes ;
- conséquences potentielles ;
- mesures déjà en place ;
- probabilité d'utilisation abusive des données.

---

## 5. Documenter l'incident

Chaque violation doit être documentée, même lorsqu'aucune notification à la CNIL n'est finalement nécessaire.

Utiliser la fiche suivante :

### Fiche d'incident

**Identifiant :** [INC-YYYY-MM-DD-XXX]

**Date / heure de découverte :** [À COMPLÉTER]

**Date / heure estimée du début :** [À COMPLÉTER]

**Personne ayant découvert l'incident :** [À COMPLÉTER]

**Système concerné :** [À COMPLÉTER]

**Description :**  
[À COMPLÉTER]

**Données concernées :**  
[À COMPLÉTER]

**Nombre de personnes concernées :**  
[À COMPLÉTER]

**Cause probable :**  
[À COMPLÉTER]

**Mesures immédiates prises :**  
[À COMPLÉTER]

**Risque pour les personnes :**  
[À COMPLÉTER]

**Notification CNIL nécessaire ?**  
[OUI / NON / À ÉVALUER]

**Notification des personnes nécessaire ?**  
[OUI / NON / À ÉVALUER]

**Date de notification CNIL :**  
[À COMPLÉTER]

**Actions correctives :**  
[À COMPLÉTER]

**Date de clôture :**  
[À COMPLÉTER]

---

## 6. Notification à la CNIL

Lorsqu'une violation de données personnelles est susceptible d'engendrer un risque pour les droits et libertés des personnes concernées, le responsable du traitement doit déterminer si une notification à la CNIL est nécessaire.

Lorsqu'une notification est requise, elle doit être effectuée **dans les meilleurs délais et, lorsque cela est possible, dans les 72 heures après en avoir pris connaissance**.

La notification doit notamment permettre de présenter :

- la nature de la violation ;
- les catégories et le nombre approximatif de personnes concernées ;
- les catégories et le nombre approximatif d'enregistrements concernés ;
- les conséquences probables ;
- les mesures prises ou proposées pour remédier à la violation et en limiter les conséquences.

**Responsable de la notification : [À COMPLÉTER]**

**Procédure / portail utilisé : [À COMPLÉTER]**

Si toutes les informations ne sont pas disponibles dans les 72 heures, les informations disponibles sont communiquées puis complétées selon les modalités applicables.

---

## 7. Information des personnes concernées

Lorsque la violation est susceptible d'engendrer un risque élevé pour les droits et libertés des personnes, le responsable du traitement doit déterminer si les personnes concernées doivent être informées.

Le moyen d'information prévu est :

**[EMAIL / NOTIFICATION DANS L'APPLICATION / AUTRE]**

Le message doit expliquer de manière claire :

- ce qui s'est produit ;
- les données concernées ;
- les conséquences potentielles ;
- les mesures prises ;
- les mesures que la personne peut prendre ;
- le contact permettant d'obtenir davantage d'informations.

---

## 8. Correction et retour d'expérience

Après traitement de l'incident :

1. identifier la cause racine ;
2. corriger la vulnérabilité ;
3. révoquer les accès compromis ;
4. renouveler les secrets compromis ;
5. vérifier l'intégrité des données ;
6. renforcer les contrôles si nécessaire ;
7. mettre à jour la documentation ;
8. mettre à jour le registre des traitements si nécessaire ;
9. conserver la documentation de l'incident.

**Responsable du retour d'expérience : [À COMPLÉTER]**

---

## 9. Conservation des preuves et de la documentation

Les éléments relatifs à l'incident doivent être conservés pendant une durée permettant de démontrer les mesures prises et de répondre aux obligations applicables.

Durée de conservation des dossiers d'incidents :

**[À COMPLÉTER]**

Lieu de stockage sécurisé :

**[À COMPLÉTER]**

Personnes autorisées à y accéder :

**[À COMPLÉTER]**

---

## 10. Contacts d'urgence

| Fonction | Personne | Contact |
|---|---|---|
| Responsable du traitement | [À COMPLÉTER] | [À COMPLÉTER] |
| Responsable technique | [À COMPLÉTER] | [À COMPLÉTER] |
| Responsable sécurité | [À COMPLÉTER] | [À COMPLÉTER] |
| Contact RGPD | [À COMPLÉTER] | [À COMPLÉTER] |
| Hébergeur | [À COMPLÉTER] | [À COMPLÉTER] |

