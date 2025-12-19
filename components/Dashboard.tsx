import React from 'react';
import { NewsItem, Team } from '../types';
import { Trophy, Newspaper, AlertCircle } from 'lucide-react';

interface DashboardProps {
  news: NewsItem[];
  leadingTeam?: Team;
}

const Dashboard: React.FC<DashboardProps> = ({ news, leadingTeam }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Card */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl p-6 border border-blue-700/50 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={120} />
          </div>
          <h3 className="text-blue-300 uppercase text-xs font-bold tracking-wider mb-1">Current Leader</h3>
          <div className="text-3xl font-black mb-2 relative z-10">
            {leadingTeam ? leadingTeam.name : "Season Start"}
          </div>
          <p className="text-sm text-blue-200 relative z-10">
            {leadingTeam 
              ? "Currently topping the table with excellent form." 
              : "Waiting for the first whistle of the season."}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
             <h3 className="text-gray-400 uppercase text-xs font-bold tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> Manager Tips
             </h3>
             <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                <li>Check the fixtures before simulating.</li>
                <li>Team strength heavily influences AI results.</li>
                <li>Use Gemini AI for realistic scores.</li>
             </ul>
        </div>
      </div>

      {/* News Feed */}
      <div className="md:col-span-2 bg-gray-800 rounded-xl border border-gray-700 shadow-lg flex flex-col h-[500px]">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900/50 rounded-t-xl">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Newspaper className="text-yellow-500" size={18} />
            LEAGUE NEWS
          </h3>
          <span className="text-xs text-gray-500">Live Updates</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {news.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No news yet. Simulate a round!</p>
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="bg-gray-700/40 p-4 rounded-lg border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Round {item.round}</span>
                    <span className="text-gray-500 text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-1">{item.headline}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{item.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;