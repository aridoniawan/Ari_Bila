import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const dpMessages = [
  "Yeay! Satu langkah lebih dekat! 💸",
  "Alhamdulillah, rejeki lancar! ✨",
  "Vendor aman! Makin mantap nih persiapannya! 🔥",
  "Wohoo! DP sukses dibayar! Lanjut persiapan berikutnya! 🚀"
];

const taskMessages = [
  "Wah hebat! Satu tugas beres! 🤩",
  "Keren banget! Semangat terus persiapannya! 💪",
  "Mantap! Makin dekat ke hari H! 💖",
  "Kerja bagus! Yuk selesaikan yang lain! 🎯"
];

const Celebration = () => {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCelebrate = (event) => {
      const type = event.detail?.type || 'task';
      const messages = type === 'dp' ? dpMessages : taskMessages;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      setMessage(randomMsg);
      setActive(true);

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF69B4', '#ff8fa3', '#ff4d6d', '#ffd166', '#06d6a0'],
        zIndex: 10000
      });

      setTimeout(() => {
        setActive(false);
      }, 4000);
    };

    window.addEventListener('celebrate', handleCelebrate);
    return () => window.removeEventListener('celebrate', handleCelebrate);
  }, []);

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 9999,
      backgroundColor: 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeInOut 4s forwards'
    }}>
      <div style={{
        background: 'white',
        padding: '1.5rem 2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'var(--color-primary)',
        textAlign: 'center',
        animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        border: '3px solid var(--color-primary)',
        transform: 'scale(0)'
      }}>
        {message}
      </div>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Celebration;
