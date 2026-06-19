import Sidebar from '../components/Sidebar';
import Header from '../components/header';
import CalendarWidget from '../components/calendrier';
import AppointmentList from '../components/appointementList';


const DashboardPage = () => {
  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      
      {/* Sidebar : Largeur fixe */}
      <div className="w-64 border-r border-slate-700">
        <Sidebar />
      </div>
      
      {/* Zone de contenu principale */}
      <main className="flex-1 p-6">
        <Header />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold">Dashboard médical</h1>
          <p className="text-gray-400">Bienvenue sur votre espace de gestion médicale.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
            
            <div className="lg:col-span-8">
              <AppointmentList />
            </div>

            <div className="lg:col-span-4">
              <CalendarWidget />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;