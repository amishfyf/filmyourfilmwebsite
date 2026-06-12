import React, { useState, useEffect, useRef } from 'react';
import './clientGrid.css';

const LOGOS = [
  'abbott.png',
  'apollotyres.png',
  'dezerv.png',
  'facebook.png',
  'freshtohome.png',
  'kenstar.png',
  'kfc.png',
  'M3M.png',
  'msi.png',
  'oglivy.png',
  'Phillips.png',
  'RoyalEnfield.png',
  'toothsi.png',
  'UrbanCompany.png',
  'Vistara.png',
  'IndiaGate.png',
  'Amazon.png',
  'Powerade.png'
];

const NUM_CELLS = 8;

export default function ClientGrid() {
  const [cells, setCells] = useState(() =>
    Array.from({ length: NUM_CELLS }, (_, i) => ({
      id: i,
      currentLogo: LOGOS[i],
      nextLogo: null,
      isAnimating: false,
    }))
  );

  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const k = tickRef.current;
      const cellIdToAnimate = k % NUM_CELLS;
      const nextLogo = LOGOS[(k + NUM_CELLS) % LOGOS.length];

      setCells(prevCells => prevCells.map(c => {
        if (c.id === cellIdToAnimate) {
          return {
            ...c,
            nextLogo,
            isAnimating: true
          };
        }
        return c;
      }));

      tickRef.current = k + 1;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAnimationEnd = (cellId) => {
    setCells(prevCells =>
      prevCells.map(c => {
        if (c.id === cellId && c.isAnimating) {
          return {
            ...c,
            currentLogo: c.nextLogo,
            nextLogo: null,
            isAnimating: false
          };
        }
        return c;
      })
    );
  };

  return (
    <section className="client-section" id="clients">
      <h2 className="client-heading" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: "clamp(3rem, 9vw, 6.5rem)", marginBottom: "4rem", letterSpacing: "-0.03em", maxWidth: "1200px", margin: 0, lineHeight: 1 }}>Our Clients</h2>
      <div className="client-grid">
        {cells.map(cell => (
          <div key={cell.id} className="client-cell">
            <img
              src={`/logos/${cell.currentLogo}`}
              alt="Client Logo"
              className={`client-logo ${cell.isAnimating ? 'slide-out-down' : ''}`}
              onAnimationEnd={cell.isAnimating ? () => handleAnimationEnd(cell.id) : undefined}
            />

            {cell.isAnimating && cell.nextLogo && (
              <img
                src={`/logos/${cell.nextLogo}`}
                alt="Client Logo"
                className="client-logo slide-in-top"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
