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
  const [inputs, setInputs] = useState({
    redName: 'Red',
    blueName: 'Blue',
    redIndex: 10,
    blueIndex: 8,
    rating: 72,
    slope: 113
  });

  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games));
  }, [games]);

  const startGame = () => {
    const chRed = calculateCourseHandicap(inputs.redIndex, inputs.slope, inputs.rating);
    const chBlue = calculateCourseHandicap(inputs.blueIndex, inputs.slope, inputs.rating);
    const shotsGiven = Math.abs(chRed - chBlue);
    const shotsTo = chRed > chBlue ? 'Blue' : 'Red';

    const sortedSI = Array.from({ length: 18 }, (_, i) => i + 1).sort((a, b) => a - b); // SI 1 to 18

    const newGame = {
      redName: inputs.redName,
      blueName: inputs.blueName,
      redIndex: inputs.redIndex,
      blueIndex: inputs.blueIndex,
      rating: inputs.rating,
      slope: inputs.slope,
      chRed,
      chBlue,
      shotsGiven,
      shotsTo,
      holes: Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        par: 4,
        si: i + 1,
        red: 0,
        blue: 0
      }))
    };
    setGames([...games, newGame]);
    setActiveGameIndex(games.length);
  };

  const updateHole = (index, team, delta) => {
    const updatedGames = [...games];
    updatedGames[activeGameIndex].holes[index][team] += delta;
    if (updatedGames[activeGameIndex].holes[index][team] < 0) {
      updatedGames[activeGameIndex].holes[index][team] = 0;
    }
    setGames(updatedGames);
  };

  const calculateResult = (hole) => {
    const { red, blue, si } = hole;
    const game = games[activeGameIndex];
    const { shotsGiven, shotsTo } = game;

    let redScore = red;
    let blueScore = blue;

    // Determine if this hole gets a stroke based on SI
    if (shotsGiven > 0) {
      const strokeHoles = Array.from({ length: shotsGiven }, (_, i) => i + 1); // SI 1, 2, ..., shotsGiven
      if (strokeHoles.includes(si)) {
        if (shotsTo === 'Red') redScore -= 1;
        if (shotsTo === 'Blue') blueScore -= 1;
      }
    }

    if (redScore < blueScore) return game.redName;
    if (blueScore < redScore) return game.blueName;
    return 'Half';
  };

  const computeMatchStatus = (game) => {
    let redUp = 0;
    let blueUp = 0;
    game.holes.forEach(hole => {
      const result = calculateResult(hole);
      if (result === game.redName) redUp++;
      else if (result === game.blueName) blueUp++;
    });

    const diff = redUp - blueUp;
    if (diff > 0) return `${game.redName} ${diff} Up`;
    if (diff < 0) return `${game.blueName} ${-diff} Up`;
    return 'All Square';
  };

  return (
    <div className="app-container">
      <h1>Golf Matchplay Tracker</h1>
      <div className="game-list">
        {games.map((game, index) => (
          <button
            key={index}
            onClick={() => setActiveGameIndex(index)}
            className={index === activeGameIndex ? 'active' : ''}
          >
            {game.redName} vs {game.blueName} ({computeMatchStatus(game)})
          </button>
        ))}
        <button onClick={startGame}>+ New Game</button>
      </div>

      <div className="course-form">
        <input
          placeholder="Red"
          value={inputs.redName}
          onChange={e => setInputs({ ...inputs, redName: e.target.value })}
        />
        <input
          placeholder="Blue"
          value={inputs.blueName}
          onChange={e => setInputs({ ...inputs, blueName: e.target.value })}
        />
        <input
          type="number"
          value={inputs.redIndex}
          onChange={e => setInputs({ ...inputs, redIndex: +e.target.value })}
        />
        <input
          type="number"
          value={inputs.blueIndex}
          onChange={e => setInputs({ ...inputs, blueIndex: +e.target.value })}
        />
        <input
          type="number"
          value={inputs.rating}
          onChange={e => setInputs({ ...inputs, rating: +e.target.value })}
        />
        <input
          type="number"
          value={inputs.slope}
          onChange={e => setInputs({ ...inputs, slope: +e.target.value })}
        />
        <button onClick={startGame}>Start Game</button>
      </div>

      {games[activeGameIndex] && (
        <div>
          <h3>{games[activeGameIndex].redName} vs {games[activeGameIndex].blueName}</h3>
          <p>{games[activeGameIndex].redName} CH: {games[activeGameIndex].chRed}, {games[activeGameIndex].blueName} CH: {games[activeGameIndex].chBlue}</p>
          <table>
            <thead>
              <tr>
                <th>Hole</th><th>Par</th><th>SI</th>
                <th>{games[activeGameIndex].redName}</th>
                <th>{games[activeGameIndex].blueName}</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {games[activeGameIndex].holes.map((hole, i) => (
                <tr key={i}>
                  <td>{hole.hole}</td>
                  <td><input value={hole.par} onChange={e => {
                    const updated = [...games];
                    updated[activeGameIndex].holes[i].par = +e.target.value;
                    setGames(updated);
                  }} /></td>
                  <td><input value={hole.si} onChange={e => {
                    const updated = [...games];
                    updated[activeGameIndex].holes[i].si = +e.target.value;
                    setGames(updated);
                  }} /></td>
                  <td>
                    <button onClick={() => updateHole(i, 'red', -1)}>-</button>
                    {hole.red}
                    <button onClick={() => updateHole(i, 'red', 1)}>+</button>
                  </td>
                  <td>
                    <button onClick={() => updateHole(i, 'blue', -1)}>-</button>
                    {hole.blue}
                    <button onClick={() => updateHole(i, 'blue', 1)}>+</button>
                  </td>
                  <td>{calculateResult(hole)}</td>
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
