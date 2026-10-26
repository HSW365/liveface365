import { useEffect, useRef, useState } from 'react';
import {
  Aperture, ArrowUpRight, AudioLines, BadgeCheck, Camera, Check, ChevronDown,
  CircleHelp, Clapperboard, Copy, Crown, ExternalLink, Eye, EyeOff, Film,
  FlipHorizontal, Gauge, Heart, Info, Layers3, Link2, LockKeyhole, Monitor,
  MoreHorizontal, Radio, Settings2, ShieldCheck, Sparkles, Square, Users,
  Video, WandSparkles, X, Zap, Server, Code2
} from 'lucide-react';

const looks = [
  { id: 'studio', name: 'Studio Glow', type: 'Creator', emoji: 'S', color: 'lavender', desc: 'Soft light and a clean creator look' },
  { id: 'cosmic', name: 'Cosmic Muse', type: 'Fantasy', emoji: 'C', color: 'blue', desc: 'A dreamy, original digital persona' },
  { id: 'pop', name: 'Pop Icon', type: 'Style', emoji: 'P', color: 'pink', desc: 'Bold colors and camera-ready energy' },
  { id: 'comic', name: 'Comic Hero', type: 'Character', emoji: 'H', color: 'lime', desc: 'A playful, fictional hero aesthetic' },
  { id: 'retro', name: 'Retro Star', type: 'Vintage', emoji: 'R', color: 'peach', desc: 'Warm throwback color treatment' },
  { id: 'dream', name: 'Dreamscape', type: 'Fantasy', emoji: 'D', color: 'mint', desc: 'An uplifting, surreal look' },
];

