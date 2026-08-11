import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/header';
import Chatbot from '../components/Chatbot';

const ChatPage = () => {
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient');
  const [userId, setUserId] = useState<string>('user1');

  // Récupérer le rôle de l'utilisateur depuis le contexte ou localStorage
  useEffect(() => {
    // TODO: Récupérer depuis le contexte d'authentification
    const storedRole = localStorage.getItem('userRole') as 'patient' | 'doctor' | null;
    const storedUserId = localStorage.getItem('userId');
    
    if (storedRole) {
      setUserRole(storedRole);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-700">
        <Sidebar />
      </div>

      {/* Zone de contenu principale */}
      <main className="flex-1 p-6">
        <Header />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold">Assistant IA Conversationnel</h1>
          <p className="text-gray-400">
            Discutez avec notre assistant pour gérer vos rendez-vous médicaux.
          </p>
          
          {/* Sélecteur de rôle (pour démo) */}
          <div className="mt-6 flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="role-patient"
                name="role"
                value="patient"
                checked={userRole === 'patient'}
                onChange={() => setUserRole('patient')}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <label htmlFor="role-patient" className="text-sm text-gray-300">
                Mode Patient
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="role-doctor"
                name="role"
                value="doctor"
                checked={userRole === 'doctor'}
                onChange={() => setUserRole('doctor')}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <label htmlFor="role-doctor" className="text-sm text-gray-300">
                Mode Médecin
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Comment utiliser l'assistant :</h3>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
              <li>Dites "Bonjour" pour commencer une conversation.</li>
              <li>Pour prendre un RDV : "Je veux un rendez-vous le [date] à [heure]".</li>
              <li>Pour voir vos RDV : "Quels sont mes rendez-vous aujourd'hui ?".</li>
              <li>Pour vérifier les disponibilités : "Quels créneaux avez-vous demain ?".</li>
            </ul>
          </div>

          {/* Zone de chat intégrée */}
          <div className="mt-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-[600px]">
              <Chatbot userRole={userRole} userId={userId} />
            </div>
          </div>
        </div>
      </main>

      {/* Chatbot flottant (optionnel) */}
      <Chatbot userRole={userRole} userId={userId} />
    </div>
  );
};

export default ChatPage;
