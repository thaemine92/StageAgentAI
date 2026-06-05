# Agent de Rendez-vous IA

Système d'agent conversationnel intelligent dédié à la prise de rendez-vous automatisée 24/7 pour les professionnels (commerçants, cliniques médicales).
* **Triage et Priorisation** : Grâce à une compréhension contextuelle avancée, l'agent identifie les urgences médicales et adapte son comportement pour assurer une prise en charge rapide des cas critiques.
* **Approche Multi-canal** : Le système s'adapte aux habitudes de vos clients (téléphone, SMS, WhatsApp), garantissant une accessibilité maximale sans imposer la création de comptes complexes.
* **Conformité et Sécurité** : le système assure le respect rigoureux de la confidentialité des données , garantissant la protection des renseignements personnels des patients et clients.
* **Gestion simplifiée pour le professionnel** : Le système s'occupe de la logistique (consignes de préparation, rappels, vérification de disponibilité).
* **Analytique pour la Décision** : Grâce à la centralisation , le professionnel peut obtenir des rapports sur les périodes de forte demande, permettant d'optimiser la gestion des ressources et du personnel.
* **Robustesse face aux imprévus** : L'architecture intègre des mécanismes de gestion d'erreurs (codes de retour d'API) qui permettent à l'agent de gérer élégamment les pannes temporaires (ex: "Désolé, nos systèmes de réservation sont temporairement indisponibles, veuillez réessayer dans quelques instants"). 
## Modèle de Données (MDD)

Le système repose sur une architecture robuste assurant la traçabilité des logs et la confidentialité des données sensibles.
### Organisation des entités
Le modèle est structuré autour de cinq pôles fonctionnels :

* **Pôle Professionnel**
    * `CompteProfessionnel` : C'est le profil de l'utilisateur qui utilise votre plateforme (le médecin, le commerçant, etc.). Ce profil contient toutes les informations nécessaires pour gérer son entreprise et son assistant IA.
    * `ReferentielServices` : Correspond aux différents services proféssionel proposés (ex: Médecin, Commerçant, etc)
* **Pôle Client**
    * `Client` : Gère l'identité du patient/utilisateur via son numéro de téléphone . Inclut les données critiques pour le secteur médical (`RAMQ`, `date_naissance`).
* **Pôle Transactionnel**
    * `RendezVous` : Cœur opérationnel liant un `Client` à un `ReferentielServices`. Stocke les détails contextuels comme les consignes spécifiques de préparation.
* **Pôle Sécurité & Conformité**
    * Gestion transverse via les champs `consentement_partage_données` (Client) et `est_anonyme` (LogSysteme) pour garantir le respect strict des réglementations sur la protection de la vie privée.
* **Pôle Technique (Monitoring)**
    * `LogSysteme` : "Boîte noire" capturant les interactions. Elle enregistre les métriques de performance (`temps_reponse_ms`) et les codes d'erreurs API.
## Justifications Techniques

* **Traçabilité auto-générée** : Chaque interaction est consignée dans LogSysteme.
* **Sécurité & Confidentialité** : Conformité assurée par l'anonymisation des logs.
* **Architecture 24/7 : Le système** fonctionne en continu, supprimant la gestion complexe des horaires d'ouverture et garantissant une disponibilité constante pour l'utilisateur final.
* **Sécurité & Confidentialité** : Conformité assurée par l'anonymisation des logs et le stockage sécurisé des informations sensibles (RAMQ) selon les standards de protection des données.
* **Chiffrement des données sensibles** : Les données hautement confidentielles, telles que les numéros RAMQ, sont protégées par des mécanismes de hachage et de chiffrement. Le champ MotDePasse_Hash dans CompteProfessionnel garantit qu'aucune information d'authentification n'est stockée en clair, prévenant ainsi les risques en cas d'accès non autorisé à la base de données.
* **Administration centralisée** : Le système permet aux administrateurs de monitorer les erreurs (erreur_code) et la performance (temps_reponse_ms) en temps réel.
* **Gestion de l'intégrité référentielle** : L'utilisation de clés étrangères entre ReferentielServices et RendezVous garantit une cohérence parfaite des données, évitant toute réservation pour un service inexistant ou non défini.
* **Modularité des services** : Le découplage des services (ReferentielServices) par rapport aux entités de rendez-vous permet au professionnel de modifier ses offres (prix, instructions, urgence) de manière dynamique sans impacter l'historique des réservations passées.
* **Gestion des erreurs centralisée** : Le système capture systématiquement les erreurs d'API dans LogSysteme, ce qui permet d'isoler rapidement les problèmes de dépendances externes (ex: indisponibilité de l'API OpenAI ou échec de routage Twilio).
