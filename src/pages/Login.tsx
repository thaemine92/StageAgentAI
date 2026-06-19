import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === 'admin@doclinic.com' && password === '123456') {
      navigate('/dashboard');
    } else {
      setError('Email ou mot de passe incorrect.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Connexion</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Message d'erreur si la connexion échoue */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@doclinic.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;