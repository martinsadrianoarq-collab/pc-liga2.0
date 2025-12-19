import React from 'react';
import { TableRow, Team, CompetitionConfig, Match } from '../types';

interface LeagueTableProps {
  table: TableRow[]; // Contains ALL rows (need to filter for groups)
  teams: Team[];
  config?: CompetitionConfig;
  matches?: Match[];
}

interface BracketMatchProps {
  match: Match;
  matches: Match[];
  teams: Team[];
}

const BracketMatch: React.FC<BracketMatchProps> = ({ match, matches, teams }) => {
     const isDoubleLeg = match.leg === 1; // Only render leg 1 as the container for double leg pair
     const leg2 = matches.find(m => m.id === match.relatedMatchId || m.relatedMatchId === match.id && m.leg === 2);
     
     // Determine display scores
     const home = teams.find(t => t.id === match.homeTeamId);
     const away = teams.find(t => t.id === match.awayTeamId);
     
     let scoreText = "VS";
     let subText = "";

     if (match.played) {
         if (leg2 && leg2.played) {
             // Double Leg Complete
             const aggHome = (match.homeScore || 0) + (leg2.awayScore || 0); // Leg 1 Home is Team A
             const aggAway = (match.awayScore || 0) + (leg2.homeScore || 0); // Leg 1 Away is Team B
             scoreText = `${aggHome} - ${aggAway}`;
             subText = `(L1: ${match.homeScore}-${match.awayScore}, L2: ${leg2.homeScore}-${leg2.awayScore})`;
             if (leg2.penaltyWinnerId) subText += " Pens";
         } else if (leg2) {
             // Leg 1 Played, Leg 2 Pending
             scoreText = `${match.homeScore} - ${match.awayScore}`;
             subText = "(Leg 1)";
         } else {
             // Single Leg Played
             scoreText = `${match.homeScore} - ${match.awayScore}`;
             if (match.penaltyWinnerId) subText = "Won on Pens";
         }
     }

     return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 mb-2 min-w-[200px] md:min-w-[220px] shadow-sm relative group hover:border-gray-500 transition-colors">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700/50 pb-1">
                <span className="font-bold text-xs md:text-sm text-white truncate max-w-[120px]" title={home?.name}>{home?.name}</span>
                {match.played && !leg2 && <span className="font-mono text-yellow-400 font-bold bg-black/30 px-2 rounded text-xs">{match.homeScore}</span>}
            </div>
            <div className="flex justify-between items-center">
                <span className="font-bold text-xs md:text-sm text-white truncate max-w-[120px]" title={away?.name}>{away?.name}</span>
                {match.played && !leg2 && <span className="font-mono text-yellow-400 font-bold bg-black/30 px-2 rounded text-xs">{match.awayScore}</span>}
            </div>
            
            {(leg2 || match.penaltyWinnerId) && (
                <div className="mt-2 text-center pt-2 border-t border-gray-700">
                    <div className="text-yellow-400 font-mono font-bold tracking-widest bg-black/20 rounded py-0.5 text-xs">{scoreText}</div>
                    <div className="text-[9px] md:text-[10px] text-gray-400 mt-1 truncate">{subText}</div>
                </div>
            )}
        </div>
     );
};

