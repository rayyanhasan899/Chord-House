export default function Privacy() {
  return (
    <article className="panel reading">
      <p className="eyebrow">Privacy & permissions</p>
      <h1>Your learning stays yours.</h1>
      <p>
        Chord House stores your account email, password hash, profile and
        learning preferences. Personal records are isolated by account. Session
        cookies keep you signed in; we do not store login credentials in browser
        storage.
      </p>
      <h2>Account security</h2>
      <p>
        Verification and password-reset email is used only for requested account
        actions. In local development it is captured privately on your device.
        Password changes revoke active sessions. Account deletion requires a
        verified email, your password and confirmation. Account deletion
        controls and full data export will be added during privacy hardening.
      </p>
      <h2>Microphone and notifications</h2>
      <p>
        The tuner requests microphone permission only when you start it and
        processes audio locally. Stop releases microphone capture. Chord audio
        and the metronome use local synthesized sound without microphone access.
        No notification permission is requested by these account pages.
      </p>
      <h2>Local use and third parties</h2>
      <p>
        Local operation needs no paid service. Online deployments may involve a
        hosting, database and mail provider; their details must be documented
        before public deployment. Song content and lyrics require appropriate
        rights. We do not claim a licensed popular-song library is available
        yet.
      </p>
    </article>
  );
}
