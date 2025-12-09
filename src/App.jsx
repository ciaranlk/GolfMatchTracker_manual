// Final fixed version restoring full features + fixing game isolation
import React, { useState, useEffect } from 'react';
import './App.css';

const defaultHoleData = () =>
  Array.from({ length: 18 }, (_, i) => ({
    hole: i + 1,
    par: '',
    si: '',
    red: '',
    blue: '',
  }));

const calculateShotsGiven = (hcpA, hcpB) => Math.abs(hcpA - hcpB);

const calculateMatchStatus = (holeResults) => {
  let redUp = 0, blueUp = 0;
  for (const result of holeResults) {
    if (result === 'Team Red') redUp++;
    else if (result === 'Team Blue') blueUp++;
  }
  const diff = redUp - blueUp;
  if (diff === 0) return 'AS';
  return diff > 0 ? `Team Red ${diff} Up` : `Team Blue ${-diff} Up`;
};

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('golfGames');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const currentGame = games[currentGameIndex];

  const createNewGame = () => {
    const newGame = {
      redName: 'Team Red',
      blueName: 'Team Blue',
      redIndex: 10,
      blueIndex: 14,
      rating: 72,
      slope: 120,
      holes: defaultHoleData(),
    };
    const updatedGames = [...games, newGame];
    setGames(updatedGames);
    setCurrentGameIndex(updatedGames.length - 1);
  };

  const updateGame = (updateFn) => {
    const updated = [...games];
    updated[currentGameIndex] = updateFn(updated[currentGameIndex]);
    setGames(updated);
    localStorage.setItem('golfGames', JSON.stringify(updated));
  };

  const calculateResults = (game) => {
    const shotsGiven = calculateShotsGiven(game.redIndex, game.blueIndex);
    const giveTo = game.redIndex > game.blueIndex ? 'blue' : 'red';
    const result = [];

    game.holes.forEach((h, i) => {
      const si = parseInt(h.si);
      const red = parseInt(h.red);
      const blue = parseInt(h.blue);
      if (isNaN(red) || isNaN(blue)) return result.push('');

      let redAdj = red;
      let blueAdj = blue;
      if (si && shotsGiven >= si) {
        if (giveTo === 'red') redAdj -= 1;
        else blueAdj -= 1;
      }

      if (redAdj < blueAdj) result.push('Team Red');
      else if (blueAdj < redAdj) result.push('Team Blue');
      else result.push('Half');
    });
    return result;
  };

  if (!currentGame) return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>
      <button onClick={createNewGame}>+ New Game</button>
    </div>
  );

  const holeResults = calculateResults(currentGame);
  const matchStatus = calculateMatchStatus(holeResults);
  const shots = calculateShotsGiven(currentGame.redIndex, currentGame.blueIndex);

  const redCH = Math.round(currentGame.redIndex * (currentGame.slope / 113) + (currentGame.rating - 72));
  const blueCH = Math.round(currentGame.blueIndex * (currentGame.slope / 113) + (currentGame.rating - 72));

  return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>

      <div className="tabs">
        {games.map((g, i) => (
          <button
            key={i}
            onClick={() => setCurrentGameIndex(i)}
            style={{ fontWeight: i === currentGameIndex ? 'bold' : 'normal' }}
          >
            {g.redName} vs {g.blueName} ({calculateMatchStatus(calculateResults(g))})
          </button>
        ))}
        <button onClick={createNewGame}>+ New Game</button>
      </div>

      <div className="teams">
        <input value={currentGame.redName} onChange={e => updateGame(g => ({ ...g, redName: e.target.value }))} /> vs
        <input value={currentGame.blueName} onChange={e => updateGame(g => ({ ...g, blueName: e.target.value }))} />
      </div>
      <div className="handicaps">
        <label>Handicap Index A
          <input value={currentGame.redIndex} onChange={e => updateGame(g => ({ ...g, redIndex: parseInt(e.target.value) }))} />
        </label>
        <label>Handicap Index B
          <input value={currentGame.blueIndex} onChange={e => updateGame(g => ({ ...g, blueIndex: parseInt(e.target.value) }))} />
        </label>
        <label>Course Rating
          <input value={currentGame.rating} onChange={e => updateGame(g => ({ ...g, rating: parseFloat(e.target.value) }))} />
        </label>
        <label>Slope
          <input value={currentGame.slope} onChange={e => updateGame(g => ({ ...g, slope: parseInt(e.target.value) }))} />
        </label>
      </div>

      <p>Shots Given: {shots} to Team {currentGame.redIndex > currentGame.blueIndex ? 'Blue' : 'Red'}</p>
      <p>CH A: {redCH} &nbsp; CH B: {blueCH}</p>
      <h3>Match Status: {matchStatus}</h3>

      <table>
        <thead>
          <tr><th>Hole</th><th>Par</th><th>SI</th><th>{currentGame.redName}</th><th>{currentGame.blueName}</th><th>Result</th></tr>
        </thead>
        <tbody>
          {currentGame.holes.map((hole, i) => (
            <tr key={i}>
              <td>{hole.hole}</td>
              <td><input value={hole.par} onChange={e => updateGame(g => {
                const holes = [...g.holes];
                holes[i].par = e.target.value;
                return { ...g, holes };
              })} /></td>
              <td><input value={hole.si} onChange={e => updateGame(g => {
                const holes = [...g.holes];
                holes[i].si = e.target.value;
                return { ...g, holes };
              })} /></td>
              <td><input value={hole.red} onChange={e => updateGame(g => {
                const holes = [...g.holes];
                holes[i].red = e.target.value;
                return { ...g, holes };
              })} /></td>
              <td><input value={hole.blue} onChange={e => updateGame(g => {
                const holes = [...g.holes];
                holes[i].blue = e.target.value;
                return { ...g, holes };
              })} /></td>
              <td className={holeResults[i] === 'Team Red' ? 'red' : holeResults[i] === 'Team Blue' ? 'blue' : ''}>{holeResults[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
