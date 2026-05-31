import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatOneDReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { fetchByBarcode, type OFFResult } from '../../hooks/useOpenFoodFacts'
import Button from '../ui/Button'

interface Props {
  onResult: (result: OFFResult) => void
  onClose: () => void
}

type ScanState =
  | { status: 'scanning' }
  | { status: 'loading';   barcode: string }
  | { status: 'found';     result: OFFResult }
  | { status: 'not_found'; barcode: string }
  | { status: 'error';     message: string }

/* ------------------------------------------------------------------ */
/* Type minimal pour l'API native BarcodeDetector (Chrome / Android)   */
/* ------------------------------------------------------------------ */
interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike
  getSupportedFormats?(): Promise<string[]>
}
declare global {
  interface Window { BarcodeDetector?: BarcodeDetectorCtor }
}

/* Formats des codes-barres alimentaires (EAN / UPC + Code 128) */
const ONE_D_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]
const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

/* Petit bip de confirmation */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
    osc.onended = () => ctx.close()
  } catch { /* audio indispo : on ignore */ }
}

function cameraError(e: unknown): string {
  const name = (e as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Acces a la camera refuse. Autorisez la camera puis reessayez.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'Aucune camera arriere detectee sur cet appareil.'
  if (name === 'NotReadableError')
    return 'La camera est deja utilisee par une autre application.'
  return 'Erreur camera. Verifiez les autorisations.'
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const trackRef   = useRef<MediaStreamTrack | null>(null)
  const handledRef = useRef(false)

  const [state, setState]   = useState<ScanState>({ status: 'scanning' })
  const [manual, setManual] = useState('')
  const [torchOn, setTorchOn]       = useState(false)
  const [torchAvail, setTorchAvail] = useState(false)

  /* Recherche Open Food Facts */
  const lookup = useCallback(async (barcode: string) => {
    setState({ status: 'loading', barcode })
    try {
      const off = await fetchByBarcode(barcode)
      if (off) setState({ status: 'found', result: off })
      else     setState({ status: 'not_found', barcode })
    } catch {
      setState({ status: 'error', message: 'Impossible de contacter Open Food Facts.' })
    }
  }, [])

  /* Code-barres detecte -> on declenche la recherche une seule fois */
  const onDetected = useCallback((raw: string) => {
    if (handledRef.current) return
    const code = raw.trim()
    if (!/^\d{8,14}$/.test(code)) return // on ne garde que des codes plausibles
    handledRef.current = true
    try { navigator.vibrate?.(120) } catch { /* ignore */ }
    beep()
    lookup(code)
  }, [lookup])

  /* Moteur de scan temps reel */
  useEffect(() => {
    if (state.status !== 'scanning') return
    handledRef.current = false

    let stopped = false
    let rafId = 0
    let stream: MediaStream | null = null
    let zxControls: { stop: () => void } | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }

        const track = stream.getVideoTracks()[0]
        trackRef.current = track
        const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
        setTorchAvail(!!caps?.torch)

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        video.muted = true
        await video.play().catch(() => { /* autoplay bloque : ignore */ })

        /* 1) Moteur natif BarcodeDetector — rapide et precis */
        const BD = window.BarcodeDetector
        if (BD) {
          let formats = NATIVE_FORMATS
          try {
            const supported = await BD.getSupportedFormats?.()
            if (supported?.length) formats = NATIVE_FORMATS.filter(f => supported.includes(f))
          } catch { /* ignore */ }
          const detector = new BD(formats.length ? { formats } : undefined)

          let last = 0
          const loop = async (ts: number) => {
            if (stopped) return
            if (ts - last >= 100 && video.readyState >= 2) {
              last = ts
              try {
                const codes = await detector.detect(video)
                if (codes?.length) { onDetected(codes[0].rawValue); return }
              } catch { /* frame illisible : on continue */ }
            }
            rafId = requestAnimationFrame(loop)
          }
          rafId = requestAnimationFrame(loop)
          return
        }

        /* 2) Repli ZXing — lecteur 1D dedie EAN/UPC + TRY_HARDER */
        const hints = new Map<DecodeHintType, unknown>()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, ONE_D_FORMATS)
        hints.set(DecodeHintType.TRY_HARDER, true)
        const reader = new BrowserMultiFormatOneDReader(hints, {
          delayBetweenScanAttempts: 80,
          delayBetweenScanSuccess: 400,
        })
        zxControls = await reader.decodeFromStream(stream, video, (result) => {
          if (stopped || !result) return
          onDetected(result.getText())
        })
      } catch (e) {
        if (!stopped) setState({ status: 'error', message: cameraError(e) })
      }
    }

    start()

    return () => {
      stopped = true
      if (rafId) cancelAnimationFrame(rafId)
      try { zxControls?.stop() } catch { /* ignore */ }
      stream?.getTracks().forEach(t => t.stop())
      trackRef.current = null
      setTorchOn(false)
      setTorchAvail(false)
    }
  }, [state.status, onDetected])

  /* Lampe torche */
  const toggleTorch = useCallback(async () => {
    const track = trackRef.current
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] as unknown as MediaTrackConstraintSet[] })
      setTorchOn(next)
    } catch { /* torche non supportee */ }
  }, [torchOn])

  return (
    <div className="flex flex-col gap-4">
      {/* Camera */}
      <div className={`relative rounded-2xl overflow-hidden bg-black ${state.status !== 'scanning' ? 'hidden' : ''}`}>
        <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted />

        {/* Cadre de visee */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-32 border-2 border-indigo-400 rounded-xl relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-300 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-300 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-300 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-300 rounded-br" />
            <div className="absolute left-0 right-0 h-0.5 bg-indigo-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Bouton torche */}
        {torchAvail && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-lg backdrop-blur transition ${torchOn ? 'bg-yellow-400 text-gray-900' : 'bg-black/50 text-white'}`}
            aria-label="Lampe torche"
          >
            {torchOn ? 'ON' : 'OFF'}
          </button>
        )}

        <p className="absolute bottom-3 inset-x-0 text-center text-white text-xs opacity-75">
          Visez le code-barres — detection automatique
        </p>
      </div>

      {/* Chargement */}
      {state.status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Recherche du produit...</p>
          <p className="text-gray-600 text-xs font-mono">{state.barcode}</p>
        </div>
      )}

      {/* Trouve */}
      {state.status === 'found' && (
        <div className="flex flex-col gap-4">
          <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="text-2xl">OK</span>
              <div>
                <p className="font-bold text-white text-lg leading-tight">{state.result.nom}</p>
                {state.result.marque && <p className="text-gray-400 text-sm">{state.result.marque}</p>}
                {state.result.categorie && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {state.result.categorie}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-xl px-4 py-3 mt-1">
              <p className="text-xs text-gray-500 mb-2">Pour 100 g</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <span className="text-gray-400">Calories</span>  <span className="font-semibold text-yellow-400">{state.result.macro.calories} kcal</span>
                <span className="text-gray-400">Proteines</span> <span className="font-semibold text-blue-400">{state.result.macro.proteines} g</span>
                <span className="text-gray-400">Glucides</span>  <span className="font-semibold text-green-400">{state.result.macro.glucides} g</span>
                <span className="text-gray-400">Lipides</span>   <span className="font-semibold text-orange-400">{state.result.macro.lipides} g</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setState({ status: 'scanning' })}>
              Re-scanner
            </Button>
            <Button className="flex-1 justify-center" onClick={() => onResult(state.result)}>
              Utiliser
            </Button>
          </div>
        </div>
      )}

      {/* Introuvable */}
      {state.status === 'not_found' && (
        <div className="flex flex-col gap-3 items-center py-4">
          <p className="text-3xl">?</p>
          <p className="text-white font-medium">Produit introuvable</p>
          <p className="text-gray-500 text-sm text-center">
            Code <span className="font-mono text-gray-400">{state.barcode}</span> non reference.
          </p>
          <Button variant="secondary" onClick={() => setState({ status: 'scanning' })}>Re-scanner</Button>
        </div>
      )}

      {/* Erreur */}
      {state.status === 'error' && (
        <div className="flex flex-col gap-3 items-center py-4">
          <p className="text-3xl">!</p>
          <p className="text-red-400 font-medium text-center">{state.message}</p>
          <Button variant="secondary" onClick={() => setState({ status: 'scanning' })}>Reessayer</Button>
        </div>
      )}

      {/* Saisie manuelle */}
      {state.status === 'scanning' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 text-center">Ou entrez le code-barres manuellement</p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={manual}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && manual.trim() && lookup(manual.trim())}
              placeholder="Ex : 3017620422003"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <Button size="sm" onClick={() => lookup(manual.trim())} disabled={!manual.trim()}>OK</Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="justify-center" onClick={onClose}>Annuler</Button>
    </div>
  )
}
