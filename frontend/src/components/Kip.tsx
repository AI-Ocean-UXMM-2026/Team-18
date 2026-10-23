import { useEffect, useId, useState } from "react";
import { usePrefs } from "@/lib/prefs";

export type KipMood = "studying" | "thinking" | "idle" | "celebrating" | "waving";
// Updated four-scene Kip artwork from the user-supplied EduCompass prototype.
export function Kip({ size = 140, mood = "waving", stage }: { size?: number; mood?: KipMood; stage?: number }) {
  const { t } = usePrefs();
  const instanceId = useId().replace(/:/g, "");
  const activeStage = stage ?? (mood === "studying" || mood === "thinking" ? 0 : mood === "idle" ? 1 : mood === "celebrating" ? 2 : 3);
  const width = size; const height = size * 270 / 380;
  return <div className="kip-art flex shrink-0 items-center justify-center" aria-label={t("Kip the navigator")} role="img">
        <svg
          width={width}
          height={height}
          viewBox="0 0 380 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto max-w-full drop-shadow-md"
        >
          <defs>
            {/* Kip's fur gradient */}
            <linearGradient id={`${instanceId}-kipFurGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6D00" />
              <stop offset="60%" stopColor="#E65100" />
              <stop offset="100%" stopColor="#C43E00" />
            </linearGradient>

            {/* University Laurel Wreath Silver Gradient */}
            <linearGradient id={`${instanceId}-kipLaurelGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Briefcase Gradient */}
            <linearGradient id={`${instanceId}-kipBriefcaseGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Graduation Mortarboard Silver-White Gradient */}
            <linearGradient id={`${instanceId}-kipGradCapGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Desk Gradient */}
            <linearGradient id={`${instanceId}-kipDeskGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Laptop Display Glow */}
            <linearGradient id={`${instanceId}-kipScreenGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>

          {/* Embedded Styles with Smooth Keyframes & Reduced-Motion Support */}
          <style>{`
            @keyframes kipSoftBob {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-6px) rotate(1deg); }
            }
            @keyframes kipCelebrateBounce {
              0%, 100% { transform: translateY(0px) scale(1); }
              30% { transform: translateY(-12px) scale(1.02); }
              60% { transform: translateY(-2px) scale(0.99); }
            }
            @keyframes kipTailSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(14deg); }
            }
            @keyframes kipEarTwitch {
              0%, 80%, 100% { transform: rotate(0deg); }
              85% { transform: rotate(-4deg); }
              90% { transform: rotate(3deg); }
            }
            @keyframes kipEyeBlink {
              0%, 90%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.12); }
            }
            @keyframes kipTasselSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(18deg); }
            }
            @keyframes kipWreathFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-7px) rotate(-2deg); }
            }
            @keyframes kipBriefcaseFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-7px) rotate(2deg); }
            }
            @keyframes kipTyping {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3.5px); }
            }
            @keyframes kipConfettiFloat {
              0% { transform: translateY(0px) scale(0.8); opacity: 0.3; }
              50% { transform: translateY(-12px) scale(1.1); opacity: 0.95; }
              100% { transform: translateY(-24px) scale(0.7); opacity: 0; }
            }

            .anim-kip-bob {
              animation: kipSoftBob 3.6s ease-in-out infinite;
              transform-origin: 190px 220px;
            }
            .anim-kip-celebrate {
              animation: kipCelebrateBounce 1.6s ease-in-out infinite;
              transform-origin: 190px 220px;
            }
            .anim-kip-tail {
              animation: kipTailSway 2.8s ease-in-out infinite;
              transform-origin: 228px 185px;
            }
            .anim-kip-ears {
              animation: kipEarTwitch 4.5s ease-in-out infinite;
              transform-origin: 190px 65px;
            }
            .anim-kip-eyes {
              animation: kipEyeBlink 3.8s infinite;
              transform-origin: 190px 115px;
            }
            .anim-kip-tassel {
              animation: kipTasselSway 2.4s ease-in-out infinite;
              transform-origin: 228px 74px;
            }
            .anim-kip-wreath {
              animation: kipWreathFloat 3.2s ease-in-out infinite;
              transform-origin: 75px 150px;
            }
            .anim-kip-briefcase {
              animation: kipBriefcaseFloat 3.4s ease-in-out infinite;
              transform-origin: 305px 155px;
            }
            .anim-kip-typing {
              animation: kipTyping 1s ease-in-out infinite;
              transform-origin: 190px 185px;
            }
            .anim-kip-confetti {
              animation: kipConfettiFloat 2.6s ease-in-out infinite;
            }

            @media (prefers-reduced-motion: reduce) {
              .anim-kip-bob,
              .anim-kip-celebrate,
              .anim-kip-tail,
              .anim-kip-ears,
              .anim-kip-eyes,
              .anim-kip-tassel,
              .anim-kip-wreath,
              .anim-kip-briefcase,
              .anim-kip-typing,
              .anim-kip-confetti {
                animation: none !important;
              }
            }
          `}</style>

          {/* Floor Shadow */}
          <ellipse cx="190" cy="246" rx="65" ry="10" fill="#142B63" fillOpacity="0.12" />

          {/* ============================================================== */}
          {/* STAGE 1 BACKGROUND PROPS: University Laurel Wreath & Briefcase */}
          {/* ============================================================== */}
          {activeStage === 1 && (
            <g className="transition-all duration-500 ease-out">
              {/* Left Side: Frosted Academic Laurel Wreath */}
              <g className="anim-kip-wreath">
                {/* Central Star Crest */}
                <circle cx="75" cy="148" r="14" fill={`url(#${instanceId}-kipLaurelGrad)`} stroke="#CBD5E1" strokeWidth="1.5" />
                <polygon points="75,138 78,146 86,148 78,150 75,158 72,150 64,148 72,146" fill="#FFFFFF" />
                <circle cx="75" cy="148" r="3" fill="#D99513" />

                {/* Left Branch Leaves */}
                <path d="M 75 178 C 55 174 42 152 46 128" stroke={`url(#${instanceId}-kipLaurelGrad)`} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 48 132 C 40 126 40 118 46 114 C 52 118 54 126 48 132 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
                <path d="M 44 146 C 34 142 32 134 38 130 C 44 132 48 140 44 146 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
                <path d="M 48 162 C 38 160 38 152 44 148 C 50 150 52 158 48 162 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
                <path d="M 58 174 C 48 174 48 166 54 162 C 60 164 62 172 58 174 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />

                {/* Right Branch Leaves */}
                <path d="M 75 178 C 95 174 108 152 104 128" stroke={`url(#${instanceId}-kipLaurelGrad)`} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 102 132 C 110 126 110 118 104 114 C 98 118 96 126 102 132 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
                <path d="M 106 146 C 116 142 118 134 112 130 C 106 132 102 140 106 146 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
                <path d="M 102 162 C 112 160 112 152 106 148 C 100 150 98 158 102 162 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
                <path d="M 92 174 C 102 174 102 166 96 162 C 90 164 88 172 92 174 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />

                <path d="M 68 180 C 75 183 75 183 82 180 L 86 186 L 64 186 Z" fill={`url(#${instanceId}-kipLaurelGrad)`} />
              </g>

              {/* Right Side: Frosted Executive Briefcase */}
              <g className="anim-kip-briefcase">
                <ellipse cx="305" cy="188" rx="34" ry="6" fill="#142B63" fillOpacity="0.08" />
                <rect x="270" y="136" width="70" height="48" rx="8" fill={`url(#${instanceId}-kipBriefcaseGrad)`} stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M 270 152 L 340 152" stroke="#E2E8F0" strokeWidth="1.5" />
                <path d="M 294 136 L 294 122 C 294 118 316 118 316 122 L 316 136" stroke={`url(#${instanceId}-kipBriefcaseGrad)`} strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <rect x="299" y="148" width="12" height="15" rx="2.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                <rect x="302" y="153" width="6" height="5" rx="1" fill="#64748B" />
              </g>
            </g>
          )}

          {/* ============================================================== */}
          {/* MAIN KIP CHARACTER GROUP                                      */}
          {/* ============================================================== */}
          <g className={activeStage === 2 ? 'anim-kip-celebrate' : 'anim-kip-bob'}>
            {/* Kip's Fluffy Striped Tail (Behind body) */}
            <g className="anim-kip-tail">
              <path
                d="M 226 170 C 255 174 278 154 276 122 C 274 96 252 86 234 94 C 222 100 220 112 222 124"
                stroke="#E65100"
                strokeWidth="26"
                strokeLinecap="round"
                fill="none"
              />
              {/* White tip & dark stripes */}
              <path d="M 268 99 C 274 106 276 118 274 126" stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" fill="none" />
              <path d="M 246 88 C 252 90 258 94 262 100" stroke="#5D2600" strokeWidth="24" strokeLinecap="round" fill="none" />
              <path d="M 230 150 C 238 153 246 153 254 147" stroke="#5D2600" strokeWidth="24" strokeLinecap="round" fill="none" />
            </g>

            {/* Kip's Feet Paws */}
            <ellipse cx="166" cy="224" rx="16" ry="9" fill="#5D2600" />
            <ellipse cx="214" cy="224" rx="16" ry="9" fill="#5D2600" />
            <circle cx="166" cy="222" r="4.5" fill="#E65100" />
            <circle cx="214" cy="222" r="4.5" fill="#E65100" />

            {/* Chubby Pear-Shaped Body */}
            <path
              d="M 190 70 C 142 70 128 105 128 160 C 128 204 150 224 190 224 C 230 224 252 204 252 160 C 252 105 238 70 190 70 Z"
              fill={`url(#${instanceId}-kipFurGrad)`}
            />

            {/* Creamy Fluffy Belly */}
            <path
              d="M 190 135 C 166 135 156 158 156 192 C 156 216 170 220 190 220 C 210 220 224 216 224 192 C 224 158 214 135 190 135 Z"
              fill="#FFF3E0"
            />

            {/* Big Fluffy Triangular Ears */}
            <g className="anim-kip-ears">
              {/* Left Ear */}
              <path d="M 132 95 C 122 65 140 42 164 56 C 166 74 155 92 132 95 Z" fill="#E65100" />
              <path d="M 138 88 C 132 68 144 54 158 64 C 158 76 150 86 138 88 Z" fill="#FFF3E0" />
              <path d="M 138 78 L 148 74 L 142 84" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Right Ear */}
              <path d="M 248 95 C 258 65 240 42 216 56 C 214 74 225 92 248 95 Z" fill="#E65100" />
              <path d="M 242 88 C 248 68 236 54 222 64 C 222 76 230 86 242 88 Z" fill="#FFF3E0" />
              <path d="M 242 78 L 232 74 L 238 84" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>

            {/* White Brow Markings */}
            <ellipse cx="164" cy="94" rx="8" ry="5" fill="#FFFFFF" transform="rotate(-15 164 94)" />
            <ellipse cx="216" cy="94" rx="8" ry="5" fill="#FFFFFF" transform="rotate(15 216 94)" />

            {/* White Cheek Markings */}
            <path d="M 132 138 C 132 122 142 114 154 114 C 154 138 144 150 132 138 Z" fill="#FFFFFF" />
            <path d="M 248 138 C 248 122 238 114 226 114 C 226 138 236 150 248 138 Z" fill="#FFFFFF" />

            {/* Rosy Soft Cheeks */}
            <circle cx="150" cy="136" r="8" fill="#FF8A80" fillOpacity="0.45" />
            <circle cx="230" cy="136" r="8" fill="#FF8A80" fillOpacity="0.45" />

            {/* Snout & Nose */}
            <ellipse cx="190" cy="132" rx="15" ry="11" fill="#FFF3E0" />
            <ellipse cx="190" cy="128" rx="5" ry="3.5" fill="#5D2600" />

            {/* ========================================================== */}
            {/* EYES & MOUTH (Dynamic across stages)                       */}
            {/* ========================================================== */}
            <g className="anim-kip-eyes">
              {/* STAGE 0: Thinking / Reading Book */}
              {activeStage === 0 && (
                <g>
                  {/* Left Eye looking down inquisitively */}
                  <ellipse cx="168" cy="124" rx="13" ry="15" fill="#142B63" />
                  <circle cx="165" cy="120" r="5" fill="#FFFFFF" />
                  <circle cx="172" cy="129" r="2" fill="#FFFFFF" />
                  {/* Right Eye */}
                  <ellipse cx="212" cy="124" rx="13" ry="15" fill="#142B63" />
                  <circle cx="209" cy="120" r="5" fill="#FFFFFF" />
                  <circle cx="216" cy="129" r="2" fill="#FFFFFF" />
                  {/* Contemplative thinking curve mouth */}
                  <path d="M 185 134 Q 190 131 195 134" stroke="#5D2600" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* STAGE 1: Happy curved smile eyes `^ ^` */}
              {activeStage === 1 && (
                <g>
                  {/* Curved happy eyes */}
                  <path d="M 160 124 Q 168 115 176 124" stroke="#142B63" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                  <path d="M 204 124 Q 212 115 220 124" stroke="#142B63" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                  {/* Cute smile */}
                  <path d="M 184 133 C 187 137 193 137 196 133" stroke="#5D2600" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* STAGE 2: Big joyful anime eyes & open cheering smile */}
              {activeStage === 2 && (
                <g>
                  <ellipse cx="168" cy="124" rx="14" ry="16" fill="#142B63" />
                  <circle cx="164" cy="118" r="6" fill="#FFFFFF" />
                  <circle cx="173" cy="129" r="2.5" fill="#FFFFFF" />
                  <circle cx="174" cy="120" r="1.5" fill="#2F80ED" />

                  <ellipse cx="212" cy="124" rx="14" ry="16" fill="#142B63" />
                  <circle cx="208" cy="118" r="6" fill="#FFFFFF" />
                  <circle cx="217" cy="129" r="2.5" fill="#FFFFFF" />
                  <circle cx="218" cy="120" r="1.5" fill="#2F80ED" />

                  {/* Wide open celebratory mouth */}
                  <path d="M 183 133 Q 190 144 197 133 Z" fill="#5D2600" />
                  <path d="M 185 134 Q 190 139 195 134" stroke="#FF8A80" strokeWidth="2" fill="none" />
                </g>
              )}

              {/* STAGE 3: Friendly focused eyes & warm smile */}
              {activeStage === 3 && (
                <g>
                  <ellipse cx="168" cy="124" rx="13" ry="15" fill="#142B63" />
                  <circle cx="165" cy="119" r="5" fill="#FFFFFF" />
                  <circle cx="172" cy="128" r="2" fill="#FFFFFF" />

                  <ellipse cx="212" cy="124" rx="13" ry="15" fill="#142B63" />
                  <circle cx="209" cy="119" r="5" fill="#FFFFFF" />
                  <circle cx="216" cy="128" r="2" fill="#FFFFFF" />

                  {/* Gentle warm smile */}
                  <path d="M 184 134 C 187 138 193 138 196 134" stroke="#5D2600" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>
              )}
            </g>

            {/* Explorer Navy Scarf */}
            <path
              d="M 148 152 C 164 162 216 162 232 152 C 234 160 224 168 190 168 C 156 168 146 160 148 152 Z"
              fill="#142B63"
            />
            <path d="M 190 164 L 182 186 L 198 186 Z" fill="#1B367A" />

            {/* Golden Compass Medal */}
            <circle cx="190" cy="184" r="10" fill="#FFD166" />
            <circle cx="190" cy="184" r="8" fill="#FFF8E1" />
            <polygon points="190,178 193,184 190,183 187,184" fill="#E65100" />
            <polygon points="190,190 193,184 190,185 187,184" fill="#2F80ED" />
            <circle cx="190" cy="184" r="2" fill="#142B63" />

            {/* ========================================================== */}
            {/* ARMS & PAWS (Posing according to stage)                    */}
            {/* ========================================================== */}

            {/* STAGE 0: Left paw resting under chin pondering (matching video frame 1) */}
            {activeStage === 0 && (
              <g>
                {/* Right Arm resting down */}
                <path d="M 234 155 C 244 164 242 185 228 188 C 222 182 224 168 234 155 Z" fill="#5D2600" />
                {/* Left Arm curved up to chin */}
                <path d="M 146 160 C 136 172 144 186 160 172 C 166 166 172 150 174 138 C 170 137 162 142 158 152 Z" fill="#5D2600" />
                {/* Paw under chin with pink pad */}
                <ellipse cx="173" cy="138" rx="7.5" ry="7" fill="#5D2600" />
                <circle cx="173" cy="138" r="3.5" fill="#E65100" />
              </g>
            )}

            {/* STAGE 1: Gesturing to laurel wreath and briefcase (frames 2-3) */}
            {activeStage === 1 && (
              <g>
                {/* Left arm gesturing left */}
                <path d="M 142 160 C 126 168 116 178 120 186 C 124 188 134 182 146 170 Z" fill="#5D2600" />
                <ellipse cx="120" cy="185" rx="7" ry="6" fill="#5D2600" />
                <circle cx="120" cy="185" r="3" fill="#E65100" />

                {/* Right arm gesturing right */}
                <path d="M 238 160 C 254 168 264 178 260 186 C 256 188 246 182 234 170 Z" fill="#5D2600" />
                <ellipse cx="260" cy="185" rx="7" ry="6" fill="#5D2600" />
                <circle cx="260" cy="185" r="3" fill="#E65100" />
              </g>
            )}

            {/* STAGE 2: Both arms raised in the air celebrating! (frame 4) */}
            {activeStage === 2 && (
              <g>
                {/* Left arm raised high */}
                <path d="M 144 156 C 130 142 118 122 122 112 C 128 110 138 126 149 146 Z" fill="#5D2600" />
                <circle cx="122" cy="111" r="8" fill="#5D2600" />
                <circle cx="122" cy="111" r="4" fill="#E65100" />

                {/* Right arm raised high */}
                <path d="M 236 156 C 250 142 262 122 258 112 C 252 110 242 126 231 146 Z" fill="#5D2600" />
                <circle cx="258" cy="111" r="8" fill="#5D2600" />
                <circle cx="258" cy="111" r="4" fill="#E65100" />
              </g>
            )}

            {/* STAGE 3: Typing on keyboard (frame 6) */}
            {activeStage === 3 && (
              <g className="anim-kip-typing">
                {/* Left arm typing */}
                <path d="M 144 162 C 142 178 152 194 164 198 C 167 196 162 186 153 173 Z" fill="#5D2600" />
                <ellipse cx="164" cy="198" rx="6.5" ry="5.5" fill="#5D2600" />
                <circle cx="164" cy="198" r="2.5" fill="#E65100" />

                {/* Right arm typing */}
                <path d="M 236 162 C 238 178 228 194 216 198 C 213 196 218 186 227 173 Z" fill="#5D2600" />
                <ellipse cx="216" cy="198" rx="6.5" ry="5.5" fill="#5D2600" />
                <circle cx="216" cy="198" r="2.5" fill="#E65100" />
              </g>
            )}

            {/* ========================================================== */}
            {/* STAGE 2: GRADUATION MORTARBOARD CAP                        */}
            {/* ========================================================== */}
            {activeStage === 2 && (
              <g className="transition-all duration-300">
                {/* Skull cap seated cleanly between Kip's fluffy ears */}
                <path d="M 166 74 Q 190 66 214 74 L 210 88 Q 190 93 170 88 Z" fill={`url(#${instanceId}-kipGradCapGrad)`} stroke="#CBD5E1" strokeWidth="1" />
                {/* Diamond Cap Board */}
                <polygon points="190,50 240,64 190,78 140,64" fill={`url(#${instanceId}-kipGradCapGrad)`} stroke="#FFFFFF" strokeWidth="1.5" />
                {/* Cap Button */}
                <ellipse cx="190" cy="64" rx="3.5" ry="2.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
                {/* Dangling Tassel */}
                <g className="anim-kip-tassel">
                  <path d="M 190 64 Q 224 62 232 74" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                  <circle cx="232" cy="76" r="2.5" fill="#E2E8F0" />
                  <polygon points="232,78 228,94 236,94" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
                </g>

                {/* Celebration Confetti & Sparkles */}
                <path d="M 126 84 L 128 78 L 130 84 L 136 86 L 130 88 L 128 94 L 126 88 L 120 86 Z" fill="#FFD166" className="anim-kip-confetti" />
                <path d="M 252 80 L 254 74 L 256 80 L 262 82 L 256 84 L 254 90 L 252 84 L 246 82 Z" fill="#2F80ED" className="anim-kip-confetti" style={{ animationDelay: '1s' }} />
                <circle cx="140" cy="64" r="2.5" fill="#10B981" className="anim-kip-confetti" style={{ animationDelay: '0.5s' }} />
                <circle cx="240" cy="52" r="2" fill="#E65100" className="anim-kip-confetti" style={{ animationDelay: '1.5s' }} />
              </g>
            )}
          </g>

          {/* ============================================================== */}
          {/* FOREGROUND PROPS                                              */}
          {/* ============================================================== */}

          {/* STAGE 0: Open Study Book */}
          {activeStage === 0 && (
            <g className="transition-all duration-300">
              <ellipse cx="190" cy="236" rx="70" ry="8" fill="#142B63" fillOpacity="0.14" />
              <path d="M 183 234 Q 190 238 197 234 L 195 230 Q 190 233 185 230 Z" fill="#94A3B8" />

              {/* Hardcover Binding */}
              <path
                d="M 120 226 Q 190 236 190 236 Q 190 236 260 226 L 264 231 Q 190 241 190 241 Q 190 241 116 231 Z"
                fill="#1E293B"
              />

              {/* Left Page */}
              <path
                d="M 190 232 C 160 232 135 224 122 216 L 122 227 C 135 235 160 239 190 236 Z"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              <path
                d="M 190 228 C 160 228 135 220 124 212 L 124 223 C 135 231 160 235 190 232 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <line x1="138" y1="219" x2="178" y2="225" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
              <line x1="138" y1="223" x2="174" y2="229" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />

              {/* Right Page */}
              <path
                d="M 190 232 C 220 232 245 224 258 216 L 258 227 C 245 235 220 239 190 236 Z"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              <path
                d="M 190 228 C 220 228 245 220 256 212 L 256 223 C 245 231 220 235 190 232 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <line x1="202" y1="225" x2="242" y2="219" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
              <line x1="206" y1="229" x2="242" y2="223" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
            </g>
          )}

          {/* STAGE 3: Modern Desk & Laptop */}
          {activeStage === 3 && (
            <g className="transition-all duration-300">
              <ellipse cx="190" cy="244" rx="75" ry="6" fill="#142B63" fillOpacity="0.1" />

              {/* Desk Legs */}
              <rect x="124" y="202" width="8" height="42" rx="2.5" fill={`url(#${instanceId}-kipDeskGrad)`} stroke="#CBD5E1" strokeWidth="1" />
              <rect x="248" y="202" width="8" height="42" rx="2.5" fill={`url(#${instanceId}-kipDeskGrad)`} stroke="#CBD5E1" strokeWidth="1" />

              {/* Desk Top */}
              <rect x="110" y="196" width="160" height="10" rx="3.5" fill={`url(#${instanceId}-kipDeskGrad)`} stroke="#CBD5E1" strokeWidth="1" />
              <line x1="112" y1="198" x2="268" y2="198" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

              {/* Laptop Base */}
              <rect x="162" y="190" width="56" height="7" rx="2" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
              <rect x="184" y="192" width="12" height="3" rx="0.5" fill="#FFFFFF" />

              {/* Laptop Screen Display */}
              <rect x="167" y="150" width="46" height="40" rx="3.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
              <rect x="170" y="153" width="40" height="32" rx="2" fill={`url(#${instanceId}-kipScreenGrad)`} />

              {/* EduCompass Compass Logo on Screen */}
              <circle cx="190" cy="169" r="7" fill="#FFFFFF" fillOpacity="0.95" />
              <polygon points="190,164 192,169 190,168 188,169" fill="#E65100" />
              <polygon points="190,174 192,169 190,170 188,169" fill="#2F80ED" />
              <circle cx="190" cy="169" r="1.5" fill="#142B63" />
            </g>
          )}
        </svg>
  </div>;
}

const STAGES = [
  { label: "Discovery", tip: "Hi! I'm Kip! Let's explore your passions and discover your ideal career path!", icon: "01" },
  { label: "Explore", tip: "Explore majors and universities for Grade 12, GED and IGCSE students.", icon: "02" },
  { label: "Graduate", tip: "Check degree recognition and entry requirements directly with each university.", icon: "03" },
  { label: "Career", tip: "Take the career quiz to discover your top 3 career matches.", icon: "04" },
];

export function KipGuide() {
  const { t } = usePrefs();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!preference.matches);
    const update = () => setPlaying(!preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStage(value => (value + 1) % STAGES.length), 4200);
    return () => window.clearInterval(timer);
  }, [playing]);
  const chooseStage = (value: number) => { setStage(value); setPlaying(false); };
  return <div className="relative mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/25 bg-white/10 p-5 text-center shadow-xl">
    <span className="absolute -top-3 rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-deep">{t("CareerNest Navigator")}</span>
    <button type="button" onClick={() => chooseStage((stage + 1) % STAGES.length)} className="mt-3 w-full rounded-xl border border-line bg-card p-3 text-left text-ink" aria-label={t("Show another tip")}>
      <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-brand"><span>{t("Kip the navigator")}</span><span>{stage + 1} / 4</span></span>
      <span className="block min-h-16 text-sm font-semibold">{t(STAGES[stage].tip)}</span>
    </button>
    <button type="button" className="w-full rounded-xl py-2 focus-visible:outline-2 focus-visible:outline-white" onClick={() => chooseStage((stage + 1) % STAGES.length)} aria-label={t("Show another tip")}><Kip size={300} stage={stage} /></button>
    <div className="flex w-full flex-wrap justify-center gap-1 rounded-xl border border-line bg-card p-1" role="group" aria-label={t("Your pathway")}>
      {STAGES.map((item, index) => <button key={item.label} type="button" aria-pressed={stage === index} title={t(item.label)} className={`flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-semibold ${stage === index ? "bg-brand-soft text-brand" : "text-muted hover:bg-soft"}`} onClick={() => chooseStage(index)}><span className="font-mono">{item.icon}</span><span className="block max-w-full truncate">{t(item.label)}</span></button>)}
      <button type="button" className="grid min-h-11 min-w-11 place-items-center rounded-lg text-brand hover:bg-soft" aria-pressed={playing} aria-label={t(playing ? "Pause animation" : "Play animation")} onClick={() => setPlaying(value => !value)}>{playing ? "Ⅱ" : "▷"}</button>
    </div>
    <p className="mt-3 w-full border-t border-white/20 pt-3 text-xs text-white/80">{t("A little encouragement for your next big step.")}</p>
  </div>;
}
