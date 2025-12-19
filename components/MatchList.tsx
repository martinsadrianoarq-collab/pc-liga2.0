import React, { useState } from 'react';
import { Match, Team } from '../types';
import { Play, Loader2, CheckCircle2, X, Save } from 'lucide-react';

interface MatchListProps {
  roundNumber: number;
  matches: Match[];
  teams: Team[];
  onSimulate: () => void;
  onMatchUpdate: (matchId: string, homeScore: number, awayScore: number, penaltyWinnerId?: string) => void;
  isSimulating: boolean;
  totalRounds: number;
  onNextRound: () => void;
  onPrevRound: () => void;
}

const MatchList: React.FC<MatchListProps> = ({ 
  roundNumber, 
  matches, 
  teams, 
  onSimulate, 
  onMatchUpdate,
  isSimulating,
  totalRounds,
  onNextRound,
  onPrevRound
}) => {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const getTeam = (id: string) => teams.find(t => t.id === id);
  const isRoundComplete = matches.every(m => m.played);

  // Edit Modal Component
  const EditMatchModal = ({ match, onClose }: { match: Match; onClose: () => void }) => {
    const home = getTeam(match.homeTeamId);
    const away = getTeam(match.awayTeamId);
    const [hScore, setHScore] = useState<number>(match.homeScore ?? 0);
    const [aScore, setAScore] = useState<number>(match.awayScore ?? 0);
    const [penWinner, setPenWinner] = useState<string | undefined>(match.penaltyWinnerId);

    const isKnockout = match.stage !== 'LEAGUE' && match.stage !== 'GROUP_STAGE';
    const isSingleLeg = !match.leg; // Assuming single leg if leg is undefined
    const isDraw = hScore === aScore;
    const needsPenaltySelection = isKnockout && isDraw && isSingleLeg;

    const handleSave = () => {
        onMatchUpdate(match.id, hScore, aScore, needsPenaltySelection ? penWinner : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-600 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
                    <h3 className="text-white font-bold text-sm uppercase">Edit Match Result</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex flex-col items-center flex-1">
                            <div className="font-bold text-gray-200 text-center mb-2 text-sm h-10 flex items-center">{home?.name}</div>
                            <input 
                                type="number" 
                                min="0" 
                                value={hScore} 
                                onChange={(e) => setHScore(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 h-12 bg-gray-900 border border-gray-600 rounded text-center text-2xl font-mono text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="text-gray-500 font-mono text-xl pt-8">-</div>
                         <div className="flex flex-col items-center flex-1">
                            <div className="font-bold text-gray-200 text-center mb-2 text-sm h-10 flex items-center">{away?.name}</div>
                            <input 
                                type="number" 
                                min="0" 
                                value={aScore} 
                                onChange={(e) => setAScore(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 h-12 bg-gray-900 border border-gray-600 rounded text-center text-2xl font-mono text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {needsPenaltySelection && (
                        <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                             <label className="block text-xs text-yellow-500 uppercase font-bold mb-2 text-center">Tie Breaker: Penalty Winner</label>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => setPenWinner(home?.id)}
                                    className={`flex-1 py-2 text-xs rounded border ${penWinner === home?.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                                >
                                    {home?.name}
                                </button>
                                <button 
                                    onClick={() => setPenWinner(away?.id)}
                                    className={`flex-1 py-2 text-xs rounded border ${penWinner === away?.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                                >
                                    {away?.name}
                                </button>
                             </div>
                        </div>
                    )}

                    <button 
                        onClick={handleSave}
                        disabled={needsPenaltySelection && !penWinner}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Update Result
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-6 relative">
      {editingMatch && <EditMatchModal match={editingMatch} onClose={() => setEditingMatch(null)} />}

      {/* Header / Controls */}
      <div className="bg-gray-800 rounded-t-lg p-3 md:p-4 border-b border-gray-700 flex justify-between items-center shadow-lg sticky top-0 z-10">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={onPrevRound}
            disabled={roundNumber <= 1}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors text-gray-300"
          >
            ←
          </button>
          <div className="text-center">
            <h2 className="text-white font-bold text-sm md:text-lg whitespace-nowrap">ROUND {roundNumber}</h2>
          </div>
          <button 
            onClick={onNextRound}
            disabled={roundNumber >= totalRounds}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors text-gray-300"
          >
            →
          </button>
        </div>

        {/* Action Button */}
        <div>
            {!isRoundComplete ? (
                 <button
                 onClick={onSimulate}
                 disabled={isSimulating}
                 className={`
                   flex items-center space-x-2 px-3 py-2 md:px-5 md:py-2 rounded font-bold text-xs md:text-sm uppercase tracking-wide transition-all
                   ${isSimulating 
                     ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                     : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50 hover:shadow-green-900/80 active:translate-y-0.5'}
                 `}
               >
                 {isSimulating ? (
                   <>
                     <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" />
                     <span>Sim...</span>
                   </>
                 ) : (
                   <>
                     <Play className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                     <span>Simulate</span>
                   </>
                 )}
               </button>
            ) : (
                <div className="flex items-center space-x-2 text-green-400 px-3 py-1 bg-green-900/20 rounded border border-green-900">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] md:text-xs font-bold uppercase">Done</span>
                </div>
            )}
         
        </div>
      </div>

      {/* Matches */}
      <div className="bg-gray-800 rounded-b-lg shadow-xl border border-t-0 border-gray-700 divide-y divide-gray-700 min-h-[300px]">
        {matches.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No matches scheduled.</div>
        ) : (
            matches.map((match) => {
            const home = getTeam(match.homeTeamId);
            const away = getTeam(match.awayTeamId);

            return (
                <div 
                  key={match.id} 
                  onClick={() => setEditingMatch(match)}
                  className="group hover:bg-gray-700/30 transition-colors cursor-pointer relative"
                  title="Click to edit result"
                >
                  <div className="p-3 md:p-4 flex items-center justify-between gap-2 md:gap-4">
                      
                      {/* Home Team (Left) */}
                      <div className="flex-1 flex justify-end items-center space-x-2 md:space-x-3 text-right min-w-0">
                        <span className="font-semibold text-gray-200 text-sm md:text-base truncate hidden sm:block">
                          {home?.name}
                        </span>
                        <span className="font-semibold text-gray-200 text-xs sm:hidden truncate">
                          {home?.name.substring(0, 3).toUpperCase()}
                        </span>
                        <div 
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-gray-600 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-bold" 
                          style={{ backgroundColor: home?.primaryColor, color: home?.primaryColor === '#ffffff' ? 'black' : 'white' }}
                        >
                          {home?.name.charAt(0)}
                        </div>
                      </div>

                      {/* Scoreboard (Center) */}
                      <div className="flex-shrink-0 w-[100px] md:w-32 flex justify-center items-center">
                        {match.played ? (
                            <div className="bg-black/40 w-full text-center py-1 rounded border border-gray-600 font-mono text-lg md:text-xl font-bold text-white tracking-widest whitespace-nowrap overflow-hidden group-hover:border-blue-500/50 transition-colors">
                              {match.homeScore} - {match.awayScore}
                            </div>
                        ) : (
                            <div className="text-[10px] md:text-xs text-gray-500 font-mono bg-gray-900 px-3 py-1 rounded whitespace-nowrap group-hover:bg-gray-800 border border-transparent group-hover:border-gray-600 transition-colors">
                              VS
                            </div>
                        )}
                      </div>

                      {/* Away Team (Right) */}
                      <div className="flex-1 flex justify-start items-center space-x-2 md:space-x-3 text-left min-w-0">
                        <div 
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-gray-600 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-bold" 
                          style={{ backgroundColor: away?.primaryColor, color: away?.primaryColor === '#ffffff' ? 'black' : 'white' }}
                        >
                          {away?.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-200 text-sm md:text-base truncate hidden sm:block">
                          {away?.name}
                        </span>
                        <span className="font-semibold text-gray-200 text-xs sm:hidden truncate">
                          {away?.name.substring(0, 3).toUpperCase()}
                        </span>
                      </div>

                  </div>
                  {/* Commentary snippet */}
                  {match.played && match.commentary && (
                      <div className="px-4 pb-2 text-center border-t border-gray-700/30 pt-1">
                          <p className="text-[10px] text-gray-400 italic truncate max-w-[90%] mx-auto">"{match.commentary}"</p>
                      </div>
                  )}
                </div>
            );
            })
        )}
      </div>
    </div>
  );
};

export default MatchList;