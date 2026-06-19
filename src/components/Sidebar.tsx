import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { name: "Tableau de bord", icon: "🏠" },
    { name: "Patients", icon: "👥" },
    { name: "Rendez-vous", icon: "📅" },
    { name: "Documents", icon: "📁" },
    { name: "Paramètres", icon: "⚙️" },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/'); // Retour à la page de connexion
  };

  return (
    <div className="h-full flex flex-col">
      <div className="text-2xl font-bold text-blue-400 mb-10 px-4">Doclinic</div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white transition-all rounded-lg"
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </a>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700">
        <button 
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;