const navItems = [
  { label: 'Studio', icon: Aperture },
  { label: 'My looks', icon: Layers3 },
  { label: 'Stream setup', icon: Radio },
  { label: 'Frontend', icon: Monitor },
  { label: 'Backend', icon: Server },
  { label: 'Account & billing', icon: LockKeyhole },
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
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingFrameRef = useRef(null);
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const [sessionToken, setSessionToken] = useState(() => window.sessionStorage.getItem('liveface365_token') || '');
  const [account, setAccount] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const currentLook = looks.find((look) => look.id === selectedLook) || looks[0];
  const lookFilters = {
    studio: 'brightness(1.06) contrast(1.04) saturate(1.08)',
    cosmic: 'hue-rotate(24deg) saturate(1.32) contrast(1.06)',
    pop: 'saturate(1.65) contrast(1.12)',
    comic: 'saturate(1.9) contrast(1.24)',
    retro: 'sepia(.32) saturate(1.2) contrast(1.04)',
    dream: 'hue-rotate(-18deg) saturate(1.28) brightness(1.08)',
  };
  const intensity = beauty / 100;
  const cameraFilter = selectedLook === 'cosmic'
    ? `hue-rotate(${24 * intensity}deg) saturate(${1 + .32 * intensity}) contrast(${1 + .06 * intensity})`
    : selectedLook === 'pop'
      ? `saturate(${1 + .65 * intensity}) contrast(${1 + .12 * intensity})`
      : selectedLook === 'comic'
        ? `saturate(${1 + .9 * intensity}) contrast(${1 + .24 * intensity})`
        : selectedLook === 'retro'
          ? `sepia(${.32 * intensity}) saturate(${1 + .2 * intensity}) contrast(${1 + .04 * intensity})`
          : selectedLook === 'dream'
            ? `hue-rotate(${-18 * intensity}deg) saturate(${1 + .28 * intensity}) brightness(${1 + .08 * intensity})`
            : `brightness(${1 + .06 * intensity}) contrast(${1 + .04 * intensity}) saturate(${1 + .08 * intensity})`;

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

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) { notify('Start the camera before taking a snapshot.'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) { notify('Snapshot could not be created in this browser.'); return; }
    if (mirror) { context.translate(canvas.width, 0); context.scale(-1, 1); }
    context.filter = cameraFilter;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.download = 'liveface365-' + currentLook.id + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    notify('Snapshot saved to your device.');
  };

  const startRecording = () => {
    setRecordingError('');
    const stream = streamRef.current;
    if (!stream) { notify('Start your camera before recording.'); return; }
    if (!window.MediaRecorder) { setRecordingError('Recording is not supported in this browser.'); return; }
    try {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight || !document.createElement('canvas').captureStream) {
        setRecordingError('This browser cannot record the processed camera preview.'); return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      const drawFrame = () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          recordingFrameRef.current = window.requestAnimationFrame(drawFrame); return;
        }
        context.filter = cameraFilter;
        if (mirror) { context.save(); context.translate(canvas.width, 0); context.scale(-1, 1); context.drawImage(video, 0, 0, canvas.width, canvas.height); context.restore(); }
        else context.drawImage(video, 0, 0, canvas.width, canvas.height);
        recordingFrameRef.current = window.requestAnimationFrame(drawFrame);
      };
      drawFrame();
      const processedStream = canvas.captureStream(30);
      const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = types.find((type) => window.MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(processedStream, mimeType ? { mimeType } : undefined);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data && event.data.size) recordedChunksRef.current.push(event.data); };
      recorder.onerror = () => { setRecording(false); setRecordingError('Recording stopped because the browser reported an error.'); };
      recorder.onstop = () => {
        if (recordingFrameRef.current) window.cancelAnimationFrame(recordingFrameRef.current);
        processedStream.getTracks().forEach((track) => track.stop());
        const chunks = recordedChunksRef.current;
        if (!chunks.length) { setRecordingError('No recording data was produced. Try again.'); return; }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'liveface365-recording-' + new Date().toISOString().replace(/[:.]/g, '-') + '.webm';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        notify('Recording saved to your device.');
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      notify('Recording started. Keep this tab open while recording.');
    } catch {
      setRecordingError('Could not start recording. Check browser support and camera permission.');
    }
  };

  const stopRecording = () => {
    if (recordingFrameRef.current) window.cancelAnimationFrame(recordingFrameRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    setRecording(false);
  };

  const stopCamera = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') stopRecording();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const apiCall = async (path, options = {}) => {
    if (!apiBase) throw new Error('API address is not configured in the production build yet.');
    const response = await fetch(apiBase.replace(/\/$/, '') + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(sessionToken ? { Authorization: 'Bearer ' + sessionToken } : {}), ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed. Try again.');
    return data;
  };

  const loadAccount = async () => {
    if (!sessionToken) return;
    try {
      const data = await apiCall('/api/me');
      setAccount(data.user);
      setSubscription(data.subscription);
    } catch (error) {
      setAccount(null);
      setSubscription(null);
      if (error.message.includes('Session expired') || error.message.includes('Sign in')) {
        window.sessionStorage.removeItem('liveface365_token');
        setSessionToken('');
      }
    }
  };

  useEffect(() => { if (sessionToken) loadAccount(); }, [sessionToken]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const data = await apiCall('/api/auth/' + (authMode === 'register' ? 'register' : 'login'), {
        method: 'POST', body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      window.sessionStorage.setItem('liveface365_token', data.token);
      setSessionToken(data.token);
      setAccount(data.user);
      setAuthPassword('');
      notify(authMode === 'register' ? 'Account created.' : 'Signed in.');
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };

  const signOut = () => {
    window.sessionStorage.removeItem('liveface365_token');
    setSessionToken('');
    setAccount(null);
    setSubscription(null);
    notify('Signed out.');
  };

  const startCheckout = async (plan) => {
    if (!sessionToken) { setActiveNav('Account & billing'); setAuthError('Sign in or create an account before choosing a subscription.'); notify('Sign in to continue to checkout.'); return; }
    try {
      const data = await apiCall('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ plan }) });
      window.location.assign(data.url);
    } catch (error) { setAuthError(error.message); notify(error.message); }
  };

  const openBillingPortal = async () => {
    try {
      const data = await apiCall('/api/billing/portal', { method: 'POST', body: JSON.stringify({}) });
      window.location.assign(data.url);
    } catch (error) { setAuthError(error.message); notify(error.message); }
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
              if (label === 'Frontend' || label === 'Backend' || label === 'Account & billing') window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="status-line"><span className="status-dot" /> Frontend preview available</div>
          <button className="profile-button" onClick={() => notify('Account and billing will be available when sign-in is connected.')}>
            <span className="avatar-initials">HS</span><span className="profile-copy"><strong>HSW365 Creator</strong><small>Free workspace</small></span><MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <span className="plan-chip"><Sparkles size={13} /> PREVIEW MODE</span>
            <button className="icon-button" aria-label="Help" onClick={() => setShowHelp(true)}><CircleHelp size={19} /></button>
            <button className="upgrade-button" onClick={() => notify('Subscription checkout will be connected in the billing phase.')}>Upgrade <ArrowUpRight size={15} /></button>
          </div>
        </header>

        {(activeNav === 'Studio' || activeNav === 'My looks' || activeNav === 'Stream setup') && <>
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
                <video ref={videoRef} className={`camera-video ${mirror ? 'mirrored' : ''}`} style={{ filter: cameraFilter }} autoPlay playsInline muted />
              ) : (
                <div className="camera-placeholder">
                  <div className="placeholder-orb orb-one" /><div className="placeholder-orb orb-two" /><div className="placeholder-orb orb-three" />
                  <div className="camera-illustration minimal-portrait" aria-hidden="true"><span className="portrait-frame-line" /><span className="portrait-core" /><span className="portrait-base" /></div>
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
              <button className="control-button" onClick={captureSnapshot} disabled={!cameraOn}><Camera size={16} /> Snapshot</button>
              <button className={`control-button record-button ${recording ? 'is-recording' : ''}`} onClick={recording ? stopRecording : startRecording} disabled={!cameraOn}>{recording ? <Square size={14} fill="currentColor" /> : <Film size={16} />}{recording ? 'Stop & save' : 'Record locally'}</button>
              <button className="go-live-button" onClick={() => setStreamModal(true)}><Radio size={17} /> Stream setup <ArrowUpRight size={15} /></button>
            </div>
            {recordingError && <p className="recording-error" role="alert">{recordingError}</p>}
            <p className="local-media-note">Looks are real-time color treatments—not AI face replacement. Snapshots and recordings stay in this browser until you save them.</p>
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
        </>}
        {activeNav === 'Frontend' && <section className="systems-page">
          <div className="system-intro"><div><span className="step-label">PRODUCT SYSTEMS / 01</span><h1>Frontend <span>experience.</span></h1><p>Everything the creator sees and interacts with in the browser.</p></div><span className="system-status"><i /> STATIC APP AVAILABLE</span></div>
          <div className="system-hero"><div className="system-icon"><Monitor size={22} /></div><div><small>CLIENT APPLICATION</small><h2>React + Vite</h2><p>Responsive single-page interface hosted on GitHub Pages.</p></div><span className="status-tag">CURRENT</span></div>
          <div className="system-metrics"><article><small>INTERFACE AREAS</small><strong>05</strong><p>Studio, looks, frontend, backend, account</p></article><article><small>CAMERA ACCESS</small><strong>Local</strong><p>Browser permission, local preview</p></article><article><small>VIDEO UPLOAD</small><strong>None</strong><p>No video sent to a server in this build</p></article></div>
          <div className="system-table"><div className="system-table-head"><div><span className="step-label">CAPABILITY REGISTER</span><h2>What works today</h2></div><span>LIVE VS. PLANNED</span></div>
            {[['Camera preview','AVAILABLE','Uses browser camera permission and displays a local feed.'],['Look selection','AVAILABLE','Changes the selected look in the interface only.'],['Responsive navigation','AVAILABLE','Studio navigation adapts across desktop and mobile.'],['Face transformation','PLANNED','Needs a real-time rendering provider or processing pipeline.'],['Streaming output','PLANNED','Needs a supported video output and platform integration.']].map(([name,state,detail]) => <div className="system-row" key={name}><i className={state === 'AVAILABLE' ? 'ready' : ''}/><div><strong>{name}</strong><small>{detail}</small></div><span className={state === 'AVAILABLE' ? 'ready-text' : ''}>{state}</span></div>)}
          </div>
          <div className="system-note"><ShieldCheck size={18}/><p><strong>Privacy by design.</strong> The current camera feed stays in your browser. Any future processing must disclose what data leaves the device and why.</p></div>
        </section>}
        {activeNav === 'Backend' && <section className="systems-page">
          <div className="system-intro"><div><span className="step-label">PRODUCT SYSTEMS / 02</span><h1>Backend <span>foundation.</span></h1><p>A transparent readiness map for the services needed to operate a secure, monetized product.</p></div><span className="system-status planned"><i /> NOT CONNECTED</span></div>
          <div className="backend-warning"><Server size={21}/><div><strong>No production backend is connected.</strong><p>GitHub Pages hosts static files. Accounts, billing, AI processing and protected APIs need a separate server-side layer.</p></div></div>
          <div className="backend-cards">{[
            ['01','Authentication','Sign-in, sessions, password recovery and account ownership.',LockKeyhole,'NOT BUILT'],
            ['02','Billing & entitlements','Stripe Checkout, verified webhooks, cancellation and paid access.',Zap,'NOT CONNECTED'],
            ['03','Processing API','Rendering jobs, provider credentials and usage limits.',WandSparkles,'NOT CONNECTED'],
            ['04','Streaming output','Supported output path and platform integration health.',Radio,'NOT BUILT'],
            ['05','Privacy & data','Minimal account storage, retention, deletion and audit trail.',ShieldCheck,'NOT BUILT'],
            ['06','Operations','Error monitoring, rate limits, abuse protection and deployment checks.',Settings2,'NOT BUILT']
          ].map(([n,title,desc,Icon,status]) => <article className="backend-card" key={n}><div className="backend-card-top"><span>{n}</span><Icon size={18}/></div><h3>{title}</h3><p>{desc}</p><span className="backend-state">{status}</span></article>)}</div>
          <div className="system-table build-order"><div className="system-table-head"><div><span className="step-label">IMPLEMENTATION ORDER</span><h2>Build the foundation first.</h2></div></div>
            {[['01','Choose the API and data layer','Use a server host and database compatible with the existing app and budget.'],['02','Connect identity and billing','Keep Stripe secret keys server-side; verify signed webhooks before granting access.'],['03','Enforce plan access','Check subscription entitlements on the server, not just in the UI.'],['04','Integrate processing and output','Choose the provider, then test consent, latency, reliability and failure handling.']].map(([n,title,desc]) => <div className="build-row" key={n}><span>{n}</span><div><strong>{title}</strong><small>{desc}</small></div></div>)}
          </div>
        </section>}
        {activeNav === 'Account & billing' && <section className="systems-page">
          <div className="system-intro"><div><span className="step-label">WORKSPACE SETTINGS / 03</span><h1>Account & <span>billing.</span></h1><p>Proposed subscription structure. No paid checkout is active yet.</p></div><span className="system-status planned"><i /> CHECKOUT NOT CONNECTED</span></div>
          <div className="system-hero account-hero"><div className="account-initial">HS</div><div><small>CURRENT WORKSPACE</small><h2>{account ? account.email : 'HSW365 Creator'}</h2><p>{account ? ((subscription?.plan || 'free').toUpperCase() + ' plan · ' + (subscription?.status || 'inactive')) : 'Sign in to connect your creator workspace.'}</p></div>{account ? <button className="status-tag account-action" onClick={signOut}>SIGN OUT</button> : <span className="status-tag">PREVIEW</span>}</div>
          {!account && <form className="account-auth-panel" onSubmit={submitAuth}>
            <div className="account-auth-heading"><div><small>CREATOR ACCOUNT</small><h2>{authMode === 'register' ? 'Create your account' : 'Welcome back'}</h2><p>{apiBase ? 'Your account connects to the LiveFace365 API.' : 'Account API URL still needs to be configured for the live site.'}</p></div><div className="auth-switch"><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Sign in</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Create account</button></div></div>
            <label className="auth-label">Email address<input type="email" autoComplete="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" /></label>
            <label className="auth-label">Password<input type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} required minLength={authMode === 'register' ? 12 : 1} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder={authMode === 'register' ? 'At least 12 characters' : 'Your password'} /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button className="modal-primary auth-submit" type="submit" disabled={authBusy || !apiBase}>{authBusy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'} <ArrowUpRight size={15} /></button>
            {!apiBase && <p className="auth-note">The backend must be deployed and VITE_API_BASE_URL set in the Pages build before sign-in can work.</p>}
          </form>}
          {account && <div className="account-auth-panel signed-in-panel"><div><small>ACCOUNT STATUS</small><strong>{subscription?.status || 'inactive'}</strong><p>Paid access is granted only after Stripe confirms the subscription through a verified webhook.</p></div><button className="control-button" onClick={openBillingPortal}>Manage billing <ExternalLink size={15}/></button></div>}
          <div className="plans-heading"><span className="step-label">PROPOSED PLANS</span><h2>Simple tiers. Clear value.</h2><p>These prices are proposals, not active Stripe products.</p></div>
          <div className="plan-cards"><article><small>01 / START</small><h3>Free</h3><div className="plan-price">$0 <span>/ month</span></div><p>Explore the interface and test local camera preview.</p><ul><li>Camera preview</li><li>Look library</li><li>Setup guidance</li></ul><button onClick={() => { setActiveNav('Studio'); notify('Free preview is available.'); }}>Open free preview</button></article><article className="plan-featured"><small>02 / CREATOR</small><h3>Creator Pro</h3><div className="plan-price">$12 <span>/ month</span></div><p>Proposed plan for creators who need more tools.</p><ul><li>Planned creator features</li><li>Account workspace</li><li>Usage controls</li></ul><button onClick={() => startCheckout('creator')}>Choose Creator Pro <ArrowUpRight size={14}/></button></article><article><small>03 / STUDIO</small><h3>Studio Pro</h3><div className="plan-price">$25 <span>/ month</span></div><p>Proposed plan for advanced creator workflows.</p><ul><li>Planned studio features</li><li>Team controls</li><li>Priority processing</li></ul><button onClick={() => startCheckout('studio')}>Choose Studio Pro <ArrowUpRight size={14}/></button></article></div>
          <div className="system-note"><LockKeyhole size={18}/><p><strong>Billing security.</strong> Stripe secret keys belong on the backend. Paid access must follow a verified webhook and server-side entitlement check.</p></div>
        </section>}
      </main>

      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
      {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowHelp(false)} aria-label="Close"><X size={19} /></button><div className="modal-symbol"><Sparkles size={22} /></div><span className="step-label">LIVEFACE365 GUIDE</span><h2 id="help-title">Your creative studio, explained.</h2><p>LiveFace365 is the starting point for an original creator studio. Camera preview and look selection work in this version. Real-time face tracking, AI character rendering, account login, subscription billing, and direct platform streaming are separate integrations that still need to be connected.</p><div className="guide-points"><div><Camera size={17} /><span><strong>Camera access</strong><small>Use HTTPS and grant browser camera permission.</small></span></div><div><ShieldCheck size={17} /><span><strong>Use authorized likenesses</strong><small>Use your own face, licensed likenesses, or fictional characters.</small></span></div><div><Radio size={17} /><span><strong>Streaming connection</strong><small>Follow the setup guide. Never paste a stream key into a public page.</small></span></div></div><button className="modal-primary" onClick={() => { setShowHelp(false); setStreamModal(true); }}>Open stream setup <ArrowUpRight size={16} /></button></section></div>}
      {streamModal && <div className="modal-backdrop" onClick={() => setStreamModal(false)}><section className="modal-card stream-modal" role="dialog" aria-modal="true" aria-labelledby="stream-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setStreamModal(false)} aria-label="Close"><X size={19} /></button><div className="modal-symbol orange-symbol"><Radio size={22} /></div><span className="step-label">STREAMING WORKFLOW</span><h2 id="stream-title">Take your setup live.</h2><p>Use OBS Studio and your streaming platform's official connection settings. Direct TikTok LIVE access depends on account eligibility and platform permissions.</p><div className="setup-steps"><div><span>1</span><div><strong>Open OBS Studio</strong><small>Add your webcam as a Video Capture Device.</small></div><BadgeCheck size={17} /></div><div><span>2</span><div><strong>Set up your scene</strong><small>Arrange camera, microphone, overlays, and layout.</small></div><MoreHorizontal size={17} /></div><div><span>3</span><div><strong>Connect your platform</strong><small>Use official stream settings. Keep stream keys private.</small></div><LockKeyhole size={17} /></div></div><div className="stream-notice"><Info size={16} /><span>LiveFace365 does not yet send a stream or output transformed video. The guide prepares your workflow while streaming integration is being built.</span></div><button className="modal-primary" onClick={copySetup}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Setup steps copied' : 'Copy setup steps'}</button><button className="modal-secondary" onClick={() => { setStreamModal(false); notify('OBS setup guide closed.'); }}>Back to studio</button></section></div>}
    </div>
  );
}

export default App;