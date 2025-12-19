import React, { useState, useEffect, useMemo } from 'react';
import { 
  Team, 
  Match, 
  ViewState, 
  NewsItem,
  CompetitionConfig,
  SaveData
} from './types';
import { INITIAL_TEAMS } from './constants';
import { 
  generateFixtures, 
  generateGroupStage, 
  generateKnockoutRound,
  generateBracketFromGroups,
  generateNextKnockoutMatches,
  calculateTable
} from './services/leagueUtils';
import { simulateRoundWithGemini } from './services/geminiService';
import LeagueTable from './components/LeagueTable';
import MatchList from './components/MatchList';
import Dashboard from './components/Dashboard';
import SetupScreen from './components/SetupScreen';
import Logo from './components/Logo';
import { 
  LayoutDashboard, 
  ListOrdered, 
  CalendarDays, 
  RefreshCw,
  Save,
  Home,
  Menu,
  LogOut
} from 'lucide-react';

const STORAGE_KEY = 'ligasim_saves';

const App: React.FC = () => {
  // Config State
  const [config, setConfig] = useState<CompetitionConfig | null>(null);

  // League Data State
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  
  // UI State
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Derived State
  const table = useMemo(() => calculateTable(teams, matches), [teams, matches]);
  const currentMatches = useMemo(() => matches.filter(m => m.round === currentRound), [matches, currentRound]);
  
  // Determine if we are in Group Stage
  const isCupGroupStage = config?.type === 'CUP' && config.cupFormat === 'GROUP_KNOCKOUT' && matches.some(m => m.stage === 'GROUP_STAGE' && !m.played);
  const isCup = config?.type === 'CUP';

  // Calculate Total Rounds Logic
  const totalRounds = useMemo(() => {
      if (!config) return 0;
      if (matches.length === 0) return 0;
      return Math.max(...matches.map(m => m.round));
  }, [matches, config]);

  const leadingTeam = table.length > 0 ? teams.find(t => t.id === table[0].teamId) : undefined;

  // --- SAVE / LOAD SYSTEM ---

  const getSavedGames = (): SaveData[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  };

  const handleSaveGame = () => {
    if (!config) return;
    const saves = getSavedGames();
    const currentSave: SaveData = {
      config,
      teams,
      matches,
      news,
      currentRound,
      timestamp: Date.now()
    };

    // Update existing or add new
    const existingIndex = saves.findIndex(s => s.config.id === config.id);
    if (existingIndex >= 0) {
      saves[existingIndex] = currentSave;
    } else {
      saves.push(currentSave);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    setSaveMessage('Saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleLoadGame = () => {
    const saves = getSavedGames();
    if (saves.length === 0) return;
    // Load most recent for now (UI could be expanded to pick)
    const save = saves.sort((a,b) => b.timestamp - a.timestamp)[0];
    
    setConfig(save.config);
    setTeams(save.teams);
    setMatches(save.matches);
    setNews(save.news); // Keep as strings
    setCurrentRound(save.currentRound);
    setView(ViewState.NEWS); // Go to dashboard
  };

  // --- START GAME ---

  const startLeague = (newConfig: CompetitionConfig, selectedTeams: Team[]) => {
    const configWithId = { ...newConfig, id: `game-${Date.now()}` };
    setConfig(configWithId);
    setTeams(selectedTeams);
    setCurrentRound(1);
    
    let initialMatches: Match[] = [];
    
    if (configWithId.type === 'LEAGUE') {
      initialMatches = generateFixtures(selectedTeams, configWithId.doubleRound);
    } else if (configWithId.type === 'CUP') {
      if (configWithId.cupFormat === 'KNOCKOUT') {
         initialMatches = generateKnockoutRound(selectedTeams, 'R16', 1, configWithId.doubleRoundPlayoffs);
      } else {
         const { matches, teamsWithGroups } = generateGroupStage(selectedTeams, configWithId.groupCount, configWithId.doubleRound);
         initialMatches = matches;
         setTeams(teamsWithGroups); // Update teams with Group IDs
      }
    }

    setMatches(initialMatches);
    setNews([{
      id: 'init',
      round: 0,
      headline: `${newConfig.name} Begins!`,
      content: `Welcome to ${newConfig.name}. The ${newConfig.type.toLowerCase()} format is set. Let the games begin!`,
      timestamp: new Date().toISOString()
    }]);

    setView(ViewState.FIXTURES);
  };

  // --- SIMULATION & EDITING ---

  const handleUpdateMatch = (matchId: string, homeScore: number, awayScore: number, penaltyWinnerId?: string) => {
    setMatches(prevMatches => {
        const updated = prevMatches.map(m => {
            if (m.id !== matchId) return m;
            
            let commentary = m.commentary || "Result adjusted manually.";
            if (penaltyWinnerId) {
                const winnerName = teams.find(t => t.id === penaltyWinnerId)?.name || 'Unknown';
                commentary += ` (${winnerName} wins on penalties)`;
            }

            return {
                ...m,
                homeScore,
                awayScore,
                played: true,
                commentary,
                penaltyWinnerId
            };
        });
        
        checkStageTransition(updated);
        return updated;
    });
  };

  const checkStageTransition = (currentMatchesState: Match[]) => {
    if (!config) return;

    const roundMatches = currentMatchesState.filter(m => m.round === currentRound);
    const roundPlayed = roundMatches.every(m => m.played);

    if (roundPlayed) {
         if (config.type === 'CUP') {
            // A. Group Stage -> Knockout
            if (config.cupFormat === 'GROUP_KNOCKOUT' && roundMatches.some(m => m.stage === 'GROUP_STAGE')) {
                 const futureGroupMatches = currentMatchesState.filter(m => m.round > currentRound && m.stage === 'GROUP_STAGE');
                 if (futureGroupMatches.length === 0) {
                     const nextRound = currentRound + 1;
                     // Prevent duplicate generation if next round already exists
                     if (!currentMatchesState.some(m => m.round === nextRound)) {
                         const koMatches = generateBracketFromGroups(
                             teams, 
                             currentMatchesState, 
                             config.advancingPerGroup, 
                             nextRound, 
                             config.doubleRoundPlayoffs
                         );
                         setMatches([...currentMatchesState, ...koMatches]);
                         setNews(prev => [{
                            id: `ko-${Date.now()}`,
                            round: currentRound,
                            headline: "Knockout Stage Set!",
                            content: "The group stages have concluded. The draw for the knockout phase has been made.",
                            timestamp: new Date().toISOString()
                        }, ...prev]);
                     }
                 }
            }
            // B. Knockout Progression
            else if (roundMatches.some(m => m.stage !== 'LEAGUE' && m.stage !== 'GROUP_STAGE')) {
                const currentStage = roundMatches[0].stage;
                const isFinal = currentStage === 'FINAL';
                if (!isFinal) {
                     const remainingMatchesInStage = currentMatchesState.filter(m => m.stage === currentStage && !m.played);
                     if (remainingMatchesInStage.length === 0) {
                         const maxRound = Math.max(...currentMatchesState.map(m => m.round));
                         const nextRound = maxRound + 1;
                         // Prevent duplicates
                         if (!currentMatchesState.some(m => m.round === nextRound)) {
                             const nextMatches = generateNextKnockoutMatches(
                                 currentMatchesState.filter(m => m.stage === currentStage), 
                                 nextRound,
                                 config.doubleRoundPlayoffs
                             );
                             setMatches([...currentMatchesState, ...nextMatches]);
                         }
                     }
                }
            }
         }
    }
  };

  const handleSimulateRound = async () => {
    setIsSimulating(true);

    const result = await simulateRoundWithGemini(currentMatches, teams);
    let updatedMatches = [...matches];

    // 1. Process Simulation Results & Handle Penalties
    updatedMatches = updatedMatches.map(m => {
        // Skip if not in current round
        if (m.round !== currentRound) return m;

        // Get Simulated Result (or fallback)
        let homeScore = m.homeScore;
        let awayScore = m.awayScore;
        let commentary = m.commentary;
        
        if (result) {
            const aiRes = result.matches.find(r => r.id === m.id);
            if (aiRes) {
                homeScore = aiRes.homeScore;
                awayScore = aiRes.awayScore;
                commentary = aiRes.commentary;
            }
        } else if (!m.played) {
            // Fallback random
            homeScore = Math.floor(Math.random() * 4);
            awayScore = Math.floor(Math.random() * 3);
            commentary = "Simulated result.";
        }

        // Logic for Penalties (Knockout only)
        let penaltyWinnerId = undefined;
        let finalCommentary = commentary;

        // Is it a Knockout Match?
        if (m.stage !== 'LEAGUE' && m.stage !== 'GROUP_STAGE') {
            const isSingleLeg = !m.leg;
            const isSecondLeg = m.leg === 2;

            // Scenario A: Single Leg Draw -> Penalties
            if (isSingleLeg && homeScore === awayScore) {
                const homeWonPens = Math.random() > 0.5;
                penaltyWinnerId = homeWonPens ? m.homeTeamId : m.awayTeamId;
                const homePens = homeWonPens ? 5 : 4;
                const awayPens = homeWonPens ? 4 : 5;
                finalCommentary += ` (Penalties: ${homePens}-${awayPens})`;
            }

            // Scenario B: Second Leg Aggregate Draw -> Penalties
            if (isSecondLeg) {
                // Find Leg 1
                const leg1 = matches.find(l1 => l1.id === m.relatedMatchId || l1.relatedMatchId === m.id);
                if (leg1 && leg1.played) {
                    const aggHome = (leg1.homeScore || 0) + (awayScore || 0);
                    const aggAway = (leg1.awayScore || 0) + (homeScore || 0);
                    
                    const teamAGoals = aggHome;
                    const teamBGoals = aggAway;

                    if (teamAGoals === teamBGoals) {
                        const homeWonPens = Math.random() > 0.5;
                        penaltyWinnerId = homeWonPens ? m.homeTeamId : m.awayTeamId;
                        const homePens = homeWonPens ? 5 : 4;
                        const awayPens = homeWonPens ? 4 : 5;
                        finalCommentary += ` (Agg ${teamBGoals}-${teamAGoals}. Penalties: ${homePens}-${awayPens})`;
                    }
                }
            }
        }

        return {
            ...m,
            homeScore: homeScore,
            awayScore: awayScore,
            commentary: finalCommentary,
            played: true,
            penaltyWinnerId
        };
    });
    
    if (result) {
        setNews(prev => [{
            id: Date.now().toString(),
            round: currentRound,
            headline: result.news.headline,
            content: result.news.content,
            timestamp: new Date().toISOString()
        }, ...prev]);
    }

    setMatches(updatedMatches);
    checkStageTransition(updatedMatches); 

    setIsSimulating(false);
  };

  const goToNextRound = () => {
    const nextRoundHasMatches = matches.some(m => m.round === currentRound + 1);
    if (nextRoundHasMatches) {
      setCurrentRound(r => r + 1);
    }
  };
  const goToPrevRound = () => {
    if (currentRound > 1) setCurrentRound(r => r - 1);
  };

  // --- VIEWS ---

  if (view === ViewState.HOME) {
      return (
          // Use 100dvh for mobile viewport height to include browser bars correctly
          // overflow-y-auto ensures scrolling if content exceeds height (e.g. landscape mobile)
          <div className="min-h-[100dvh] bg-gray-900 flex flex-col items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700 text-center space-y-8 animate-in fade-in duration-700 my-auto">
                  <div className="space-y-4 flex flex-col items-center">
                      <Logo size={120} />
                  </div>

                  <div className="space-y-4">
                      <button 
                        onClick={() => setView(ViewState.SETUP)}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-transform active:scale-95 shadow-lg border-b-4 border-green-800"
                      >
                          NEW CAREER
                      </button>
                      <button 
                        onClick={handleLoadGame}
                        disabled={getSavedGames().length === 0}
                        className="w-full py-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold rounded-lg transition-transform active:scale-95 border-b-4 border-gray-900"
                      >
                          LOAD GAME ({getSavedGames().length})
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  if (view === ViewState.SETUP) {
    return <SetupScreen 
        onStart={startLeague} 
        onLoadGame={handleLoadGame} 
        onCancel={() => setView(ViewState.HOME)} 
        savedGamesCount={getSavedGames().length} 
    />;
  }

  const MobileNavButton = ({ v, icon: Icon, label }: { v: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => setView(v)}
      className={`flex flex-col items-center justify-center p-2 flex-1 min-w-0 ${view === v ? 'text-blue-400' : 'text-gray-500'}`}
    >
      <Icon size={20} />
      <span className="text-[9px] mt-0.5 truncate w-full text-center">{label}</span>
    </button>
  );

  return (
    // Main Container: Uses 100dvh to fix mobile scroll issues
    <div className="h-[100dvh] bg-gray-900 text-gray-100 flex flex-col md:flex-row font-inter overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-800 flex flex-col items-center cursor-pointer hover:bg-gray-800/50 transition-colors" onClick={() => setView(ViewState.HOME)}>
           <Logo size={64} showText={false} />
           <h1 className="font-['Press_Start_2P'] text-yellow-500 text-lg mt-3 text-center leading-tight">
            PC LIGA<br/><span className="text-white text-xs">2.0</span>
          </h1>
          {config && <div className="mt-2 text-xs text-gray-500 font-mono uppercase truncate w-full text-center">{config.name}</div>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[{v: ViewState.NEWS, i: LayoutDashboard, l: 'Dashboard'}, {v: ViewState.FIXTURES, i: CalendarDays, l: 'Fixtures'}, {v: ViewState.TABLE, i: ListOrdered, l: 'Table'}].map(item => (
            <button
              key={item.l}
              onClick={() => setView(item.v)}
              className={`
                flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all duration-200
                ${view === item.v 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
              `}
            >
              <item.i size={20} />
              <span className="font-medium tracking-wide">{item.l}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
           <button 
            onClick={handleSaveGame}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors text-sm"
          >
            <Save size={14} /> {saveMessage || "Save Game"}
          </button>
          <button 
            onClick={() => setView(ViewState.HOME)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-900/50 text-red-400 rounded hover:bg-red-900/20 hover:text-red-300 transition-colors text-sm"
          >
            <Home size={14} /> Main Menu
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* 
          Mobile: h-[calc(100dvh-60px)] calculates height minus bottom nav. 
          overflow-y-auto enables internal scrolling.
          pb-24 ensures extra padding at bottom so content isn't hidden by nav.
      */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-[calc(100dvh-60px)] md:h-screen pb-24 md:pb-12 scroll-smooth">
        <header className="mb-6 md:mb-8 flex justify-between items-end">
          <div>
             <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
               {view === ViewState.TABLE && (isCupGroupStage ? 'Group Standings' : isCup ? 'Tournament' : 'League Standings')}
               {view === ViewState.FIXTURES && (isCup ? 'Cup Fixtures' : 'Match Schedule')}
               {view === ViewState.NEWS && 'Manager Dashboard'}
               {isCup && <span className="bg-yellow-500 text-black text-[10px] md:text-xs px-2 py-1 rounded font-bold uppercase ml-2">Cup Mode</span>}
             </h2>
             <p className="text-gray-500 text-xs md:text-sm">
               Round {currentRound} 
               {isCupGroupStage ? ' (Group Stage)' : ''}
               {!isCupGroupStage && isCup ? ' (Knockout)' : ''}
             </p>
          </div>
          <div className="bg-gray-800 px-3 py-1 md:px-4 md:py-2 rounded-full border border-gray-700 text-[10px] md:text-xs text-gray-400 font-mono hidden md:block">
            v2.0.0
          </div>
        </header>

        <div className="max-w-5xl mx-auto">
          {view === ViewState.TABLE && config && (
            <LeagueTable 
                table={table} 
                teams={teams} 
                config={config} 
                matches={matches} 
            />
          )}

          {view === ViewState.FIXTURES && (
             <MatchList 
              roundNumber={currentRound}
              matches={currentMatches}
              teams={teams}
              onSimulate={handleSimulateRound}
              onMatchUpdate={handleUpdateMatch}
              isSimulating={isSimulating}
              totalRounds={totalRounds}
              onNextRound={goToNextRound}
              onPrevRound={goToPrevRound}
            />
          )}

          {view === ViewState.NEWS && (
            <Dashboard news={news} leadingTeam={leadingTeam} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 flex justify-between p-1 z-50 safe-area-bottom h-[60px]">
         <MobileNavButton v={ViewState.NEWS} icon={LayoutDashboard} label="Home" />
         <MobileNavButton v={ViewState.FIXTURES} icon={CalendarDays} label="Matches" />
         <MobileNavButton v={ViewState.TABLE} icon={ListOrdered} label="Table" />
         <button onClick={handleSaveGame} className="flex flex-col items-center justify-center p-2 flex-1 min-w-0 text-gray-500 active:text-blue-400">
             <Save size={20} />
             <span className="text-[9px] mt-0.5">{saveMessage || "Save"}</span>
         </button>
         <button onClick={() => setView(ViewState.HOME)} className="flex flex-col items-center justify-center p-2 flex-1 min-w-0 text-red-500 active:text-red-300">
             <LogOut size={20} />
             <span className="text-[9px] mt-0.5">Exit</span>
         </button>
      </div>

    </div>
  );
};

export default App;