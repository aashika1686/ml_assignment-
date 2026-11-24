import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleHelp, CloudUpload,
  Cpu, Image as ImageIcon, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck,
  Sparkles, Trash2, Upload, WandSparkles, X,
} from 'lucide-react';

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MODEL_ID = 'Xenova/modnet';
let modelPromise;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const useWebGPU = Boolean(navigator.gpu);
      const options = useWebGPU ? { device: 'webgpu' } : {};
      const segmenter = await pipeline('background-removal', MODEL_ID, options);
      return { segmenter, device: useWebGPU ? 'webgpu' : 'wasm' };
    })().catch((error) => {
      modelPromise = undefined;
      throw error;
    });
  }
  return modelPromise;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [modelReady, setModelReady] = useState(false);
  const [engine, setEngine] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [sourceUrl, resultUrl]);

  const acceptFile = useCallback((incoming) => {
    const next = incoming?.[0];
    if (!next) return;
    setError('');
    setResultUrl((old) => { if (old) URL.revokeObjectURL(old); return ''; });
    if (!next.type.startsWith('image/')) {
      setError('Choose an image file such as PNG, JPG, or WEBP.');
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setError('This image is larger than 100 MB. Choose a smaller file to continue.');
      return;
    }
    setSourceUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(next); });
    setFile(next);
    setShowOriginal(false);
  }, []);

  const processImage = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setStatus(modelReady ? 'Preparing your image…' : 'Loading the AI model for the first time…');
    try {
      const { segmenter, device } = await loadModel();
      setModelReady(true);
      setEngine(device === 'webgpu' ? 'WebGPU acceleration' : 'Browser CPU mode');
      setStatus('Detecting the foreground…');
      const output = await segmenter(sourceUrl);
      const transparentImage = Array.isArray(output) ? output[0] : output;
      setStatus('Creating your transparent PNG…');
      const blob = await transparentImage.toBlob();
      setResultUrl(URL.createObjectURL(blob));
      setStatus('Background removed');
    } catch (cause) {
      const message = cause?.message || 'The image could not be processed. Please try another image.';
      setError(message.includes('WebGPU') ? 'Your browser could not start WebGPU. Try the latest Chrome or Edge, or use a smaller image.' : message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const clearImage = () => {
    setFile(null);
    setError('');
    setStatus('');
    setResultUrl((old) => { if (old) URL.revokeObjectURL(old); return ''; });
    setSourceUrl((old) => { if (old) URL.revokeObjectURL(old); return ''; });
    if (inputRef.current) inputRef.current.value = '';
  };

  const download = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    const base = file?.name?.replace(/\.[^.]+$/, '') || 'clearcut-image';
    link.href = resultUrl;
    link.download = `${base}-transparent.png`;
    link.click();
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files);
  };

  return (
    <div className="app-shell">
      <div className="topline"><span><Sparkles size={13} /> MACHINE LEARNING ASSIGNMENT</span><span className="topline-right"><LockKeyhole size={13} /> Processed privately in your browser</span></div>
      <header className="navbar">
        <a className="brand" href="#top" aria-label="ClearCut AI home"><span className="brand-mark"><WandSparkles size={19} /></span><span>clearcut<span className="brand-ai">.ai</span></span></a>
        <nav><a href="#how-it-works">How it works</a><a href="#about-project">About project</a></nav>
        <a className="nav-cta" href="#workspace">Try it free <ArrowRight size={15} /></a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> AI IMAGE TOOL · NO SIGN-UP</div>
            <h1>Keep the subject.<br /><span>Lose the background.</span></h1>
            <p className="hero-subtitle">Create a clean, transparent cutout in seconds. Upload a photo and let our in-browser AI do the rest.</p>
            <div className="hero-points"><span><Check size={15} /> Free to use</span><span><Check size={15} /> Your images stay on your device</span></div>
            <a href="#workspace" className="primary-button">Remove a background <ArrowRight size={17} /></a>
            <div className="model-caption"><Cpu size={14} /> Powered by MODNet and Transformers.js</div>
          </div>
          <div className="hero-art" aria-label="Preview of an image with its background removed">
            <div className="art-glow" />
            <div className="art-card art-back"><div className="mini-label">BEFORE</div><div className="sample-sun" /><div className="sample-hill hill-one" /><div className="sample-hill hill-two" /></div>
            <div className="art-card art-front"><div className="mini-label result-label"><span><Check size={11} /></span> TRANSPARENT</div><div className="checker" /><div className="sample-person"><div className="person-hair"/><div className="person-head"/><div className="person-neck"/><div className="person-shirt"/><div className="person-arm"/></div></div>
            <div className="art-badge"><span className="badge-icon"><WandSparkles size={15} /></span><span><b>AI cutout ready</b><small>Clean edges, transparent PNG</small></span><Check size={16} className="badge-check" /></div>
            <div className="sparkle sparkle-one">✦</div><div className="sparkle sparkle-two">✧</div>
          </div>
        </section>

        <section className="workspace-section" id="workspace">
          <div className="section-heading"><div><div className="eyebrow muted-eyebrow">YOUR WORKSPACE</div><h2>Make your cutout</h2><p>Upload one image to get started. Your original stays untouched.</p></div><div className="secure-pill"><ShieldCheck size={15} /> Private by design</div></div>
          <div className="workspace-card">
            <div className="upload-column">
              {!file ? <div className={`dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}>
                <input ref={inputRef} type="file" accept="image/*" onChange={(e) => acceptFile(e.target.files)} hidden />
                <div className="upload-icon"><CloudUpload size={25} /></div>
                <h3>Drop your image here</h3><p>or <button className="browse-button" type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>browse files</button> from your device</p>
                <div className="upload-meta"><span>PNG</span><span>JPG</span><span>WEBP</span><i /> <span>Up to 100 MB</span></div>
              </div> : <div className="file-card"><div className="file-preview"><img src={sourceUrl} alt="Selected original" /></div><div className="file-info"><strong>{file.name}</strong><span>{formatSize(file.size)} · Image ready</span><button className="text-button" onClick={() => inputRef.current?.click()}><RefreshCw size={13} /> Change image</button><input ref={inputRef} type="file" accept="image/*" onChange={(e) => acceptFile(e.target.files)} hidden /></div><button className="icon-button remove-file" title="Remove image" onClick={clearImage}><X size={17} /></button></div>}
              {error && <div className="error-message" role="alert"><CircleHelp size={15} />{error}</div>}
              {file && <button className="process-button" disabled={busy} onClick={resultUrl ? download : processImage}>{busy ? <><LoaderCircle className="spin" size={17} />{status || 'Working…'}</> : resultUrl ? <><ArrowDownToLine size={17} /> Download transparent PNG</> : <><WandSparkles size={17} /> Remove background <ArrowRight size={16} /></>}</button>}
              {busy && <div className="progress-track"><div className="progress-bar" /></div>}
              {file && status && !busy && !error && <div className="status-line"><Check size={14} /> {status}{engine && <span> · {engine}</span>}</div>}
              <div className="privacy-note"><LockKeyhole size={14} /> Images are processed locally in your browser. Nothing is uploaded to a server.</div>
            </div>
            <div className="preview-column">
              <div className="preview-top"><div><strong>Preview</strong><span>{resultUrl ? 'Your transparent result' : 'Your result will appear here'}</span></div>{resultUrl && <button className="icon-button" onClick={clearImage} title="Start over"><Trash2 size={15} /></button>}</div>
              <div className={`preview-canvas ${resultUrl ? 'has-result' : ''}`}>
                {resultUrl ? <><div className="checker-bg"/><img src={showOriginal ? sourceUrl : resultUrl} alt={showOriginal ? 'Original image' : 'Background removed result'} /><div className="preview-tag">{showOriginal ? 'ORIGINAL' : 'TRANSPARENT PNG'}</div><button className="toggle-original" onClick={() => setShowOriginal((value) => !value)}>{showOriginal ? 'Show result' : 'View original'} <ChevronDown size={13} /></button></> : <div className="empty-preview"><div className="preview-icon"><ImageIcon size={24} /></div><strong>Ready when you are</strong><span>Upload an image to see your cutout here</span></div>}
              </div>
              <div className="preview-footer"><span><span className={`status-dot ${resultUrl ? 'green' : ''}`} />{resultUrl ? 'Background removed' : 'Waiting for image'}</span>{resultUrl && <button onClick={download}><ArrowDownToLine size={14} /> Save PNG</button>}</div>
            </div>
          </div>
          <p className="size-note">Maximum upload size: 100 MB per image. Very large images may take longer to process and require more device memory.</p>
        </section>

        <section className="how-section" id="how-it-works"><div className="center-heading"><div className="eyebrow muted-eyebrow">SIMPLE BY DESIGN</div><h2>From photo to cutout in 3 steps</h2><p>No editing skills or complicated software required.</p></div><div className="steps-grid"><article className="step-card"><div className="step-number">01</div><div className="step-icon"><Upload size={20} /></div><h3>Upload your image</h3><p>Choose a PNG, JPG, or WEBP file up to 100 MB.</p></article><article className="step-card"><div className="step-number">02</div><div className="step-icon"><WandSparkles size={20} /></div><h3>Let AI do the work</h3><p>MODNet identifies the subject and estimates a soft foreground mask.</p></article><article className="step-card"><div className="step-number">03</div><div className="step-icon"><ArrowDownToLine size={20} /></div><h3>Download your PNG</h3><p>Save your subject as a transparent PNG, ready to use anywhere.</p></article></div></section>

        <section className="project-card" id="about-project">
          <div className="project-icon"><Cpu size={21} /></div>
          <div className="project-content">
            <div className="eyebrow muted-eyebrow">COLLEGE PROJECT</div>
            <h2>Machine Learning Assignment</h2>
            <p>AI-powered image background removal using the MODNet image matting model, running directly in the browser with Transformers.js.</p>
            <div className="team-list">
              <div className="team-member">
                <span className="avatar">A</span>
                <span>
                  <strong style={{ fontSize: '15px', color: '#172b4d' }}>Aashika</strong>
                  <small style={{ fontSize: '13px', color: '#53657d' }}>240201601003</small>
                </span>
              </div>
              <div className="team-divider" />
              <div className="team-member">
                <span className="avatar avatar-lilac">R</span>
                <span>
                  <strong style={{ fontSize: '15px', color: '#172b4d' }}>Rifa Akthar</strong>
                  <small style={{ fontSize: '13px', color: '#53657d' }}>240201601049</small>
                </span>
              </div>
            </div>
            <div className="college-name" style={{ color: '#263f63', fontSize: '15px', fontWeight: 700, marginTop: '17px' }}>
              Crescent Institute of Science and Technology
            </div>
          </div>
        </section>
      </main>
      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><WandSparkles size={16} /></span><span>clearcut<span className="brand-ai">.ai</span></span></a><span>Machine Learning Assignment · Crescent Institute of Science and Technology</span><span>Built with Transformers.js</span></footer>
    </div>
  );
}

export default App;
