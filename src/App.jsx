// File: src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css';

function calculateCourseHandicap(index, slope, rating) {
  return Math.round(index * (slope / 113) + (rating - 72));
}

function getShotsGivenArray(shots, si) {
  const arr = Array(18).fill(0);
  for (let i = 1; i <= shots; i++) {
    const hole = si.findIndex(s => s === i);
    if (hole !== -1) arr[hole] = 1;
  }
  return arr;
}

function App() {
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem('games')) || []);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const activeGame = games[activeGameIndex];

  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games));
  }, [games]);

  const updateGame = (newGame) => {
    const newGames = [...games];
    newGames[activeGameIndex] = newGame;
    setGames(newGames);
  };

  const calculateResult = (redScore, blueScore, redShots, blueShots) => {
    if (redScore === '' || blueScore === '') return '-';
    const red = parseInt(redScore);
    const blue = parseInt(blueScore);
    if (isNaN(red) || isNaN(blue)) return '-';
    if (redShots > 0) red -= 1;
    if (blueShots > 0) blue -= 1;
    if (red < blue) return 'Red';
    if (blue < red) return 'Blue';
    return 'Half';
  };

  const calculateMatchStatus = (results) => {
    let redUp = 0;
    let blueUp = 0;
    results.forEach(result => {
      if (result === 'Red') redUp++;
      else if (result === 'Blue') blueUp++;
    });
    const diff = redUp - blueUp;
    if (diff > 0) return `Red ${diff} Up`;
    if (diff < 0) return `Blue ${Math.abs(diff)} Up`;
    return 'All Square';
  };

  const startGame = (red, blue, indexA, indexB, rating, slope) => {
    const chA = calculateCourseHandicap(indexA, slope, rating);
    const chB = calculateCourseHandicap(indexB, slope, rating);
    const shots = Math.abs(chA - chB);
    const givingToRed = chB > chA;
    const si = Array.from({ length: 18 }, (_, i) => i + 1);
    const redShots = givingToRed ? getShotsGivenArray(shots, si) : Array(18).fill(0);
    const blueShots = !givingToRed ? getShotsGivenArray(shots, si) : Array(18).fill(0);

    const newGame = {
      red, blue, chA, chB, redScores: Array(18).fill(''), blueScores: Array(18).fill(''), pars: Array(18).fill(4), si,
      redShots, blueShots, results: Array(18).fill('-'), matchStatus: 'All Square'
    };

    setGames([...games, newGame]);
    setActiveGameIndex(games.length);
  };

  if (!activeGame) return <div>No active game</div>;

  const handleScoreChange = (hole, team, delta) => {
    const newGame = { ...activeGame };
    const scores = team === 'red' ? [...newGame.redScores] : [...newGame.blueScores];
    const val = parseInt(scores[hole]) || 0;
    scores[hole] = Math.max(0, val + delta);
    if (team === 'red') newGame.redScores = scores;
    else newGame.blueScores = scores;

    const results = newGame.redScores.map((r, i) =>
      calculateResult(r, newGame.blueScores[i], newGame.redShots[i], newGame.blueShots[i])
    );
    newGame.results = results;
    newGame.matchStatus = calculateMatchStatus(results);

    updateGame(newGame);
  };

  return (
    <div>
      <h2>Golf Match Tracker</h2>
      <div>
        {games.map((g, i) => (
          <button key={i} onClick={() => setActiveGameIndex(i)}>
            {g.red} vs {g.blue} ({g.matchStatus})
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Hole</th><th>Par</th><th>SI</th>
            <th>{activeGame.red}</th><th>{activeGame.blue}</th><th>Result</th>
          </tr>
        </thead>
        <tbody>
          {activeGame.pars.map((_, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><input value={activeGame.pars[i]} onChange={e => {
                const newGame = { ...activeGame };
                newGame.pars[i] = e.target.value;
                updateGame(newGame);
              }} /></td>
              <td><input value={activeGame.si[i]} onChange={e => {
                const newGame = { ...activeGame };
                newGame.si[i] = parseInt(e.target.value);
                updateGame(newGame);
              }} /></td>
              <td>
                <button onClick={() => handleScoreChange(i, 'red', -1)}>-</button>
                {activeGame.redScores[i] || 0}
                <button onClick={() => handleScoreChange(i, 'red', 1)}>+</button>
              </td>
              <td>
                <button onClick={() => handleScoreChange(i, 'blue', -1)}>-</button>
                {activeGame.blueScores[i] || 0}
                <button onClick={() => handleScoreChange(i, 'blue', 1)}>+</button>
              </td>
              <td>{activeGame.results[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>Match Status: {activeGame.matchStatus}</div>
      <div>{activeGame.red} CH: {activeGame.chA}, {activeGame.blue} CH: {activeGame.chB}</div>
    </div>
  );
}

export default App;
