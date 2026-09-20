import { useEffect, useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import Overview from "./screens/Overview";

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

  if (isPhone) {
    return (
      <PhoneFrame bare>
        <Overview />
      </PhoneFrame>
    );
  }

  return (
    <div className="flex h-svh w-full items-center justify-center overflow-hidden">
      <div style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}>
        <PhoneFrame>
          <Overview />
        </PhoneFrame>
      </div>
    </div>
  );
}
