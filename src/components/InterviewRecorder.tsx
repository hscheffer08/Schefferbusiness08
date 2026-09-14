import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Square, Trash2, Upload } from 'lucide-react';

export type InterviewAudio = { data: string; mediaType: string; duration: number };
const AUDIO_LIMIT_SECONDS = 180;
const VIDEO_LIMIT_SECONDS = 60;
const LIMIT_BYTES = 2_500_000;

type Mode = 'audio' | 'video';

export default function InterviewRecorder({ disabled, onChange, onRecording }: {
  disabled: boolean; onChange: (audio: InterviewAudio | null) => void; onRecording: (active: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>('audio');
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const mounted = useRef(true);
  const objectUrl = useRef('');
  const fileInput = useRef<HTMLInputElement>(null);
  const callback = useRef({ onChange, onRecording });
  callback.current = { onChange, onRecording };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearInterval(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
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
    setError('');
    callback.current.onChange(null);
  }

  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    clearInterval(timer.current);
  }

  function blobToPayload(blob: Blob, duration: number) {
    if (duration < 1 || blob.size < 100 || blob.size > LIMIT_BYTES) {
      setError(`Arquivo muito curto ou grande. O limite é ${(LIMIT_BYTES / 1_000_000).toFixed(1)} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (!mounted.current) return;
      objectUrl.current = URL.createObjectURL(blob);
      setUrl(objectUrl.current);
      const type = (blob.type || (mode === 'video' ? 'video/webm' : 'audio/webm')).split(';')[0];
      setMediaType(type);
      callback.current.onChange({ data: String(reader.result).split(',')[1], mediaType: type, duration });
    };
    reader.onerror = () => setError('Não foi possível preparar a gravação. Tente novamente.');
    reader.readAsDataURL(blob);
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
        ? { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15, max: 20 } } }
        : { audio: true });
      if (!mounted.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const candidates = isVideo
        ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
        : ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(media, {
        ...(mimeType ? { mimeType } : {}),
        ...(isVideo ? { videoBitsPerSecond: 170000, audioBitsPerSecond: 48000 } : { audioBitsPerSecond: 64000 }),
      });
      recorder.current = rec;
      const chunks: Blob[] = [];
      const startTime = Date.now();
      let bytes = 0;
      const limitSeconds = isVideo ? VIDEO_LIMIT_SECONDS : AUDIO_LIMIT_SECONDS;
      rec.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
        if (bytes >= LIMIT_BYTES && rec.state === 'recording') stop();
      };
      rec.onerror = () => { setError('A gravação foi interrompida. Grave novamente.'); stop(); };
      rec.onstop = async () => {
        clearInterval(timer.current);
        media.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false);
        callback.current.onRecording(false);
        const duration = Math.min(limitSeconds, (Date.now() - startTime) / 1000);
        const blob = new Blob(chunks, { type: rec.mimeType });
        blobToPayload(blob, duration);
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
      if (mounted.current) setError(mode === 'video'
        ? 'Não consegui acessar câmera e microfone. Permita o acesso nas configurações do navegador.'
        : 'Não consegui acessar o microfone. Permita o acesso nas configurações do navegador ou use texto.');
    } finally {
      if (mounted.current) {
        setRequesting(false);
        if (recorder.current?.state !== 'recording') callback.current.onRecording(false);
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
      setError(`Para envio direto, o vídeo precisa ter até ${(LIMIT_BYTES / 1_000_000).toFixed(1)} MB. Você também pode gravar um vídeo de até 1 minuto aqui.`);
      return;
    }
    const temp = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = temp;
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      URL.revokeObjectURL(temp);
      if (duration < 1 || duration > VIDEO_LIMIT_SECONDS + 0.5) {
        setError('O vídeo deve ter entre 1 segundo e 1 minuto.');
        return;
      }
      blobToPayload(file, duration);
      setSeconds(Math.round(duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(temp);
      setError('Não consegui ler esse vídeo. Tente outro arquivo.');
    };
  }

  const limitSeconds = mode === 'video' ? VIDEO_LIMIT_SECONDS : AUDIO_LIMIT_SECONDS;
  return <div className="mt-4 rounded-2xl border border-[#31588e] bg-[#0b2856] p-4">
    <div className="mb-4 flex gap-2" role="tablist" aria-label="Formato da resposta">
      <button type="button" disabled={disabled || recording} onClick={() => { clear(); setMode('audio'); }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ${mode === 'audio' ? 'bg-[#246cff] text-white' : 'bg-[#041027] text-[#b9cbea]'}`}><Mic size={16} />Áudio</button>
      <button type="button" disabled={disabled || recording} onClick={() => { clear(); setMode('video'); }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ${mode === 'video' ? 'bg-[#246cff] text-white' : 'bg-[#041027] text-[#b9cbea]'}`}><Camera size={16} />Vídeo</button>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || requesting} onClick={recording ? stop : start} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#246cff] px-4 font-bold disabled:opacity-50">
        {recording ? <Square size={18} /> : mode === 'video' ? <Camera size={18} /> : <Mic size={18} />}
        {requesting ? (mode === 'video' ? 'Liberando câmera…' : 'Liberando microfone…') : recording ? 'Parar gravação' : url ? 'Gravar novamente' : mode === 'video' ? 'Gravar vídeo' : 'Gravar resposta'}
      </button>
      {mode === 'video' && !recording && <>
        <button type="button" disabled={disabled} onClick={() => fileInput.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#4774ad] bg-[#06152f] px-4 text-sm font-bold text-[#d7e6fb]"><Upload size={17} />Enviar vídeo</button>
        <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={event => { void handleUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      </>}
      <span role="status" className="text-sm text-blue-100">{recording ? 'Gravando · ' : ''}{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} / {mode === 'video' ? '1:00' : '3:00'}</span>
      {url && <button type="button" disabled={disabled} onClick={clear} className="min-h-12 px-3" aria-label="Excluir gravação"><Trash2 size={20} /></button>}
    </div>
    {url && (mediaType.startsWith('video/')
      ? <video controls playsInline src={url} className="mt-3 max-h-[360px] w-full rounded-xl bg-black" aria-label="Rever seu vídeo gravado" />
      : <audio controls src={url} className="mt-3 w-full" aria-label="Ouvir sua resposta gravada" />)}
    <p className="mt-3 text-sm leading-relaxed text-[#c4d4ea]">{mode === 'video'
      ? 'A IA analisa conteúdo da resposta, fala, postura, gestos, olhar para a câmera e enquadramento. O vídeo fica apenas nesta tela até o envio ou descarte.'
      : 'Ao enviar, o áudio será processado por IA para transcrição e análise da fala. A gravação fica nesta tela até o envio ou descarte; não é salva no seu histórico do Conectaê.'}</p>
    {mode === 'video' && <p className="mt-2 text-xs text-[#8fa8ca]">Vídeo: até 1 minuto. Para upload direto, até 2,5 MB. Gravar aqui já usa compressão leve para funcionar melhor no celular.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}
  </div>;
}
