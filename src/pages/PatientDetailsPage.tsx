import { useParams } from 'react-router-dom';
import { useClients } from '../hooks/UseClients';
import Sidebar from '../components/Sidebar';
import Header from '../components/header';
import Chatbot from '../components/Chatbot';

const PatientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const clients = useClients();

  // Recherche du patient
  const patient = clients.find(c => c.id === id);

  if (!patient) {
    return (
      <div className="flex min-h-screen bg-slate-900 text-white">
        <div className="w-64 border-r border-slate-700">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <Header />
          <div className="mt-8">
            <h1 className="text-3xl font-bold">Patient introuvable</h1>
            <p className="text-gray-400">Aucun patient trouvé avec l'ID: {id}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-700">
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <main className="flex-1 p-6">
        <Header />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-6">Dossier de : {((patient as any).nom || patient.id)}</h1>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            {patient.ramq && (
              <p className="flex items-center gap-3">
                <span className="text-gray-400">RAMQ:</span>
                <span className="font-medium">{patient.ramq}</span>
              </p>
            )}
            
            {patient.telephone && (
              <p className="flex items-center gap-3">
                <span className="text-gray-400">Téléphone:</span>
                <span className="font-medium">{patient.telephone}</span>
              </p>
            )}
            
            {patient.email && (
              <p className="flex items-center gap-3">
                <span className="text-gray-400">Email:</span>
                <span className="font-medium">{patient.email}</span>
              </p>
            )}
            
            <p className="flex items-center gap-3">
              <span className="text-gray-400">Consentement partage données:</span>
              <span className={`font-medium ${patient.consentement_partage_donnees ? 'text-green-400' : 'text-red-400'}`}>
                {patient.consentement_partage_donnees ? "✅ Oui" : "❌ Non"}
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* Chatbot Planifia */}
      <Chatbot userRole="doctor" userId="doc1" />
    </div>
  );
};

export default PatientDetailsPage;