const Header = () => {
  const user = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('userToken') || 'null') 
    : null;

  const getInitials = () => {
    if (user?.nom) {
      return user.nom.split(' ').map((n: string) => n[0].toUpperCase()).join('').slice(0, 2);
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'UD';
  };

  const getDisplayName = () => {
    return user?.nom || user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'MEDECIN': return 'Médecin';
      case 'CLIENT': return 'Patient';
      default: return 'Invité';
    }
  };

  return (
    <header className="flex justify-between items-center mb-8">
      {/* Barre de recherche */}
      <div className="relative w-96">
        <input 
          type="text" 
          placeholder="Rechercher..." 
          className="w-full bg-slate-800 text-white rounded-lg py-2 px-4 outline-none border border-slate-700 focus:border-blue-500"
        />
      </div>

      {/* Profil utilisateur */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-bold">{getDisplayName()}</p>
          <p className="text-xs text-gray-400">{getRoleLabel()}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          {getInitials()}
        </div>
      </div>
    </header>
  );
};

export default Header;