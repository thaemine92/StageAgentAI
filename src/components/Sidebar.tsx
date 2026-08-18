import { useNavigate, Link } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { name: "Tableau de bord", icon: "🏠", path: "/dashboard" },
    { name: "Patients", icon: "👥", path: "/patients" },
    { name: "Mon Espace", icon: "👤", path: "/mon-espace" },
    { name: "Rendez-vous", icon: "📅", path: "/rendezvous" },
    { name: "Chat", icon: "💬", path: "/chat" },
    { name: "Documents", icon: "📁", path: "/documents" },
    { name: "Paramètres", icon: "⚙️", path: "/parametres" },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    // Supprimer le token de la session
    localStorage.removeItem('userToken');
    // Rediriger vers la page d'accueil
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="text-2xl font-bold text-blue-400 mb-10 px-4">Doctolib</div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.name} to={item.path} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white transition-all rounded-lg">
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-400 transition-colors">
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;