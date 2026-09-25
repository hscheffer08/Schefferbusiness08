import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Square, Trash2, Upload } from 'lucide-react';

export type InterviewFrame = { data: string; mediaType: 'image/jpeg'; time: number };
export type InterviewAudio = { data: string; mediaType: string; duration: number; frames?: InterviewFrame[] };

const AUDIO_LIMIT_SECONDS = 180;
const VIDEO_LIMIT_SECONDS = 90;
const LIMIT_BYTES = 2_200_000;
const FRAME_COUNT = 7;
const MAX_FRAME_BASE64 = 180_000;

type Mode = 'audio' | 'video';

function readAsBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(blob);
  });
}

function waitForVideoEvent(video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked', timeout = 2500) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('video-timeout'));
    }, timeout);
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('video-error'));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener(event, onEvent);
      video.removeEventListener('error', onError);
    };
    video.addEventListener(event, onEvent, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

async function extractFrames(blob: Blob, duration: number): Promise<InterviewFrame[]> {
  const tempUrl = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = tempUrl;

  try {
    if (!Number.isFinite(video.duration) || video.readyState < 1) {
      video.load();
      await waitForVideoEvent(video, 'loadedmetadata', 3500);
    }
    const realDuration = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(video.duration, duration) : duration;
    if (!realDuration || !video.videoWidth || !video.videoHeight) return [];

    const maxDimension = 420;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return [];

    const fractions = [0.06, 0.20, 0.36, 0.52, 0.68, 0.84, 0.96].slice(0, FRAME_COUNT);
    const frames: InterviewFrame[] = [];

    for (const fraction of fractions) {
      const target = Math.max(0.05, Math.min(realDuration - 0.05, realDuration * fraction));
      if (target < 0 || !Number.isFinite(target)) continue;
      try {
        if (Math.abs(video.currentTime - target) > 0.04) {
          const seek = waitForVideoEvent(video, 'seeked', 2200);
          video.currentTime = target;
          await seek;
        }
        ctx.drawImage(video, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', 0.52);
        let base64 = dataUrl.split(',')[1] || '';
        if (base64.length > MAX_FRAME_BASE64) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.38);
          base64 = dataUrl.split(',')[1] || '';
        }
        if (base64 && base64.length <= MAX_FRAME_BASE64) {
          frames.push({ data: base64, mediaType: 'image/jpeg', time: Math.round(target * 10) / 10 });
        }
      } catch {
        // A missing frame should not block the audio/video answer.
      }
    }
    return frames;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(tempUrl);
  }
}

