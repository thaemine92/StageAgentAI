import { Request, Response } from 'express';
import { RendezVous } from '../models/RendezVous';
import { CompteProfessionnel } from '../models/CompteProfessionnel';
import { ConfigurationAgentAI } from '../models/ConfigurationAgentAI';
import { Client } from '../models/Clients';
import { getAppointments, createAppointment } from './appointmentController';
import { getClientsByDoctor, getClientById } from './clientController';
// Import du SDK Mistral - sera chargé dynamiquement plus bas
// Utilisation d'un import dynamique pour éviter les problèmes ESM/CJS

// Interface pour les messages de chat
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Interface pour la requête de chat
export interface ChatRequest {
  message: string;
  userId?: string;
  userRole: 'patient' | 'doctor' | 'admin';
  conversationId?: string;
  conversationHistory?: Array<{role: 'user' | 'assistant'; content: string}>;
}

// Interface pour la configuration des disponibilités
export interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  availableSlots: {
    date: string;
    times: string[];
  }[];
  services: {
    id: string;
    name: string;
    duration: number; // en minutes
  }[];
}

// Fonction pour générer le prompt système en fonction du rôle
export const generateSystemPrompt = (
  userRole: string,
  doctorInfo?: DoctorAvailability,
  existingAppointments: RendezVous[] = []
): string => {
  const basePrompt = `
    Tu es un assistant IA médical intelligent. 
    Ton rôle est d'aider les patients à prendre des rendez-vous et les médecins à gérer leur planning.
    
    RÈGLES GÉNÉRALES:
    - Réponds TOUJOURS en français.
    - Sois professionnel, clair et concis.
    - Si tu ne peux pas répondre, dis "Je ne peux pas répondre à cette demande."
    - Ne révèle jamais d'informations personnelles sans vérification.
    
    CONTEXTE ACTUEL:
    ${doctorInfo ? `
      Médecin: ${doctorInfo.doctorName}
      Services disponibles: ${doctorInfo.services.map(s => s.name).join(', ')}
      Créneaux disponibles: ${doctorInfo.availableSlots.map(slot => 
        `${slot.date}: ${slot.times.join(', ')}`
      ).join(' | ')}
    ` : 'Aucun médecin sélectionné.'}
    
    ${existingAppointments.length > 0 ? `
      Rendez-vous existants: ${existingAppointments.map(app => {
        let date: Date;
        if (app.heure_debut instanceof Date) {
          date = app.heure_debut;
        } else if (typeof app.heure_debut === 'string') {
          date = new Date(app.heure_debut);
        } else {
          date = new Date();
        }
        return `${app.nom_patient} à ${!isNaN(date.getTime()) ? date.toLocaleString() : 'date invalide'}`;
      }).join('; ')}
    ` : ''}
  `;

  const roleSpecificPrompt = userRole === 'doctor' 
    ? `
      EN TANT QUE MÉDECIN:
      - Tu peux lister les rendez-vous du médecin.
      - Tu peux ajouter des notes à un rendez-vous.
      - Tu peux consulter les disponibilités.
      - Format des réponses: toujours inclure l'heure et le nom du patient.
    `
    : `
      EN TANT QUE PATIENT:
      - Pour prendre un rendez-vous: demande le nom, la date, l'heure et le motif.
      - Vérifie toujours que le créneau est disponible avant de confirmer.
      - Format de confirmation: "Votre rendez-vous avec [Nom du médecin] est confirmé pour le [date] à [heure]."
      - Si le créneau n'est pas disponible: propose des alternatives.
    `;

  return basePrompt + roleSpecificPrompt;
};

