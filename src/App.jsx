import React, { useState, useEffect } from 'react';
import './App.css';

function calculateCourseHandicap(handicapIndex, slope, rating, par = 72) {
  return Math.round(handicapIndex * (slope / 113) + (rating - par));
}

function getInitialGames() {
  const saved = localStorage.getItem('golfGames');
  return saved ? JSON.parse(saved) : [];
}

function App() {
  const [games, setGames] = useState(getInitialGames);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const [teamAName, setTeamAName] = useState('Team Red');
  const [teamBName, setTeamBName] = useState('Team Blue');
  const [handicapIndexA, setHandicapIndexA] = useState(10);
  const [handicapIndexB, setHandicapIndexB] = useState(14);
  const [courseRating, setCourseRating] = useState(72);
  const [slope, setSlope] = useState(120);

  const [holes, setHoles] = useState(
    Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 4,
      si: i + 1,
      scoreA: '',
      scoreB: '',
    }))
  );

  const courseHandicapA = calculateCourseHandicap(handicapIndexA, slope, courseRating);
  const courseHandicapB = calculateCourseHandicap(handicapIndexB, slope, courseRating);

  const shotsGiven = Math.abs(courseHandicapA - courseHandicapB);
  const shotsTo = courseHandicapA > courseHandicapB ? 'Team B' : 'Team A';

  const shotHoles = holes
    .slice()
    .sort((a, b) => a.si - b.si)
    .slice(0, shotsGiven)
    .map(h => h.hole);

  const determineWinner = (a, b, holeNumber) => {
    if (a === '' || b === '') return '';
    let adjA = parseInt(a);
    let adjB = parseInt(b);
    if (courseHandicapA > courseHandicapB && shotHoles.includes(holeNumber)) adjB--;
    if (courseHandicapB > courseHandicapA && shotHoles.includes(holeNumber)) adjA--;
    if (adjA < adjB) return teamAName;
    if (adjB < adjA) return teamBName;
    return 'Halved';
  };

  const getMatchStatus = () => {
    let score = 0;
    for (const hole of holes) {
      const winner = determineWinner(hole.scoreA, hole.scoreB, hole.hole);
      if (winner === teamAName) score++;
      else if (winner === teamBName) score--;
    }
    if (score === 0) return 'AS';
    return score > 0 ? `${teamAName} ${score} Up` : `${teamBName} ${Math.abs(score)} Up`;
  };

  useEffect(() => {
    const updatedGames = [...games];
    updatedGames[currentGameIndex] = {
      name: `${teamAName} vs ${teamBName}`,
      teamAName,
      teamBName,
      handicapIndexA,
      handicapIndexB,
      courseRating,
      slope,
      holes,
    };
    setGames(updatedGames);
    localStorage.setItem('golfGames', JSON.stringify(updatedGames));
  }, [teamAName, teamBName, handicapIndexA, handicapIndexB, courseRating, slope, holes]);

  const createNewGame = () => {
    const newGame = {
      name: `Game ${games.length + 1}`,
      teamAName: 'Team Red',
      teamBName: 'Team Blue',
      handicapIndexA: 10,
      handicapIndexB: 14,
      courseRating: 72,
      slope: 120,
      holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, si: i + 1, scoreA: '', scoreB: '' })),
    };
    const newGames = [...games, newGame];
    setGames(newGames);
    setCurrentGameIndex(newGames.length - 1);
  };

  useEffect(() => {
    if (games.length > 0) {
      const g = games[currentGameIndex];
      setTeamAName(g.teamAName);
      setTeamBName(g.teamBName);
      setHandicapIndexA(g.handicapIndexA);
      setHandicapIndexB(g.handicapIndexB);
      setCourseRating(g.courseRating);
      setSlope(g.slope);
      setHoles(g.holes);
    }
  }, [currentGameIndex]);

  return (
    <div className="App">
      <h1>Golf Matchplay Tracker</h1>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={createNewGame}>+ New Game</button>
        {games.map((g, i) => (
          <button
            key={i}
            onClick={() => setCurrentGameIndex(i)}
            style={{ marginLeft: '5px', fontWeight: currentGameIndex === i ? 'bold' : 'normal' }}
          >
            {g.name} ({getMatchStatus()})
          </button>
        ))}
      </div>

      <table>
        <tbody>
          <tr>
            <td><input value={teamAName} onChange={e => setTeamAName(e.target.value)} /></td>
            <td><input value={teamBName} onChange={e => setTeamBName(e.target.value)} /></td>
            <td>Handicap Index A <input value={handicapIndexA} onChange={e => setHandicapIndexA(+e.target.value)} /></td>
            <td>Handicap Index B <input value={handicapIndexB} onChange={e => setHandicapIndexB(+e.target.value)} /></td>
          </tr>
          <tr>
            <td>Course Rating <input value={courseRating} onChange={e => setCourseRating(+e.target.value)} /></td>
            <td>Slope <input value={slope} onChange={e => setSlope(+e.target.value)} /></td>
            <td>CH A: {courseHandicapA}</td>
            <td>CH B: {courseHandicapB}</td>
          </tr>
        </tbody>
      </table>

      <h3>Shots Given: {shotsGiven} to {shotsTo}</h3>
      <h3>Match Status: {getMatchStatus()}</h3>

      <table>
        <thead>
          <tr>
            <th>Hole</th>
            <th>Par</th>
            <th>SI</th>
            <th>{teamAName}</th>
            <th>{teamBName}</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {holes.map((hole, idx) => {
            const winner = determineWinner(hole.scoreA, hole.scoreB, hole.hole);
            return (
              <tr key={hole.hole}>
                <td>{hole.hole}</td>
                <td><input value={hole.par} onChange={e => {
                  const newHoles = [...holes];
                  newHoles[idx].par = +e.target.value;
                  setHoles(newHoles);
                }} /></td>
                <td><input value={hole.si} onChange={e => {
                  const newHoles = [...holes];
                  newHoles[idx].si = +e.target.value;
                  setHoles(newHoles);
                }} /></td>
                <td><input value={hole.scoreA} onChange={e => {
                  const newHoles = [...holes];
                  newHoles[idx].scoreA = e.target.value;
                  setHoles(newHoles);
                }} /></td>
                <td><input value={hole.scoreB} onChange={e => {
                  const newHoles = [...holes];
                  newHoles[idx].scoreB = e.target.value;
                  setHoles(newHoles);
                }} /></td>
                <td style={{ backgroundColor: winner === teamAName ? 'red' : winner === teamBName ? 'blue' : '', color: winner ? 'white' : 'black' }}>{winner}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
