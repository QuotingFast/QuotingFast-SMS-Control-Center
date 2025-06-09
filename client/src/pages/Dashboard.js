import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
// Dashboard components
import StatCard from '../components/dashboard/StatCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import LeadTable from '../components/dashboard/LeadTable';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch overview data
        const overviewResponse = await axios.get('/api/dashboard/overview');
        setOverviewData(overviewResponse.data);

        // Fetch activity data
        const activityResponse = await axios.get('/api/dashboard/activity');
        setActivityData(activityResponse.data);

        // Fetch conversion data
        const conversionResponse = await axios.get('/api/dashboard/conversions');
        setConversionData(conversionResponse.data);

        // Fetch recent leads
        const leadsResponse = await axios.get('/api/leads?limit=5&sort=createdAt:desc');
        setRecentLeads(leadsResponse.data.leads);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate last 7 days for chart labels
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    return format(subDays(new Date(), i), 'MMM dd');
  }).reverse();

  // Default data for charts if API data is not yet loaded
  const defaultChartData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Messages Sent',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
      }
    ]
  };

  // Format activity data for chart
  const activityChartData = activityData ? {
    labels: activityData.dates,
    datasets: [
      {
        label: 'Messages Sent',
        data: activityData.sent,
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
      },
      {
        label: 'Responses',
        data: activityData.received,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
      {
        label: 'Opt-outs',
        data: activityData.optouts,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      }
    ]
  } : defaultChartData;

  // Format lead status data for pie chart
  const leadStatusChartData = overviewData ? {
    labels: ['Active', 'Converted', 'Opted Out', 'Inactive'],
    datasets: [
      {
        data: [
          overviewData.activeLeadsCount,
          overviewData.convertedLeadsCount,
          overviewData.optedOutLeadsCount,
          overviewData.inactiveLeadsCount
        ],
        backgroundColor: [
          'rgba(14, 165, 233, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(100, 116, 139, 0.7)'
        ],
        borderColor: [
          'rgb(14, 165, 233)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(100, 116, 139)'
        ],
        borderWidth: 1,
      },
    ],
  } : {
    labels: ['Active', 'Converted', 'Opted Out', 'Inactive'],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['rgba(14, 165, 233, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(100, 116, 139, 0.7)'] }]
  };

  // Format conversion data for bar chart
  const conversionChartData = conversionData ? {
    labels: conversionData.days,
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: conversionData.rates,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      }
    ]
  } : {
    labels: last7Days,
    datasets: [{ label: 'Conversion Rate (%)', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: 'rgba(34, 197, 94, 0.7)' }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          className="mt-2 btn btn-danger"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Leads" 
          value={overviewData?.totalLeadsCount || 0} 
          change={overviewData?.leadGrowthRate || 0} 
          icon="users"
          color="primary"
        />
        <StatCard 
          title="Active Leads" 
          value={overviewData?.activeLeadsCount || 0} 
          change={overviewData?.activeLeadChangeRate || 0} 
          icon="active"
          color="success"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${overviewData?.conversionRate || 0}%`} 
          change={overviewData?.conversionRateChange || 0} 
          icon="conversion"
          color="warning"
        />
        <StatCard 
          title="Opt-out Rate" 
          value={`${overviewData?.optOutRate || 0}%`} 
          change={overviewData?.optOutRateChange || 0} 
          icon="optout"
          color="danger"
          reverseColors={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Activity Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Message Activity</h2>
          <div className="h-80">
            <Line 
              data={activityChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.1)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Lead Status Breakdown</h2>
          <div className="h-80 flex items-center justify-center">
            <div className="w-3/4 h-3/4">
              <Pie 
                data={leadStatusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Conversion Rate Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Conversion Rate by Day</h2>
          <div className="h-80">
            <Bar 
              data={conversionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.1)'
                    },
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <RecentActivity />
        </div>
      </div>

      {/* Recent Leads */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Leads</h2>
          <a href="/leads" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
            View All
          </a>
        </div>
        <LeadTable leads={recentLeads} />
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-4">
        <a 
          href="/api/dashboard/export/leads" 
          className="btn btn-secondary"
          download
        >
          Export Leads
        </a>
        <a 
          href="/api/dashboard/export/messages" 
          className="btn btn-secondary"
          download
        >
          Export Messages
        </a>
        <a 
          href="/api/dashboard/export/conversions" 
          className="btn btn-secondary"
          download
        >
          Export Conversions
        </a>
      </div>
    </div>
  );
};

export default Dashboard;
