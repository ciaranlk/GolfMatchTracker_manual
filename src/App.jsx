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
  const [activeGame, setActiveGame] = useState(0);
  const [teamA, setTeamA] = useState('Red');
  const [teamB, setTeamB] = useState('Blue');
  const [indexA, setIndexA] = useState(10);
  const [indexB, setIndexB] = useState(8);
  const [courseRating, setCourseRating] = useState(72);
  const [slope, setSlope] = useState(113);

  const addGame = () => {
    const chA = calculateCourseHandicap(indexA, slope, courseRating);
    const chB = calculateCourseHandicap(indexB, slope, courseRating);
    const shots = Math.abs(chA - chB);
    const shotsTo = chA > chB ? 'A' : 'B';

    const holes = Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 4,
      si: i + 1,
      scoreA: 0,
      scoreB: 0,
    }));

    const newGame = {
      teamA,
      teamB,
      indexA,
      indexB,
      courseRating,
      slope,
      chA,
      chB,
      shots,
      shotsTo,
      holes,
    };
    setGames([...games, newGame]);
    setActiveGame(games.length);
  };

  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games));
  }, [games]);

  const handleScoreChange = (holeIdx, team, delta) => {
    const updatedGames = [...games];
    const currentGame = updatedGames[activeGame];
    const hole = currentGame.holes[holeIdx];
    if (team === 'A') {
      hole.scoreA = Math.max(0, hole.scoreA + delta);
    } else {
      hole.scoreB = Math.max(0, hole.scoreB + delta);
    }
    setGames(updatedGames);
  };

  const calculateResults = (game) => {
    let aScore = 0;
    let bScore = 0;
    let remaining = 18;
    const perHoleResults = game.holes.map(hole => {
      const { scoreA, scoreB, si } = hole;
      let netA = scoreA;
      let netB = scoreB;
      if (game.shotsTo === 'A' && si <= game.shots) netA--;
      if (game.shotsTo === 'B' && si <= game.shots) netB--;

      if (scoreA === 0 && scoreB === 0) return '-';

      if (netA < netB) aScore++;
      else if (netB < netA) bScore++;
      else return 'Half';

      remaining--;
      if (aScore > bScore + remaining) return `${game.teamA}`;
      if (bScore > aScore + remaining) return `${game.teamB}`;
      return aScore > bScore ? `${game.teamA}` : `${game.teamB}`;
    });

    const diff = aScore - bScore;
    const matchStatus =
      diff === 0 ? 'All Square'
        : diff > 0 ? `${game.teamA} ${diff} Up`
        : `${game.teamB} ${-diff} Up`;
    return { perHoleResults, matchStatus };
  };

  const { perHoleResults, matchStatus } = games[activeGame]
    ? calculateResults(games[activeGame])
    : { perHoleResults: [], matchStatus: '' };

  return (
    <div className="App">
      <h1>Golf Match Tracker</h1>

      <div style={{ marginBottom: '10px' }}>
        <input value={teamA} onChange={e => setTeamA(e.target.value)} /> vs
        <input value={teamB} onChange={e => setTeamB(e.target.value)} />
        <input value={indexA} onChange={e => setIndexA(Number(e.target.value))} />
        <input value={indexB} onChange={e => setIndexB(Number(e.target.value))} />
        <input value={courseRating} onChange={e => setCourseRating(Number(e.target.value))} />
        <input value={slope} onChange={e => setSlope(Number(e.target.value))} />
        <button onClick={addGame}>Start Game</button>
      </div>

      <div>
        {games.map((game, idx) => (
          <button
            key={idx}
            onClick={() => setActiveGame(idx)}
            style={{ fontWeight: activeGame === idx ? 'bold' : 'normal' }}
          >
            {`${game.teamA} vs ${game.teamB} (${calculateResults(game).matchStatus})`}
          </button>
        ))}
      </div>

      {games[activeGame] && (
        <div>
          <h2>{games[activeGame].teamA} vs {games[activeGame].teamB}</h2>
          <p>Red CH: {games[activeGame].chA}, Blue CH: {games[activeGame].chB}</p>
          <p>{matchStatus}</p>

          <table>
            <thead>
              <tr>
                <th>Hole</th>
                <th>Par</th>
                <th>SI</th>
                <th>{games[activeGame].teamA}</th>
                <th>{games[activeGame].teamB}</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {games[activeGame].holes.map((hole, idx) => (
                <tr key={idx}>
                  <td>{hole.hole}</td>
                  <td><input value={hole.par} onChange={e => {
                    const updated = [...games];
                    updated[activeGame].holes[idx].par = Number(e.target.value);
                    setGames(updated);
                  }} /></td>
                  <td><input value={hole.si} onChange={e => {
                    const updated = [...games];
                    updated[activeGame].holes[idx].si = Number(e.target.value);
                    setGames(updated);
                  }} /></td>
                  <td>
                    <button onClick={() => handleScoreChange(idx, 'A', -1)}>-</button>
                    {hole.scoreA}
                    <button onClick={() => handleScoreChange(idx, 'A', 1)}>+</button>
                  </td>
                  <td>
                    <button onClick={() => handleScoreChange(idx, 'B', -1)}>-</button>
                    {hole.scoreB}
                    <button onClick={() => handleScoreChange(idx, 'B', 1)}>+</button>
                  </td>
                  <td>{perHoleResults[idx]}</td>
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
