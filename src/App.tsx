import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, FastForward, Activity, BrainCircuit, Shield, 
  Zap, Target, Eye, Flame, ChevronRight, AlertCircle, Wifi, WifiOff, Maximize, Minimize
} from 'lucide-react';

// --- CONSTANTS & CONFIGURATION ---

// 🔴 LIVE API CONFIGURATION 🔴
// Get a free API key from https://cricapi.com/
const CRICKET_API_KEY = ""; 
const CRICKET_API_URL = `https://api.cricapi.com/v1/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`;

const AGENT_PROFILES = [
  { id: 'dhoni', name: 'MS Dhoni', role: 'Finisher & Captain', icon: Eye, color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
  { id: 'kohli', name: 'Virat Kohli', role: 'Chase Master', icon: Zap, color: 'text-rose-500', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  { id: 'rohit', name: 'Rohit Sharma', role: 'Tactical Flow', icon: BrainCircuit, color: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/10' },
  { id: 'bumrah', name: 'Jasprit Bumrah', role: 'Pace Surgeon', icon: Target, color: 'text-cyan-400', border: 'border-cyan-400/30', bg: 'bg-cyan-400/10' },
  { id: 'dravid', name: 'Rahul Dravid', role: 'Anchor & Architect', icon: Shield, color: 'text-indigo-400', border: 'border-indigo-400/30', bg: 'bg-indigo-400/10' },
  { id: 'ponting', name: 'Ricky Ponting', role: 'Aggressor', icon: Flame, color: 'text-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
];

const INITIAL_MATCH_STATE = {
  teamA: 'MI',
  teamB: 'RR',
  target: 206,
  runs: 38,
  wickets: 4,
  balls: 32, // 5.2 overs
  toss: 'MI won toss, elected to bowl',
  venue: 'Wankhede Stadium, Mumbai',
  extras: 3,
  partnership: { runs: 14, balls: 11 },
  batters: [
    { name: 'Will Jacks', runs: 12, balls: 8, fours: 2, sixes: 0, striker: true },
    { name: 'Suryakumar Yadav', runs: 8, balls: 5, fours: 2, sixes: 0, striker: false }
  ],
  bowler: { name: 'Brijesh Sharma', overs: '0.2', runs: 2, wickets: 0, maidens: 0 },
  lastEvent: 'Brijesh Sharma into the attack. MI are 38/4, crumbling under pressure after Jofra Archer took 2 early wickets.',
  history: [
    { ball: 32, runs: 0, wicket: false, desc: "Sharma starts with a dot. Will Jacks watchful." },
    { ball: 31, runs: 0, wicket: true, desc: "OUT! Vaibhav Sooryavanshi takes a maiden IPL catch. MI 4 down!" },
    { ball: 25, runs: 0, wicket: true, desc: "OUT! Naman Dhir is gone! Archer is on fire." }
  ]
};

// --- REAL-TIME API FETCH ENGINE ---

async function fetchLiveMatchFromAPI() {
  if (!CRICKET_API_KEY) {
    throw new Error("Missing API Key. Switch to Sim Mode or add key.");
  }

  try {
    const response = await fetch(CRICKET_API_URL);
    if (!response.ok) throw new Error("API Network Error");
    
    const data = await response.json();
    if (data.status !== "success" || !data.data || data.data.length === 0) {
      throw new Error("No live matches found or API limit reached.");
    }

    // Find the most relevant live match (prefer T20/IPL if available)
    const liveMatch = data.data.find(m => m.matchStarted && !m.matchEnded) || data.data[0];
    
    // Parse CricAPI data into our standardized state format
    // Note: CricAPI free tier provides basic scoreboards. We mock deep stats (like specific batters) 
    // if the API doesn't provide them in the free payload, while keeping team scores 100% real.
    const currentScore = liveMatch.score && liveMatch.score.length > 0 
      ? liveMatch.score[liveMatch.score.length - 1] 
      : { r: 0, w: 0, o: 0 };

    return {
      teamA: liveMatch.teams[0],
      teamB: liveMatch.teams[1],
      target: currentScore.inning === "Inning 2" && liveMatch.score.length > 1 ? liveMatch.score[0].r + 1 : "1st Inn",
      runs: currentScore.r || 0,
      wickets: currentScore.w || 0,
      balls: Math.floor((currentScore.o || 0) * 6) + Math.round(((currentScore.o || 0) % 1) * 10),
      toss: liveMatch.tossWinner ? `${liveMatch.tossWinner} won toss, elected to ${liveMatch.tossChoice}` : "Toss info unavailable",
      venue: liveMatch.venue || "Live Stadium",
      extras: Math.floor(Math.random() * 5), // Deep stat fallback
      partnership: { runs: Math.floor(Math.random() * 20), balls: Math.floor(Math.random() * 15) },
      batters: [
        { name: 'Striker', runs: Math.floor(currentScore.r / 2.5), balls: Math.floor((currentScore.o*6) / 2.5), fours: 2, sixes: 1, striker: true },
        { name: 'Non-Striker', runs: Math.floor(currentScore.r / 3), balls: Math.floor((currentScore.o*6) / 3), fours: 1, sixes: 0, striker: false }
      ],
      bowler: { name: 'Live Bowler', overs: '0.0', runs: 0, wickets: 0, maidens: 0 },
      lastEvent: liveMatch.status, // Uses the API's status update as the event
      history: [
        { ball: 1, runs: 0, wicket: false, desc: "Live match data synced via API." }
      ]
    };
  } catch (error) {
    console.error("Live API Fetch Failed:", error);
    throw error;
  }
}

// --- AI LOGIC (GEMINI) ---

async function fetchAgentReactions(matchState) {
  const apiKey = ""; // Canvas auto-injects
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const overs = Math.floor(matchState.balls / 6) + '.' + (matchState.balls % 6);
  const needed = matchState.target - matchState.runs;
  const ballsRemaining = 120 - matchState.balls;
  const currentStriker = matchState.batters.find(b => b.striker)?.name || 'Unknown';

  const prompt = `
    You are the reasoning engine for a live cricket tactical war room.
    Analyze this exact LIVE MATCH STATE:
    Score: ${matchState.runs}/${matchState.wickets}
    Overs: ${overs}
    Target: ${matchState.target} (Need ${needed} runs off ${ballsRemaining} balls)
    Batter on strike: ${currentStriker}
    Bowler: ${matchState.bowler.name}
    Event just happened: ${matchState.lastEvent}

    Simulate the immediate tactical reaction of these 6 legendary cricket minds:
    1. MS Dhoni (calm, calculated, take game deep)
    2. Virat Kohli (intense, aggressive strike rotation, intent)
    3. Rohit Sharma (instinctive field reading, finding gaps)
    4. Jasprit Bumrah (bowling strategy, yorkers, surgical pressure)
    5. Rahul Dravid (composed, minimize risk, build partnership)
    6. Ricky Ponting (fearless, dominating, attack the bowler)

    Provide a short, punchy, real-time tactical response for each.
    ALSO, calculate the exact real-time win probability (%) for both teams based on this situation and identify the current momentum.
  `;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: "You are a real-time multi-agent cricket intelligence system. Respond strictly in the required JSON schema representing 6 distinct cricket personalities and the match prediction." }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          prediction: {
            type: "OBJECT",
            properties: {
              battingTeamProb: { type: "INTEGER", description: "Win probability percentage for the batting team (0-100)" },
              bowlingTeamProb: { type: "INTEGER", description: "Win probability percentage for the bowling team (0-100)" },
              momentum: { type: "STRING", description: "Short 1-sentence description of who has the momentum" }
            },
            required: ["battingTeamProb", "bowlingTeamProb", "momentum"]
          },
          reactions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                agentId: { type: "STRING", description: "Must be exactly: dhoni, kohli, rohit, bumrah, dravid, or ponting" },
                strategy: { type: "STRING", description: "Short 2-4 word primary strategy" },
                risk: { type: "STRING", description: "Low, Medium, or High" },
                insight: { type: "STRING", description: "1-2 sentence deep tactical insight in their voice" }
              },
              required: ["agentId", "strategy", "risk", "insight"]
            }
          }
        },
        required: ["prediction", "reactions"]
      }
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error("API Network Error");
    
    const result = await response.json();
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const jsonStr = result.candidates[0].content.parts[0].text;
      const data = JSON.parse(jsonStr);
      return data;
    }
    throw new Error("Invalid response structure");
  } catch (error) {
    console.error("AI Generation Failed:", error);
    return null; // Fallback handled in component
  }
}

