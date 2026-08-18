import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RendezVous } from '../models/RendezVous';

const AppointmentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [rdv, setRdv] = useState<RendezVous | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/appointments/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Convertir la date en objet Date
            const appointment = data.appointment;
            setRdv({
              ...appointment,
              heure_debut: new Date(appointment.heure_debut)
            });
          }
        })
        .catch(() => setRdv(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 text-white">Chargement...</div>;
  }

  if (!rdv) {
    return <div className="p-8 text-white">Rendez-vous non trouvé.</div>;
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Détails du Rendez-vous #{rdv.id}</h1>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Informations patient</h2>
        <div className="space-y-4">
          <p><span className="text-gray-400">Patient :</span> {rdv.nom_patient}</p>
          <p><span className="text-gray-400">Heure :</span> {(() => {
            try {
              const date = new Date(rdv.heure_debut);
              return !isNaN(date.getTime()) ? date.toLocaleString() : 'Date invalide';
            } catch {
              return 'Date invalide';
            }
          })()}</p>
          <p><span className="text-gray-400">Statut :</span> {rdv.statut}</p>
          <p><span className="text-gray-400">Consignes :</span> {rdv.consignes_specifiques}</p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;