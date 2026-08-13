import { useState } from 'react';
import { Link } from 'react-router-dom';

const ResetRequest = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.message || 'Erreur lors de la demande');
        return;
      }
      setMessage(result.message || 'Si le compte existe, un email a été envoyé.');
    } catch (err) {
      console.error(err);
      setError('Impossible de contacter le serveur.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-blue-400">Réinitialiser le mot de passe</h1>
        <p className="mt-2 text-sm text-gray-400">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-gray-300">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none" />
          </label>

          {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {message && <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

          <button className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500">Envoyer le lien</button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          <Link to="/" className="text-blue-400 hover:text-blue-300">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetRequest;
