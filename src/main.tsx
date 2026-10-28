import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { birthday } from './config/birthday';
import './style.css';

type Screen = 'entrance' | 'game' | 'finale';
const fallbackName = birthday.recipientName.trim() || 'PLAYER ONE';
const partyGoal = 200;
const giftSprite = ['..DP.PD..', '.DPPPPPD.', '..DD.DD..', '.DDDDDDD.', 'DDDDDDDDD', 'DYYYYYYYD', 'DYYYDYYYD', 'DYYYDYYYD', 'DDDDDDDDD'];

function playTone(audio: AudioContext, frequency: number, start: number, duration: number, wave: OscillatorType, volume: number) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .01);
}

function App() {
  const [screen, setScreen] = useState<Screen>('entrance');
  const [coins, setCoins] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [tapLevel, setTapLevel] = useState(0);
  const [buddyLevel, setBuddyLevel] = useState(0);
  const [secretFound, setSecretFound] = useState(false);
  const [tapFx, setTapFx] = useState(0);
  const [upgradeFx, setUpgradeFx] = useState<{ type: 'tap' | 'buddy'; count: number } | null>(null);
  const musicOn = true;
  const sfxOn = true;
  const [bonus, setBonus] = useState(false);
  const [toast, setToast] = useState('Pick any treasure to begin!');
  const [celebration, setCelebration] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);

  function getAudio() {
    if (!audioContext.current || audioContext.current.state === 'closed') audioContext.current = new AudioContext();
    if (audioContext.current.state === 'suspended') void audioContext.current.resume();
    return audioContext.current;
  }

  useEffect(() => {
    if (!musicOn || (screen !== 'game' && screen !== 'finale')) return;
    let cancelled = false;
    let timer = 0;
    const audio = getAudio();
    const step = .15;
    const gameTune = [523, 0, 659, 784, 0, 659, 587, 0, 440, 0, 523, 659, 0, 587, 494, 0];
    const victoryTune = [784, 784, 0, 784, 0, 659, 784, 0, 880, 0, 784, 659, 587, 0, 659, 784, 880, 1047, 0, 1047, 880, 784, 1047, 1175];

    function playSequence(notes: number[], loop: boolean) {
      const start = audio.currentTime + .04;
      notes.forEach((note, index) => {
        if (!note) return;
        const at = start + index * step;
        playTone(audio, note, at, .12, index % 4 === 0 ? 'triangle' : 'square', .018);
        if (loop && index % 4 === 0) playTone(audio, note / 2, at, .14, 'triangle', .009);
      });
      if (loop) timer = window.setTimeout(() => { if (!cancelled) playSequence(notes, true); }, notes.length * step * 1000);
    }

    if (screen === 'game') playSequence(gameTune, true);
    else playSequence(victoryTune, false);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [musicOn, screen]);

  const tapCost = Math.floor(25 * 1.7 ** tapLevel);
  const buddyCost = Math.floor(60 * 1.8 ** buddyLevel);

  useEffect(() => {
    if (screen !== 'game' || buddyLevel === 0) return;
    const timer = window.setInterval(() => {
      setCoins(value => value + buddyLevel);
      setCoinsEarned(value => value + buddyLevel);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, buddyLevel]);

  useEffect(() => { document.title = `The Birthday Arcade — A special quest for ${fallbackName}`; }, []);
  useEffect(() => () => { void audioContext.current?.close(); }, []);

  function beep(frequency = 520) {
    if (!sfxOn) return;
    try {
      const audio = getAudio();
      playTone(audio, frequency, audio.currentTime, .085, 'square', .035);
    } catch { /* Sound remains an optional enhancement. */ }
  }

  function reset() {
    setScreen('entrance'); setCoins(0); setCoinsEarned(0); setTapCount(0); setTapLevel(0); setBuddyLevel(0); setSecretFound(false); setTapFx(0); setUpgradeFx(null); setBonus(false); setCelebration(0); setToast('Tap the coin to start your birthday run!');
  }

  function start() {
    beep();
    if (!birthday.enableMiniGame) { openFinale(); return; }
    setCoins(0); setCoinsEarned(0); setTapCount(0); setTapLevel(0); setBuddyLevel(0); setSecretFound(false); setTapFx(0); setUpgradeFx(null); setCelebration(0); setToast('Tap the coin to start your birthday run!'); setScreen('game');
  }

  function openFinale() { setScreen('finale'); setBonus(false); setCelebration(value => value + 1); beep(740); }

  function tapCoin() {
    setTapFx(value => value + 1);
    setCoins(value => value + 1 + tapLevel); setCoinsEarned(value => value + 1 + tapLevel);
    setTapCount(value => value + 1);
    setToast(tapCount + 1 === 1 ? 'Nice! The birthday coin is yours.' : 'Birthday magic collected!');
    beep(660 + (tapCount % 4) * 70);
  }

  function buyTapUpgrade() {
    if (coins < tapCost) return;
    setCoins(value => value - tapCost); setTapLevel(value => value + 1);
    setUpgradeFx(value => ({ type: 'tap', count: (value?.count ?? 0) + 1 }));
    setToast('POWER TAP upgraded! Every click is worth more.'); beep(820);
  }

  function buyBuddy() {
    if (coins < buddyCost) return;
    setCoins(value => value - buddyCost); setBuddyLevel(value => value + 1);
    setUpgradeFx(value => ({ type: 'buddy', count: (value?.count ?? 0) + 1 }));
    setToast('PIXEL BUDDY joined! It finds coins while you play.'); beep(900);
  }

  function findSecret() {
    if (secretFound) return;
    setSecretFound(true);
    setCoins(value => value + 100); setCoinsEarned(value => value + 100); setTapCount(value => Math.max(value, 15));
    setToast(`SECRET FOUND! ${birthday.secretMessage}`); setCelebration(value => value + 1); beep(990);
  }

  const pieces = celebration ? Array.from({ length: 72 }, (_, i) => <i key={`${celebration}-${i}`} className={i % 3 === 0 ? 'confetti-star' : ''} style={{ '--x': `${(i * 37) % 100}%`, '--delay': `${(i % 11) * .07}s`, '--duration': `${2 + (i % 20) / 10}s`, '--color': ['#ffca5c','#ff6d91','#79e4df','#bb8cff','#fff1d6'][i % 5] } as React.CSSProperties & Record<'--x' | '--delay' | '--duration' | '--color', string>} />) : null;

  return <main className="arcade">
    <div className="sky" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</div>
    <section className="screen" key={screen}>
      {screen === 'entrance' && <div className="panel entrance-panel">
        <div className="eyebrow">WELCOME, PLAYER ONE</div><h1>THE BIRTHDAY<br /><span>ARCADE</span></h1>
        <div className="hero-art" aria-hidden="true"><div className="floating-star star-a">✦</div><div className="floating-star star-b">✧</div><div className="cabinet"><div className="cabinet-marquee">HAPPY<br />B-DAY!</div><div className="cabinet-screen"><span>★</span><span>♥</span><span>★</span></div><div className="cabinet-controls"><i /><b /><b /></div></div><div className="floating-star star-c">✦</div></div>
        <p className="subtitle">{birthday.entranceSubtitle || 'INSERT COIN TO CELEBRATE'}</p><p className="blink">PRESS START</p>
        <div className="actions"><button className="pixel-button primary" onClick={start}>START GAME</button></div>
      </div>}
      {screen === 'game' && <div className="panel game-panel">
        <div className="hud"><span>PLAYER 1: {fallbackName.toUpperCase()}</span><span>LEVEL {String(1 + Math.floor(coins / 50)).padStart(2, '0')}</span></div>
        <h2>MISSION: {birthday.mainMission || 'UNLOCK THE CELEBRATION'}</h2>
        <div className="stats"><span>PIXEL COINS <b>{String(coins).padStart(5, '0')}</b></span><span className="coin-rate">+{buddyLevel}/SEC</span></div>
        <div className="clicker-layout">
          <div className="clicker-core">
            <div className="progress-label"><span>PARTY METER</span><span>{Math.min(100, Math.floor(coinsEarned / partyGoal * 100))}%</span></div>
            <div className="progress" role="progressbar" aria-label="Progress to the birthday party" aria-valuemin={0} aria-valuemax={partyGoal} aria-valuenow={Math.min(partyGoal, coinsEarned)}><i style={{ width: `${Math.min(100, coinsEarned / partyGoal * 100)}%` }} /></div>
            <div className="coin-stage">
              <div className="coin-burst" aria-hidden="true">{tapFx > 0 && Array.from({ length: 8 }, (_, i) => <i key={`${tapFx}-${i}`} style={{ '--burst-angle': `${i * 45}deg` } as React.CSSProperties & { '--burst-angle': string }} />)}</div>
              {tapFx > 0 && <span key={tapFx} className="tap-pop" aria-hidden="true">+{1 + tapLevel}</span>}
            <button className={`coin-button ${tapFx ? tapFx % 2 ? 'tap-a' : 'tap-b' : ''}`} onClick={tapCoin} aria-label={`Tap for ${1 + tapLevel} pixel coin${tapLevel ? 's' : ''}`}>
              <span className="coin-spark spark-one">*</span><span className="coin-face">P1</span><span className="coin-spark spark-two">*</span>
              <small>+{1 + tapLevel}</small>
            </button>
            </div>
            <p className="instruction">TAP THE COIN!</p>
            {birthday.enableSecret && tapCount >= 15 && !secretFound && <button className="secret-heart" onClick={findSecret} aria-label="Find the hidden birthday heart">{String.fromCodePoint(0x2665)}&nbsp; A TINY SECRET APPEARED!</button>}
          </div>
          <div className="upgrade-shop" aria-label="Upgrade shop">
            <div className="shop-title">PIXEL SHOP</div>
            <article key={upgradeFx?.type === 'tap' ? upgradeFx.count : 'tap'} className={`upgrade-card ${upgradeFx?.type === 'tap' ? 'upgrade-purchased' : ''}`}><div className="upgrade-icon" aria-hidden="true">{'\u26A1'}</div><div className="upgrade-copy"><h3>POWER TAP</h3><p>More coins with every tap. Level {tapLevel}</p><button className="buy-button" onClick={buyTapUpgrade} disabled={coins < tapCost}>BUY · {tapCost} COINS</button></div></article>
            <article key={upgradeFx?.type === 'buddy' ? upgradeFx.count : 'buddy'} className={`upgrade-card ${upgradeFx?.type === 'buddy' ? 'upgrade-purchased' : ''}`}><div className="upgrade-icon buddy-icon" aria-hidden="true">{'\u25A3'}</div><div className="upgrade-copy"><h3>PIXEL BUDDY</h3><p>Finds {buddyLevel || 1} coin{buddyLevel ? 's' : ''} every second. Level {buddyLevel}</p><button className="buy-button" onClick={buyBuddy} disabled={coins < buddyCost}>BUY · {buddyCost} COINS</button></div></article>
            <p className="shop-tip">Collect coins, buy upgrades, watch your meter climb!</p>
          </div>
        </div>
        <div className="toast" role="status">{toast}</div>
        <div className="actions end-actions"><button className="pixel-button primary" onClick={openFinale}>{coinsEarned >= partyGoal ? 'CLAIM YOUR BIRTHDAY PARTY!' : 'SKIP TO THE CELEBRATION'}</button></div>
      </div>}
      {screen === 'finale' && <div className="panel finale-panel">
        <div className="eyebrow">LEVEL COMPLETE!</div><h2 className="final-heading">HAPPY BIRTHDAY, {fallbackName.toUpperCase()}!</h2>
        <div className="pixel-cake" role="img" aria-label="A three-layer birthday cake with three glowing candles"><div className="flames"><i /><i /><i /></div><div className="candles"><i /><i /><i /></div><div className="cake-top" /><div className="cake-layer layer-one" /><div className="cake-layer layer-two" /><div className="cake-layer layer-three" /><div className="cake-plate" /></div>
        <article className="letter" aria-label="Birthday message">{birthday.birthdayMessage.map(line => <p key={line}>{line}</p>)}{birthday.senderName.trim() && <p className="signature">— {birthday.senderName}</p>}</article>
        {bonus && <div className="bonus" role="status"><span className="pixel-gift" role="img" aria-label="Pixel-art gift">{giftSprite.join('').split('').map((pixel, index) => <i key={index} className={pixel === '.' ? 'empty' : `gift-${pixel.toLowerCase()}`} />)}</span><div className="eyebrow">BONUS LOOT UNLOCKED</div><p>{birthday.bonusRewardMessage}</p></div>}
        <div className="actions"><button className="pixel-button primary" onClick={reset}>PLAY AGAIN</button><button className="pixel-button" onClick={() => setBonus(value => !value)}>SECRET REWARD</button></div>
      </div>}
    </section>
    <div className="confetti" aria-hidden="true" key={celebration}>{pieces}</div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
