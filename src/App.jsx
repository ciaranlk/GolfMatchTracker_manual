// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

function calculatePlayingHandicap(index, slope, rating, par = 72) {
  return Math.round(index * (slope / 113) + (rating - par));
}

const defaultHoleData = Array.from({ length: 18 }, (_, i) => ({
  hole: i + 1,
  par: 4,
  si: i + 1,
}));

export default function App() {
  const [games, setGames] = useState(() => {
    const stored = localStorage.getItem('golfGames');
    return stored ? JSON.parse(stored) : [];
  });
  const [activeGameIndex, setActiveGameIndex] = useState(0);

  const activeGame = games[activeGameIndex];

  useEffect(() => {
    localStorage.setItem('golfGames', JSON.stringify(games));
  }, [games]);

  const createNewGame = () => {
    const newGame = {
      id: Date.now(),
      name: `Game ${games.length + 1}`,
      teamRed: 'Red',
      teamBlue: 'Blue',
      holes: defaultHoleData,
      scores: Array(18).fill({ red: '', blue: '' }),
      indexRed: 10,
      indexBlue: 12,
      slope: 120,
      rating: 71.5,
    };
    setGames([...games, newGame]);
    setActiveGameIndex(games.length);
  };

  const updateGame = (updated) => {
    const updatedGames = games.map((g, i) => (i === activeGameIndex ? updated : g));
    setGames(updatedGames);
  };

  const updateScore = (holeIndex, team, value) => {
    const updatedScores = [...activeGame.scores];
    updatedScores[holeIndex] = {
      ...updatedScores[holeIndex],
      [team]: value,
    };
    updateGame({ ...activeGame, scores: updatedScores });
  };

  const getShotsGiven = () => {
    const red = calculatePlayingHandicap(activeGame.indexRed, activeGame.slope, activeGame.rating);
    const blue = calculatePlayingHandicap(activeGame.indexBlue, activeGame.slope, activeGame.rating);
    const diff = Math.abs(red - blue);
    const moreShots = red > blue ? 'red' : 'blue';
    const siSorted = [...activeGame.holes].sort((a, b) => a.si - b.si);
    const shots = Array(18).fill({ red: 0, blue: 0 });
    for (let i = 0; i < diff; i++) {
      const holeIndex = siSorted[i].hole - 1;
      shots[holeIndex][moreShots]++;
    }
    return shots;
  };

  const shotsGiven = getShotsGiven();

  const calculateHoleResult = (index) => {
    const { red, blue } = activeGame.scores[index];
    if (!red || !blue) return '';
    const redGross = parseInt(red);
    const blueGross = parseInt(blue);
    if (isNaN(redGross) || isNaN(blueGross)) return '';
    const redNet = redGross - shotsGiven[index].red;
    const blueNet = blueGross - shotsGiven[index].blue;
    if (redNet < blueNet) return 'red';
    if (blueNet < redNet) return 'blue';
    return 'tie';
  };

  const getMatchStatus = () => {
    let redUp = 0;
    let blueUp = 0;
    for (let i = 0; i < 18; i++) {
      const winner = calculateHoleResult(i);
      if (winner === 'red') redUp++;
      else if (winner === 'blue') blueUp++;
    }
    const diff = redUp - blueUp;
    if (diff === 0) return 'All Square';
    return diff > 0 ? `${activeGame.teamRed} ${diff} Up` : `${activeGame.teamBlue} ${Math.abs(diff)} Up`;
  };

  const exportCSV = () => {
    const headers = ['Hole', 'Par', 'SI', 'Red', 'Blue', 'Winner'];
    const rows = activeGame.holes.map((h, i) => [
      h.hole,
      h.par,
      h.si,
      activeGame.scores[i].red || '',
      activeGame.scores[i].blue || '',
      calculateHoleResult(i),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeGame.name}.csv`;
    link.click();
  };

  return (
    <div className="app">
      <h1>Golf Matchplay Tracker</h1>
      <div className="game-select">
        <button onClick={createNewGame}>+ New Game</button>
        {games.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setActiveGameIndex(i)}
            className={i === activeGameIndex ? 'active' : ''}
          >
            {g.name} ({getMatchStatus()})
          </button>
        ))}
      </div>

      {activeGame && (
        <div className="game-panel">
          <h2>{activeGame.name}</h2>
          <p className="match-status">Status: {getMatchStatus()}</p>
          <div className="scores">
            <div className="row header">
              <div>Hole</div>
              <div>Par</div>
              <div>SI</div>
              <div>{activeGame.teamRed}</div>
              <div>{activeGame.teamBlue}</div>
            </div>
            {activeGame.holes.map((hole, i) => {
              const result = calculateHoleResult(i);
              return (
                <div
                  className={`row ${result === 'red' ? 'red-win' : result === 'blue' ? 'blue-win' : ''}`}
                  key={i}
                >
                  <div>{hole.hole}</div>
                  <div>{hole.par}</div>
                  <div>{hole.si}</div>
                  <div>
                    <input
                      type="number"
                      value={activeGame.scores[i].red || ''}
                      onChange={(e) => updateScore(i, 'red', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={activeGame.scores[i].blue || ''}
                      onChange={(e) => updateScore(i, 'blue', e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={exportCSV}>Export CSV</button>
        </div>
      )}
    </div>
  );
}
