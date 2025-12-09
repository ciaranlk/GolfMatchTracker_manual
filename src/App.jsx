import React, { useState } from 'react';
import './App.css';

function App() {
  const initialHoles = Array.from({ length: 18 }, (_, i) => ({
    hole: i + 1,
    par: 4,
    si: i + 1,
    redGross: '',
    blueGross: '',
  }));

  const [teamA, setTeamA] = useState('Team Red');
  const [teamB, setTeamB] = useState('Team Blue');
  const [handicapA, setHandicapA] = useState(10);
  const [handicapB, setHandicapB] = useState(14);
  const [courseRating, setCourseRating] = useState(72);
  const [slope, setSlope] = useState(120);
  const [holes, setHoles] = useState(initialHoles);

  const diff = Math.abs(handicapA - handicapB);
  const shotsGivenTo = handicapA < handicapB ? teamB : teamA;

  const sortedBySI = [...holes].sort((a, b) => a.si - b.si);
  const holesToApplyShots = sortedBySI.slice(0, diff).map(h => h.hole);

  const getNetScore = (gross, shots) => {
    const parsed = parseInt(gross);
    return isNaN(parsed) ? null : parsed - shots;
  };

  const getHoleWinner = (hole) => {
    const redGross = parseInt(hole.redGross);
    const blueGross = parseInt(hole.blueGross);
    if (isNaN(redGross) || isNaN(blueGross)) return '';

    const redShots = shotsGivenTo === teamA && holesToApplyShots.includes(hole.hole) ? 1 : 0;
    const blueShots = shotsGivenTo === teamB && holesToApplyShots.includes(hole.hole) ? 1 : 0;

    const redNet = redGross - redShots;
    const blueNet = blueGross - blueShots;

    if (redNet < blueNet) return teamA;
    if (blueNet < redNet) return teamB;
    return 'Tie';
  };

  const getMatchStatus = () => {
    let redWins = 0;
    let blueWins = 0;
    let holesPlayed = 0;

    for (let hole of holes) {
      const winner = getHoleWinner(hole);
      if (winner === teamA) redWins++;
      else if (winner === teamB) blueWins++;
      holesPlayed++;

      const remaining = 18 - holesPlayed;
      if (redWins - blueWins > remaining) return `${teamA} ${redWins - blueWins} Up`;
      if (blueWins - redWins > remaining) return `${teamB} ${blueWins - redWins} Up`;
    }

    if (redWins > blueWins) return `${teamA} ${redWins - blueWins} Up`;
    if (blueWins > redWins) return `${teamB} ${blueWins - redWins} Up`;
    return 'AS';
  };

  const handleHoleChange = (index, field, value) => {
    const updated = [...holes];
    updated[index][field] = value;
    setHoles(updated);
  };

  return (
    <div className="App">
      <h2>Golf Matchplay Tracker</h2>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div>
          <label>Team A Name</label><br />
          <input value={teamA} onChange={e => setTeamA(e.target.value)} />
        </div>
        <div>
          <label>Team B Name</label><br />
          <input value={teamB} onChange={e => setTeamB(e.target.value)} />
        </div>
        <div>
          <label>Handicap Index A</label><br />
          <input type="number" value={handicapA} onChange={e => setHandicapA(+e.target.value)} />
        </div>
        <div>
          <label>Handicap Index B</label><br />
          <input type="number" value={handicapB} onChange={e => setHandicapB(+e.target.value)} />
        </div>
        <div>
          <label>Course Rating</label><br />
          <input type="number" value={courseRating} onChange={e => setCourseRating(+e.target.value)} />
        </div>
        <div>
          <label>Slope</label><br />
          <input type="number" value={slope} onChange={e => setSlope(+e.target.value)} />
        </div>
      </div>

      <h4>Shots Given: {diff} to {shotsGivenTo}</h4>
      <h4>Match Status: {getMatchStatus()}</h4>

      <table>
        <thead>
          <tr>
            <th>Hole</th>
            <th>Par</th>
            <th>SI</th>
            <th>{teamA} Gross</th>
            <th>{teamB} Gross</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
          {holes.map((hole, index) => {
            const winner = getHoleWinner(hole);
            return (
              <tr key={index}>
                <td>{hole.hole}</td>
                <td>
                  <input
                    type="number"
                    value={hole.par}
                    onChange={e => handleHoleChange(index, 'par', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={hole.si}
                    onChange={e => handleHoleChange(index, 'si', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={hole.redGross}
                    onChange={e => handleHoleChange(index, 'redGross', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={hole.blueGross}
                    onChange={e => handleHoleChange(index, 'blueGross', e.target.value)}
                  />
                </td>
                <td>{winner}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
