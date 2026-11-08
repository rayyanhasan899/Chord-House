export class ChordAudio {
  onEnded?: () => void;
  private context: AudioContext | null = null;
  private version = 0;
  stop() {
    this.version++;
    const context = this.context;
    this.context = null;
    if (context) void context.close();
  }
  async play(notes: number[], arpeggio: boolean, volume: number) {
    this.stop();
    const turn = this.version;
    const context = new AudioContext();
    this.context = context;
    try {
      await context.resume();
      if (turn !== this.version) return;
      const start = context.currentTime + 0.03;
      notes.forEach((midi, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = "triangle";
        osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
        const at = start + (arpeggio ? index * 0.14 : 0);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(
          (volume / Math.max(notes.length, 1)) * 0.25,
          at + 0.015,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);
        osc.connect(gain).connect(context.destination);
        osc.start(at);
        osc.stop(at + 1.25);
        if (index === notes.length - 1)
          osc.onended = () => {
            if (turn === this.version) {
              this.stop();
              this.onEnded?.();
            }
          };
      });
    } catch (error) {
      this.stop();
      throw error;
    }
  }
}
