"use client";
import { useState } from "react";
import { useHydrated } from "@/lib/hydrated";
import { useRouter } from "next/navigation";
import { useAuth } from "./context";
import { api, apiError, type ProfileUpdate } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feedback } from "@/components/ui/feedback";
export function Onboarding() {
  const hydrated = useHydrated();
  const auth = useAuth();
  const profile = auth.profile;
  const router = useRouter();
  const [instrument, setInstrument] = useState<ProfileUpdate["instrument"]>(
    profile?.instrument || "acoustic_guitar",
  );
  const [timezone, setTimezone] = useState(profile?.timezone || "UTC");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const tunings =
    instrument === "ukulele"
      ? ["reentrant"]
      : instrument === "bass"
        ? ["standard"]
        : ["standard", "drop_d", "dadgad"];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage("");
    const body: ProfileUpdate = {
      display_name: String(form.get("display_name")),
      instrument,
      skill: String(form.get("skill")) as ProfileUpdate["skill"],
      timezone,
      tuning: String(form.get("tuning")),
      theme: String(form.get("theme")) as ProfileUpdate["theme"],
      handedness: String(form.get("handedness")) as ProfileUpdate["handedness"],
      chord_display: String(
        form.get("chord_display"),
      ) as ProfileUpdate["chord_display"],
      interests: String(form.get("interests")),
      onboarding_complete: true,
    };
    try {
      const r = await api.PATCH("/api/v1/me", { body });
      if (!r.data) throw new Error(apiError(r.error));
      auth.accept(r.data);
      router.push("/account");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : apiError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="setup-layout">
      <div>
        <p className="eyebrow">Your starting point</p>
        <h1>Make it your own.</h1>
        <p className="lede">
          Tell us what you play and where you’re starting. You can revisit these
          preferences anytime.
        </p>
        <p className="hint">
          Instrument and skill level are essential. All other choices have
          defaults; interests are optional.
        </p>
      </div>
      <div className="panel">
        <h2>Learning preferences</h2>
        <Feedback error message={message} />
        <form onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={!hydrated || busy}>
            <label>
              Display name
              <Input
                name="display_name"
                defaultValue={profile?.display_name}
                required
                maxLength={80}
              />
            </label>
            <div className="form-grid">
              <label>
                Instrument
                <select
                  value={instrument}
                  onChange={(e) =>
                    setInstrument(e.target.value as ProfileUpdate["instrument"])
                  }
                >
                  <option value="acoustic_guitar">Acoustic guitar</option>
                  <option value="electric_guitar">Electric guitar</option>
                  <option value="bass">Bass guitar</option>
                  <option value="ukulele">Ukulele</option>
                </select>
              </label>
              <label>
                Skill level
                <select
                  name="skill"
                  defaultValue={profile?.skill || "beginner"}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label>
                Preferred tuning
                <select
                  name="tuning"
                  key={instrument}
                  defaultValue={
                    tunings.includes(profile?.tuning || "")
                      ? profile?.tuning
                      : tunings[0]
                  }
                >
                  {tunings.map((t) => (
                    <option key={t} value={t}>
                      {t === "dadgad"
                        ? "DADGAD"
                        : t === "drop_d"
                          ? "Drop D"
                          : t === "reentrant"
                            ? "Re-entrant G C E A"
                            : "Standard"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Handedness
                <select
                  name="handedness"
                  defaultValue={profile?.handedness || "right"}
                >
                  <option value="right">Right-handed</option>
                  <option value="left">Left-handed</option>
                </select>
              </label>
            </div>
            <label>
              Timezone
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                maxLength={100}
                aria-describedby="timezone-help"
              />
            </label>
            <p id="timezone-help" className="hint">
              Use an IANA timezone, such as Asia/Karachi.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
              }
            >
              Use device timezone
            </Button>
            <label>
              Appearance
              <select name="theme" defaultValue={profile?.theme || "system"}>
                <option value="system">Match device</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Chord display preference
              <select
                name="chord_display"
                defaultValue={profile?.chord_display || "diagrams"}
              >
                <option value="diagrams">Chord diagrams</option>
                <option value="fretboard">Fretboard</option>
              </select>
            </label>
            <label>
              Learning interests <span className="hint">(optional)</span>
              <textarea
                name="interests"
                defaultValue={profile?.interests}
                maxLength={500}
                rows={3}
              />
            </label>
            <Button disabled={busy}>
              {busy ? "Saving…" : "Save preferences"}
            </Button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
