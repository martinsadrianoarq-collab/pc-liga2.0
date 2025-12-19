import { Team, Match, TableRow, MatchStage } from '../types';

/**
 * Generates a standard league fixture list.
 */
export const generateFixtures = (teams: Team[], doubleRound: boolean = false): Match[] => {
  const matches: Match[] = [];
  const numberOfTeams = teams.length;
  const tempTeams = [...teams];
  const roundsPerLeg = numberOfTeams - 1;
  const matchesPerRound = numberOfTeams / 2;

  for (let round = 0; round < roundsPerLeg; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = tempTeams[match];
      const away = tempTeams[numberOfTeams - 1 - match];

      matches.push({
        id: `r${round + 1}-m${match + 1}`,
        round: round + 1,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: null,
        awayScore: null,
        played: false,
        stage: 'LEAGUE'
      });
    }
    tempTeams.splice(1, 0, tempTeams.pop()!);
  }

  if (doubleRound) {
    const firstLegMatches = [...matches];
    firstLegMatches.forEach(m => {
      matches.push({
        id: `r${m.round + roundsPerLeg}-${m.id.split('-')[1]}`,
        round: m.round + roundsPerLeg,
        homeTeamId: m.awayTeamId,
        awayTeamId: m.homeTeamId,
        homeScore: null,
        awayScore: null,
        played: false,
        stage: 'LEAGUE'
      });
    });
  }

  return matches.sort((a, b) => a.round - b.round);
};

/**
 * Generates fixtures for a Group Stage (Champions League style).
 */
export const generateGroupStage = (teams: Team[], groupCount: number, doubleRound: boolean): { matches: Match[], teamsWithGroups: Team[] } => {
  const shuffled = [...teams].sort(() => 0.5 - Math.random());
  const teamsPerGroup = Math.ceil(teams.length / groupCount);
  const matches: Match[] = [];
  const labeledTeams: Team[] = [];

  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  for (let g = 0; g < groupCount; g++) {
    const groupLabel = groupNames[g];
    const groupTeams = shuffled.slice(g * teamsPerGroup, (g + 1) * teamsPerGroup);
    
    // Assign group ID to teams
    groupTeams.forEach(t => labeledTeams.push({ ...t, groupId: groupLabel }));

    // Generate Round Robin for this group
    const groupFixtures = generateFixtures(groupTeams, doubleRound);
    
    groupFixtures.forEach(m => {
      m.id = `g${groupLabel}-${m.id}`;
      m.stage = 'GROUP_STAGE';
      m.groupId = groupLabel;
      matches.push(m);
    });
  }

  return { matches: matches.sort((a, b) => a.round - b.round), teamsWithGroups: labeledTeams };
};

/**
 * Generates initial knockout round (Random draw).
 */
export const generateKnockoutRound = (teams: Team[], stage: MatchStage, roundNumber: number, doubleLeg: boolean = false): Match[] => {
  const matches: Match[] = [];
  const shuffled = [...teams].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      const matchIdBase = `ko-${stage}-m${(i/2) + 1}`;
      
      // Leg 1
      matches.push({
        id: `${matchIdBase}-L1`,
        round: roundNumber,
        homeTeamId: shuffled[i].id,
        awayTeamId: shuffled[i+1].id,
        homeScore: null,
        awayScore: null,
        played: false,
        stage: stage,
        leg: doubleLeg ? 1 : undefined
      });

      // Leg 2 (Swap Home/Away)
      if (doubleLeg) {
        matches.push({
          id: `${matchIdBase}-L2`,
          round: roundNumber + 1,
          homeTeamId: shuffled[i+1].id,
          awayTeamId: shuffled[i].id,
          homeScore: null,
          awayScore: null,
          played: false,
          stage: stage,
          leg: 2,
          relatedMatchId: `${matchIdBase}-L1`
        });
      }
    }
  }
  return matches;
};

/**
 * Transition from Groups to Knockout
 */
export const generateBracketFromGroups = (
    teams: Team[], 
    matches: Match[], 
    advancingPerGroup: number,
    nextRoundNumber: number,
    doubleLegPlayoffs: boolean
): Match[] => {
    // 1. Calculate tables
    const allTables = calculateTable(teams, matches);
    const groupTables: Record<string, TableRow[]> = {};
    
    teams.forEach(t => {
        if (!t.groupId) return;
        if (!groupTables[t.groupId]) groupTables[t.groupId] = [];
        const row = allTables.find(r => r.teamId === t.id);
        if (row) groupTables[t.groupId].push(row);
    });

    // 2. Select qualifiers
    const qualifiers: { teamId: string, group: string, rank: number }[] = [];
    Object.keys(groupTables).sort().forEach(gId => {
        const sorted = groupTables[gId].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
        
        for(let i=0; i<advancingPerGroup; i++) {
            if(sorted[i]) {
                qualifiers.push({ teamId: sorted[i].teamId, group: gId, rank: i + 1 });
            }
        }
    });

    // 3. Create pairings
    const newMatches: Match[] = [];
    const numMatches = qualifiers.length / 2;
    
    let stage: MatchStage = 'R16';
    if (qualifiers.length === 8) stage = 'QUARTER_FINAL';
    if (qualifiers.length === 4) stage = 'SEMI_FINAL';
    if (qualifiers.length === 2) stage = 'FINAL';

    // Final is always single leg
    const isDoubleLeg = doubleLegPlayoffs && stage !== 'FINAL';

    for(let i=0; i<numMatches; i++) {
        // Pairing logic (Top vs Bottom)
        const home = qualifiers[i];
        const away = qualifiers[qualifiers.length - 1 - i];
        
        const matchIdBase = `ko-${stage}-m${i+1}`;

        // Leg 1
        newMatches.push({
            id: isDoubleLeg ? `${matchIdBase}-L1` : matchIdBase,
            round: nextRoundNumber,
            homeTeamId: home.teamId,
            awayTeamId: away.teamId,
            homeScore: null,
            awayScore: null,
            played: false,
            stage: stage,
            leg: isDoubleLeg ? 1 : undefined
        });

        // Leg 2
        if (isDoubleLeg) {
             newMatches.push({
                id: `${matchIdBase}-L2`,
                round: nextRoundNumber + 1,
                homeTeamId: away.teamId,
                awayTeamId: home.teamId,
                homeScore: null,
                awayScore: null,
                played: false,
                stage: stage,
                leg: 2,
                relatedMatchId: `${matchIdBase}-L1`
            });
        }
    }

    return newMatches;
}

