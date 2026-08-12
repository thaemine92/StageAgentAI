import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MEDECIN' | 'CLIENT'>('CLIENT');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Appel de l'API backend pour la connexion (proxy vers /api en dev)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || 'Identifiants invalides');
        return;
      }

      // Stocker le token/utilisateur dans localStorage
      if (result.user) {
        localStorage.setItem('userToken', JSON.stringify(result.user));
      }

      // Redirection selon le rôle
      const redirectTo = role === 'MEDECIN' ? '/dashboard' : '/mon-espace';
      navigate(redirectTo);
      
    } catch (error) {
      alert('Erreur de connexion. Veuillez réessayer.');
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
      <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl border border-slate-800 w-96 space-y-4">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">Connexion à Doclinic</h1>
        
        {/* Sélecteur de rôle */}
        <div className="flex bg-slate-800 p-1 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'CLIENT' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('MEDECIN')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'MEDECIN' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Médecin
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Adresse email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder={role === 'MEDECIN' ? "docteur@doclinic.com" : "mon.email@client.com"}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Mot de passe</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded transition-colors"
        >
          Se connecter en tant que {role === 'MEDECIN' ? 'Médecin' : 'Patient'}
        </button>
      </form>
    </div>
  );
};

export default Login;