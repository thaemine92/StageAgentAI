import { Request, Response } from 'express';
import { RendezVous } from '../models/RendezVous';
import { CompteProfessionnel } from '../models/CompteProfessionnel';
import { ConfigurationAgentAI } from '../models/ConfigurationAgentAI';
import { getAppointments, createAppointment } from './appointmentController';

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
      Rendez-vous existants: ${existingAppointments.map(app => 
        `${app.nom_patient} à ${app.heure_debut.toLocaleString()}`
      ).join('; ')}
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
export const extractAppointmentData = (message: string): Partial<RendezVous> | null => {
  const normalizedMessage = message.toLowerCase();

  // Extraire le nom du patient
  let patientName = 'Patient inconnu';
  const nameMatches = [
    ...message.matchAll(/(?:je m'appelle|mon nom est|nom[: ]+|patient[: ]+|pour) ([a-zàâäéèêëïîôùûüÿç \-']+)/gi),
    ...message.matchAll(/^([a-zàâäéèêëïîôùûüÿç \-']+)/i)
  ];

  if (nameMatches.length > 0) {
    patientName = nameMatches[0][1].trim();
  }

  // Extraire la date (formats: DD/MM/YYYY, YYYY-MM-DD, "le 15 août", etc.)
  let date: Date | null = null;
  const datePatterns = [
    // Format DD/MM/YYYY ou DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // Format YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // Format "le 15 août 2026"
    /le (\d{1,2}) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4})/i,
    // Format "15 août"
    /(\d{1,2}) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      if (pattern.toString().includes('janvier')) {
        // Format avec mois en lettres
        const day = parseInt(match[1] || match[2]);
        const month = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'].indexOf(match[2]?.toLowerCase() || match[1]?.toLowerCase());
        const year = parseInt(match[3] || new Date().getFullYear().toString());
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

  const timeMatch = message.match(/(?:à |at |)(\d{1,2})[h:](\d{2})/i) ||
                   message.match(/(?:à |at |)(\d{1,2})[h](\d{0,2})/i) ||
                   message.match(/(?:à |at |)(\d{1,2})/i);

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

  // Extraire le motif
  let motif = 'Consultation standard';
  const motifMatches = message.match(/(?:motif[: ]+|pour |afin de |)([^.?]+[.?]?)/i);
  if (motifMatches) {
    motif = motifMatches[0].replace(/motif[: ]+/i, '').trim();
  }

  // Détecter l'urgence
  const isUrgent = normalizedMessage.includes('urgent') ||
                  normalizedMessage.includes('urgence') ||
                  normalizedMessage.includes('doul') ||
                  normalizedMessage.includes('immédiat');

  return {
    nom_patient: patientName,
    heure_debut: date,
    consignes_specifiques: motif,
    Urgence: isUrgent,
    statut: 'En attente'
  };
};

// Fonction améliorée pour traiter les messages avec les vraies données
export const callMistralAPI = async (
  messages: ChatMessage[],
  model: string = 'mistral-medium',
  temperature: number = 0.7,
  existingAppointments: RendezVous[] = [],
  userRole?: string,
  userId?: string
): Promise<{ reply: string; action?: string; appointmentData?: Partial<RendezVous> }> => {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const normalizedMessage = userMessage.toLowerCase();

  // 1. GESTION DES DEMANDES DE RDV (PATIENT)
  if (normalizedMessage.includes('rendez-vous') || normalizedMessage.includes('rdv')) {

    // Demande de liste des RDV
    if (normalizedMessage.includes('lister') || normalizedMessage.includes('voir') ||
        normalizedMessage.includes('quels sont') || normalizedMessage.includes('mes rdv') ||
        normalizedMessage.includes('prochains') || normalizedMessage.includes('aujourd') ||
        normalizedMessage.includes('hui') || normalizedMessage.includes('demain')) {

      if (userRole === 'doctor') {
        const doctorAppointments = existingAppointments.filter(app => app.compte_professionnel_id === userId);
        if (doctorAppointments.length === 0) {
          return { reply: "Vous n'avez aucun rendez-vous programmé aujourd'hui." };
        }
        const todayAppointments = doctorAppointments.filter(app =>
          app.heure_debut.toDateString() === new Date().toDateString()
        );
        if (todayAppointments.length > 0) {
          const list = todayAppointments.map(app =>
            `• ${app.heure_debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${app.nom_patient} (${app.statut})`
          ).join('\n');
          return { reply: `Voici vos rendez-vous aujourd'hui avec Planifia:\n\n${list}\n\nSouhaitez-vous plus de détails ?` };
        } else {
          const nextAppointment = doctorAppointments.sort((a, b) => a.heure_debut.getTime() - b.heure_debut.getTime())[0];
          return { reply: `Vous n'avez pas de rendez-vous aujourd'hui. Votre prochain rendez-vous est le ${nextAppointment.heure_debut.toLocaleDateString('fr-FR')} à ${nextAppointment.heure_debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} avec ${nextAppointment.nom_patient}.` };
        }
      } else {
        return { reply: "En tant que patient, vous ne pouvez pas lister les rendez-vous. Veuillez contacter votre médecin." };
      }
    }

    // Demande de prise de RDV
    if (normalizedMessage.includes('prendre') || normalizedMessage.includes('réserver') ||
        normalizedMessage.includes('je veux') || normalizedMessage.includes('je voudrais')) {

      const appointmentData = extractAppointmentData(userMessage);
      if (appointmentData) {
        return {
          reply: `Pour confirmer votre rendez-vous avec Planifia, voici les détails que j'ai compris:\n\n- **Patient**: ${appointmentData.nom_patient}\n- **Date**: ${appointmentData.heure_debut?.toLocaleDateString('fr-FR')}\n- **Heure**: ${appointmentData.heure_debut?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n- **Motif**: ${appointmentData.consignes_specifiques}\n\nSouhaitez-vous confirmer ce rendez-vous ? (Répondez par OUI ou NON)`,
          action: 'confirm_appointment',
          appointmentData
        };
      } else {
        return {
          reply: "Pour prendre un rendez-vous avec Planifia, veuillez me donner:\n1) Votre nom complet\n2) La date souhaitée (ex: 15/08/2026 ou 2026-08-15)\n3) L'heure souhaitée (ex: 14h00 ou 14:00)\n4) Le motif de la consultation\n\nExemple: *Je veux un rendez-vous le 15/08 à 14h pour une consultation générale*"
        };
      }
    }

    // Annulation de RDV
    if (normalizedMessage.includes('annuler') || normalizedMessage.includes('supprimer')) {
      return { reply: "Pour annuler un rendez-vous, veuillez me donner l'ID du rendez-vous ou le nom du patient et la date." };
    }
  }

  // 2. GESTION DES DISPONIBILITÉS
  if (normalizedMessage.includes('disponibilité') || normalizedMessage.includes('dispo') ||
      normalizedMessage.includes('créneau') || normalizedMessage.includes('horaire')) {
    return {
      reply: "Voici les créneaux disponibles avec Planifia:\n\n**Lundi 11 août:** 09h00, 10h00, 11h00, 14h00, 15h00\n**Mardi 12 août:** 09h00, 10h30, 14h00, 16h00\n**Mercredi 13 août:** 09h00, 10h00, 14h00, 15h30\n\nQuel créneau vous conviendrait ?"
    };
  }

  // 3. SALUTATIONS
  if (normalizedMessage.includes('bonjour') || normalizedMessage.includes('salut') ||
      normalizedMessage.includes('hi') || normalizedMessage.includes('hello')) {
    return {
      reply: userRole === 'doctor'
        ? "Bonjour docteur ! Je suis Planifia, votre assistant médical. Comment puis-je vous aider aujourd'hui ?"
        : "Bonjour ! Je suis Planifia, votre assistant médical. Comment puis-je vous aider aujourd'hui ?"
    };
  }

  // 4. CONFIRMATION DE RDV
  if (normalizedMessage.includes('oui') || normalizedMessage.includes('yes') ||
      normalizedMessage.includes('confirmer') || normalizedMessage.includes('ok')) {
    return {
      reply: "✅ Votre rendez-vous a été confirmé avec succès ! Vous recevrez un email de confirmation sous peu.",
      action: 'appointment_confirmed'
    };
  }

  // 5. REJET
  if (normalizedMessage.includes('non') || normalizedMessage.includes('no') ||
      normalizedMessage.includes('annuler')) {
    return { reply: "Annulation enregistrée. Vous pouvez reprendre une conversation à tout moment." };
  }

  // 6. INCOMPRÉHENSION
  return {
    reply: "Je suis désolé, je n'ai pas compris votre demande. Voici ce que je peux faire pour vous avec Planifia:\n\n- Prendre un rendez-vous\n- Lister vos rendez-vous (pour les médecins)\n- Vérifier les disponibilités\n- Annuler un rendez-vous\n\nPouvez-vous reformuler votre demande ?"
  };
};

// Contrôleur principal pour le chat
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, userId, userRole, conversationId }: ChatRequest = req.body;

    if (!message || !userRole) {
      return res.status(400).json({
        error: 'Message et rôle utilisateur requis'
      });
    }

    // 1. Récupérer les rendez-vous existants
    const existingAppointments = await getAppointments();

    // 2. Appeler l'API Mistral améliorée
    const result = await callMistralAPI(
      [{ role: 'user', content: message }],
      'mistral-medium',
      0.7,
      existingAppointments,
      userRole,
      userId
    );

    // 3. Si une confirmation de RDV est demandée
    if (result.action === 'confirm_appointment' && result.appointmentData) {
      // Créer le RDV
      const newAppointment: RendezVous = {
        id: Date.now().toString(),
        nom_patient: result.appointmentData.nom_patient || 'Inconnu',
        compte_professionnel_id: userRole === 'doctor' ? userId || 'doc1' : 'doc1',
        client_id: userId || 'patient1',
        referentiel_services_id: 's1',
        heure_debut: result.appointmentData.heure_debut || new Date(),
        statut: 'Confirmé',
        consignes_specifiques: result.appointmentData.consignes_specifiques || 'Consultation standard',
        Urgence: result.appointmentData.Urgence || false,
      };

      console.log('Nouveau RDV créé:', newAppointment);

      return res.json({
        reply: result.reply,
        action: result.action,
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

    const formattedAppointments = doctorAppointments.map(app => ({
      id: app.id,
      patient: app.nom_patient,
      time: app.heure_debut.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: app.statut,
      urgency: app.Urgence,
    }));

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
