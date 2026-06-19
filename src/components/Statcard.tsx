//src/components/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string;
  percentage: number;
}

const StatCard = ({ title, value, percentage }: StatCardProps) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-lg">
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <p className="text-white text-xl font-bold">{value}</p>
      <div className="w-full bg-slate-700 h-2 mt-2 rounded">
        <div 
          className="bg-green-500 h-2 rounded" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatCard;