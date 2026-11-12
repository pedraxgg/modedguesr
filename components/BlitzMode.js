import React, { useState, useEffect, useRef } from 'react';

export default function BlitzMode({ locations, onExit }) {
  const TOTAL_ROUNDS = 10;
  const ROUND_TIME = 5; // 5 segundos por rodada

  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [guessCoords, setGuessCoords] = useState(null);
  const timerRef = useRef(null);

  const currentLocation = locations[(round - 1) % locations.length];

  // Controla o cronômetro regressivo de 5 segundos
  useEffect(() => {
    if (gameOver) return;

    setTimeLeft(ROUND_TIME);
    setGuessCoords(null);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current);
          handleRoundEnd(null); // Tempo esgotado sem palpite
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [round, gameOver]);

  // Fórmula padrão de distância (Haversine) e pontuação (máx 5000 pts)
  const calculatePoints = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

    // Decaimento exponencial inspirado no GeoGuessr/WorldGuessr
    return Math.round(5000 * Math.exp(-distance / 2000));
  };

  // Avança imediatamente para a próxima rodada ou finaliza
  const handleRoundEnd = (coords) => {
    clearInterval(timerRef.current);

    if (coords && currentLocation) {
      const pts = calculatePoints(
        currentLocation.lat,
        currentLocation.lng,
        coords.lat,
        coords.lng
      );
      setScore((prev) => prev + pts);
    }

    if (round >= TOTAL_ROUNDS) {
      setGameOver(true);
    } else {
      setRound((prev) => prev + 1);
    }
  };

  if (gameOver) {
    return (
      <div className="blitz-gameover-modal">
        <h2>⚡ Fim do Modo Blitz!</h2>
        <p>Pontuação Total (10 rodadas): <strong>{score} / 50.000</strong></p>
        <button onClick={onExit}>Voltar ao Menu</button>
      </div>
    );
  }

  return (
    <div className="blitz-hud">
      {/* Segue o padrão visual do DESIGN.md do WorldGuessr */}
      <div className={`timer ${timeLeft <= 2 ? 'critical' : ''}`}>
        ⚡ Rodada {round}/{TOTAL_ROUNDS} | ⏱️ {timeLeft}s | 🏆 {score} pts
      </div>

      {/* Aqui entra o iframe/componente do Street View e o Minimapa Leaflet */}
      {/* No evento de clique/confirmação do minimapa, chame: handleRoundEnd({ lat, lng }) */}
    </div>
  );
}
