// Dans src/pages/PatientDetailsPage.tsx
import { useParams } from 'react-router-dom';
import { useClients } from '../hooks/UseClients';

const PatientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const clients = useClients();
  
  // On cherche le patient spécifique dans la liste
  const patient = clients.find(c => c.id === id);

  if (!patient) {
    return <div className="p-8 text-white">Patient introuvable avec l'ID {id}</div>;
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Dossier de : {patient.id}</h1>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <p><strong>RAMQ :</strong> {patient.ramq}</p>
        <p><strong>Téléphone :</strong> {patient.telephone}</p>
        <p><strong>Consentement :</strong> {patient.consentement_partage_donnees ? "Oui" : "Non"}</p>
      </div>
    </div>
  );
};

export default PatientDetailsPage;