/**
 * Generates the next round of knockout matches.
 */
export const generateNextKnockoutMatches = (
    prevStageMatches: Match[], 
    nextRoundNumber: number,
    doubleLegPlayoffs: boolean
): Match[] => {
  const winners: string[] = [];
  const processedMatchIds = new Set<string>();

  // Use the full list of matches from the stage (Leg 1 and Leg 2)
  const sortedMatches = [...prevStageMatches].sort((a,b) => a.id.localeCompare(b.id));

  sortedMatches.forEach(m => {
     if (processedMatchIds.has(m.id)) return;

     if (m.leg === 1) {
         // This is a Double Leg Tie. Find Leg 2.
         const leg2 = sortedMatches.find(m2 => m2.relatedMatchId === m.id || m2.id === m.relatedMatchId);
         
         if (leg2) {
             processedMatchIds.add(leg2.id);
             
             // Calculate Aggregate
             // Leg 1: Home(A) vs Away(B). Leg 2: Home(B) vs Away(A).
             // Team A goals = m.homeScore + leg2.awayScore
             // Team B goals = m.awayScore + leg2.homeScore
             const teamAGoals = (m.homeScore || 0) + (leg2.awayScore || 0);
             const teamBGoals = (m.awayScore || 0) + (leg2.homeScore || 0);

             if (teamAGoals > teamBGoals) winners.push(m.homeTeamId);
             else if (teamBGoals > teamAGoals) winners.push(m.awayTeamId);
             else {
                 // Tie? Check Penalties on Leg 2
                 if (leg2.penaltyWinnerId) winners.push(leg2.penaltyWinnerId);
                 else winners.push(m.homeTeamId); // Fallback should not happen if sim is correct
             }
         } else {
             // Fallback if Leg 2 is missing for some reason (shouldn't happen if logic is correct)
             winners.push((m.homeScore || 0) > (m.awayScore || 0) ? m.homeTeamId : m.awayTeamId);
         }
     } else if (!m.leg) {
         // Single Leg Match
         if (m.penaltyWinnerId) {
             winners.push(m.penaltyWinnerId);
         } else {
            winners.push((m.homeScore || 0) > (m.awayScore || 0) ? m.homeTeamId : m.awayTeamId);
         }
     }
  });

  const matches: Match[] = [];
  let stage: MatchStage = 'QUARTER_FINAL';
  if (winners.length === 4) stage = 'SEMI_FINAL';
  if (winners.length === 2) stage = 'FINAL';

  // Final is always single leg
  const isDoubleLeg = doubleLegPlayoffs && stage !== 'FINAL';

  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      const matchIdBase = `ko-${stage}-m${(i/2) + 1}`;
      
      matches.push({
        id: isDoubleLeg ? `${matchIdBase}-L1` : matchIdBase,
        round: nextRoundNumber,
        homeTeamId: winners[i],
        awayTeamId: winners[i+1],
        homeScore: null,
        awayScore: null,
        played: false,
        stage: stage,
        leg: isDoubleLeg ? 1 : undefined
      });

      if (isDoubleLeg) {
          matches.push({
            id: `${matchIdBase}-L2`,
            round: nextRoundNumber + 1,
            homeTeamId: winners[i+1],
            awayTeamId: winners[i],
            homeScore: null,
            awayScore: null,
            played: false,
            stage: stage,
            leg: 2,
            relatedMatchId: `${matchIdBase}-L1`
          });
      }
    }
  }
  
  return matches;
}

/**
 * Calculates tables. 
 */
export const calculateTable = (teams: Team[], matches: Match[]): TableRow[] => {
  const table: Record<string, TableRow> = {};

  teams.forEach((team) => {
    table[team.id] = {
      teamId: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    };
  });

  matches.forEach((match) => {
    const isTableMatch = match.stage === 'LEAGUE' || match.stage === 'GROUP_STAGE';

    if (match.played && match.homeScore !== null && match.awayScore !== null && isTableMatch) {
      const home = table[match.homeTeamId];
      const away = table[match.awayTeamId];

      if (!home || !away) return;

      home.played++;
      away.played++;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won++;
        home.points += 3;
        away.lost++;
        home.form.push('W');
        away.form.push('L');
      } else if (match.homeScore < match.awayScore) {
        away.won++;
        away.points += 3;
        home.lost++;
        away.form.push('W');
        home.form.push('L');
      } else {
        home.drawn++;
        home.points += 1;
        away.drawn++;
        away.points += 1;
        home.form.push('D');
        away.form.push('D');
      }
    }
  });

  Object.values(table).forEach((row) => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);
  });

  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
};