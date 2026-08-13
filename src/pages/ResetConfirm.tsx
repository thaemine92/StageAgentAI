import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const ResetConfirm = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get('token') || '';
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) return setError('Token manquant.');
    if (password.length < 6) return setError('Mot de passe trop court.');
    if (password !== confirm) return setError('Confirmation différente.');

    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.message || 'Erreur lors de la réinitialisation');
        return;
      }
      setMessage(result.message || 'Mot de passe réinitialisé.');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      setError('Impossible de contacter le serveur.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-blue-400">Choisir un nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-gray-400">Entrez votre nouveau mot de passe pour terminer la réinitialisation.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-gray-300">
            Nouveau mot de passe
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none" />
          </label>

          <label className="block text-sm text-gray-300">
            Confirmer le mot de passe
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none" />
          </label>

          {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {message && <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

          <button className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500">Valider</button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          <Link to="/" className="text-blue-400 hover:text-blue-300">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetConfirm;
