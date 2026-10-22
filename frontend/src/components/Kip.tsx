import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
// Original Kip artwork from the supplied EduCompass prototype.
export function Kip({ size = 140 }: { size?: number }) {
  const width = size; const height = size * 230 / 220;
  return <div className="kip-art shrink-0" aria-label="Kip the navigator" role="img">        <svg
          width={width}
          height={height}
          viewBox="0 0 220 230"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-md"
        >
          <style>{`
            @keyframes kipBob {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-7px) rotate(1.5deg); }
            }
            @keyframes kipBlink {
              0%, 90%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.12); }
            }
            @keyframes kipTailSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(14deg); }
            }
            @keyframes kipEarTwitch {
              0%, 80%, 100% { transform: rotate(0deg); }
              85% { transform: rotate(-5deg); }
              90% { transform: rotate(4deg); }
            }
            @keyframes kipPawWave {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-16deg); }
              75% { transform: rotate(14deg); }
            }
            @keyframes kipCompassShine {
              0%, 100% { transform: scale(1) rotate(0deg); }
              50% { transform: scale(1.12) rotate(10deg); }
            }
            .kip-body-group {
              animation: kipBob 3.6s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .kip-eyes {
              animation: kipBlink 3.8s infinite;
              transform-origin: 105px 105px;
            }
            .kip-tail {
              animation: kipTailSway 2.8s ease-in-out infinite;
              transform-origin: 160px 170px;
            }
            .kip-ears {
              animation: kipEarTwitch 4.5s ease-in-out infinite;
              transform-origin: 110px 50px;
            }
            .kip-wave-paw {
              animation: kipPawWave 2.2s ease-in-out infinite;
              transform-origin: 52px 145px;
            }
            .kip-star-badge {
              animation: kipCompassShine 3s ease-in-out infinite;
              transform-origin: 110px 165px;
            }
          `}</style>

          {/* Shadow beneath character */}
          <ellipse cx="110" cy="216" rx="60" ry="10" fill="#142B63" fillOpacity="0.12" />

          {/* Main Floating Body Group */}
          <g className="kip-body-group">
            {/* Fluffy Striped Tail (Behind body) */}
            <g className="kip-tail">
              <path
                d="M148 165C175 168 198 150 196 118C194 92 172 82 154 90C142 96 140 108 142 120"
                stroke="#E65100"
                strokeWidth="28"
                strokeLinecap="round"
                fill="none"
              />
              {/* White tail tip & stripes */}
              <path d="M188 95C194 102 196 114 194 122" stroke="#FFFFFF" strokeWidth="26" strokeLinecap="round" fill="none" />
              <path d="M166 84C172 86 178 90 182 96" stroke="#5D2600" strokeWidth="26" strokeLinecap="round" fill="none" />
              <path d="M152 145C160 148 168 148 176 142" stroke="#5D2600" strokeWidth="26" strokeLinecap="round" fill="none" />
            </g>

            {/* Little Feet Paws */}
            <ellipse cx="86" cy="204" rx="16" ry="9" fill="#5D2600" />
            <ellipse cx="134" cy="204" rx="16" ry="9" fill="#5D2600" />
            <circle cx="86" cy="202" r="4.5" fill="#E65100" />
            <circle cx="134" cy="202" r="4.5" fill="#E65100" />

            {/* Chubby Pear-Shaped Body */}
            {/* Rich warm terracotta / apricot red panda fur */}
            <path
              d="M110 50C62 50 48 85 48 140C48 184 70 204 110 204C150 204 172 184 172 140C172 85 158 50 110 50Z"
              fill="#E65100"
            />

            {/* Creamy Fluffy Belly */}
            <path
              d="M110 115C86 115 76 138 76 172C76 196 90 200 110 200C130 200 144 196 144 172C144 138 134 115 110 115Z"
              fill="#FFF3E0"
            />

            {/* Ears (Big fluffy triangular red panda ears) */}
            <g className="kip-ears">
              {/* Left Ear */}
              <path
                d="M52 75C42 45 60 22 84 36C86 54 75 72 52 75Z"
                fill="#E65100"
              />
              <path
                d="M58 68C52 48 64 34 78 44C78 56 70 66 58 68Z"
                fill="#FFF3E0"
              />
              {/* Left ear fluff tufts */}
              <path d="M58 58L68 54L62 64" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Right Ear */}
              <path
                d="M168 75C178 45 160 22 136 36C134 54 145 72 168 75Z"
                fill="#E65100"
              />
              <path
                d="M162 68C168 48 156 34 142 44C142 56 150 66 162 68Z"
                fill="#FFF3E0"
              />
              {/* Right ear fluff tufts */}
              <path d="M162 58L152 54L158 64" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>

            {/* Cute White Brow Markings */}
            <ellipse cx="84" cy="74" rx="8" ry="5" fill="#FFFFFF" transform="rotate(-15 84 74)" />
            <ellipse cx="136" cy="74" rx="8" ry="5" fill="#FFFFFF" transform="rotate(15 136 74)" />

            {/* White Cheek Markings */}
            <path
              d="M52 118C52 102 62 94 74 94C74 118 64 130 52 118Z"
              fill="#FFFFFF"
            />
            <path
              d="M168 118C168 102 158 94 146 94C146 118 156 130 168 118Z"
              fill="#FFFFFF"
            />

            {/* Big Sparkling Anime Eyes (Inquisitive & Cute) */}
            <g className="kip-eyes">
              {/* Left Eye */}
              <ellipse cx="88" cy="104" rx="14" ry="16" fill="#142B63" />
              <circle cx="84" cy="98" r="6" fill="#FFFFFF" />
              <circle cx="93" cy="109" r="2.5" fill="#FFFFFF" />
              <circle cx="94" cy="100" r="1.5" fill="#2F80ED" />

              {/* Right Eye */}
              <ellipse cx="132" cy="104" rx="14" ry="16" fill="#142B63" />
              <circle cx="128" cy="98" r="6" fill="#FFFFFF" />
              <circle cx="137" cy="109" r="2.5" fill="#FFFFFF" />
              <circle cx="138" cy="100" r="1.5" fill="#2F80ED" />
            </g>

            {/* Rosy Soft Cheeks */}
            <circle cx="70" cy="116" r="9" fill="#FF8A80" fillOpacity="0.45" />
            <circle cx="150" cy="116" r="9" fill="#FF8A80" fillOpacity="0.45" />

            {/* Little Cute Snout & Button Nose */}
            <ellipse cx="110" cy="112" rx="15" ry="11" fill="#FFF3E0" />
            <ellipse cx="110" cy="108" rx="5" ry="3.5" fill="#5D2600" />
            {/* Smile */}
            <path
              d="M104 114C107 117 113 117 116 114"
              stroke="#5D2600"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Explorer Navy Scarf with Golden Stitching */}
            <path
              d="M68 132C84 142 136 142 152 132C154 140 144 148 110 148C76 148 66 140 68 132Z"
              fill="#142B63"
            />
            {/* Scarf knot/fold */}
            <path
              d="M110 144L102 166L118 166Z"
              fill="#1B367A"
            />

            {/* Right Arm Paw (Resting gently) */}
            <path
              d="M154 135C164 144 162 165 148 168C142 162 144 148 154 135Z"
              fill="#5D2600"
            />

            {/* Left Arm Paw (Waving paw with animation) */}
            <g className="kip-wave-paw">
              <path
                d="M62 140C46 130 36 112 44 98C54 106 62 122 62 140Z"
                fill="#5D2600"
              />
              {/* Soft paw pad */}
              <circle cx="48" cy="108" r="4" fill="#E65100" />
            </g>

            {/* Floating Golden Compass / Star Medal */}
            <g className="kip-star-badge">
              <circle cx="110" cy="164" r="11" fill="#FFD166" />
              <circle cx="110" cy="164" r="9" fill="#FFF8E1" />
              {/* Compass 4-point star needle */}
              <polygon points="110,157 113,164 110,163 107,164" fill="#E65100" />
              <polygon points="110,171 113,164 110,165 107,164" fill="#2F80ED" />
              <circle cx="110" cy="164" r="2" fill="#142B63" />
            </g>

            {/* Mini Star Sparkles Floating Near Ear */}
            <path
              d="M42 45L44 40L46 45L51 47L46 49L44 54L42 49L37 47L42 45Z"
              fill="#FFD166"
              opacity="0.9"
            />
          </g>
        </svg></div>;
}

export function KipGuide() {
  const { t } = usePrefs();
  const [tip, setTip] = useState(0);
  const tips = ["Focus on your strengths, not just exam scores.", "There are no right or wrong answers. Choose what feels like you.", "Your career matches are a starting point. Explore the paths that interest you."];
  return <div className="relative mx-auto flex w-full max-w-sm flex-col items-center rounded-[20px] border border-white/25 bg-white/10 p-6 text-center shadow-xl">
    <span className="absolute -top-3 rounded-full bg-[#d99513] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">CareerNet Navigator</span>
    <button type="button" onClick={() => setTip(i => (i + 1) % tips.length)} className="mt-3 w-full rounded-xl border border-line bg-white p-3 text-left text-[#142b63]" aria-label={t("Show another tip")}><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#b84b00]">✦ Kip the navigator</span><span className="text-sm font-semibold">{t(tips[tip])}</span></button>
    <Kip size={170} />
    <p className="w-full border-t border-white/20 pt-3 text-xs text-blue-100">{t("A little encouragement for your next big step.")}</p>
  </div>;
}
