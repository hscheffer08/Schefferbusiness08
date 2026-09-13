import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

export type InterviewAudio = { data: string; mediaType: string; duration: number };
const LIMIT_SECONDS = 180;
const LIMIT_BYTES = 2_500_000;

export default function InterviewRecorder({ disabled, onChange, onRecording }: {
  disabled: boolean; onChange: (audio: InterviewAudio | null) => void; onRecording: (active: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const mounted = useRef(true);
  const objectUrl = useRef('');
  const callback = useRef({ onChange, onRecording });
  callback.current = { onChange, onRecording };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearInterval(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      URL.revokeObjectURL(objectUrl.current);
      callback.current.onRecording(false);
    };
  }, []);

  function clear() {
    URL.revokeObjectURL(objectUrl.current); objectUrl.current = '';
    setUrl(''); setSeconds(0); callback.current.onChange(null);
  }
  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    clearInterval(timer.current);
  }
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador não oferece gravação. Abra no Safari/Chrome atualizado ou responda por texto.'); return;
    }
    setRequesting(true); callback.current.onRecording(true); setError(''); clear();
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(media, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64000 });
      recorder.current = rec;
      const chunks: Blob[] = [];
      const startTime = Date.now();
      let bytes = 0;
      rec.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
        if (bytes >= LIMIT_BYTES && rec.state === 'recording') stop();
      };
      rec.onerror = () => { setError('A gravação foi interrompida. Grave novamente.'); stop(); };
      rec.onstop = async () => {
        clearInterval(timer.current); media.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false); callback.current.onRecording(false);
        const duration = Math.min(LIMIT_SECONDS, (Date.now() - startTime) / 1000);
        const blob = new Blob(chunks, { type: rec.mimeType });
        if (duration < 1 || blob.size < 100 || blob.size > LIMIT_BYTES) {
          setError('Gravação muito curta ou grande. Tente uma resposta de até 3 minutos.'); return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (!mounted.current) return;
          objectUrl.current = URL.createObjectURL(blob); setUrl(objectUrl.current);
          callback.current.onChange({ data: String(reader.result).split(',')[1], mediaType: blob.type.split(';')[0], duration });
        };
        reader.onerror = () => setError('Não foi possível preparar o áudio. Grave novamente.');
        reader.readAsDataURL(blob);
      };
      rec.start(1000); setRecording(true); callback.current.onRecording(true);
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000); setSeconds(Math.min(elapsed, LIMIT_SECONDS));
        if (elapsed >= LIMIT_SECONDS) stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      if (mounted.current) setError('Não consegui acessar o microfone. Permita o acesso nas configurações do navegador ou use texto.');
    } finally { if (mounted.current) { setRequesting(false); if (recorder.current?.state !== 'recording') callback.current.onRecording(false); } }
  }
  return <div className="mt-4 rounded-2xl border border-[#31588e] bg-[#0b2856] p-4">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || requesting} onClick={recording ? stop : start} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#246cff] px-4 font-bold disabled:opacity-50">
        {recording ? <Square size={18} /> : <Mic size={18} />}{requesting ? 'Liberando microfone…' : recording ? 'Parar gravação' : url ? 'Gravar novamente' : 'Gravar resposta'}
      </button>
      <span role="status" className="text-sm text-blue-100">{recording ? 'Gravando · ' : ''}{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} / 3:00</span>
      {url && <button type="button" disabled={disabled} onClick={clear} className="min-h-12 px-3" aria-label="Excluir gravação"><Trash2 size={20} /></button>}
    </div>
    {url && <audio controls src={url} className="mt-3 w-full" aria-label="Ouvir sua resposta gravada" />}
    <p className="mt-3 text-sm leading-relaxed text-[#c4d4ea]">Ao enviar, o áudio será processado por IA para transcrição e análise da fala. A gravação fica nesta tela até o envio ou descarte; não é salva no seu histórico do Conectaê.</p>
    {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}
  </div>;
}