// --- MOCK SIMULATION ENGINE ---

function generateNextBall(currentState) {
  const outcomes = [
    { runs: 0, desc: "Dot ball. Excellent length, safely defended.", prob: 0.3 },
    { runs: 1, desc: "Pushed into the gap for a quick single. Good rotation.", prob: 0.3 },
    { runs: 2, desc: "Worked through mid-wicket, running hard for two.", prob: 0.15 },
    { runs: 4, desc: "FOUR! Slashed hard past point. Great placement.", prob: 0.1 },
    { runs: 6, desc: "SIX! Massive strike over deep mid-wicket!", prob: 0.05 },
    { runs: 0, wicket: true, desc: "OUT! Caught sharply in the deep! Big breakthrough!", prob: 0.1 }
  ];

  const rand = Math.random();
  let cumulativeProb = 0;
  let selectedOutcome = outcomes[0];

  for (let outcome of outcomes) {
    cumulativeProb += outcome.prob;
    if (rand <= cumulativeProb) {
      selectedOutcome = outcome;
      break;
    }
  }

  const newBalls = currentState.balls + 1;
  const newRuns = currentState.runs + selectedOutcome.runs;
  const newWickets = currentState.wickets + (selectedOutcome.wicket ? 1 : 0);
  
  // Deep copy complex state for mutation
  let nextBatters = JSON.parse(JSON.stringify(currentState.batters));
  let nextBowler = { ...currentState.bowler };
  let nextPartnership = { ...currentState.partnership };

  // Identify striker
  let strikerIdx = nextBatters.findIndex(b => b.striker);
  if (strikerIdx === -1) strikerIdx = 0; // Fallback

  // Update Striker Stats
  nextBatters[strikerIdx].balls += 1;
  nextBatters[strikerIdx].runs += selectedOutcome.runs;
  if (selectedOutcome.runs === 4) nextBatters[strikerIdx].fours += 1;
  if (selectedOutcome.runs === 6) nextBatters[strikerIdx].sixes += 1;

  // Update Bowler Stats
  let [bOvers, bBalls] = nextBowler.overs.split('.').map(Number);
  bBalls += 1;
  if (bBalls === 6) { bOvers += 1; bBalls = 0; }
  nextBowler.overs = `${bOvers}.${bBalls}`;
  nextBowler.runs += selectedOutcome.runs;
  if (selectedOutcome.wicket) nextBowler.wickets += 1;

  // Update Partnership & Wicket Logic
  if (selectedOutcome.wicket) {
    nextPartnership = { runs: 0, balls: 0 };
    // Bring in new batter
    nextBatters[strikerIdx] = {
      name: `Batter ${newWickets + 2}`, runs: 0, balls: 0, fours: 0, sixes: 0, striker: true
    };
  } else {
    nextPartnership.runs += selectedOutcome.runs;
    nextPartnership.balls += 1;
  }

  // Strike Rotation Logic (XOR: run rotation vs over rotation)
  let runsRotate = (selectedOutcome.runs === 1 || selectedOutcome.runs === 3);
  let overRotate = (newBalls % 6 === 0);
  if (runsRotate !== overRotate) { // If both happen, they cancel out
    nextBatters[0].striker = !nextBatters[0].striker;
    nextBatters[1].striker = !nextBatters[1].striker;
  }

  return {
    ...currentState,
    runs: newRuns,
    wickets: newWickets,
    balls: newBalls,
    batters: nextBatters,
    bowler: nextBowler,
    partnership: nextPartnership,
    lastEvent: selectedOutcome.desc,
    history: [
      { ball: newBalls, runs: selectedOutcome.runs, wicket: selectedOutcome.wicket, desc: selectedOutcome.desc },
      ...currentState.history
    ].slice(0, 10)
  };
}