const LeagueTable: React.FC<LeagueTableProps> = ({ table, teams, config, matches = [] }) => {
  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || 'Unknown';
  const getTeamColor = (id: string) => teams.find(t => t.id === id)?.primaryColor || '#gray-500';

  if (!table || table.length === 0) {
     return <div className="text-gray-500 p-8 text-center bg-gray-800 rounded">No matches played yet.</div>;
  }

  // Helper to render a single table
  const RenderTable: React.FC<{ rows: TableRow[], title?: string, showLegend?: boolean }> = ({ rows, title, showLegend }) => (
    <div className="w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 mb-6">
      <div className="bg-gray-900 px-4 py-3 md:px-6 md:py-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-sm md:text-xl font-bold text-white tracking-wider flex items-center gap-2">
          {title ? title : <><span className="text-green-500 text-lg md:text-2xl">⚡</span> LEAGUE TABLE</>}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[350px] md:min-w-0">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-wider">
              <th className="px-2 md:px-4 py-2 border-b border-gray-700 text-center w-8">#</th>
              <th className="px-2 md:px-4 py-2 border-b border-gray-700 w-1/3">Team</th>
              <th className="px-1 md:px-2 py-2 border-b border-gray-700 text-center">P</th>
              <th className="px-1 md:px-2 py-2 border-b border-gray-700 text-center hidden sm:table-cell">W</th>
              <th className="px-1 md:px-2 py-2 border-b border-gray-700 text-center hidden sm:table-cell">D</th>
              <th className="px-1 md:px-2 py-2 border-b border-gray-700 text-center hidden sm:table-cell">L</th>
              <th className="px-1 md:px-2 py-2 border-b border-gray-700 text-center">GD</th>
              <th className="px-2 md:px-4 py-2 border-b border-gray-700 text-center font-extrabold text-white">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {rows.map((row, index) => {
              // Logic for highlighting based on type
              let isQualified = false;
              let isRelegated = false;

              if (config?.type === 'LEAGUE') {
                  isQualified = index < (config.qualificationSpots || 4);
                  isRelegated = index >= rows.length - (config.relegationSpots || 2);
              } else if (config?.type === 'CUP' && config.cupFormat === 'GROUP_KNOCKOUT') {
                  isQualified = index < (config.advancingPerGroup || 2);
              }

              return (
                <tr 
                  key={row.teamId} 
                  className={`
                    hover:bg-gray-700/50 transition-colors cursor-pointer
                    ${isQualified ? 'bg-green-900/10' : ''}
                    ${isRelegated ? 'bg-red-900/10' : ''}
                  `}
                >
                  <td className={`px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-mono ${isQualified ? 'text-green-400' : isRelegated ? 'text-red-400' : 'text-gray-400'}`}>
                    {index + 1}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="h-2 w-2 rounded-full mr-2 hidden md:block" 
                        style={{ backgroundColor: getTeamColor(row.teamId) }}
                      ></div>
                      <span 
                        className={`font-semibold text-xs md:text-sm truncate max-w-[120px] md:max-w-none ${index===0 ? 'text-yellow-400' : 'text-gray-200'}`}
                        style={{ borderLeft: `3px solid ${getTeamColor(row.teamId)}`, paddingLeft: '6px' }}
                      >
                        {getTeamName(row.teamId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm text-gray-300">{row.played}</td>
                  <td className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm text-gray-500 hidden sm:table-cell">{row.won}</td>
                  <td className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm text-gray-500 hidden sm:table-cell">{row.drawn}</td>
                  <td className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm text-gray-500 hidden sm:table-cell">{row.lost}</td>
                  <td className={`px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm font-medium ${row.goalDifference > 0 ? 'text-green-400' : row.goalDifference < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {row.goalDifference}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-center text-sm md:text-base font-bold text-white bg-gray-800/30">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {showLegend && config?.type === 'LEAGUE' && (
        <div className="px-4 md:px-6 py-2 bg-gray-900 border-t border-gray-700 flex flex-wrap text-[10px] md:text-xs text-gray-500 gap-4">
            <div className="flex items-center"><div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div> Promotion/Champ</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div> Relegation</div>
        </div>
      )}
       {showLegend && config?.type === 'CUP' && (
        <div className="px-4 md:px-6 py-2 bg-gray-900 border-t border-gray-700 flex text-[10px] md:text-xs text-gray-500 gap-4">
            <div className="flex items-center"><div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div> Advances</div>
        </div>
      )}
    </div>
  );

  // 1. Regular League
  if (config?.type === 'LEAGUE') {
      return <RenderTable rows={table} showLegend={true} />;
  }

  // 2. Cup Group Stage
  if (config?.type === 'CUP' && config.cupFormat === 'GROUP_KNOCKOUT') {
      // Check if we are in knockout phase (if any KO matches exist)
      const hasKOMatches = matches.some(m => m.stage !== 'GROUP_STAGE' && m.stage !== 'LEAGUE');
      
      // Group rows by groupId
      const groups: Record<string, TableRow[]> = {};
      teams.forEach(t => {
          if (t.groupId) {
              if (!groups[t.groupId]) groups[t.groupId] = [];
              const row = table.find(r => r.teamId === t.id);
              if (row) groups[t.groupId].push(row);
          }
      });
      
      const groupKeys = Object.keys(groups).sort();

      // Group Tables Rendering (Unified Grid: Stacked on mobile, 2 cols on desktop)
      const GroupsRender = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupKeys.map(key => (
                <RenderTable 
                key={key} 
                rows={groups[key].sort((a,b) => b.points - a.points || b.goalDifference - a.goalDifference)} 
                title={`GROUP ${key}`} 
                showLegend={key === groupKeys[groupKeys.length-1]}
                />
            ))}
        </div>
      );

      // If we have KO matches, show Bracket AND Groups
      const allGroupMatchesPlayed = matches.filter(m => m.stage === 'GROUP_STAGE').every(m => m.played);

      if (hasKOMatches && allGroupMatchesPlayed) {
          // Render Bracket
          const rounds = ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
          if (teams.length >= 16) rounds.unshift('R16');
          
          return (
             <div className="space-y-8">
                 <div className="bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-700">
                     <h2 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="text-yellow-500">🏆</span> PLAYOFFS</h2>
                     <div className="overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex gap-4 md:gap-8 min-w-max px-2">
                            {rounds.map(stage => {
                                const stageMatches = matches.filter(m => m.stage === stage && (m.leg === 1 || !m.leg));
                                if (stageMatches.length === 0) return null;

                                return (
                                    <div key={stage} className="flex flex-col justify-around gap-4 min-w-[200px] md:min-w-[220px]">
                                        <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase text-center border-b border-gray-700 pb-2 mb-2">{stage.replace('_', ' ')}</h3>
                                        {stageMatches.map(m => <BracketMatch key={m.id} match={m} matches={matches} teams={teams} />)}
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                 </div>
                 
                 <h3 className="text-gray-500 font-bold uppercase text-xs md:text-sm mt-8 mb-4 border-b border-gray-800 pb-2">Group Stage Results</h3>
                 {GroupsRender}
             </div>
          );
      }

      return GroupsRender;
  }

  // Straight Knockout (No Groups)
   if (config?.type === 'CUP' && config.cupFormat === 'KNOCKOUT') {
      const rounds = ['R16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
      
      return (
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-700">
            <h2 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="text-yellow-500">🏆</span> TOURNAMENT BRACKET</h2>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 md:gap-8 min-w-max px-2">
                {rounds.map(stage => {
                    const stageMatches = matches.filter(m => m.stage === stage && (m.leg === 1 || !m.leg));
                    if (stageMatches.length === 0) return null;

                    return (
                        <div key={stage} className="flex flex-col justify-around gap-4 min-w-[200px] md:min-w-[220px]">
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase text-center border-b border-gray-700 pb-2 mb-2">{stage.replace('_', ' ')}</h3>
                            {stageMatches.map(m => <BracketMatch key={m.id} match={m} matches={matches} teams={teams} />)}
                        </div>
                    )
                })}
                </div>
            </div>
        </div>
      );
  }

  return <div className="text-center p-8 text-gray-500">Tournament in Knockout Phase.</div>;
};

export default LeagueTable;