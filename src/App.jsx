import React, { useState, useEffect } from 'react';
import './App.css';

const defaultCourse = Array.from({ length: 18 }, (_, i) => ({
  hole: i + 1,
  par: 4,
  si: i + 1,
}));

const getShotsGiven = (hcp1, hcp2, course) => {
  const diff = Math.abs(hcp1 - hcp2);
  const shots = {};
  for (let i = 0; i < diff; i++) {
    const siHole = course.find(h => h.si === i + 1);
    if (siHole) shots[siHole.hole] = 1;
  }
  return hcp1 > hcp2 ? { red: shots, blue: {} } : { red: {}, blue: shots };
};

function App() {
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem('games')) || []);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [teamNames, setTeamNames] = useState({ red: 'Red', blue: 'Blue' });
  const [handicaps, setHandicaps] = useState({ red: 10, blue: 5 });
  const [course, setCourse] = useState(defaultCourse);
  const [scores, setScores] = useState({});

  useEffect(() => {
    const shots = getShotsGiven(handicaps.red, handicaps.blue, course);
    const newScores = {};
    course.forEach(h => {
      newScores[h.hole] = {
        red: 0,
        blue: 0,
        winner: '',
        shotsRed: shots.red[h.hole] || 0,
        shotsBlue: shots.blue[h.hole] || 0,
      };
    });
    setScores(newScores);
  }, [handicaps, course]);

  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games));
  }, [games]);

  const handleScore = (hole, team, delta) => {
    const updated = { ...scores };
    updated[hole][team] += delta;
    const redTotal = updated[hole].red - updated[hole].shotsRed;
    const blueTotal = updated[hole].blue - updated[hole].shotsBlue;
    if (redTotal < blueTotal) updated[hole].winner = 'red';
    else if (blueTotal < redTotal) updated[hole].winner = 'blue';
    else updated[hole].winner = '';
    setScores(updated);
  };

  const matchStatus = () => {
    let redWins = 0, blueWins = 0;
    Object.values(scores).forEach(s => {
      if (s.winner === 'red') redWins++;
      else if (s.winner === 'blue') blueWins++;
    });
    const diff = redWins - blueWins;
    if (diff === 0) return 'All Square';
    return diff > 0 ? `${teamNames.red} ${diff} Up` : `${teamNames.blue} ${Math.abs(diff)} Up`;
  };

  const saveGame = () => {
    const summary = {
      teamNames,
      handicaps,
      result: matchStatus(),
      scores,
    };
    const updatedGames = [...games];
    updatedGames[activeGameIndex] = summary;
    setGames(updatedGames);
  };

  const newGame = () => {
    setGames([...games, {}]);
    setActiveGameIndex(games.length);
    setScores({});
  };

  return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>

      <div className="teams">
        <input value={teamNames.red} onChange={e => setTeamNames({ ...teamNames, red: e.target.value })} />
        vs
        <input value={teamNames.blue} onChange={e => setTeamNames({ ...teamNames, blue: e.target.value })} />
      </div>

      <div className="handicaps">
        <label>{teamNames.red} Handicap Index <input type="number" value={handicaps.red} onChange={e => setHandicaps({ ...handicaps, red: +e.target.value })} /></label>
        <label>{teamNames.blue} Handicap Index <input type="number" value={handicaps.blue} onChange={e => setHandicaps({ ...handicaps, blue: +e.target.value })} /></label>
      </div>

      <h2>{matchStatus()}</h2>

      <div className="scorecard">
        {course.map(hole => (
          <div key={hole.hole} className="hole">
            <strong>Hole {hole.hole} (SI {hole.si})</strong>
            <div className="scores">
              <button onClick={() => handleScore(hole.hole, 'red', -1)}>-</button>
              <span className="red">{scores[hole.hole]?.red}</span>
              <button onClick={() => handleScore(hole.hole, 'red', 1)}>+</button>
              vs
              <button onClick={() => handleScore(hole.hole, 'blue', -1)}>-</button>
              <span className="blue">{scores[hole.hole]?.blue}</span>
              <button onClick={() => handleScore(hole.hole, 'blue', 1)}>+</button>
            </div>
            {scores[hole.hole]?.winner && (
              <div className={`winner ${scores[hole.hole].winner}`}>{teamNames[scores[hole.hole].winner]} wins hole</div>
            )}
          </div>
        ))}
      </div>

      <button onClick={saveGame}>Save Game</button>
      <button onClick={newGame}>New Game</button>

      <h3>Saved Games</h3>
      <ul>
        {games.map((g, i) => (
          <li key={i} onClick={() => setActiveGameIndex(i)}>
            Game {i + 1}: {g?.result || 'In Progress'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
