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

  const updateLocalStorage = (newGames) => {
    localStorage.setItem('games', JSON.stringify(newGames));
  };

  const addNewGame = () => {
    const newGame = {
      teamA: 'Team Red',
      teamB: 'Team Blue',
      indexA: 10,
      indexB: 15,
      rating: 72,
      slope: 120,
      pars: Array(18).fill(4),
      sis: Array.from({ length: 18 }, (_, i) => i + 1),
      scoresA: Array(18).fill(''),
      scoresB: Array(18).fill('')
    };
    const newGames = [...games, newGame];
    setGames(newGames);
    setActiveGameIndex(newGames.length - 1);
    updateLocalStorage(newGames);
  };

  const updateGame = (key, value) => {
    const updated = [...games];
    updated[activeGameIndex][key] = value;
    setGames(updated);
    updateLocalStorage(updated);
  };

  const updateScore = (team, index, value) => {
    const updated = [...games];
    const arr = team === 'A' ? 'scoresA' : 'scoresB';
    updated[activeGameIndex][arr][index] = value;
    setGames(updated);
    updateLocalStorage(updated);
  };

  const getHoleResult = (holeIdx) => {
    const game = games[activeGameIndex];
    const { scoresA, scoresB, sis, indexA, indexB, slope, rating } = game;
    const chA = calculateCourseHandicap(indexA, slope, rating);
    const chB = calculateCourseHandicap(indexB, slope, rating);
    const shots = Math.abs(chA - chB);
    const receive = chA < chB ? 'B' : 'A';

    const netA = parseInt(scoresA[holeIdx]) || 0;
    const netB = parseInt(scoresB[holeIdx]) || 0;

    const si = parseInt(sis[holeIdx]);
    if (!si || !netA || !netB) return '';

    if (receive === 'A' && si <= shots) netA -= 1;
    if (receive === 'B' && si <= shots) netB -= 1;

    if (netA < netB) return game.teamA;
    if (netB < netA) return game.teamB;
    return 'Half';
  };

  const getMatchStatus = () => {
    const game = games[activeGameIndex];
    const { scoresA, scoresB, sis, indexA, indexB, slope, rating, teamA, teamB } = game;
    const chA = calculateCourseHandicap(indexA, slope, rating);
    const chB = calculateCourseHandicap(indexB, slope, rating);
    const shots = Math.abs(chA - chB);
    const receive = chA < chB ? 'B' : 'A';
    let aUp = 0;

    for (let i = 0; i < 18; i++) {
      const si = parseInt(sis[i]);
      let a = parseInt(scoresA[i]) || 0;
      let b = parseInt(scoresB[i]) || 0;
      if (!a || !b || !si) continue;

      if (receive === 'A' && si <= shots) a -= 1;
      if (receive === 'B' && si <= shots) b -= 1;

      if (a < b) aUp++;
      else if (b < a) aUp--;
    }

    if (aUp === 0) return 'AS';
    return aUp > 0 ? `${teamA} ${aUp} Up` : `${teamB} ${Math.abs(aUp)} Up`;
  };

  useEffect(() => {
    updateLocalStorage(games);
  }, [games]);

  if (!games.length) {
    return <button onClick={addNewGame}>+ New Matchplay Game</button>;
  }

  const game = games[activeGameIndex];
  const chA = calculateCourseHandicap(game.indexA, game.slope, game.rating);
  const chB = calculateCourseHandicap(game.indexB, game.slope, game.rating);
  const shotsGiven = Math.abs(chA - chB);
  const receiver = chA < chB ? game.teamA : game.teamB;

  return (
    <div className="App">
      <h2>Golf Matchplay Tracker</h2>

      <div className="tabs">
        {games.map((g, i) => (
          <button key={i} onClick={() => setActiveGameIndex(i)}>
            {g.teamA} vs {g.teamB} ({getMatchStatus()})
          </button>
        ))}
        <button onClick={addNewGame}>+ New Game</button>
      </div>

      <div className="inputs">
        <input value={game.teamA} onChange={(e) => updateGame('teamA', e.target.value)} /> vs
        <input value={game.teamB} onChange={(e) => updateGame('teamB', e.target.value)} />
        <div>
          Handicap Index A: <input type="number" value={game.indexA} onChange={(e) => updateGame('indexA', +e.target.value)} />
          Handicap Index B: <input type="number" value={game.indexB} onChange={(e) => updateGame('indexB', +e.target.value)} />
        </div>
        <div>
          Course Rating: <input type="number" value={game.rating} onChange={(e) => updateGame('rating', +e.target.value)} />
          Slope: <input type="number" value={game.slope} onChange={(e) => updateGame('slope', +e.target.value)} />
        </div>
      </div>

      <p>Shots Given: {shotsGiven} to {receiver}</p>
      <p>CH A: {chA}  CH B: {chB}</p>
      <h4>Match Status: {getMatchStatus()}</h4>

      <table>
        <thead>
          <tr><th>Hole</th><th>Par</th><th>SI</th><th>{game.teamA}</th><th>{game.teamB}</th><th>Result</th></tr>
        </thead>
        <tbody>
          {game.pars.map((_, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><input value={game.pars[i]} onChange={e => {
                const updated = [...game.pars];
                updated[i] = e.target.value;
                updateGame('pars', updated);
              }} /></td>
              <td><input value={game.sis[i]} onChange={e => {
                const updated = [...game.sis];
                updated[i] = e.target.value;
                updateGame('sis', updated);
              }} /></td>
              <td><input value={game.scoresA[i]} onChange={e => updateScore('A', i, e.target.value)} /></td>
              <td><input value={game.scoresB[i]} onChange={e => updateScore('B', i, e.target.value)} /></td>
              <td className={getHoleResult(i) === game.teamA ? 'red' : getHoleResult(i) === game.teamB ? 'blue' : ''}>{getHoleResult(i)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
