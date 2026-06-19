// ══════════════════════ STANDINGS & STATS COMPUTATION ══════════════════════
import { CATEGORY_LABELS_SHORT, CATEGORY_COLORS } from './cardDatabase';

export function computeAllStandings(teams, groupResults) {
  const groups = {};
  Object.entries(teams).forEach(([name, info]) => {
    const g = info.group || 'A';
    if (!groups[g]) groups[g] = {};
    groups[g][name] = { team: name, group: g, pl:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 };
  });
  Object.entries(groupResults).forEach(([key, res]) => {
    const [g, ta, tb] = key.split('|');
    if (!groups[g]?.[ta] || !groups[g]?.[tb]) return;
    const A = groups[g][ta], B = groups[g][tb];
    const sa = +res.a, sb = +res.b;
    A.pl++; B.pl++; A.gf+=sa; A.ga+=sb; B.gf+=sb; B.ga+=sa;
    if (sa>sb){ A.w++;A.pts+=3;B.l++; }
    else if (sa<sb){ B.w++;B.pts+=3;A.l++; }
    else { A.d++;B.d++;A.pts++;B.pts++; }
  });
  Object.keys(groups).forEach(g => {
    groups[g] = Object.values(groups[g]).sort((x,y)=>
      y.pts-x.pts || (y.gf-y.ga)-(x.gf-x.ga) || y.gf-x.gf
    );
  });
  return groups;
}

export function computeTeamSummary(teamName, teams, groupResults) {
  const info = teams[teamName];
  if (!info) return null;
  const group = info.group || 'A';
  let pl=0,w=0,d=0,l=0,gf=0,ga=0,pts=0;
  const matchLog = [];
  Object.entries(groupResults).forEach(([key, res]) => {
    const [g, ta, tb] = key.split('|');
    if (g !== group) return;
    if (ta !== teamName && tb !== teamName) return;
    const isHome = ta === teamName;
    const opponent = isHome ? tb : ta;
    const myScore = isHome ? +res.a : +res.b;
    const oppScore = isHome ? +res.b : +res.a;
    pl++; gf+=myScore; ga+=oppScore;
    let result;
    if (myScore>oppScore){ w++;pts+=3;result='W'; }
    else if (myScore<oppScore){ l++;result='L'; }
    else { d++;pts++;result='D'; }
    matchLog.push({ opponent, myScore, oppScore, result });
  });
  const deck = info.deck || [];
  return {
    team:teamName, player:info.player||'', group,
    pl,w,d,l,gf,ga,pts,gd:gf-ga,
    winRate: pl>0 ? w/pl*100 : 0,
    deck, totalCards: deck.reduce((s,c)=>s+(c.qty||0),0),
    matchLog,
  };
}

export function computeCommunityStats(teams, groupResults) {
  const teamNames = Object.keys(teams);
  const standings = computeAllStandings(teams, groupResults);
  const allRows = Object.values(standings).flat();
  const totalMatches = Object.keys(groupResults).length;
  const totalCards = teamNames.reduce((s,t)=>s+(teams[t].deck||[]).reduce((ss,c)=>ss+(c.qty||0),0),0);
  const totalPrize = allRows.reduce((s,r)=>s+r.gf,0);

  const withWR = allRows.filter(r=>r.pl>0).map(r=>({...r,winRate:r.w/r.pl*100}));
  const winRateRanking = [...withWR].sort((a,b)=>b.winRate-a.winRate||b.pts-a.pts);
  const topScorers = [...allRows].filter(r=>r.pl>0).sort((a,b)=>b.gf-a.gf);
  const bestDefense = [...allRows].filter(r=>r.pl>0).sort((a,b)=>a.ga-b.ga);
  const mostPoints = [...allRows].sort((a,b)=>b.pts-a.pts);

  const cardUsage = {};
  teamNames.forEach(t => {
    (teams[t].deck||[]).forEach(c => {
      if (!cardUsage[c.name]) cardUsage[c.name]={name:c.name,category:c.category,teamCount:0,totalQty:0};
      cardUsage[c.name].teamCount++;
      cardUsage[c.name].totalQty+=(c.qty||0);
    });
  });
  const popularCards = Object.values(cardUsage).sort((a,b)=>b.teamCount-a.teamCount||b.totalQty-a.totalQty);

  const categoryTotals = {};
  teamNames.forEach(t => {
    (teams[t].deck||[]).forEach(c => {
      categoryTotals[c.category]=(categoryTotals[c.category]||0)+(c.qty||0);
    });
  });

  const completeDecks = teamNames.filter(t=>(teams[t].deck||[]).reduce((s,c)=>s+(c.qty||0),0)===60).length;

  return {
    teamCount:teamNames.length, groupCount:Object.keys(standings).length,
    totalMatches, totalCards, totalPrize, completeDecks,
    avgPerMatch: totalMatches>0 ? totalPrize/totalMatches : 0,
    winRateRanking, topScorers, bestDefense, mostPoints,
    popularCards, categoryTotals, standings,
  };
}