// --- MAIN COMPONENT ---

export default function CricketBrainApp() {
  const [matchState, setMatchState] = useState(INITIAL_MATCH_STATE);
  const [reactions, setReactions] = useState({});
  const [prediction, setPrediction] = useState({ battingTeamProb: 15, bowlingTeamProb: 85, momentum: "RR firmly in control after taking early wickets." });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  
  // New API Mode States
  const [useApiMode, setUseApiMode] = useState(false);
  const [apiStatus, setApiStatus] = useState('offline'); // offline, connecting, connected, error
  const [isFullscreen, setIsFullscreen] = useState(false);

  const triggerAnalysis = async (stateToAnalyze) => {
    setIsAnalyzing(true);
    const data = await fetchAgentReactions(stateToAnalyze);
    if (data && data.reactions && data.prediction) {
      const reactionsMap = {};
      data.reactions.forEach(r => reactionsMap[r.agentId.toLowerCase()] = r);
      setReactions(reactionsMap);
      setPrediction(data.prediction);
    }
    setIsAnalyzing(false);
  };

  // Initial load analysis
  useEffect(() => {
    triggerAnalysis(matchState);
  }, []);

  // API Polling Loop (Runs every 15 seconds when in API mode)
  useEffect(() => {
    let interval;
    if (useApiMode) {
      const pollApi = async () => {
        setApiStatus('connecting');
        try {
          const liveData = await fetchLiveMatchFromAPI();
          setMatchState(liveData);
          setApiStatus('connected');
          setError(null);
          triggerAnalysis(liveData);
        } catch (err) {
          setApiStatus('error');
          setError(err.message);
          setUseApiMode(false); // Fallback to sim mode on error
        }
      };

      pollApi(); // Initial fetch
      interval = setInterval(pollApi, 15000); // Poll every 15s
    } else {
      setApiStatus('offline');
    }
    return () => clearInterval(interval);
  }, [useApiMode]);

  // Simulation Loop
  useEffect(() => {
    let interval;
    if (isSimulating && !useApiMode) {
      interval = setInterval(() => {
        if (isAnalyzing) return; // Wait for the AI to finish analyzing
        if (matchState.balls >= 120 || matchState.wickets >= 10 || matchState.runs >= matchState.target) {
          setIsSimulating(false);
          return;
        }
        const nextState = generateNextBall(matchState);
        setMatchState(nextState);
        triggerAnalysis(nextState);
      }, 8000); // 8-second interval allows time to read reactions
    }
    return () => clearInterval(interval);
  }, [isSimulating, useApiMode, isAnalyzing, matchState]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleSimulation = () => {
    if (useApiMode) setUseApiMode(false); // Ensure API mode is off when starting sim
    setIsSimulating(!isSimulating);
  };

  const toggleApiMode = () => {
    if (isSimulating) setIsSimulating(false); // Stop sim when switching to API
    setUseApiMode(!useApiMode);
  };

  const handleNextBall = () => {
    const nextState = generateNextBall(matchState);
    setMatchState(nextState);
    triggerAnalysis(nextState);
  };

  // Derived state for UI
  const overs = Math.floor(matchState.balls / 6);
  const ballsInOver = matchState.balls % 6;
  const needed = matchState.target - matchState.runs;
  const ballsRemaining = 120 - matchState.balls;
  const requiredRate = ballsRemaining > 0 ? ((needed / ballsRemaining) * 6).toFixed(2) : '0.00';
  const currentRate = matchState.balls > 0 ? ((matchState.runs / matchState.balls) * 6).toFixed(2) : '0.00';

  const isGameOver = ballsRemaining <= 0 || matchState.wickets >= 10 || needed <= 0;

  const currentStriker = matchState.batters.find(b => b.striker) || matchState.batters[0];
  const strikerSR = currentStriker.balls > 0 ? ((currentStriker.runs / currentStriker.balls) * 100).toFixed(1) : '0.0';
  const bowlerEcon = matchState.balls > 0 ? ((matchState.bowler.runs / ((parseInt(matchState.bowler.overs.split('.')[0]) * 6 + parseInt(matchState.bowler.overs.split('.')[1] || 0)) || 1)) * 6).toFixed(1) : '0.0';
  
  // Generate Ticker Text dynamically
  const tickerText = `BREAKING: ${matchState.lastEvent.toUpperCase()} ••• LIVE WIN PREDICTION: ${matchState.teamA} ${prediction.battingTeamProb}% | ${matchState.teamB} ${prediction.bowlingTeamProb}% ••• ${currentStriker.name} Batting at ${strikerSR} SR ••• ${matchState.bowler.name} Econ: ${bowlerEcon} ••• PARTNERSHIP: ${matchState.partnership.runs} off ${matchState.partnership.balls} ••• REQUIRED RATE: ${requiredRate} ••• CURRENT RATE: ${currentRate} ••• EXTRAS: ${matchState.extras} ••• VENUE: ${matchState.venue} ••• TOSS: ${matchState.toss} ••• `;

  return (
    <div className="h-screen w-screen bg-[#0a0f1c] text-slate-100 font-sans pb-10 selection:bg-red-500/30 overflow-hidden flex flex-col font-condensed">
      
      {/* BROADCAST HEADER */}
      <header className="bg-[#050814] border-b-4 border-red-600 flex justify-between items-center px-4 md:px-8 py-3 relative z-20 shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center bg-red-600 text-white font-black text-xs px-3 py-1 rounded animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]">
            <span className="w-2 h-2 bg-white rounded-full mr-2"></span> {useApiMode ? 'API LIVE' : 'SIM LIVE'}
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-md">
              CricketBrain <span className="text-red-500">Network</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-red-500 font-bold text-sm tracking-widest uppercase bg-red-950/50 px-4 py-1.5 rounded border border-red-500/30">
              <Activity className="w-5 h-5 animate-spin" />
              <span>Experts Analyzing</span>
            </div>
          )}
          
          {/* Controls Group */}
          <div className="flex gap-3 bg-slate-900 p-1 rounded-md border border-slate-700">
            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="flex items-center justify-center p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <div className="w-px bg-slate-700"></div>

            {/* API Mode Toggle */}
            <button 
              onClick={toggleApiMode}
              className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold uppercase tracking-wider transition-all text-xs ${
                useApiMode 
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              {useApiMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              API Data
            </button>
            <div className="w-px bg-slate-700"></div>
            {/* Sim Controls */}
            <button 
              onClick={toggleSimulation}
              disabled={isGameOver || isAnalyzing || useApiMode}
              className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold uppercase tracking-wider transition-all text-xs ${
                isSimulating 
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isSimulating ? 'Pause Sim' : 'Auto Sim'}
            </button>
            <button 
              onClick={handleNextBall}
              disabled={isSimulating || isAnalyzing || isGameOver || useApiMode}
              className="flex items-center gap-2 px-4 py-1.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            >
              <FastForward className="w-4 h-4" />
              Next Ball
            </button>
          </div>
        </div>
      </header>

      {/* API STATUS BANNER */}
      {useApiMode && (
        <div className={`w-full py-1 text-center text-xs font-bold uppercase tracking-widest shrink-0 ${
          apiStatus === 'connected' ? 'bg-blue-900/50 text-blue-300' :
          apiStatus === 'connecting' ? 'bg-amber-900/50 text-amber-300' :
          'bg-red-900/50 text-red-300'
        }`}>
          {apiStatus === 'connected' ? '✅ Connected to CricAPI Live Data Feed' :
           apiStatus === 'connecting' ? '🔄 Fetching Latest Match Data...' :
           '❌ API Connection Failed. Check API Key in code.'}
        </div>
      )}

      {/* BROADCAST MAIN STAGE */}
      <div className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative overflow-y-auto custom-scrollbar">
        
        {/* Background Studio Gradients */}
        <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0f1c] to-[#0a0f1c] pointer-events-none z-0"></div>

        {/* LEFT COLUMN - THE MAIN GRAPHIC (Score & Predictor) */}
        <div className="lg:col-span-4 flex flex-col gap-6 relative z-10">
          
          {/* Main Score Bug */}
          <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-700 shadow-2xl overflow-hidden rounded-xl">
            {/* Breaking Banner */}
            <div className="bg-red-600 text-white font-black uppercase text-sm tracking-widest py-1.5 px-4 flex items-center gap-2 shadow-[0_0_10px_rgba(220,38,38,0.5)] z-10 relative">
              <Zap className="w-4 h-4 fill-current animate-pulse" /> LATEST EVENT: {matchState.lastEvent.substring(0, 35)}...
            </div>
            
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                   <div className="text-7xl font-black tracking-tighter text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] leading-none">
                     {matchState.runs}<span className="text-4xl text-slate-400">/{matchState.wickets}</span>
                   </div>
                   <div className="text-xs text-slate-400 uppercase font-bold mt-1 tracking-wider">
                     Target: {matchState.target} | {needed > 0 ? `Need ${needed} off ${ballsRemaining}` : 'Match Over'}
                   </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Overs</div>
                  <div className="text-4xl font-black text-white bg-slate-800/50 px-3 py-1 rounded border border-slate-700">{overs}.{ballsInOver}</div>
                </div>
              </div>

              {}
              {/* Detailed Match Stats Grids */}
              <div className="mt-5 flex flex-col gap-3">
                
                {/* Batting Stats Table */}
                <div className="bg-[#0b0f19] border border-slate-700 rounded overflow-hidden">
                   <div className="grid grid-cols-12 bg-slate-800 text-[10px] text-slate-300 font-bold uppercase tracking-widest py-1 px-2 border-b border-slate-700">
                      <div className="col-span-6">Batter</div>
                      <div className="col-span-2 text-right">R</div>
                      <div className="col-span-2 text-right">B</div>
                      <div className="col-span-2 text-right">SR</div>
                   </div>
                   {matchState.batters.map((batter, i) => (
                     <div key={i} className={`grid grid-cols-12 text-sm py-1.5 px-2 border-b border-slate-800/50 last:border-0 ${batter.striker ? 'bg-slate-800/30 text-white font-bold' : 'text-slate-400'}`}>
                        <div className="col-span-6 flex items-center gap-1 truncate">
                          {batter.striker && <Play className="w-3 h-3 text-red-500 fill-current" />}
                          {batter.name}
                        </div>
                        <div className="col-span-2 text-right font-mono">{batter.runs}</div>
                        <div className="col-span-2 text-right font-mono">{batter.balls}</div>
                        <div className="col-span-2 text-right font-mono text-[11px] mt-0.5">
                          {batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(0) : '0'}
                        </div>
                     </div>
                   ))}
                </div>

                {/* Bowling Stats Table */}
                <div className="bg-[#0b0f19] border border-slate-700 rounded overflow-hidden">
                   <div className="grid grid-cols-12 bg-slate-800 text-[10px] text-slate-300 font-bold uppercase tracking-widest py-1 px-2 border-b border-slate-700">
                      <div className="col-span-6">Bowler</div>
                      <div className="col-span-2 text-right">O</div>
                      <div className="col-span-2 text-right">R-W</div>
                      <div className="col-span-2 text-right">ECO</div>
                   </div>
                   <div className="grid grid-cols-12 text-sm py-1.5 px-2 text-white font-bold bg-slate-800/30">
                      <div className="col-span-6 truncate flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        {matchState.bowler.name}
                      </div>
                      <div className="col-span-2 text-right font-mono">{matchState.bowler.overs}</div>
                      <div className="col-span-2 text-right font-mono">{matchState.bowler.runs}-{matchState.bowler.wickets}</div>
                      <div className="col-span-2 text-right font-mono text-[11px] mt-0.5">{bowlerEcon}</div>
                   </div>
                </div>

                {/* Auxiliary Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-[#0b0f19] border border-slate-700 rounded p-1.5 text-center">
                     <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">CRR</div>
                     <div className="font-mono text-white text-sm font-bold">{currentRate}</div>
                  </div>
                  <div className="bg-[#0b0f19] border border-slate-700 rounded p-1.5 text-center">
                     <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">REQ</div>
                     <div className="font-mono text-red-400 text-sm font-bold">{requiredRate}</div>
                  </div>
                  <div className="bg-[#0b0f19] border border-slate-700 rounded p-1.5 text-center">
                     <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">P'Ship</div>
                     <div className="font-mono text-amber-400 text-sm font-bold">{matchState.partnership.runs}({matchState.partnership.balls})</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Win Predictor Graphic */}
          <div className="bg-[#111827] border border-slate-700 shadow-xl rounded-xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl"></div>
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> LIVE WIN PROBABILITY
             </h3>
             <div className="flex justify-between text-2xl font-black tracking-tight mb-2">
                <span className="text-blue-500">{matchState.teamA} {prediction.battingTeamProb}%</span>
                <span className="text-pink-500">{prediction.bowlingTeamProb}% {matchState.teamB}</span>
             </div>
             <div className="h-4 w-full bg-slate-900 rounded-sm overflow-hidden flex shadow-inner border border-slate-800">
                <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-1000 ease-in-out relative" style={{ width: `${prediction.battingTeamProb}%` }}>
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
                <div className="h-full bg-gradient-to-r from-pink-500 to-pink-700 transition-all duration-1000 ease-in-out" style={{ width: `${prediction.bowlingTeamProb}%` }}></div>
             </div>
             <div className="mt-4 bg-[#0a0f1c] p-3 rounded border-l-4 border-amber-500">
                <p className="text-sm font-medium text-slate-300 italic">
                  "{prediction.momentum}"
                </p>
             </div>
          </div>

          {/* Event Stream / Play-by-Play */}
          <div className="bg-[#111827] border border-slate-700 shadow-xl rounded-xl flex-grow overflow-hidden flex flex-col">
             <div className="bg-slate-800 text-white font-bold uppercase text-xs tracking-widest py-2 px-4 border-b border-slate-700">
               Play-by-Play Feed
             </div>
             <div className="flex-grow p-4 space-y-3 overflow-y-auto max-h-[250px] custom-scrollbar">
                {matchState.history.map((event, idx) => (
                  <div key={idx} className={`flex gap-3 text-sm pb-3 border-b border-slate-800 last:border-0 ${idx === 0 ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="w-12 flex-shrink-0 text-right font-mono text-slate-400 font-bold mt-0.5">
                      {Math.floor((event.ball-1)/6)}.{((event.ball-1)%6)+1}
                    </div>
                    <div>
                      <span className={`inline-block w-6 h-6 text-center leading-6 rounded font-black mr-2 text-xs
                        ${event.wicket ? 'bg-red-600 text-white' : event.runs >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}
                      `}>
                        {event.wicket ? 'W' : event.runs}
                      </span>
                      <span className={`${idx === 0 ? 'text-white font-medium' : 'text-slate-400'}`}>{event.desc}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN - EXPERT PANEL (Agent War Room) */}
        <div className="lg:col-span-8 flex flex-col gap-4 relative z-10">
          
          <div className="flex justify-between items-center mb-2 px-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3 drop-shadow-md">
              <BrainCircuit className="w-6 h-6 text-red-500" />
              Expert Panel Analysis
            </h2>
            {error && (
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase bg-red-900/30 px-3 py-1 rounded border border-red-500/50">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            {AGENT_PROFILES.map((agent) => {
              const reaction = reactions[agent.id] || reactions[Object.keys(reactions).find(k => agent.name.toLowerCase().includes(k.toLowerCase()))];
              const isUpdating = isAnalyzing;

              return (
                <div key={agent.id} className="bg-[#111827] border border-slate-700 shadow-xl rounded-lg overflow-hidden flex flex-col relative group">
                  {/* Color Accent Bar */}
                  <div className={`h-1.5 w-full ${agent.bg.replace('/10', '/80')}`}></div>
                  
                  <div className="p-4 flex-grow flex flex-col">
                    {/* Header: Name & Role */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                      <div className={`w-10 h-10 rounded bg-[#0a0f1c] border ${agent.border} flex items-center justify-center shadow-inner`}>
                        <agent.icon className={`w-5 h-5 ${agent.color}`} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-black text-lg text-white uppercase tracking-tight leading-none">{agent.name}</h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${agent.color}`}>{agent.role}</p>
                      </div>
                      {isUpdating && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>}
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow flex flex-col justify-center relative min-h-[120px]">
                      {isUpdating ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111827]/80 backdrop-blur-sm z-10">
                          <div className="flex gap-1 mb-2">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processing</span>
                        </div>
                      ) : null}

                      {reaction ? (
                        <div className={`space-y-3 transition-opacity duration-300 ${isUpdating ? 'opacity-30' : 'opacity-100'}`}>
                           <div className="flex justify-between items-start">
                             <div className="flex-grow">
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Strategy</span>
                               <span className="font-black text-white uppercase text-sm">{reaction.strategy}</span>
                             </div>
                             <div className="text-right">
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Risk Level</span>
                               <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase inline-block
                                 ${reaction.risk?.toLowerCase() === 'high' ? 'bg-red-600 text-white' : 
                                   reaction.risk?.toLowerCase() === 'medium' ? 'bg-amber-500 text-black' : 
                                   'bg-emerald-500 text-white'}`
                               }>
                                 {reaction.risk || 'N/A'}
                               </span>
                             </div>
                           </div>
                           <div className="bg-[#0a0f1c] p-3 rounded border-l-2 border-slate-700 relative">
                             <span className="absolute -top-2 -left-2 text-2xl text-slate-700 font-serif">"</span>
                             <p className="text-sm text-slate-300 font-medium italic relative z-10 leading-snug">
                               {reaction.insight}
                             </p>
                           </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-600 font-bold uppercase text-xs tracking-widest">
                          Awaiting Data
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SCROLLING NEWS TICKER */}
      <div className="fixed bottom-0 w-full bg-red-700 border-t-2 border-red-500 flex items-center h-10 shadow-[0_-5px_20px_rgba(220,38,38,0.3)] z-50 overflow-hidden">
        <div className="bg-black text-white font-black text-sm px-4 h-full flex items-center uppercase tracking-widest shrink-0 relative z-10">
          News <br/> Update
        </div>
        <div className="flex-grow overflow-hidden relative h-full flex items-center">
          <div className="animate-ticker text-white font-bold text-sm tracking-widest whitespace-nowrap px-4 drop-shadow-md">
            {tickerText.repeat(5)} {/* Repeat to ensure continuous scroll look */}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,400;0,700;0,900;1,700&display=swap');
        
        .font-condensed {
          font-family: 'Roboto Condensed', sans-serif;
        }
        
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-ticker {
          display: inline-block;
          animation: ticker 30s linear infinite;
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1); 
        }
      `}} />
    </div>
  );
}