// Fonction améliorée pour extraire les données d'un rendez-vous
export const extractAppointmentData = (message: string, isDoctor: boolean = false): Partial<RendezVous> | null => {
  const normalizedMessage = message.toLowerCase();

  // Extraire le nom du patient
  let patientName = 'Patient inconnu';
  let patientFirstName = '';
  let patientLastName = '';
  
  // Pour les médecins: extraire prénom et nom séparément
  if (isDoctor) {
    // Chercher des motifs comme "pour Celia" ou "patient: Celia Martin" ou "nom: Martin, prénom: Celia"
    const fullNameMatches = [
      ...message.matchAll(/(?:pour |patient[: ]+|nom[: ]+|prénom[: ]+|nom et prénom[: ]+)([a-zàâäéèêëïîôùûüÿç \-']+)/gi),
      ...message.matchAll(/([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ][a-zàâäéèêëïîôùûüÿç]+) +([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ][a-zàâäéèêëïîôùûüÿç]+)/g)
    ];
    
    if (fullNameMatches.length > 0) {
      const nameParts = fullNameMatches[0][1].trim().split(/[ \-]/);
      if (nameParts.length >= 2) {
        patientFirstName = nameParts[0];
        patientLastName = nameParts.slice(1).join(' ');
        patientName = `${patientFirstName} ${patientLastName}`;
      } else {
        patientName = fullNameMatches[0][1].trim();
      }
    }
  } else {
    // Pour les patients: extraire le nom (ou utiliser le nom du patient connecté)
    const nameMatches = [
      ...message.matchAll(/(?:je m'appelle|mon nom est|nom[: ]+|patient[: ]+|pour) ([a-zàâäéèêëïîôùûüÿç \-']+)/gi),
      ...message.matchAll(/^([a-zàâäéèêëïîôùûüÿç \-']+)/i)
    ];
    if (nameMatches.length > 0) {
      patientName = nameMatches[0][1].trim();
    }
  }

  // Extraire la date (formats: DD/MM/YYYY, YYYY-MM-DD, "le 14 août", "14 aout", etc.)
  let date: Date | null = null;
  const datePatterns = [
    // Format DD/MM/YYYY ou DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // Format YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // Format "le 14 août 2026" ou "14 aout"
    /(?:le |)(\d{1,2}) (janvier|février|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre)(?: (\d{4}))?/i
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      if (pattern.toString().includes('janvier')) {
        // Format avec mois en lettres
        const day = parseInt(match[1] || match[2]);
        const monthStr = match[2]?.toLowerCase() || match[1]?.toLowerCase();
        const month = ['janvier','février','mars','avril','mai','juin','juillet','août','aout','septembre','octobre','novembre','décembre'].indexOf(monthStr);
        let year = parseInt(match[3] || match[4] || new Date().getFullYear().toString());
        // Si on est en décembre et que la date est dans le passé, on passe à l'année suivante
        if (month === 11 && day > new Date().getDate() && !match[3]) {
          year += 1;
        }
        date = new Date(year, month, day);
      } else if (match[3]) {
        // Format DD/MM/YYYY
        date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      } else if (match[1]?.length === 4) {
        // Format YYYY-MM-DD
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
      break;
    }
  }

  // Si aucune date trouvée, utiliser aujourd'hui + 1 jour
  if (!date) {
    date = new Date();
    date.setDate(date.getDate() + 1);
  }

  // Extraire l'heure (formats: 14h00, 14:00, 2 PM, etc.)
  let hours = 10; // Heure par défaut
  let minutes = 0;

  const timeMatch = message.match(/(?:à |a |at |heures?[: ]+|h[ :])(\d{1,2})[h:](\d{2})/i) ||
                   message.match(/(?:à |a |at |heures?[: ]+)(\d{1,2})[h](\d{0,2})/i) ||
                   message.match(/(?:à |a |at )(\d{1,2})/i);

  if (timeMatch) {
    hours = parseInt(timeMatch[1]) || 10;
    minutes = parseInt(timeMatch[2]) || 0;
    if (timeMatch[0]?.toLowerCase().includes('pm') && hours < 12) {
      hours += 12;
    }
  }

  // Ajustement de l'heure
  if (hours > 24) hours = 10;
  if (minutes > 59) minutes = 0;

  date.setHours(hours, minutes, 0, 0);

  // Extraire le motif/consignes spécifiques
  let motif = 'Consultation standard';
  const motifMatches = message.match(/(?:motif[: ]+|pour |afin de |consultation pour |type[: ]+|raison[: ]+)([^.?]+[.?]?)/i);
  if (motifMatches) {
    motif = motifMatches[0].replace(/motif[: ]+|pour |afin de |consultation pour |type[: ]+|raison[: ]+/gi, '').trim();
  }

  // Extraire les notes supplémentaires (documents, traitement, etc.)
  let notes = '';
  const notesPatterns = [
    /(?:notes?[: ]+|document[s]?[: ]+|traitement[: ]+|observation[s]?[: ]+|à noter[: ]+)([^.?]+[.?]?)/i,
    /(?:avec |et |plus )(les? documents?|un traitement|des notes?|observation[s]?) [a-zàâäéèêëïîôùûüÿç ,.]+/i
  ];
  
  for (const pattern of notesPatterns) {
    const match = message.match(pattern);
    if (match) {
      notes = match[0].replace(/notes?[: ]+|document[s]?[: ]+|traitement[: ]+|observation[s]?[: ]+|à noter[: ]+/gi, '').trim();
      break;
    }
  }

  // Combiner motif et notes
  const consignesSpecifiques = notes ? `${motif}${notes ? ' - ' + notes : ''}` : motif;

  // Détecter l'urgence
  const isUrgent = normalizedMessage.includes('urgent') ||
                  normalizedMessage.includes('urgence') ||
                  normalizedMessage.includes('doul') ||
                  normalizedMessage.includes('immédiat');

  return {
    nom_patient: patientName,
    heure_debut: date,
    consignes_specifiques: consignesSpecifiques,
    Urgence: isUrgent,
    statut: 'En attente'
  };
};

// Fonction simplifiée pour traiter les messages avec l'API Mistral
// Utilise vraiment la clé API de Mistral
export const callMistralAPI = async (
  messages: ChatMessage[],
  model: string = 'mistral-small-latest',
  temperature: number = 0.7,
  existingAppointments: RendezVous[] = [],
  existingPatients: Client[] = [],
  userRole?: string,
  userId?: string
): Promise<{ reply: string; action?: string; appointmentData?: Partial<RendezVous> }> => {
  try {
    // 1. Vérifier que la clé API est disponible
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ MISTRAL_API_KEY est manquant ou vide dans .env !');
      return {
        reply: "Désolé, l'assistant IA n'est pas configuré correctement. Vérifiez que votre clé API Mistral est valide.",
        action: undefined,
        appointmentData: undefined
      };
    }

    // 2. Charger le SDK Mistral et créer le client
    // Solution : utiliser fetch directement car le SDK @mistralai/mistralai@2.6.3
    // a des problèmes avec ses méthodes
    let client;
    try {
      const mistralModule = await import('@mistralai/mistralai');
      const MistralClass = mistralModule.MistralClient || mistralModule.Mistral || mistralModule.default;
      if (!MistralClass || typeof MistralClass !== 'function') {
        throw new Error('MistralClass not available');
      }
      client = new MistralClass({ apiKey });
      console.log('✅ Client Mistral créé (version:', mistralModule.SDK_METADATA?.version, ')');
    } catch (initError) {
      console.error('❌ Erreur init Mistral:', initError.message);
      console.log('⚠️ Utilisation de fetch directement');
      client = null;
    }

    // 3. Construire le prompt système avec le contexte utilisateur
    // Formater les rendez-vous pour le prompt
    const appointmentsList = existingAppointments.length > 0
      ? existingAppointments.map(app => {
          try {
            const date = new Date(app.heure_debut);
            const dateStr = !isNaN(date.getTime()) 
              ? date.toLocaleString('fr-FR', { 
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                })
              : 'date invalide';
            return `- ${app.nom_patient} : ${dateStr} (${app.statut})`;
          } catch {
            return `- ${app.nom_patient} : date invalide (${app.statut})`;
          }
        }).join('\n')
      : 'Aucun';
    
    const patientsList = existingPatients.length > 0
      ? existingPatients.map(p => `- ${p.prenom || 'Inconnu'} ${p.nom || ''}`.trim()).join('\n')
      : 'Aucun';

    const systemPrompt = `Tu es Planifia, un assistant IA médical intelligent pour un ${userRole === 'doctor' ? 'médecin' : 'patient'}.
      
      **RÈGLES STRICTES (à suivre absolument) :**
      - Réponds TOUJOURS en français.
      - Sois professionnel, clair et concis.
      - **IMPORTANT** : Quand on te demande de lister les rendez-vous, TU DOIS utiliser UNIQUEMENT la liste fournie dans le CONTEXTE ACTUEL ci-dessous. NE PAS inventer ou omettre de rendez-vous.
      
      **CONTEXTE ACTUEL :**
      - Rôle: ${userRole}
      - ID utilisateur: ${userId || 'inconnu'}
      - **VOS RENDEZ-VOUS (${existingAppointments.length}) :**
${appointmentsList}
      
      - **VOS PATIENTS (${existingPatients.length}) :**
${patientsList}
      
      **INSTRUCTIONS SPÉCIFIQUES :**
      - Si on te demande : "donne moi mes rendez-vous", "liste mes rendez-vous", "mes prochains rendez-vous", "quels sont mes rendez-vous", "afficher mes rendez-vous" → **LISTE TOUS les rendez-vous du CONTEXTE ACTUEL ci-dessus, un par ligne, avec nom, date et heure.**
      - Si on te demande : "combien de rendez-vous j'ai ?", "nombre de rendez-vous" → **Réponds EXACTEMENT avec : "Vous avez ${existingAppointments.length} rendez-vous."**
      - Si on te demande un nombre : "donne moi mes 2 prochains rendez-vous", "les 3 derniers" → **Liste EXACTEMENT ce nombre de rendez-vous du CONTEXTE ACTUEL.**
      - Si ${existingAppointments.length} === 0 → Réponds : "Vous n'avez actuellement aucun rendez-vous programmé."
      
      **EXEMPLES DE RÉPONSES :**
      - Question: "Quels sont mes rendez-vous ?" → Réponse: "Voici vos ${existingAppointments.length} rendez-vous:\n${appointmentsList}\n\nSouhaitez-vous gérer l'un d'eux ?"
      - Question: "Combien de rendez-vous j'ai ?" → Réponse: "Vous avez ${existingAppointments.length} rendez-vous programmé(s)."
      - Question: "Donne moi mes 2 prochains rendez-vous" → Réponse: Liste les 2 premiers de ${appointmentsList}
      - Pour un patient qui veut prendre RDV: "Pour prendre un rendez-vous, merci de me donner le nom du patient, la date souhaitée, l'heure et le motif de la consultation."
      - Pour une question générale: Réponds de manière naturelle et utile.`;

    // 4. Préparer les messages pour Mistral
    const mistralMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 5. Appeler l'API Mistral
    console.log('🔹 Appel à Mistral avec le modèle:', model);
    
    let response;
    try {
      // Essayer le SDK d'abord
      if (client) {
        if (typeof client.chat === 'function') {
          console.log('📌 SDK: client.chat()');
          response = await client.chat({ model, messages: mistralMessages, temperature });
        }
        else if (client.chat?.create) {
          console.log('📌 SDK: client.chat.create()');
          response = await client.chat.create({ model, messages: mistralMessages, temperature });
        }
        else if (typeof client._chat === 'function') {
          console.log('📌 SDK: client._chat()');
          response = await client._chat({ model, messages: mistralMessages, temperature });
        }
        else if (client._chat?.create) {
          console.log('📌 SDK: client._chat.create()');
          response = await client._chat.create({ model, messages: mistralMessages, temperature });
        }
      }
      
      // Si le SDK échoue, utiliser fetch directement
      if (!response && client) {
        console.log('⚠️ SDK ne fonctionne pas, utilisation de fetch directement');
        
        // Essayer plusieurs endpoints Mistral
        const baseUrl = client?._baseURL || 'https://api.mistral.ai';
        const endpoints = [
          `${baseUrl}/v1/chat`,
          `${baseUrl}/v1/chat/completions`,
          `${baseUrl}/v1/completions`,
          'https://api.mistral.ai/v1/chat',
          'https://api.mistral.ai/v1/chat/completions'
        ];
        
        const fetchImpl = globalThis.fetch;
        if (!fetchImpl) {
          console.error('❌ fetch non disponible');
          throw new Error('fetch not available');
        }
        
        let fetchResponse = null;
        for (const endpoint of endpoints) {
          try {
            console.log(`🎯 Essai de l'endpoint: ${endpoint}`);
            fetchResponse = await fetchImpl(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model,
                messages: mistralMessages,
                temperature
              })
            });
            
            if (fetchResponse.ok) {
              console.log(`✅ Endpoint valide: ${endpoint}`);
              break;
            }
          } catch (e) {
            console.log(`❌ Erreur avec ${endpoint}:`, e.message);
          }
        }
        
        if (!fetchResponse || !fetchResponse.ok) {
          console.error('❌ Tous les endpoints ont échoué');
          throw new Error('All endpoints failed');
        }
        
        response = await fetchResponse.json();
      }
      
      if (!response) {
        throw new Error('Pas de réponse du SDK ou de fetch');
      }
    } catch (chatError) {
      console.error('❌ Erreur appel Mistral:', chatError.message);
      return { reply: "IA indisponible.", action: undefined, appointmentData: undefined };
    }

    // 6. Extraire la réponse
    if (!response || typeof response !== 'object') {
      console.error('❌ Réponse invalide de Mistral:', response);
      throw new Error('Invalid response format');
    }
    const reply = response.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
    console.log('🔹 Réponse Mistral:', reply);

    // 7. Vérifier si la réponse contient une demande de RDV explicite
    let action: string | undefined;
    let appointmentData: Partial<RendezVous> | undefined;
    
    // Si l'utilisateur a déjà demandé de confirmer un RDV, on extrait les données
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    if (userMessage.toLowerCase().includes('rendez-vous') || userMessage.toLowerCase().includes('rdv')) {
      appointmentData = extractAppointmentData(userMessage, userRole === 'doctor');
      if (appointmentData && appointmentData.nom_patient !== 'Patient inconnu') {
        action = 'confirm_appointment';
      }
    }

    return {
      reply,
      action,
      appointmentData
    };

  } catch (error: any) {
    console.error('❌ Erreur Mistral:', error);
    
    // Afficher plus de détails sur l'erreur pour le debug
    if (error.message) {
      console.error('Message d\'erreur:', error.message);
    }
    if (error.response) {
      console.error('Réponse erreur:', error.response);
    }
    
    // Retourner une réponse de secours
    return {
      reply: "Désolé, l'assistant IA est temporairement indisponible. Essayez de reformuler votre demande ou réessayez plus tard.",
      action: undefined,
      appointmentData: undefined
    };
  }
};

// Contrôleur principal pour le chat
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, userId, userRole, conversationId, conversationHistory }: ChatRequest = req.body;

    if (!message || !userRole) {
      return res.status(400).json({
        error: 'Message et rôle utilisateur requis'
      });
    }

    // 1. Construire l'historique des messages pour Mistral
    const mistralMessages: ChatMessage[] = conversationHistory ? [
      ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant' | 'system', content: msg.content })),
      { role: 'user', content: message }
    ] : [{ role: 'user', content: message }];

    // 1. Récupérer les rendez-vous existants (filtrés par utilisateur)
    let existingAppointments: RendezVous[] = [];
    try {
      if (userRole === 'doctor' && userId) {
        existingAppointments = await getAppointmentsByDoctor(userId);
      } else if (userRole === 'patient' && userId) {
        existingAppointments = await getAppointmentsByPatient(userId);
      } else {
        existingAppointments = await getAppointments();
      }
    } catch (dbError) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', dbError);
      // Fallback vers les mocks si la base échoue
      existingAppointments = [];
    }
    
    // 2. Récupérer les patients si l'utilisateur est un médecin
    let existingPatients: Client[] = [];
    if (userRole === 'doctor' && userId) {
      try {
        existingPatients = await getClientsByDoctor(userId);
      } catch (error) {
        console.error('Erreur lors de la récupération des patients:', error);
      }
    }

    // 3. Appeler l'API Mistral améliorée avec l'historique
    const result = await callMistralAPI(
      mistralMessages,
      'mistral-small-latest',
      0.7,
      existingAppointments,
      existingPatients,
      userRole,
      userId
    );

    // 3. Si une confirmation de RDV est demandée
    if (result.action === 'confirm_appointment' && result.appointmentData) {
      // S'assurer que heure_debut est un Date
      const heureDebut = result.appointmentData.heure_debut instanceof Date
        ? result.appointmentData.heure_debut
        : new Date(result.appointmentData.heure_debut || new Date());
      
      // Créer le RDV
      const newAppointment: RendezVous = {
        id: Date.now().toString(),
        nom_patient: result.appointmentData.nom_patient || 'Inconnu',
        compte_professionnel_id: userRole === 'doctor' ? userId || 'medecin-001' : 'medecin-001',
        client_id: userId || 'client-001',
        referentiel_services_id: 's1',
        heure_debut: heureDebut,
        statut: 'Confirmé',
        consignes_specifiques: result.appointmentData.consignes_specifiques || 'Consultation standard',
        Urgence: result.appointmentData.Urgence || false,
      };

      console.log('Nouveau RDV créé:', newAppointment);
      
      // Sauvegarder dans la base de données
      try {
        const { createAppointment } = await import('./appointmentController');
        await createAppointment(newAppointment);
        console.log('RDV sauvegardé en base');
      } catch (error) {
        console.error('Erreur sauvegarde RDV:', error);
      }

      return res.json({
        reply: `Rendez-vous confirmé pour **${newAppointment.nom_patient}** le **${newAppointment.heure_debut.toLocaleDateString('fr-FR')} à ${newAppointment.heure_debut.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}** pour **${newAppointment.consignes_specifiques}**.`,
        action: 'appointment_confirmed',
        appointmentData: newAppointment,
        conversationId: conversationId || Date.now().toString(),
      });
    }

    // 4. Réponse normale
    res.json({
      reply: result.reply,
      action: result.action,
      conversationId: conversationId || Date.now().toString(),
    });

  } catch (error) {
    console.error('Erreur dans handleChat:', error);
    res.status(500).json({
      error: 'Erreur lors du traitement de la requête'
    });
  }
};

