// rain made from filtered white noise, so there's no audio file to load
const soundBtn = document.getElementById("sound");
let audio = null;

function startRain() {
    audio = new AudioContext();
    const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;

    const volume = audio.createGain();
    volume.gain.value = 0.06;

    noise.connect(filter).connect(volume).connect(audio.destination);
    noise.start();
}

soundBtn.addEventListener("click", () => {
    if (!audio) startRain();
    else if (audio.state === "running") audio.suspend();
    else audio.resume();

    const on = soundBtn.getAttribute("aria-pressed") !== "true";
    soundBtn.setAttribute("aria-pressed", on);
    soundBtn.textContent = on ? "Sound on" : "Sound off";
});
