/** Bound browser/device startup; owners still close contexts on failure/cancel. */
export async function resumeAudio(context: AudioContext): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      context.resume(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Audio startup timed out")),
          5000,
        );
      }),
    ]);
    if (context.state !== "running") throw new Error("Audio did not resume");
  } catch (cause) {
    throw new Error(
      "Audio could not start. Check your audio device, then press Start to retry.",
      { cause },
    );
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
