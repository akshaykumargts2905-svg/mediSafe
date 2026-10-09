"use client";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n";

export default function SpeakButton({ text, language: requestedLanguage }) {
  const { language: preference, t } = useLanguage();
  const language = requestedLanguage || preference;
  const [state, setState] = useState({ speaking: false, message: "" });
  const current = useRef(null);
  const timer = useRef(null);
  useEffect(() => { window.speechSynthesis?.getVoices(); }, []);
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (current.current) { current.current.onend = null; current.current.onerror = null; window.speechSynthesis?.cancel(); current.current = null; }
  }, [text, language]);

  function speak() {
    const speech = window.speechSynthesis;
    if (!speech || !window.SpeechSynthesisUtterance) { setState({ speaking: false, message: "Voice is unavailable for this language. Read the text above." }); return; }
    if (state.speaking) { speech.cancel(); clearTimeout(timer.current); setState({ speaking: false, message: "" }); return; }
    let voice;
    try { voice = speech.getVoices().find((item) => item.lang.toLowerCase().startsWith(language)); }
    catch { setState({ speaking: false, message: "Audio could not be played. Read the text above." }); return; }
    if (!voice) { setState({ speaking: false, message: "Voice is unavailable for this language. Read the text above." }); return; }
    let utterance;
    try {
      speech.cancel();
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = 0.9;
    } catch { setState({ speaking: false, message: "Audio could not be played. Read the text above." }); return; }
    current.current = utterance;
    const finish = (message = "") => { clearTimeout(timer.current); current.current = null; setState({ speaking: false, message }); };
    utterance.onstart = () => clearTimeout(timer.current);
    utterance.onend = () => finish();
    utterance.onerror = () => finish("Audio could not be played. Read the text above.");
    setState({ speaking: true, message: "" });
    timer.current = setTimeout(() => { speech.cancel(); finish("Audio could not be played. Read the text above."); }, 7000);
    try { speech.speak(utterance); } catch { finish("Audio could not be played. Read the text above."); }
  }
  return <div className="speech-control"><button className="button secondary" type="button" disabled={!text} onClick={speak}>{t(state.speaking ? "Stop audio" : "Listen")}</button>{state.message && <p role="status" className="fine-print">{t(state.message)}</p>}</div>;
}
