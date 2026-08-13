import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState<'CLIENT' | 'MEDECIN'>('CLIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Veuillez saisir votre nom et prénom.');
      return;
    }

    if (!email.trim()) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    const additionalData: Record<string, unknown> =
      role === 'MEDECIN'
        ? { nom_entite: `${firstName.trim()} ${lastName.trim()}` }
        : { prenom: firstName.trim(), nom: lastName.trim() };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          ...additionalData,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.message || 'Erreur lors de l’inscription.');
        return;
      }

      if (result.user) {
        localStorage.setItem('userToken', JSON.stringify(result.user));
      }

      setSuccess('Inscription réussie ! Redirection en cours...');
      setTimeout(() => {
        navigate(role === 'MEDECIN' ? '/dashboard' : '/mon-espace');
      }, 800);
    } catch (err) {
      console.error(err);
      setError('Impossible de créer le compte. Veuillez réessayer.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-blue-400">Créer un compte</h1>
        <p className="mt-2 text-sm text-gray-400">
          Inscrivez-vous pour gérer vos rendez-vous en toute simplicité.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              role === 'CLIENT' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('MEDECIN')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              role === 'MEDECIN' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Médecin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-gray-300">
              Prénom
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
            <label className="block text-sm text-gray-300">
              Nom
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
          </div>

          <label className="block text-sm text-gray-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </label>

          <label className="block text-sm text-gray-300">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </label>

          <label className="block text-sm text-gray-300">
            Confirmation du mot de passe
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </label>

          {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {success && <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Vous avez déjà un compte ?{' '}
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
