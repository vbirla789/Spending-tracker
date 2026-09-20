import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import Agent from "./screens/Agent";
import Overview from "./screens/Overview";

/* iOS drawer curve — the agent presents itself the way a sheet would, so the
   gesture vocabulary matches the chevron-back in its header. */
const SHEET_EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];

/**
 * Shrink the phone to fit short desktop windows while keeping it 1:1 on a
 * roomy screen. Outer box is 375×812 plus the 5px bezel and a little air.
 */
function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () =>
      setScale(Math.min(1, window.innerWidth / 420, window.innerHeight / 860));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return scale;
}

/** On a real phone we ditch the mockup and run edge-to-edge. */
function useIsPhone() {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isPhone;
}

export default function App() {
  const scale = usePhoneScale();
  const isPhone = useIsPhone();

  /* null = closed. A string opens the agent with that question already asked;
     an empty string opens it at its empty state. */
  const [agentQuestion, setAgentQuestion] = useState<string | null>(null);

  const screens = (
    <>
      {/* Overview stays mounted underneath so the agent slides over it rather
          than replacing it — otherwise there'd be nothing behind the sheet. */}
      <div className="h-full">
        <Overview onAsk={(q) => setAgentQuestion(q)} />
      </div>

      <AnimatePresence>
        {agentQuestion !== null && (
          <motion.div
            key="agent"
            className="absolute inset-0 z-40"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.42, ease: SHEET_EASE }}
          >
            <Agent
              initialQuestion={agentQuestion || undefined}
              onBack={() => setAgentQuestion(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (isPhone) return <PhoneFrame bare>{screens}</PhoneFrame>;

  /* The stage grey lives here rather than on `body`, so the document root can
     stay the screen's own colour — see the note in index.css. */
  return (
    <div className="flex h-svh w-full items-center justify-center overflow-hidden bg-[#e9eae6]">
      <div style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}>
        <PhoneFrame>{screens}</PhoneFrame>
      </div>
    </div>
  );
}
