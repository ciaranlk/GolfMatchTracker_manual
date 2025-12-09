import React, { useState, useEffect } from 'react';
import './App.css';

// Helper to calculate playing handicap (simple version: index × slope/113 rounded)
function calcCourseHandicap(index, slope, rating, par = 72) {
  return Math.round(index * (slope / 113) + (rating - par));
}

function exportToCSV(games) {
  // Flatten games into CSV rows, one row per hole per game
  let csv = `"Game","TeamA","TeamB","Hole","Par","SI","ScoreA","ScoreB","Winner"\n`;
  games.forEach((g, gi) => {
    g.holes.forEach(h => {
      csv += `"${g.name}",` +
             `"${g.teamA}",` +
             `"${g.teamB}",` +
             `${h.hole},${h.par},${h.si},` +
             `${h.scoreA === '' ? '' : h.scoreA},` +
             `${h.scoreB === '' ? '' : h.scoreB},` +
             `"${h.winner || ''}"\n`;
    });
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'golf_matchplay_data.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON(games) {
  const data = JSON.stringify(games, null, 2);
  const blob = new Blob([data], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'golf_matchplay_data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('golfGames');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentGameIndex, setCurrentGameIndex] = useState(
    games.length > 0 ? 0 : -1
  );

  // Initialize a new game object
  const createNewGame = () => {
    const newGame = {
      name: `Game ${games.length + 1}`,
      teamA: 'Team Red',
      teamB: 'Team Blue',
      hcpA: 10,
      hcpB: 14,
      courseRating: 72,
      slope: 120,
      holes: Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        par: 4,
        si: i + 1,
        scoreA: '',
        scoreB: '',
        winner: ''
      }))
    };
    const newGames = [...games, newGame];
    setGames(newGames);
    setCurrentGameIndex(newGames.length - 1);
  };

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('golfGames', JSON.stringify(games));
  }, [games]);

  if (currentGameIndex < 0) {
    return (
      <div className="App">
        <h1>Golf Matchplay Tracker</h1>
        <button onClick={createNewGame}>+ New Game</button>
      </div>
    );
  }

  const game = games[currentGameIndex];

  const updateGameField = (field, value) => {
    const updated = { ...game, [field]: value };
    const newGames = [...games];
    newGames[currentGameIndex] = updated;
    setGames(newGames);
  };

  const updateHoleField = (holeIdx, field, value) => {
    const updatedHoles = game.holes.map((h, i) =>
      i === holeIdx ? { ...h, [field]: value } : h
    );
    const updatedGame = { ...game, holes: updatedHoles };
    const newGames = [...games];
    newGames[currentGameIndex] = updatedGame;
    setGames(newGames);
  };

  // Compute course handicaps
  const courseHcpA = calcCourseHandicap(game.hcpA, game.slope, game.courseRating);
  const courseHcpB = calcCourseHandicap(game.hcpB, game.slope, game.courseRating);
  const shotsDiff = Math.abs(courseHcpA - courseHcpB);
  const shotsTo = courseHcpA > courseHcpB ? 'B' : 'A';

  // Determine which holes get strokes
  const shotHoles = game.holes
    .slice()
    .sort((a, b) => a.si - b.si)
    .slice(0, shotsDiff)
    .map(h => h.hole);

  const computeHoleWinner = (h) => {
    const red = parseInt(h.scoreA);
    const blue = parseInt(h.scoreB);
    if (isNaN(red) || isNaN(blue)) return '';
    let netRed = red;
    let netBlue = blue;
    if (shotsTo === 'A' && shotHoles.includes(h.hole)) netBlue--;
    if (shotsTo === 'B' && shotHoles.includes(h.hole)) netRed--;
    if (netRed < netBlue) return game.teamA;
    if (netBlue < netRed) return game.teamB;
    return 'Halved';
  };

  const matchStatus = () => {
    let diff = 0;
    game.holes.forEach(h => {
      const w = h.winner;
      if (w === game.teamA) diff++;
      else if (w === game.teamB) diff--;
    });
    if (diff === 0) return 'AS';
    return diff > 0 ? `${game.teamA} ${diff} Up` : `${game.teamB} ${-diff} Up`;
  };

  const handleWinnerUpdate = (hIdx) => {
    const updatedHoles = game.holes.map((h, i) => {
      if (i !== hIdx) return h;
      const winner = computeHoleWinner(h);
      return { ...h, winner };
    });
    const updatedGame = { ...game, holes: updatedHoles };
    const newGames = [...games];
    newGames[currentGameIndex] = updatedGame;
    setGames(newGames);
  };

  return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>

      <div className="game-controls">
        <button onClick={createNewGame}>+ New Game</button>
        {games.map((g, i) => (
          <button
            key={i}
            onClick={() => setCurrentGameIndex(i)}
            style={{
              fontWeight: i === currentGameIndex ? 'bold' : 'normal',
              marginLeft: '5px'
            }}
          >
            {g.name} — {g.teamA} vs {g.teamB} ({ matchStatus() })
          </button>
        ))}
        <button style={{ marginLeft: '20px' }} onClick={() => exportToJSON(games)}>
          📄 Export JSON
        </button>
        <button onClick={() => exportToCSV(games)}>
          📊 Export CSV
        </button>
      </div>

      <div className="inputs">
        <div>
          <label>Team A: </label>
          <input value={game.teamA} onChange={e => updateGameField('teamA', e.target.value)} />
        </div>
        <div>
          <label>Team B: </label>
          <input value={game.teamB} onChange={e => updateGameField('teamB', e.target.value)} />
        </div>
        <div>
          <label>Handicap Index A: </label>
          <input
            type="number"
            value={game.hcpA}
            onChange={e => updateGameField('hcpA', +e.target.value)}
          />
          <span> → CH: {courseHcpA}</span>
        </div>
        <div>
          <label>Handicap Index B: </label>
          <input
            type="number"
            value={game.hcpB}
            onChange={e => updateGameField('hcpB', +e.target.value)}
          />
          <span> → CH: {courseHcpB}</span>
        </div>
        <div>
          <label>Course Rating: </label>
          <input
            type="number"
            value={game.courseRating}
            onChange={e => updateGameField('courseRating', +e.target.value)}
          />
        </div>
        <div>
          <label>Slope: </label>
          <input
            type="number"
            value={game.slope}
            onChange={e => updateGameField('slope', +e.target.value)}
          />
        </div>
      </div>

      <h3>Shots Given: {shotsDiff} to Team {shotsTo}</h3>
      <h3>Match Status: {matchStatus()}</h3>

      <table>
        <thead>
          <tr>
            <th>Hole</th>
            <th>Par</th>
            <th>SI</th>
            <th>{game.teamA} Gross</th>
            <th>{game.teamB} Gross</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {game.holes.map((h, idx) => (
            <tr key={h.hole}>
              <td>{h.hole}</td>
              <td>
                <input
                  type="number"
                  value={h.par}
                  onChange={e => updateHoleField(idx, 'par', +e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={h.si}
                  onChange={e => updateHoleField(idx, 'si', +e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={h.scoreA}
                  onChange={e => updateHoleField(idx, 'scoreA', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={h.scoreB}
                  onChange={e => updateHoleField(idx, 'scoreB', e.target.value)}
                />
              </td>
              <td
                style={{
                  backgroundColor:
                    h.winner === game.teamA
                      ? 'red'
                      : h.winner === game.teamB
                      ? 'blue'
                      : 'transparent',
                  color:
                    h.winner === game.teamA || h.winner === game.teamB
                      ? 'white'
                      : 'black'
                }}
              >
                {h.winner}
              </td>
              <td>
                <button onClick={() => handleWinnerUpdate(idx)}>Update</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
