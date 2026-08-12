import { useEffect, useState } from 'react';
import { RendezVous } from '../models/RendezVous';
import { Link } from 'react-router-dom'; 

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setAppointments(data.appointments || []);
        } else {
          setError(data.message || 'Erreur de chargement');
        }
      })
      .catch(err => {
        setError(err.message);
        console.error('Erreur lors du chargement des rendez-vous:', err);
      })
      .finally(() => setLoading(false));
  }, []);

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
                {new Date(app.heure_debut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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