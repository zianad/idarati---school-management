import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgColor = 'bg-blue-500' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-500 dark:text-gray-400 uppercase">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`text-white rounded-xl p-4 ${iconBgColor} shadow-lg`}>
            {icon}
          </div>
      </div>
    </div>
  );
};

export default StatCard;