// Fonction pour lister les rendez-vous via l'IA
export const listAppointments = async (req: Request, res: Response) => {
  try {
    const { userId, userRole } = req.body;
    
    if (userRole !== 'doctor') {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    const appointments = await getAppointments();
    const doctorAppointments = appointments.filter(app => app.compte_professionnel_id === userId);

    if (doctorAppointments.length === 0) {
      return res.json({
        reply: "Vous n'avez aucun rendez-vous programmé.",
        appointments: [],
      });
    }

    const formattedAppointments = doctorAppointments.map(app => {
      let date: Date;
      if (app.heure_debut instanceof Date) {
        date = app.heure_debut;
      } else if (typeof app.heure_debut === 'string') {
        date = new Date(app.heure_debut);
      } else {
        date = new Date();
      }
      
      const timeStr = !isNaN(date.getTime())
        ? date.toLocaleString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Date invalide';
      
      return {
        id: app.id,
        patient: app.nom_patient,
        time: timeStr,
        status: app.statut,
        urgency: app.Urgence,
      };
    });

    const summary = formattedAppointments
      .map((app: any) => `• ${app.time} - ${app.patient} (${app.status}${app.urgency ? ' - URGENT' : ''})`)
      .join('\n');

    res.json({
      reply: `Voici vos rendez-vous à venir:\n\n${summary}\n\nSouhaitez-vous plus de détails sur l'un d'eux ?`,
      appointments: formattedAppointments,
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
  }
};
