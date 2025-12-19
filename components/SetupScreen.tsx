import React, { useState, useEffect } from 'react';
import { Team, CompetitionConfig, CompetitionType, CupFormat } from '../types';
import { Settings, Users, Trophy, Shield, RefreshCcw, ArrowUpCircle, ArrowDownCircle, Grid, PlayCircle, Users2, LogOut } from 'lucide-react';

interface SetupScreenProps {
  onStart: (config: CompetitionConfig, teams: Team[]) => void;
  onLoadGame: () => void;
  onCancel: () => void;
  savedGamesCount: number;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
  '#000000', '#ffffff', '#64748b'
];

const DEFAULT_TEAMS_POOL = [
  "Rio FC", "São Paulo Utd", "Minas Athletic", "Porto City", "Salvador Sun", 
  "Curitiba Green", "Fortaleza Lions", "Recife Sharks", "Brasília Capital", "Santos Beach",
  "Manaus Forest", "Belém Stars", "Goiânia Gold", "Natal Dunes", "Floripa Waves",
  "Vitória Kings", "Maceió Reefs", "Aracaju Palms", "João Pessoa Sun", "Teresina Heat",
  "Cuiabá Gold", "Macapá River", "Palmas Sun", "Boa Vista North", "Rio Branco Stars",
  "London Blues", "Manchester Red", "Liverpool Port", "Madrid Royal", "Barcelona Stripes"
];

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, onLoadGame, onCancel, savedGamesCount }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'teams'>('general');
  
  const [config, setConfig] = useState<CompetitionConfig>({
    id: '',
    name: 'LigaSim 2000',
    type: 'LEAGUE',
    teamCount: 16,
    doubleRound: true,
    qualificationSpots: 4,
    relegationSpots: 3,
    cupFormat: 'GROUP_KNOCKOUT',
    groupCount: 4,
    advancingPerGroup: 2,
    doubleRoundPlayoffs: false
  });

  const [teams, setTeams] = useState<Team[]>(
    Array.from({ length: 16 }).map((_, i) => ({
      id: `t${i+1}`,
      name: DEFAULT_TEAMS_POOL[i % DEFAULT_TEAMS_POOL.length],
      strength: Math.floor(Math.random() * 30) + 65, 
      primaryColor: PRESET_COLORS[i % PRESET_COLORS.length]
    }))
  );

  // Auto-adjust logic
  useEffect(() => {
    // Ensure league spots valid
    if (config.type === 'LEAGUE') {
       if (config.qualificationSpots + config.relegationSpots > config.teamCount) {
         setConfig(prev => ({
           ...prev,
           qualificationSpots: Math.max(1, Math.floor(prev.teamCount / 4)),
           relegationSpots: Math.max(1, Math.floor(prev.teamCount / 5))
         }));
       }
    }
    // Ensure cup group logic valid
    if (config.type === 'CUP' && config.cupFormat === 'GROUP_KNOCKOUT') {
        const teamsPerGroup = Math.floor(config.teamCount / config.groupCount);
        // Ensure teamsPerGroup is at least 3 for a proper group stage
        if (teamsPerGroup < 3) {
             // If manual slider for team count drags too low, adjust logical defaults or warn
             // But here we might just rely on the specific controls logic below to keep it safe
        }
        
        if (config.advancingPerGroup >= teamsPerGroup) {
            setConfig(prev => ({...prev, advancingPerGroup: Math.max(1, teamsPerGroup - 1)}));
        }
    }
  }, [config.teamCount, config.groupCount, config.cupFormat, config.type]);

  const handleTeamCountChange = (count: number) => {
    setConfig(prev => ({ ...prev, teamCount: count }));
    updateTeamsArray(count);
  };

  const updateTeamsArray = (count: number) => {
    setTeams(prev => {
      if (count > prev.length) {
        const newTeams = [...prev];
        for (let i = prev.length; i < count; i++) {
          newTeams.push({
            id: `t${Date.now()}-${i}`,
            name: DEFAULT_TEAMS_POOL[i % DEFAULT_TEAMS_POOL.length] || `Team ${i+1}`,
            strength: 70,
            primaryColor: PRESET_COLORS[i % PRESET_COLORS.length]
          });
        }
        return newTeams;
      } else {
        return prev.slice(0, count);
      }
    });
  }

  const handleGroupSettingsChange = (groups: number, teamsPerGroup: number) => {
      const newTeamCount = groups * teamsPerGroup;
      setConfig(prev => ({
          ...prev,
          groupCount: groups,
          teamCount: newTeamCount
      }));
      updateTeamsArray(newTeamCount);
  };

  const updateTeam = (index: number, field: keyof Team, value: any) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], [field]: value };
    setTeams(newTeams);
  };

  const randomizeTeams = () => {
    setTeams(prev => prev.map((t, i) => ({
      ...t,
      name: DEFAULT_TEAMS_POOL[Math.floor(Math.random() * DEFAULT_TEAMS_POOL.length)],
      strength: Math.floor(Math.random() * 40) + 55,
      primaryColor: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    })));
  };

  const isGroupMode = config.type === 'CUP' && config.cupFormat === 'GROUP_KNOCKOUT';
  const teamsPerGroup = isGroupMode ? Math.floor(config.teamCount / config.groupCount) : 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 border-b border-gray-700 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-['Press_Start_2P']">
            <Settings className="text-blue-500" /> NEW GAME
          </h1>
          <div className="flex space-x-2">
             <button 
               onClick={() => setActiveTab('general')}
               className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
             >
               Settings
             </button>
             <button 
               onClick={() => setActiveTab('teams')}
               className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'teams' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
             >
               Teams ({teams.length})
             </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'general' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Name */}
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Competition Name</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => setConfig({...config, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Type Selection */}
              <div>
                 <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Format</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setConfig({...config, type: 'LEAGUE'})}
                      className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${config.type === 'LEAGUE' ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800 hover:bg-gray-750'}`}
                    >
                      <Trophy size={32} className={config.type === 'LEAGUE' ? 'text-green-500' : 'text-gray-500'} />
                      <span className="font-bold text-white">League</span>
                    </button>
                    <button 
                      onClick={() => setConfig({...config, type: 'CUP'})}
                      className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${config.type === 'CUP' ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-800 hover:bg-gray-750'}`}
                    >
                      <Shield size={32} className={config.type === 'CUP' ? 'text-yellow-500' : 'text-gray-500'} />
                      <span className="font-bold text-white">Cup</span>
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team Count (Hidden if Group Mode overrides it) */}
                <div className={isGroupMode ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">
                      Teams: {config.teamCount}
                      {isGroupMode && <span className="text-[10px] ml-2 text-yellow-500">(Controlled by Group Settings)</span>}
                  </label>
                  <input 
                    type="range" 
                    min={config.type === 'CUP' ? "8" : "4"} 
                    max="32" 
                    step={config.type === 'CUP' ? "4" : "2"}
                    value={config.teamCount} 
                    onChange={(e) => handleTeamCountChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    disabled={isGroupMode}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>min</span>
                    <span>max</span>
                  </div>
                </div>

                {/* Specific Rules Container */}
                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                   <label className="block text-gray-400 text-xs font-bold mb-3 uppercase border-b border-gray-700 pb-2">
                       {config.type} Rules
                   </label>

                   {config.type === 'LEAGUE' ? (
                     <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <input 
                            type="checkbox" 
                            checked={config.doubleRound} 
                            onChange={(e) => setConfig({...config, doubleRound: e.target.checked})}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-500 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                            <span className="text-white text-sm block font-medium">Double Round Robin</span>
                            </div>
                        </div>

                        {/* Zone Sliders */}
                         <div className="space-y-2">
                             <div className="flex justify-between items-center text-xs">
                                <span className="text-green-400 font-bold flex items-center gap-1"><ArrowUpCircle size={12}/> Champions Zone</span>
                                <span className="text-white bg-gray-700 px-2 py-0.5 rounded">{config.qualificationSpots}</span>
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max={config.teamCount - config.relegationSpots} 
                                value={config.qualificationSpots} 
                                onChange={(e) => setConfig({...config, qualificationSpots: parseInt(e.target.value)})}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                             />

                             <div className="flex justify-between items-center text-xs pt-1">
                                <span className="text-red-400 font-bold flex items-center gap-1"><ArrowDownCircle size={12}/> Drop Zone</span>
                                <span className="text-white bg-gray-700 px-2 py-0.5 rounded">{config.relegationSpots}</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max={config.teamCount - config.qualificationSpots} 
                                value={config.relegationSpots} 
                                onChange={(e) => setConfig({...config, relegationSpots: parseInt(e.target.value)})}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                             />
                        </div>
                     </div>
                   ) : (
                    /* CUP SETTINGS */
                    <div className="space-y-4">
                        <div className="flex gap-2 text-xs mb-3">
                            <button 
                                onClick={() => setConfig({...config, cupFormat: 'KNOCKOUT'})}
                                className={`flex-1 py-1 rounded ${config.cupFormat === 'KNOCKOUT' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                            >Straight Knockout</button>
                            <button 
                                onClick={() => setConfig({...config, cupFormat: 'GROUP_KNOCKOUT'})}
                                className={`flex-1 py-1 rounded ${config.cupFormat === 'GROUP_KNOCKOUT' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                            >Groups + KO</button>
                        </div>

                        {config.cupFormat === 'GROUP_KNOCKOUT' && (
                            <div className="space-y-4 pt-2">
                                {/* Double Round Checkbox for Cup Groups */}
                                <div className="flex items-center space-x-3 pb-2 border-b border-gray-700">
                                    <input 
                                        type="checkbox" 
                                        checked={config.doubleRound} 
                                        onChange={(e) => setConfig({...config, doubleRound: e.target.checked})}
                                        className="w-4 h-4 rounded bg-gray-700 border-gray-500 text-yellow-600 focus:ring-yellow-500"
                                    />
                                    <div>
                                        <span className="text-gray-300 text-xs block font-medium">Group Stage: Home & Away</span>
                                    </div>
                                </div>

                                {/* Number of Groups */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-300 flex items-center gap-1"><Grid size={12}/> Number of Groups</span>
                                        <span className="text-yellow-500 font-bold">{config.groupCount}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[2, 4, 8].map(gVal => (
                                            <button
                                                key={gVal}
                                                onClick={() => handleGroupSettingsChange(gVal, teamsPerGroup)}
                                                className={`flex-1 py-1 text-xs rounded border ${config.groupCount === gVal ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                {gVal}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Teams Per Group */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-300 flex items-center gap-1"><Users2 size={12}/> Teams per Group</span>
                                        <span className="text-yellow-500 font-bold">{teamsPerGroup}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="3" max="6" step="1"
                                        value={teamsPerGroup}
                                        onChange={(e) => handleGroupSettingsChange(config.groupCount, parseInt(e.target.value))}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                    />
                                     <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>3</span>
                                        <span>6</span>
                                    </div>
                                </div>

                                {/* Advancing */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-300 flex items-center gap-1"><PlayCircle size={12}/> Advance per Group</span>
                                        <span className="text-yellow-500 font-bold">{config.advancingPerGroup}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" max={Math.max(1, teamsPerGroup - 1)}
                                        value={config.advancingPerGroup}
                                        onChange={(e) => setConfig({...config, advancingPerGroup: parseInt(e.target.value)})}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                    />
                                    <div className="text-[10px] text-gray-500 mt-1 text-right">
                                        {config.groupCount * config.advancingPerGroup} teams reach knockout
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Playoff Configuration (Available for both modes) */}
                        <div className="pt-2 border-t border-gray-700">
                             <div className="flex items-center space-x-3">
                                <input 
                                    type="checkbox" 
                                    checked={config.doubleRoundPlayoffs} 
                                    onChange={(e) => setConfig({...config, doubleRoundPlayoffs: e.target.checked})}
                                    className="w-4 h-4 rounded bg-gray-700 border-gray-500 text-red-500 focus:ring-red-500"
                                />
                                <div>
                                    <span className="text-gray-300 text-xs block font-medium">Playoffs: Home & Away</span>
                                    <span className="text-gray-500 text-[10px] block">Agg. ties decided by penalties. Final is single leg.</span>
                                </div>
                            </div>
                        </div>

                        {config.cupFormat === 'KNOCKOUT' && (
                            <div className="text-xs text-gray-500 italic text-center p-2">
                                Simple elimination bracket.
                            </div>
                        )}
                    </div>
                   )}
                </div>
              </div>

            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">Edit Teams</h3>
                <button 
                  onClick={randomizeTeams}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <RefreshCcw size={12} /> Randomize All
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-[400px]">
                {teams.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-700">
                    <span className="text-gray-500 w-6 font-mono text-sm">{idx + 1}.</span>
                    <input 
                      type="color" 
                      value={team.primaryColor}
                      onChange={(e) => updateTeam(idx, 'primaryColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                    />
                    <input 
                      type="text" 
                      value={team.name}
                      onChange={(e) => updateTeam(idx, 'name', e.target.value)}
                      className="flex-1 bg-transparent border-b border-gray-700 focus:border-blue-500 text-white text-sm py-1 outline-none"
                    />
                    <input 
                         type="number" 
                         value={team.strength}
                         onChange={(e) => updateTeam(idx, 'strength', parseInt(e.target.value))}
                         className="w-16 bg-transparent text-right text-blue-400 font-mono text-sm outline-none"
                       />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-900 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 font-bold text-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
          >
             <LogOut size={16} /> EXIT
          </button>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <button
                onClick={onLoadGame}
                className="text-gray-400 hover:text-white text-sm underline"
            >
                Load Saved Game ({savedGamesCount})
            </button>
            <button 
                onClick={() => onStart(config, teams)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
            >
                START SEASON <Users size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;