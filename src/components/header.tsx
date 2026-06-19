const Header = () => {
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
          <p className="text-sm font-bold">Johen Doe</p>
          <p className="text-xs text-gray-400">ADMIN</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          JD
        </div>
      </div>
    </header>
  );
};

export default Header;