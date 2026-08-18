import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/authFrontend';
import { Client } from '../models/Clients';
import Sidebar from '../components/Sidebar';
import Header from '../components/header';

export const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' } | null>(null);

  // Récupérer les patients du médecin connecté
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          navigate('/');
          return;
        }

        // Si l'utilisateur est un médecin, récupérer ses patients
        // Pour l'instant, on utilise des mocks car la route API n'existe pas encore
        if (user.role === 'MEDECIN') {
          // Mock patients data
          const mockPatients = [
            {
              id: 'client-001',
              prenom: 'Alice',
              nom: 'Martin',
              email: 'alice.martin@email.com',
              telephone: '+1234567890',
              ramq: 'RAMQ001',
              date_naissance: '1985-05-15'
            },
            {
              id: 'client-002',
              prenom: 'Marc',
              nom: 'Dupont',
              email: 'marc.dupont@email.com',
              telephone: '+1987654321',
              ramq: 'RAMQ002',
              date_naissance: '1990-08-20'
            }
          ];
          setPatients(mockPatients);
        }
      } catch (err) {
        setError('Erreur lors du chargement des patients');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [navigate]);

  // Fonction de tri
  const sortPatients = (data: Client[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Gestion des valeurs potentielles undefined
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Comparaison des strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Comparaison des numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Comparaison des dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });
  };

  // Gestion de la recherche
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.prenom || ''} ${patient.nom || ''}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) ||
           (patient.email?.toLowerCase().includes(searchLower)) ||
           (patient.maladie?.toLowerCase().includes(searchLower)) ||
           (patient.traitement?.toLowerCase().includes(searchLower)) ||
           (patient.ramq?.toLowerCase().includes(searchLower));
  });

  const sortedPatients = sortPatients(filteredPatients);

  // Gestion du clic sur un patient
  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // Gestion du tri
  const requestSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Indicateur de direction de tri
  const getSortIndicator = (key: keyof Client) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Calcul de la classe pour le tri
  const getSortClass = (key: keyof Client) => {
    if (!sortConfig || sortConfig.key !== key) return '';
    return 'text-blue-400';
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
            <div className="animate-pulse text-xl">Chargement des patients...</div>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-400">Mes Patients</h1>
            <div className="text-sm text-gray-400">
              {patients.length} patient(s) trouvé(s)
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tableau des patients */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {sortedPatients.length > 0 ? (
              <table className="w-full">
                {/* En-tête du tableau */}
                <thead>
                  <tr className="border-b border-slate-700">
                    <th
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white ${getSortClass('nom')}`}
                      onClick={() => requestSort('nom')}
                    >
                      <div className="flex items-center gap-1">
                        Nom
                        <span className="text-xs">{getSortIndicator('nom')}</span>
                      </div>
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white ${getSortClass('prenom')}`}
                      onClick={() => requestSort('prenom')}
                    >
                      <div className="flex items-center gap-1">
                        Prénom
                        <span className="text-xs">{getSortIndicator('prenom')}</span>
                      </div>
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white ${getSortClass('age')}`}
                      onClick={() => requestSort('age')}
                    >
                      <div className="flex items-center gap-1">
                        Âge
                        <span className="text-xs">{getSortIndicator('age')}</span>
                      </div>
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white ${getSortClass('maladie')}`}
                      onClick={() => requestSort('maladie')}
                    >
                      <div className="flex items-center gap-1">
                        Maladie
                        <span className="text-xs">{getSortIndicator('maladie')}</span>
                      </div>
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white ${getSortClass('traitement')}`}
                      onClick={() => requestSort('traitement')}
                    >
                      <div className="flex items-center gap-1">
                        Traitement
                        <span className="text-xs">{getSortIndicator('traitement')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Corps du tableau */}
                <tbody className="divide-y divide-slate-700">
                  {sortedPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => handlePatientClick(patient.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {patient.nom || 'N/C'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {patient.prenom || 'N/C'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {patient.age || 'N/C'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {patient.maladie || 'Non spécifié'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {patient.traitement || 'Non spécifié'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {patient.telephone || 'N/C'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(patient.id);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-gray-400">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <p className="text-lg mb-2">Aucun patient trouvé</p>
                <p className="text-sm text-gray-500">
                  {searchTerm 
                    ? `Aucun patient ne correspond à "${searchTerm}"` 
                    : 'Vous n\'avez pas encore de patients attribués.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientsPage;
