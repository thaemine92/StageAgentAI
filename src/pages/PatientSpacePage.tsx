import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/authFrontend';
import { Client } from '../models/Clients';
import { RendezVous } from '../models/RendezVous';
import Sidebar from '../components/Sidebar';
import Header from '../components/header';

export const PatientSpacePage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profil' | 'rdv' | 'historique'>('profil');

  // Récupérer les informations du patient connecté
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          navigate('/');
          return;
        }

        // Si l'utilisateur est un patient, récupérer ses infos et RDV
        if (user.role === 'CLIENT') {
          // Utiliser les infos de l'utilisateur connecté
          setUserInfo(user as any);
          
          // Récupérer les rendez-vous du patient via l'API
          const response = await fetch(`/api/appointments/client/${user.id}`);
          if (!response.ok) {
            throw new Error('Erreur lors du chargement des rendez-vous');
          }
          const data = await response.json();
          
          // Convertir les dates en objets Date
          let patientAppointments = (data.appointments || []).map((app: any) => ({
            ...app,
            heure_debut: app.heure_debut instanceof Date ? app.heure_debut : new Date(app.heure_debut)
          }));
          
          setAppointments(patientAppointments);
        }
      } catch (err) {
        setError('Erreur lors du chargement de vos informations');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Calcul de l'âge à partir de la date de naissance
  const calculateAge = (dateNaissance?: Date): number | null => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Formatage de la date
  const formatDate = (date?: Date): string => {
    if (!date) return 'N/C';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formatage de l'heure
  const formatTime = (date?: Date): string => {
    if (!date) return 'N/C';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Tri des rendez-vous par date
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = a.heure_debut instanceof Date ? a.heure_debut : new Date(a.heure_debut);
    const dateB = b.heure_debut instanceof Date ? b.heure_debut : new Date(b.heure_debut);
    const timeA = dateA.getTime();
    const timeB = dateB.getTime();
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;
    return timeA - timeB;
  });

  // Filtrer les rendez-vous futurs et passés
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingAppointments = sortedAppointments.filter(app => {
    const date = new Date(app.heure_debut);
    return !isNaN(date.getTime()) && date >= today;
  });
  
  const pastAppointments = sortedAppointments.filter(app => {
    const date = new Date(app.heure_debut);
    return !isNaN(date.getTime()) && date < today;
  });

  // Gestion du clic sur un rendez-vous
  const handleAppointmentClick = (appointmentId: string) => {
    navigate(`/rendezvous/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-900 text-white">
        <div className="w-64 border-r border-slate-700">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <Header />
          <div className="mt-8 text-center">
            <div className="animate-pulse text-xl">Chargement de vos informations...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-900 text-white">
        <div className="w-64 border-r border-slate-700">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <Header />
          <div className="mt-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex min-h-screen bg-slate-900 text-white">
        <div className="w-64 border-r border-slate-700">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <Header />
          <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200">
            Vos informations de profil ne sont pas disponibles.
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

      {/* Zone de contenu principale */}
      <main className="flex-1 p-6">
        <Header />

        {/* En-tête de la page */}
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-6">Mon Espace Patient</h1>

          {/* Onglets */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('profil')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profil' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Mon Profil
            </button>
            <button
              onClick={() => setActiveTab('rdv')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'rdv' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Mes Rendez-vous ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'historique' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Historique ({pastAppointments.length})
            </button>
          </div>

          {/* Contenu selon l'onglet */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            {activeTab === 'profil' && (
              <div className="space-y-6">
                {/* Section Informations personnelles */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Informations Personnelles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Identité</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Nom :</span>
                          <span className="ml-2 text-white">{userInfo.nom || 'Non spécifié'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Prénom :</span>
                          <span className="ml-2 text-white">{userInfo.prenom || 'Non spécifié'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Âge :</span>
                          <span className="ml-2 text-white">{calculateAge(userInfo.date_naissance) || userInfo.age || 'Non spécifié'} ans</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Date de naissance :</span>
                          <span className="ml-2 text-white">{formatDate(userInfo.date_naissance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Email :</span>
                          <span className="ml-2 text-white">{userInfo.email || 'Non spécifié'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Téléphone :</span>
                          <span className="ml-2 text-white">{userInfo.telephone || 'Non spécifié'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Informations Médicales</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Maladie :</span>
                          <span className="ml-2 text-white">{userInfo.maladie || 'Non spécifié'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Traitement :</span>
                          <span className="ml-2 text-white">{userInfo.traitement || 'Non spécifié'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Antécédents :</span>
                          <span className="ml-2 text-white">{userInfo.antecedents_medicaux || 'Non spécifié'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Allergies :</span>
                          <span className="ml-2 text-white">{userInfo.allergies || 'Aucune'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">RAMQ :</span>
                          <span className="ml-2 text-white">{userInfo.ramq || 'Non spécifié'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton pour modifier le profil */}
                <div className="pt-4">
                  <button
                    onClick={() => navigate('/modifier-profil')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Modifier mon profil
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'rdv' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Mes Prochains Rendez-vous</h2>
                
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={() => handleAppointmentClick(appointment.id)}
                        className="bg-slate-700/50 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-white">{appointment.consignes_specifiques}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            appointment.Urgence ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {appointment.statut}
                            {appointment.Urgence && ' - URGENT'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(appointment.heure_debut)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(appointment.heure_debut)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{appointment.nom_patient}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto mb-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-lg mb-2">Aucun rendez-vous à venir</p>
                    <p className="text-sm text-gray-500">
                      Vous n'avez pas de rendez-vous programmé pour le moment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'historique' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Historique des Rendez-vous</h2>
                
                {pastAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {pastAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={() => handleAppointmentClick(appointment.id)}
                        className="bg-slate-700/50 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600 opacity-70"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-white">{appointment.consignes_specifiques}</h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300">
                            Terminé
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(appointment.heure_debut)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(appointment.heure_debut)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{appointment.nom_patient}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto mb-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    <p className="text-lg mb-2">Aucun historique de rendez-vous</p>
                    <p className="text-sm text-gray-500">
                      Vous n'avez pas encore de rendez-vous terminés.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientSpacePage;