export default function InterviewRecorder({ disabled, onChange, onRecording }: {
  disabled: boolean;
  onChange: (audio: InterviewAudio | null) => void;
  onRecording: (active: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>('audio');
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const mounted = useRef(true);
  const objectUrl = useRef('');
  const fileInput = useRef<HTMLInputElement>(null);
  const livePreview = useRef<HTMLVideoElement>(null);
  const callback = useRef({ onChange, onRecording });
  callback.current = { onChange, onRecording };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearInterval(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      if (livePreview.current) livePreview.current.srcObject = null;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      callback.current.onRecording(false);
    };
  }, []);

  function clear() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = '';
    setUrl('');
    setMediaType('');
    setSeconds(0);
    setFrameCount(0);
    setError('');
    callback.current.onChange(null);
  }

  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    if (livePreview.current) livePreview.current.srcObject = null;
    clearInterval(timer.current);
  }

  async function blobToPayload(blob: Blob, duration: number, explicitMode?: Mode) {
    const effectiveMode = explicitMode || mode;
    if (duration < 1 || blob.size < 100 || blob.size > LIMIT_BYTES) {
      setError('Arquivo muito curto ou grande. O limite é ' + (LIMIT_BYTES / 1_000_000).toFixed(1) + ' MB.');
      return;
    }

    setProcessing(true);
    callback.current.onRecording(true);
    try {
      const [data, frames] = await Promise.all([
        readAsBase64(blob),
        effectiveMode === 'video' ? extractFrames(blob, duration).catch(() => [] as InterviewFrame[]) : Promise.resolve([] as InterviewFrame[]),
      ]);
      if (!mounted.current) return;

      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setUrl(objectUrl.current);
      const type = (blob.type || (effectiveMode === 'video' ? 'video/webm' : 'audio/webm')).split(';')[0];
      setMediaType(type);
      setFrameCount(frames.length);
      callback.current.onChange({ data, mediaType: type, duration, ...(frames.length ? { frames } : {}) });
    } catch {
      if (mounted.current) setError('Não foi possível preparar a gravação. Tente novamente.');
    } finally {
      if (mounted.current) {
        setProcessing(false);
        callback.current.onRecording(false);
      }
    }
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador não oferece gravação. Abra no Safari/Chrome atualizado ou responda por texto.');
      return;
    }

    setRequesting(true);
    callback.current.onRecording(true);
    setError('');
    clear();

    try {
      const isVideo = mode === 'video';
      const media = await navigator.mediaDevices.getUserMedia(isVideo
        ? { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 20 } } }
        : { audio: true });

      if (!mounted.current) {
        media.getTracks().forEach(track => track.stop());
        return;
      }

      stream.current = media;
      if (isVideo && livePreview.current) {
        livePreview.current.srcObject = media;
        void livePreview.current.play().catch(() => {});
      }
      const candidates = isVideo
        ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
        : ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(media, {
        ...(mimeType ? { mimeType } : {}),
        ...(isVideo ? { videoBitsPerSecond: 120000, audioBitsPerSecond: 40000 } : { audioBitsPerSecond: 64000 }),
      });

      recorder.current = rec;
      const chunks: Blob[] = [];
      const startTime = Date.now();
      let bytes = 0;
      const limitSeconds = isVideo ? VIDEO_LIMIT_SECONDS : AUDIO_LIMIT_SECONDS;

      rec.ondataavailable = event => {
        if (event.data.size) {
          chunks.push(event.data);
          bytes += event.data.size;
        }
        if (bytes >= LIMIT_BYTES && rec.state === 'recording') stop();
      };

      rec.onerror = () => {
        setError('A gravação foi interrompida. Grave novamente.');
        stop();
      };

      rec.onstop = async () => {
        clearInterval(timer.current);
        media.getTracks().forEach(track => track.stop());
        if (livePreview.current) livePreview.current.srcObject = null;
        if (!mounted.current) return;
        setRecording(false);
        const duration = Math.min(limitSeconds, (Date.now() - startTime) / 1000);
        const blob = new Blob(chunks, { type: rec.mimeType });
        await blobToPayload(blob, duration, isVideo ? 'video' : 'audio');
      };

      rec.start(700);
      setRecording(true);
      callback.current.onRecording(true);
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSeconds(Math.min(elapsed, limitSeconds));
        if (elapsed >= limitSeconds) stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      if (mounted.current) {
        setError(mode === 'video'
          ? 'Não consegui acessar câmera e microfone. Permita o acesso nas configurações do navegador.'
          : 'Não consegui acessar o microfone. Permita o acesso nas configurações do navegador ou use texto.');
      }
    } finally {
      if (mounted.current) {
        setRequesting(false);
        if (recorder.current?.state !== 'recording' && !processing) callback.current.onRecording(false);
      }
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    clear();
    setMode('video');

    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      setError('Envie um vídeo MP4, WebM ou MOV.');
      return;
    }
    if (file.size > LIMIT_BYTES) {
      setError('Para envio direto, o vídeo precisa ter até ' + (LIMIT_BYTES / 1_000_000).toFixed(1) + ' MB.');
      return;
    }

    const temp = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = temp;
    video.onloadedmetadata = async () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      URL.revokeObjectURL(temp);
      if (duration < 1 || duration > VIDEO_LIMIT_SECONDS + 0.5) {
        setError('O vídeo deve ter entre 1 segundo e 90 segundos.');
        return;
      }
      setSeconds(Math.round(duration));
      await blobToPayload(file, duration, 'video');
    };
    video.onerror = () => {
      URL.revokeObjectURL(temp);
      setError('Não consegui ler esse vídeo. Tente outro arquivo.');
    };
  }

  const modeClass = (selected: boolean) => 'inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ' + (selected ? 'bg-[#246cff] text-white' : 'bg-[#041027] text-[#b9cbea]');

  return <div className="mt-4 rounded-2xl border border-[#31588e] bg-[#0b2856] p-4">
    <div className="mb-4 flex gap-2" role="tablist" aria-label="Formato da resposta">
      <button type="button" disabled={disabled || recording || processing} onClick={() => { clear(); setMode('audio'); }} className={modeClass(mode === 'audio')}><Mic size={16} />Áudio</button>
      <button type="button" disabled={disabled || recording || processing} onClick={() => { clear(); setMode('video'); }} className={modeClass(mode === 'video')}><Camera size={16} />Vídeo</button>
    </div>

    {mode === 'video' && <video ref={livePreview} autoPlay muted playsInline className={recording ? 'mb-4 aspect-video w-full rounded-xl bg-black object-cover' : 'hidden'} aria-label="Prévia ao vivo da câmera" />}
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || requesting || processing} onClick={recording ? stop : start} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#246cff] px-4 font-bold disabled:opacity-50">
        {recording ? <Square size={18} /> : mode === 'video' ? <Camera size={18} /> : <Mic size={18} />}
        {processing ? 'Extraindo frames…' : requesting ? (mode === 'video' ? 'Liberando câmera…' : 'Liberando microfone…') : recording ? 'Parar gravação' : url ? 'Gravar novamente' : mode === 'video' ? 'Gravar vídeo' : 'Gravar resposta'}
      </button>

      {mode === 'video' && !recording && <>
        <button type="button" disabled={disabled || processing} onClick={() => fileInput.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#4774ad] bg-[#06152f] px-4 text-sm font-bold text-[#d7e6fb]"><Upload size={17} />Enviar vídeo</button>
        <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={event => { void handleUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      </>}

      <span role="status" className="text-sm text-blue-100">
        {processing ? 'Preparando análise · ' : recording ? 'Gravando · ' : ''}
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} / {mode === 'video' ? '1:30' : '3:00'}
      </span>

      {url && <button type="button" disabled={disabled || processing} onClick={clear} className="min-h-12 px-3" aria-label="Excluir gravação"><Trash2 size={20} /></button>}
    </div>

    {url && (mediaType.startsWith('video/')
      ? <video controls playsInline src={url} className="mt-3 max-h-[360px] w-full rounded-xl bg-black" aria-label="Rever seu vídeo gravado" />
      : <audio controls src={url} className="mt-3 w-full" aria-label="Ouvir sua resposta gravada" />)}

    <p className="mt-3 text-sm leading-relaxed text-[#c4d4ea]">
      {mode === 'video'
        ? 'Durante a gravação, você vê a prévia da câmera para ajustar o enquadramento. Depois, o vídeo é amostrado em até 7 frames ao longo da resposta, que a IA cruza com a fala para analisar conteúdo e comunicação visual observável.'
        : 'Ao enviar, a fala é transcrita e a IA cruza o conteúdo com ritmo, pausas, repetições, dicção e entonação.'}
    </p>
    {mode === 'video' && <p className="mt-2 text-xs text-[#8fa8ca]">Vídeo: até 90 segundos e 2,2 MB. {frameCount ? frameCount + ' frames prontos para análise.' : 'Os frames são extraídos automaticamente no seu navegador.'}</p>}
    <p className="mt-2 text-xs text-[#8fa8ca]">A gravação e os frames ficam nesta resposta durante o processamento e não são adicionados ao seu histórico do Conectaê.</p>
    {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}
  </div>;
}
