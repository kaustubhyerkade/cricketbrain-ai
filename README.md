CricketBrain AI: Project Overview

CricketBrain AI is a futuristic, real-time multi-agent cricket intelligence platform. It acts as a live "war room," transforming the traditional cricket-watching experience into an interactive, AI-driven tactical command center.

Instead of just showing live scores like a standard sports app, CricketBrain AI simulates the minds of legendary cricketers. As a match progresses ball-by-ball, the platform uses artificial intelligence to generate immediate, personality-driven reactions, strategies, and predictions.

Core Concept: "Watching legendary cricket minds think live"

Fans constantly debate what their favorite captains or players would do in high-pressure situations. CricketBrain turns that imagination into reality. It currently features six distinct AI agents, each programmed with specific cricketing philosophies:

MS Dhoni: Calm, calculated, focuses on taking the game deep.

Virat Kohli: Intense, aggressive strike rotation, high intent.

Rohit Sharma: Instinctive field reading, finding gaps, tactical flow.

Jasprit Bumrah: Analytical bowling strategy, surgical pressure.

Rahul Dravid: Composed, risk-minimization, partnership building.

Ricky Ponting: Fearless, dominating, attacks the bowler.

Key Features Built into the Platform

Multi-Agent AI Engine: Powered by the Gemini AI API, the platform sends the exact live match state to the AI, which returns structured JSON containing 6 distinct tactical responses, risk assessments, and deep insights.

Live Match Integration: Capable of polling real-world cricket APIs (like CricAPI) to fetch live scores, overs, and wickets every 15 seconds.

Advanced Simulation Mode: For offline testing or when live matches aren't available, the app features a deep simulation engine that mathematically calculates ball-by-ball events, strike rotation, and individual player stats.

Live Win Predictor: The AI calculates real-time win probabilities for both teams and identifies momentum shifts based on the match context, displayed via a dynamic progress bar.

Broadcast-Style Interface: Designed like a high-end sports news channel or F1 strategy room, featuring:

A continuous scrolling "Breaking News" ticker.

Dense, professional-grade statistics tables (CRR, RRR, Partnerships, individual batter/bowler stats).

Glowing tactical cards for the AI experts.

A full-screen immersive mode.

Technical Stack

Frontend UI: React.js, Tailwind CSS (for the dark, cinematic styling), and Lucide React (for iconography).

AI Backend Engine: Google Gemini (gemini-3-flash-preview), strictly guided by structured JSON schema generation.

Live Data Source: Integrated to work with CricAPI (or fallback to the custom JS simulation engine).
