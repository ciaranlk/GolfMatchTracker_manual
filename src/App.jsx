""import React, { useState, useEffect } from 'react';
import './App.css';

const defaultHoles = Array.from({ length: 18 }, (_, i) => ({
  hole: i + 1,
  par: 4,
  si: i + 1,
  teamA: '',
  teamB: '',
  result: ''
}));

function calculateCourseHandicap(index, slope, rating) {
  return Math.round((index * slope) / 113 + (rating - 72));
}

function calculateShotsGiven(chA, chB) {
  return Math.abs(chA - chB);
}

function getShotsReceivedPerHole(shotsGiven, siList) {
  const sorted = [...siList].sort((a, b) => a.si - b.si);
  const cutoff = sorted.slice(0, shotsGiven).map(h => h.hole);
  return siList.map(h => ({
    ...h,
    receivesShot: cutoff.includes(h.hole)
  }));
}

function getHoleWinner(aGross, bGross, aGetsShot, bGetsShot) {
  if (aGross === '' || bGross === '') return '';
  const aScore = parseInt(aGross) + (aGetsShot ? -1 : 0);
  const bScore = parseInt(bGross) + (bGetsShot ? -1 : 0);
  if (aScore < bScore) return 'Team Red';
  if (bScore < aScore) return 'Team Blue';
  return 'Half';
}

function getMatchStatus(holes) {
  let aWins = 0;
  let bWins = 0;

  for (const h of holes) {
    if (h.result === 'Team Red') aWins++;
    else if (h.result === 'Team Blue') bWins++;

    const remaining = 18 - h.hole;
    if (aWins > bWins + remaining) return `Team Red ${aWins - bWins} Up`;
    if (bWins > aWins + remaining) return `Team Blue ${bWins - aWins} Up`;
  }

  if (aWins === bWins) return 'AS';
  return aWins > bWins ? `Team Red ${aWins - bWins} Up` : `Team Blue ${bWins - aWins} Up`;
}

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('matchplayGames');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGame, setActiveGame] = useState(0);

  useEffect(() => {
    localStorage.setItem('matchplayGames', JSON.stringify(games));
  }, [games]);

  const updateGame = (index, newGame) => {
    const updated = [...games];
    updated[index] = newGame;
    setGames(updated);
  };

  const addNewGame = () => {
    setGames([...games, {
      teamA: 'Team Red',
      teamB: 'Team Blue',
      indexA: 10,
      indexB: 15,
      rating: 72,
      slope: 120,
      holes: JSON.parse(JSON.stringify(defaultHoles))
    }]);
    setActiveGame(games.length);
  };

  const game = games[activeGame];
  if (!game) return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>
      <button onClick={addNewGame}>+ New Game</button>
    </div>
  );

  const chA = calculateCourseHandicap(game.indexA, game.slope, game.rating);
  const chB = calculateCourseHandicap(game.indexB, game.slope, game.rating);
  const shotsGiven = calculateShotsGiven(chA, chB);
  const teamAGivesShots = chA < chB;

  const holesWithShots = getShotsReceivedPerHole(shotsGiven, game.holes);

  const holesWithResults = holesWithShots.map(h => {
    const aGets = !teamAGivesShots && h.receivesShot;
    const bGets = teamAGivesShots && h.receivesShot;
    const result = getHoleWinner(h.teamA, h.teamB, aGets, bGets);
    return { ...h, result };
  });

  const matchStatus = getMatchStatus(holesWithResults);

  const updateHole = (holeIndex, field, value) => {
    const newHoles = [...game.holes];
    newHoles[holeIndex] = { ...newHoles[holeIndex], [field]: value };
    updateGame(activeGame, { ...game, holes: newHoles });
  };

  const updateField = (field, value) => {
    updateGame(activeGame, { ...game, [field]: value });
  };

  return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>
      <div>
        {games.map((g, i) => (
          <button key={i} onClick={() => setActiveGame(i)}>
            {g.teamA} vs {g.teamB} ({getMatchStatus(getShotsReceivedPerHole(calculateShotsGiven(
              calculateCourseHandicap(g.indexA, g.slope, g.rating),
              calculateCourseHandicap(g.indexB, g.slope, g.rating)
            ), g.holes).map(h => ({
              ...h,
              result: getHoleWinner(h.teamA, h.teamB, !(calculateCourseHandicap(g.indexA, g.slope, g.rating) < calculateCourseHandicap(g.indexB, g.slope, g.rating)) && h.receivesShot, (calculateCourseHandicap(g.indexA, g.slope, g.rating) < calculateCourseHandicap(g.indexB, g.slope, g.rating)) && h.receivesShot)
            })))})
          </button>
        ))}
        <button onClick={addNewGame}>+ New Game</button>
      </div>
      <div className="inputs">
        <input value={game.teamA} onChange={e => updateField('teamA', e.target.value)} />
        vs
        <input value={game.teamB} onChange={e => updateField('teamB', e.target.value)} />
        <br />
        Handicap Index A <input type="number" value={game.indexA} onChange={e => updateField('indexA', parseInt(e.target.value))} />
        Handicap Index B <input type="number" value={game.indexB} onChange={e => updateField('indexB', parseInt(e.target.value))} />
        <br />
        Course Rating <input type="number" value={game.rating} onChange={e => updateField('rating', parseFloat(e.target.value))} />
        Slope <input type="number" value={game.slope} onChange={e => updateField('slope', parseInt(e.target.value))} />
        <p>Shots Given: {shotsGiven} to {teamAGivesShots ? game.teamB : game.teamA}</p>
        <p>CH A: {chA}   CH B: {chB}</p>
        <h3>Match Status: {matchStatus}</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Hole</th><th>Par</th><th>SI</th>
            <th>{game.teamA}</th><th>{game.teamB}</th><th>Result</th>
          </tr>
        </thead>
        <tbody>
          {holesWithResults.map((h, i) => (
            <tr key={i}>
              <td>{h.hole}</td>
              <td><input value={h.par} onChange={e => updateHole(i, 'par', e.target.value)} /></td>
              <td><input value={h.si} onChange={e => updateHole(i, 'si', e.target.value)} /></td>
              <td><input value={h.teamA} onChange={e => updateHole(i, 'teamA', e.target.value)} /></td>
              <td><input value={h.teamB} onChange={e => updateHole(i, 'teamB', e.target.value)} /></td>
              <td className={h.result === 'Team Red' ? 'red' : h.result === 'Team Blue' ? 'blue' : ''}>{h.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
