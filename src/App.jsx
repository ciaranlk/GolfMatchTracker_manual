import React, { useState, useEffect } from 'react';
import './App.css';

function calculateCourseHandicap(index, slope, rating) {
  return Math.round(index * (slope / 113) + (rating - 72));
}

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('games');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeGameIndex, setActiveGameIndex] = useState(0);

  const [newGame, setNewGame] = useState({
    teamRed: 'Red',
    teamBlue: 'Blue',
    holes: Array(18).fill({ red: null, blue: null }),
    par: Array(18).fill(4),
    si: Array(18).fill(1).map((_, i) => i + 1),
    redIndex: 10,
    blueIndex: 8,
    rating: 72,
    slope: 113,
  });

  const startNewGame = () => {
    const courseHandicapRed = calculateCourseHandicap(newGame.redIndex, newGame.slope, newGame.rating);
    const courseHandicapBlue = calculateCourseHandicap(newGame.blueIndex, newGame.slope, newGame.rating);
    const shotsGiven = Math.abs(courseHandicapRed - courseHandicapBlue);
    const givingTeam = courseHandicapRed > courseHandicapBlue ? 'red' : 'blue';

    const holesWithShots = newGame.si
      .map((si, idx) => ({ idx, si }))
      .sort((a, b) => a.si - b.si)
      .slice(0, shotsGiven)
      .map(h => h.idx);

    const game = {
      ...newGame,
      courseHandicapRed,
      courseHandicapBlue,
      holesWithShots,
      givingTeam,
    };
    setGames([...games, game]);
    setActiveGameIndex(games.length);
  };

  const updateHoleScore = (holeIndex, team, delta) => {
    const updatedGames = [...games];
    const game = { ...updatedGames[activeGameIndex] };
    const holes = [...game.holes];
    const current = { ...holes[holeIndex] };
    current[team] = current[team] !== null ? current[team] + delta : delta;
    holes[holeIndex] = current;
    game.holes = holes;
    updatedGames[activeGameIndex] = game;
    setGames(updatedGames);
  };

  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games));
  }, [games]);

  const renderHoleResult = (hole, idx, game) => {
    if (hole.red == null || hole.blue == null) return '—';

    let redScore = hole.red;
    let blueScore = hole.blue;

    if (game.holesWithShots.includes(idx)) {
      if (game.givingTeam === 'red') redScore--;
      else blueScore--;
    }

    if (redScore < blueScore) return <span className="red">Red</span>;
    if (blueScore < redScore) return <span className="blue">Blue</span>;
    return 'Half';
  };

  const computeMatchStatus = game => {
    let redWins = 0, blueWins = 0;
    game.holes.forEach((hole, idx) => {
      if (hole.red == null || hole.blue == null) return;
      let red = hole.red;
      let blue = hole.blue;
      if (game.holesWithShots.includes(idx)) {
        if (game.givingTeam === 'red') red--;
        else blue--;
      }
      if (red < blue) redWins++;
      else if (blue < red) blueWins++;
    });

    const diff = redWins - blueWins;
    if (diff === 0) return 'All Square';
    if (diff > 0) return `Red ${diff} Up`;
    return `Blue ${-diff} Up`;
  };

  return (
    <div className="App">
      <h1>Golf Match Tracker</h1>

      <div className="new-game-form">
        <input value={newGame.teamRed} onChange={e => setNewGame({ ...newGame, teamRed: e.target.value })} placeholder="Team Red" />
        <input value={newGame.teamBlue} onChange={e => setNewGame({ ...newGame, teamBlue: e.target.value })} placeholder="Team Blue" />
        <input value={newGame.redIndex} onChange={e => setNewGame({ ...newGame, redIndex: parseInt(e.target.value) })} type="number" placeholder="Red Index" />
        <input value={newGame.blueIndex} onChange={e => setNewGame({ ...newGame, blueIndex: parseInt(e.target.value) })} type="number" placeholder="Blue Index" />
        <input value={newGame.rating} onChange={e => setNewGame({ ...newGame, rating: parseFloat(e.target.value) })} type="number" placeholder="Course Rating" />
        <input value={newGame.slope} onChange={e => setNewGame({ ...newGame, slope: parseInt(e.target.value) })} type="number" placeholder="Slope" />
        <button onClick={startNewGame}>Start Game</button>
      </div>

      <div className="game-selector">
        {games.map((game, idx) => (
          <button key={idx} onClick={() => setActiveGameIndex(idx)}>
            {game.teamRed} vs {game.teamBlue} — {computeMatchStatus(game)}
          </button>
        ))}
      </div>

      {games[activeGameIndex] && (
        <div className="scorecard">
          <h2>{games[activeGameIndex].teamRed} vs {games[activeGameIndex].teamBlue}</h2>
          <div>Red CH: {games[activeGameIndex].courseHandicapRed}, Blue CH: {games[activeGameIndex].courseHandicapBlue}</div>
          <table>
            <thead>
              <tr>
                <th>Hole</th>
                <th>Par</th>
                <th>SI</th>
                <th>{games[activeGameIndex].teamRed}</th>
                <th>{games[activeGameIndex].teamBlue}</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {games[activeGameIndex].holes.map((hole, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{games[activeGameIndex].par[idx]}</td>
                  <td>{games[activeGameIndex].si[idx]}</td>
                  <td>
                    <button onClick={() => updateHoleScore(idx, 'red', -1)}>-</button>
                    {hole.red ?? '-'}
                    <button onClick={() => updateHoleScore(idx, 'red', 1)}>+</button>
                  </td>
                  <td>
                    <button onClick={() => updateHoleScore(idx, 'blue', -1)}>-</button>
                    {hole.blue ?? '-'}
                    <button onClick={() => updateHoleScore(idx, 'blue', 1)}>+</button>
                  </td>
                  <td>{renderHoleResult(hole, idx, games[activeGameIndex])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
