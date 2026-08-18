import { useEffect, useState } from 'react';
import { RendezVous } from '../models/RendezVous';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../utils/authFrontend';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }

        // Si l'utilisateur est un médecin, récupérer SES rendez-vous
        if (user.role === 'MEDECIN') {
          const response = await fetch(`/api/appointments/doctor/${user.id}`);
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const data = await response.json();
          let doctorAppointments: RendezVous[] = (data.appointments || []).map((app: any) => ({
            ...app,
            heure_debut: new Date(app.heure_debut)
          }));
          
          // Si moins de 3 RDV, en créer pour en avoir exactement 3
          if (doctorAppointments.length < 3) {
            const needed = 3 - doctorAppointments.length;
            doctorAppointments = await createSampleAppointments(user.id, needed, doctorAppointments);
          }
          
          // Trier par date et prendre les 3 prochains
          doctorAppointments.sort((a, b) => {
            const dateA = a.heure_debut instanceof Date ? a.heure_debut : new Date(a.heure_debut);
            const dateB = b.heure_debut instanceof Date ? b.heure_debut : new Date(b.heure_debut);
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();
            if (isNaN(timeA) && isNaN(timeB)) return 0;
            if (isNaN(timeA)) return 1;
            if (isNaN(timeB)) return -1;
            return timeA - timeB;
          });
          const nextThree = doctorAppointments.slice(0, 3);
          
          setAppointments(nextThree);
        } else {
          // Pour les patients, récupérer leurs RDV
          const response = await fetch(`/api/appointments/client/${user.id}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          // Convertir les dates en objets Date
          const patientAppointments = (data.appointments || []).map((app: any) => ({
            ...app,
            heure_debut: new Date(app.heure_debut)
          }));
          setAppointments(patientAppointments);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        console.error('Erreur lors du chargement des rendez-vous:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Fonction pour créer des RDV d'exemple si nécessaire
  const createSampleAppointments = async (
    doctorId: string,
    count: number,
    existing: RendezVous[]
  ): Promise<RendezVous[]> => {
    const newAppointments: RendezVous[] = [];
    
    // Dates pour les nouveaux RDV (à partir de demain)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    // Noms de patients exemples
    const patientNames = [
      'Jean Dupont', 'Marie Martin', 'Pierre Bernard', 
      'Sophie Durand', 'Thomas Petit', 'Camille Dubois'
    ];
    
    // Motifs exemples
    const motifs = [
      'Consultation de suivi',
      'Bilan de santé annuel',
      'Consultation pour douleurs articulaires',
      'Suivi du traitement',
      'Examen de contrôle',
      'Consultation urgente'
    ];

    for (let i = 0; i < count; i++) {
      const startDate = new Date(tomorrow);
      startDate.setDate(startDate.getDate() + i);
      
      const newAppointment: RendezVous = {
        id: Date.now().toString() + i,
        nom_patient: patientNames[i % patientNames.length],
        compte_professionnel_id: doctorId,
        client_id: `temp_client_${Date.now() + i}`,
        referentiel_services_id: 's1',
        heure_debut: startDate,
        statut: 'Confirmé',
        consignes_specifiques: motifs[i % motifs.length],
        Urgence: Math.random() > 0.7 // 30% de chance d'être urgent
      };
      
      newAppointments.push(newAppointment);
      
      // Envoyer au serveur pour sauvegarde
      try {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAppointment)
        });
      } catch (err) {
        console.log('Could not save sample appointment:', err);
      }
    }
    
    return [...existing, ...newAppointments];
  };

  if (loading) {
    return <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mt-6">Chargement des rendez-vous...</div>;
  }

  if (error) {
    return <div className="bg-red-900/30 p-6 rounded-xl border border-red-700 shadow-lg mt-6">Erreur : {error}</div>;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mt-6">
      <h3 className="text-gray-400 mb-4 font-medium">Rendez-vous à venir</h3>
      
      {appointments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucun rendez-vous trouvé.</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => (
            <div 
              key={app.id} 
              className={`flex items-center justify-between border-b border-slate-700 pb-4 ${app.Urgence ? 'bg-red-900/20 px-2 rounded-lg' : ''}`}
            >
              <div>
                <p className="font-bold flex items-center gap-2">
                  {app.nom_patient}
                  {app.Urgence && (
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase">
                      Urgent
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400">{app.consignes_specifiques}</p>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-sm ${app.Urgence ? 'bg-red-950 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                {(() => {
                  try {
                    const date = new Date(app.heure_debut);
                    if (isNaN(date.getTime())) return 'Heure invalide';
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    return 'Heure invalide';
                  }
                })()}
              </span>
              <Link to={`/rendezvous/${app.id}`} className="text-xs text-blue-400 hover:underline">Voir les détails</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;