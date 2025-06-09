import React from 'react';
import { Link } from 'react-router-dom';

const RecentActivity = ({ activities, loading = false }) => {
  const formatDate = (dateString) => {
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'MESSAGE_SENT':
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
        );
      case 'MESSAGE_RECEIVED':
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'LEAD_CREATED':
        return (
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        );
      case 'LEAD_CONVERTED':
        return (
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'LEAD_OPTED_OUT':
        return (
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'MESSAGE_SENT':
        return (
          <>
            Message sent to <Link to={`/leads/${activity.leadId}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">{activity.leadName}</Link>
          </>
        );
      case 'MESSAGE_RECEIVED':
        return (
          <>
            Message received from <Link to={`/leads/${activity.leadId}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">{activity.leadName}</Link>
          </>
        );
      case 'LEAD_CREATED':
        return (
          <>
            New lead created: <Link to={`/leads/${activity.leadId}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">{activity.leadName}</Link>
          </>
        );
      case 'LEAD_CONVERTED':
        return (
          <>
            Lead converted: <Link to={`/leads/${activity.leadId}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">{activity.leadName}</Link>
          </>
        );
      case 'LEAD_OPTED_OUT':
        return (
          <>
            Lead opted out: <Link to={`/leads/${activity.leadId}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">{activity.leadName}</Link>
          </>
        );
      default:
        return activity.description || 'Unknown activity';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities && activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4">
            {getActivityIcon(activity.type)}
            <div>
              <p className="text-sm">{getActivityDescription(activity)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          No recent activity to display.
        </p>
      )}
    </div>
  );
};

export default RecentActivity;
