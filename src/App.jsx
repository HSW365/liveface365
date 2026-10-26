import { useEffect, useRef, useState } from 'react';
import {
  Aperture, ArrowUpRight, AudioLines, BadgeCheck, Camera, Check, ChevronDown,
  CircleHelp, Clapperboard, Copy, Crown, ExternalLink, Eye, EyeOff, Film,
  FlipHorizontal, Gauge, Heart, Info, Layers3, Link2, LockKeyhole, Monitor,
  MoreHorizontal, Radio, Settings2, ShieldCheck, Sparkles, Square, Users,
  Video, WandSparkles, X, Zap
} from 'lucide-react';

const looks = [
  { id: 'studio', name: 'Studio Glow', type: 'Creator', emoji: '✨', color: 'lavender', desc: 'Soft light and a clean creator look' },
  { id: 'cosmic', name: 'Cosmic Muse', type: 'Fantasy', emoji: '🌙', color: 'blue', desc: 'A dreamy, original digital persona' },
  { id: 'pop', name: 'Pop Icon', type: 'Style', emoji: '💫', color: 'pink', desc: 'Bold colors and camera-ready energy' },
  { id: 'comic', name: 'Comic Hero', type: 'Character', emoji: '⚡', color: 'lime', desc: 'A playful, fictional hero aesthetic' },
  { id: 'retro', name: 'Retro Star', type: 'Vintage', emoji: '🪩', color: 'peach', desc: 'Warm throwback color treatment' },
  { id: 'dream', name: 'Dreamscape', type: 'Fantasy', emoji: '🦋', color: 'mint', desc: 'An uplifting, surreal look' },
];

const navItems = [
  { label: 'Studio', icon: Aperture },
  { label: 'My looks', icon: Layers3 },
  { label: 'Stream setup', icon: Radio },
];

