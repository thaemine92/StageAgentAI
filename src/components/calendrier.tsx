import Calendar from 'react-calendar';

const CalendarWidget = () => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg w-full">
      <h3 className="text-gray-400 mb-4 font-medium">Calendrier</h3>
      {/* On utilise une className au lieu de style */}
      <div className="custom-calendar-container">
        <Calendar className="my-calendar-override" />
      </div>
    </div>
  );
};

export default CalendarWidget;