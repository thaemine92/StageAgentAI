import { useClients } from '../hooks/UseClients';
import { getAppointments } from '../controllers/appointmentController'; 

const ClientPortalPage = async () => {
  // Pour l'exemple, on simule l'ID du client connecté (normalement récupéré via l'authentification)
  const currentClientId = "client-1"; 

  const clients = useClients();
  const client = clients.find(c => c.id === currentClientId);

  // Récupérer les rendez-vous liés à ce client spécifique
  const allAppointments = getAppointments();
  const clientAppointments = (await allAppointments).filter(rdv => rdv.client_id === currentClientId);

  if (!client) {
    return <div className="p-8 text-white">Chargement de votre espace personnel...</div>;
  }

  return (
    <div className="p-8 text-white max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-400">Mon Espace Patient</h1>

      {/* 1. Section Informations Personnelles */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">Mes Informations</h2>
        <div className="grid grid-cols-2 gap-4 text-gray-300">
          <p><span className="text-gray-400">Téléphone :</span> {client.telephone}</p>
          <p><span className="text-gray-400">RAMQ :</span> {client.ramq}</p>
          <p><span className="text-gray-400">Date de naissance :</span> {new Date(client.date_naissance).toLocaleDateString()}</p>
          <p><span className="text-gray-400">Consentement :</span> {client.consentement_partage_donnees ? "Donné ✅" : "Refusé ❌"}</p>
        </div>
      </div>

      {/* 2. Section Rendez-vous & Consignes */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">Mes Prochains Rendez-vous</h2>
        {clientAppointments.length > 0 ? (
          <div className="space-y-4">
            {clientAppointments.map((rdv) => (
              <div key={rdv.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <p><span className="text-gray-400">Date et heure :</span> {new Date(rdv.heure_debut).toLocaleString()}</p>
                <p><span className="text-gray-400">Statut :</span> <span className="font-semibold text-yellow-400">{rdv.statut}</span></p>
                {rdv.consignes_specifiques && (
                  <div className="mt-2 p-3 bg-blue-950/50 border border-blue-800 rounded text-blue-200 text-sm">
                    <strong>Consignes du médecin :</strong> {rdv.consignes_specifiques}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Vous n'avez aucun rendez-vous planifié pour le moment.</p>
        )}
      </div>

      {/* 3. Section Documents & Convocation */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">Mes Documents & Convocation</h2>
        <ul className="space-y-2">
          <li className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
            <span>📄 Convocation officielle - Consultation</span>
            <button className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors">
              Télécharger
            </button>
          </li>
          <li className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
            <span>📋 Guide de préparation à l'examen</span>
            <button className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors">
              Télécharger
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ClientPortalPage;