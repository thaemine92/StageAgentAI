import { useParams } from 'react-router-dom';
import { getAppointmentById } from '../controllers/appointmentController';

const AppointmentDetailsPage = () => {
  const { id } = useParams<{ id: string }>(); // On récupère l'ID
  const rdv = getAppointmentById(id || ''); // On cherche les données

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
          <p><span className="text-gray-400">Heure :</span> {rdv.heure_debut.toLocaleString()}</p>
          <p><span className="text-gray-400">Statut :</span> {rdv.statut}</p>
          <p><span className="text-gray-400">Consignes :</span> {rdv.consignes_specifiques}</p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;