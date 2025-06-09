import React from 'react';

const StatCard = ({ title, value, icon, change, changeType = 'neutral', loading = false }) => {
  const getChangeColor = () => {
    if (loading) return 'text-gray-400 dark:text-gray-500';
    
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = () => {
    if (loading) return null;
    
    switch (changeType) {
      case 'positive':
        return '↑';
      case 'negative':
        return '↓';
      default:
        return '';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
          ) : (
            <p className="text-2xl font-semibold mt-1">{value}</p>
          )}
          {change !== undefined && (
            <p className={`text-sm mt-2 ${getChangeColor()}`}>
              {getChangeIcon()} {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