function App() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [selectedLook, setSelectedLook] = useState('studio');
  const [activeNav, setActiveNav] = useState('Studio');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [beauty, setBeauty] = useState(42);
  const [activeTab, setActiveTab] = useState('All looks');
  const [toast, setToast] = useState('');
  const [streamModal, setStreamModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentLook = looks.find((look) => look.id === selectedLook) || looks[0];

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access needs a secure HTTPS connection and a supported browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (error) {
      const messages = {
        NotAllowedError: 'Camera permission was blocked. Allow camera access in your browser settings, then try again.',
        NotFoundError: 'No camera was found. Connect a camera or try another device.',
        NotReadableError: 'Your camera may be in use by another app. Close it and try again.',
      };
      setCameraError(messages[error.name] || 'Camera could not start. Check your device permissions and try again.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const copySetup = async () => {
    const text = 'LiveFace365 streaming setup\n1. Open OBS Studio.\n2. Add a Video Capture Device for your camera.\n3. Add a Browser Source for supported LiveFace365 overlays when available.\n4. In your streaming platform, use its official stream key and destination. Never share your stream key.';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      notify('Open the setup guide and copy the steps manually.');
    }
  };

  const filteredLooks = looks.filter((look) => activeTab === 'All looks' || look.type === activeTab);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="LiveFace365 home">
          <span className="brand-mark"><Aperture size={22} strokeWidth={2.5} /><i /></span>
          <span className="brand-name">liveface<span>365</span><small>CREATOR STUDIO</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => {
              setActiveNav(label);
              if (label === 'Stream setup') setStreamModal(true);
              if (label === 'My looks') { setActiveTab('All looks'); document.getElementById('looks')?.scrollIntoView({ behavior: 'smooth' }); }
              if (label === 'Studio') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <Icon size={18} /><span>{label}</span>{label === 'My looks' && <span className="nav-count">06</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <div className="promo-art"><Sparkles size={23} /><span>MAKE IT</span><strong>YOUR<br />MOMENT.</strong></div>
          <p>Your camera. Your character. Your creative world.</p>
          <button className="text-button" onClick={() => setShowHelp(true)}>Explore the studio <ArrowUpRight size={15} /></button>
        </div>
        <div className="sidebar-bottom">
          <div className="status-line"><span className="status-dot" /> All systems ready</div>
          <button className="profile-button" onClick={() => notify('Account and billing will be available when sign-in is connected.')}>
            <span className="avatar-initials">HS</span><span className="profile-copy"><strong>HSW365 Creator</strong><small>Free workspace</small></span><MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <span className="plan-chip"><Sparkles size={13} /> CREATOR PLAN</span>
            <button className="icon-button" aria-label="Help" onClick={() => setShowHelp(true)}><CircleHelp size={19} /></button>
            <button className="upgrade-button" onClick={() => notify('Subscription checkout will be connected in the billing phase.')}>Upgrade <ArrowUpRight size={15} /></button>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR CREATIVE SPACE</div>
            <h1>Show up as <span>anything.</span></h1>
            <p className="welcome-subtitle">Build your on-camera vibe. Find your look. Get ready to go live.</p>
          </div>
          <div className="welcome-badge"><div className="badge-orbit"><Sparkles size={22} /></div><div><strong>Made for creators</strong><small>Imagine more. Create more.</small></div></div>
        </section>

        <section className="studio-grid">
          <div className="preview-column">
            <div className="section-heading">
              <div><span className="step-label">01 / CAMERA</span><h2>Your live preview</h2></div>
              <button className="subtle-icon-button" aria-label="Camera settings" onClick={() => setShowSettings(!showSettings)}><Settings2 size={18} /></button>
            </div>
            {showSettings && <div className="settings-panel">
              <div className="setting-row"><div><strong>Mirror preview</strong><small>Flip the preview horizontally</small></div><button className={`toggle ${mirror ? 'on' : ''}`} onClick={() => setMirror(!mirror)} aria-pressed={mirror}><span /></button></div>
              <div className="setting-row"><div><strong>Look intensity</strong><small>Preview styling intensity</small></div><span className="range-value">{beauty}%</span></div>
              <input className="intensity-slider" aria-label="Look intensity" type="range" min="0" max="100" value={beauty} onChange={(e) => setBeauty(Number(e.target.value))} />
            </div>}
            <div className={`camera-stage ${cameraOn ? 'camera-live' : ''} look-${currentLook.color}`}>
              <div className="stage-topline"><span className="live-indicator"><i /> {cameraOn ? 'CAMERA ON' : 'STUDIO PREVIEW'}</span><span className="stage-resolution"><span /> 16:9 · HD</span></div>
              {cameraOn ? (
                <video ref={videoRef} className={`camera-video ${mirror ? 'mirrored' : ''}`} autoPlay playsInline muted />
              ) : (
                <div className="camera-placeholder">
                  <div className="placeholder-orb orb-one" /><div className="placeholder-orb orb-two" /><div className="placeholder-orb orb-three" />
                  <div className="camera-illustration"><div className="illustration-halo" /><div className="illustration-head"><div className="illustration-hair" /><div className="illustration-face"><span className="eye left-eye" /><span className="eye right-eye" /><span className="nose" /><span className="smile" /></div></div><div className="illustration-body" /><span className="illustration-sparkle spark-a">✦</span><span className="illustration-sparkle spark-b">✧</span></div>
                  <div className="placeholder-copy"><strong>Your next look starts here.</strong><span>Turn on your camera to enter the studio.</span></div>
                  <button className="enable-camera" onClick={startCamera}><Camera size={17} /> Enable camera <ArrowUpRight size={15} /></button>
                  {cameraError && <div className="camera-error" role="alert">{cameraError}</div>}
                </div>
              )}
              {cameraOn && <div className="camera-active-overlay"><span className="active-look-pill">{currentLook.emoji} {currentLook.name}</span><button onClick={stopCamera} className="stop-camera"><Square size={13} fill="currentColor" /> Stop camera</button></div>}
              <div className="stage-bottomline"><span><span className={`connection-dot ${cameraOn ? 'green' : ''}`} /> {cameraOn ? 'Camera connected locally' : 'Camera not connected'}</span><span>Preview only · No video uploaded</span></div>
            </div>
            <div className="preview-controls">
              <button className="control-button" onClick={() => cameraOn ? stopCamera() : startCamera()}><Video size={17} /> {cameraOn ? 'Turn camera off' : 'Start camera'}</button>
              <button className="control-button" onClick={() => { setMirror(!mirror); notify(mirror ? 'Mirror preview disabled' : 'Mirror preview enabled'); }}><FlipHorizontal size={17} /> Flip</button>
              <button className="control-button" onClick={() => setShowSettings(!showSettings)}><Gauge size={17} /> Adjust look</button>
              <button className="go-live-button" onClick={() => setStreamModal(true)}><Radio size={17} /> Stream setup <ArrowUpRight size={15} /></button>
            </div>
            <div className="privacy-note"><ShieldCheck size={16} /><span><strong>Your camera stays yours.</strong> This preview runs in your browser. Live streaming and AI transformation need their respective integrations.</span><button aria-label="Learn about privacy" onClick={() => setShowHelp(true)}><Info size={15} /></button></div>
          </div>

          <aside className="looks-column" id="looks">
            <div className="section-heading look-heading"><div><span className="step-label">02 / YOUR VIBE</span><h2>Choose a look</h2></div><span className="look-total">06 LOOKS</span></div>
            <p className="panel-description">Pick an original style for your creator identity.</p>
            <div className="look-tabs" role="tablist" aria-label="Filter looks">
              {['All looks', 'Creator', 'Fantasy', 'Style'].map((tab) => <button role="tab" aria-selected={activeTab === tab} key={tab} className={activeTab === tab ? 'selected' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
            </div>
            <div className="looks-list">
              {filteredLooks.map((look) => (
                <button key={look.id} className={`look-card ${selectedLook === look.id ? 'chosen' : ''}`} onClick={() => { setSelectedLook(look.id); notify(`${look.name} selected`); }}>
                  <span className={`look-art ${look.color}`}><span className="look-art-orbit" /><span className="look-emoji">{look.emoji}</span><span className="look-art-star">✦</span></span>
                  <span className="look-info"><strong>{look.name}</strong><small>{look.desc}</small><span className="look-category">{look.type}</span></span>
                  <span className="look-select">{selectedLook === look.id ? <Check size={15} /> : <ArrowUpRight size={15} />}</span>
                </button>
              ))}
              {filteredLooks.length === 0 && <div className="empty-looks">More looks are coming soon.</div>}
            </div>
            <div className="selected-look-summary"><div className="summary-icon"><WandSparkles size={17} /></div><div><small>YOUR CURRENT LOOK</small><strong>{currentLook.name}</strong></div><span className="summary-ready"><i /> Selected</span></div>
            <button className="custom-look-button" onClick={() => notify('Custom avatar creation will be added with the AI provider integration.')}><Sparkles size={16} /> Create a custom look <span>Coming next</span></button>
          </aside>
        </section>

        <section className="workflow-section">
          <div className="workflow-intro"><span className="step-label">03 / THE NEXT STEP</span><h2>From your camera to your community.</h2><p>Get your creator setup ready, then connect the streaming tools you already use.</p></div>
          <div className="workflow-cards">
            <button className="workflow-card" onClick={() => { if (!cameraOn) startCamera(); else notify('Camera preview is ready.'); }}><span className="workflow-icon violet"><Camera size={20} /></span><span className="workflow-number">01</span><strong>Set your scene</strong><small>Check your camera, framing, and look.</small><span className="workflow-link">Open studio <ArrowUpRight size={14} /></span></button>
            <button className="workflow-card" onClick={() => setStreamModal(true)}><span className="workflow-icon orange"><Monitor size={20} /></span><span className="workflow-number">02</span><strong>Connect your stream</strong><small>Follow the setup guide for OBS and your platform.</small><span className="workflow-link">View setup <ArrowUpRight size={14} /></span></button>
            <button className="workflow-card" onClick={() => notify('Creator accounts and billing will be connected in a later release.')}><span className="workflow-icon green"><Users size={20} /></span><span className="workflow-number">03</span><strong>Grow your audience</strong><small>Build a recognizable creator identity.</small><span className="workflow-link">Creator tools <ArrowUpRight size={14} /></span></button>
          </div>
        </section>

        <footer className="footer"><a className="footer-brand" href="#"><span className="mini-brand-mark"><Aperture size={14} /></span> LIVEFACE365 <span>BY HSW365</span></a><span>Built for the next generation of creators.</span><div><button onClick={() => setShowHelp(true)}>Help center</button><button onClick={() => notify('Privacy policy page will be published before public launch.')}>Privacy</button><button onClick={() => notify('Terms page will be published before public launch.')}>Terms</button></div></footer>
      </main>

      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
      {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowHelp(false)} aria-label="Close"><X size={19} /></button><div className="modal-symbol"><Sparkles size={22} /></div><span className="step-label">LIVEFACE365 GUIDE</span><h2 id="help-title">Your creative studio, explained.</h2><p>LiveFace365 is the starting point for an original creator studio. Camera preview and look selection work in this version. Real-time face tracking, AI character rendering, account login, subscription billing, and direct platform streaming are separate integrations that still need to be connected.</p><div className="guide-points"><div><Camera size={17} /><span><strong>Camera access</strong><small>Use HTTPS and grant browser camera permission.</small></span></div><div><ShieldCheck size={17} /><span><strong>Use authorized likenesses</strong><small>Use your own face, licensed likenesses, or fictional characters.</small></span></div><div><Radio size={17} /><span><strong>Streaming connection</strong><small>Follow the setup guide. Never paste a stream key into a public page.</small></span></div></div><button className="modal-primary" onClick={() => { setShowHelp(false); setStreamModal(true); }}>Open stream setup <ArrowUpRight size={16} /></button></section></div>}
      {streamModal && <div className="modal-backdrop" onClick={() => setStreamModal(false)}><section className="modal-card stream-modal" role="dialog" aria-modal="true" aria-labelledby="stream-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setStreamModal(false)} aria-label="Close"><X size={19} /></button><div className="modal-symbol orange-symbol"><Radio size={22} /></div><span className="step-label">STREAMING WORKFLOW</span><h2 id="stream-title">Take your setup live.</h2><p>Use OBS Studio and your streaming platform's official connection settings. Direct TikTok LIVE access depends on account eligibility and platform permissions.</p><div className="setup-steps"><div><span>1</span><div><strong>Open OBS Studio</strong><small>Add your webcam as a Video Capture Device.</small></div><BadgeCheck size={17} /></div><div><span>2</span><div><strong>Set up your scene</strong><small>Arrange camera, microphone, overlays, and layout.</small></div><MoreHorizontal size={17} /></div><div><span>3</span><div><strong>Connect your platform</strong><small>Use official stream settings. Keep stream keys private.</small></div><LockKeyhole size={17} /></div></div><div className="stream-notice"><Info size={16} /><span>LiveFace365 does not yet send a stream or output transformed video. The guide prepares your workflow while streaming integration is being built.</span></div><button className="modal-primary" onClick={copySetup}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Setup steps copied' : 'Copy setup steps'}</button><button className="modal-secondary" onClick={() => { setStreamModal(false); notify('OBS setup guide closed.'); }}>Back to studio</button></section></div>}
    </div>
  );
}

export default App;