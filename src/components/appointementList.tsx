const AppointmentList = () => {
  const appointments = [
    { time: "09:00", patient: "Alice Martin", reason: "Consultation générale" },
    { time: "10:30", patient: "Marc Dupont", reason: "Suivi post-opératoire" },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mt-6">
      <h3 className="text-gray-400 mb-4 font-medium">Rendez-vous à venir</h3>
      <div className="space-y-4">
        {appointments.map((app, index) => (
          <div key={index} className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
              <p className="font-bold">{app.patient}</p>
              <p className="text-sm text-gray-400">{app.reason}</p>
            </div>
            <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm">
              {app.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentList;