import { useEffect, useState } from 'react';
import { getAppointments } from '../controllers/appointmentController';
import { RendezVous } from '../models/RendezVous';
import { Link } from 'react-router-dom'; 

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<RendezVous[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAppointments();
      setAppointments(data);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mt-6">
      <h3 className="text-gray-400 mb-4 font-medium">Rendez-vous à venir</h3>
      
      <div className="space-y-4">
        {appointments.map((app) => (
          <div 
            key={app.id} 
            className={`flex items-center justify-between border-b border-slate-700 pb-4 ${app.Urgence ? 'bg-red-900/20 px-2 rounded-lg' : ''}`}
          >
            <div>
              <p className="font-bold flex items-center gap-2">
                {app.nom_patient}
                {/* Pastille visuelle pour l'urgence */}
                {app.Urgence && (
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase">
                    Urgent
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-400">{app.consignes_specifiques}</p>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm ${app.Urgence ? 'bg-red-950 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
              {app.heure_debut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Link to={`/rendezvous/${app.id}`} className="text-xs text-blue-400 hover:underline">Voir les détails</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentList;