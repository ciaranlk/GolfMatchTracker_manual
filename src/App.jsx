import React, { useState } from 'react';
import './App.css';

const defaultCourse = Array.from({ length: 18 }, (_, i) => ({
  hole: i + 1,
  par: 4,
  si: i + 1
}));

export default function App() {
  const [teamAName, setTeamAName] = useState("Team Red");
  const [teamBName, setTeamBName] = useState("Team Blue");
  const [handicapIndexA, setHandicapIndexA] = useState(10);
  const [handicapIndexB, setHandicapIndexB] = useState(14);
  const [slope, setSlope] = useState(120);
  const [rating, setRating] = useState(72);
  const [course, setCourse] = useState(defaultCourse);
  const [scores, setScores] = useState(Array(18).fill({ a: '', b: '' }));
  const [winners, setWinners] = useState(Array(18).fill(null));

  const calcPlayingHandicap = (index) => Math.round((index * slope) / 113);

  const shotsA = calcPlayingHandicap(handicapIndexA);
  const shotsB = calcPlayingHandicap(handicapIndexB);
  const shotDiff = Math.abs(shotsA - shotsB);
  const shotsGivenTo = shotsA > shotsB ? 'A' : 'B';

  const siHoles = [...course].sort((a, b) => a.si - b.si).slice(0, shotDiff).map(h => h.hole);

  const getNetScore = (raw, hole, player) => {
    if (raw === '') return null;
    let net = parseInt(raw);
    if (shotsGivenTo === 'A' && player === 'A' && siHoles.includes(hole)) net -= 1;
    if (shotsGivenTo === 'B' && player === 'B' && siHoles.includes(hole)) net -= 1;
    return net;
  };

  const updateScore = (i, player, value) => {
    const newScores = [...scores];
    newScores[i] = { ...newScores[i], [player]: value };
    setScores(newScores);

    const netA = getNetScore(newScores[i].a, i + 1, 'A');
    const netB = getNetScore(newScores[i].b, i + 1, 'B');

    if (netA == null || netB == null) {
      setWinners(prev => {
        const copy = [...prev];
        copy[i] = null;
        return copy;
      });
    } else if (netA < netB) {
      setWinners(prev => {
        const copy = [...prev];
        copy[i] = 'A';
        return copy;
      });
    } else if (netB < netA) {
      setWinners(prev => {
        const copy = [...prev];
        copy[i] = 'B';
        return copy;
      });
    } else {
      setWinners(prev => {
        const copy = [...prev];
        copy[i] = 'Halved';
        return copy;
      });
    }
  };

  const runningResult = () => {
    let score = 0;
    winners.forEach((w) => {
      if (w === 'A') score += 1;
      else if (w === 'B') score -= 1;
    });
    if (score === 0) return 'AS';
    return score > 0 ? `${teamAName} ${score} Up` : `${teamBName} ${Math.abs(score)} Up`;
  };

  return (
    <div className="app">
      <h1>Golf Matchplay Tracker</h1>

      <div className="inputs">
        <div><label>Team A Name</label><input value={teamAName} onChange={e => setTeamAName(e.target.value)} /></div>
        <div><label>Team B Name</label><input value={teamBName} onChange={e => setTeamBName(e.target.value)} /></div>
        <div><label>Handicap Index A</label><input type="number" value={handicapIndexA} onChange={e => setHandicapIndexA(+e.target.value)} /></div>
        <div><label>Handicap Index B</label><input type="number" value={handicapIndexB} onChange={e => setHandicapIndexB(+e.target.value)} /></div>
        <div><label>Course Rating</label><input type="number" value={rating} onChange={e => setRating(+e.target.value)} /></div>
        <div><label>Slope</label><input type="number" value={slope} onChange={e => setSlope(+e.target.value)} /></div>
      </div>

      <h2>Shots Given: {shotDiff} to {shotsGivenTo === 'A' ? teamAName : teamBName}</h2>
      <h2>Match Status: {runningResult()}</h2>

      <table>
        <thead>
          <tr>
            <th>Hole</th>
            <th>Par</th>
            <th>SI</th>
            <th>{teamAName} Gross</th>
            <th>{teamBName} Gross</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
          {course.map((hole, i) => (
            <tr key={i}>
              <td>{hole.hole}</td>
              <td><input type="number" value={hole.par} onChange={e => {
                const newCourse = [...course];
                newCourse[i].par = +e.target.value;
                setCourse(newCourse);
              }} /></td>
              <td><input type="number" value={hole.si} onChange={e => {
                const newCourse = [...course];
                newCourse[i].si = +e.target.value;
                setCourse(newCourse);
              }} /></td>
              <td><input type="number" value={scores[i].a} onChange={e => updateScore(i, 'a', e.target.value)} /></td>
              <td><input type="number" value={scores[i].b} onChange={e => updateScore(i, 'b', e.target.value)} /></td>
              <td>{winners[i] === 'A' ? teamAName : winners[i] === 'B' ? teamBName : winners[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
