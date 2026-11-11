import Link from "next/link";
export default function Privacy() {
  return (
    <article className="panel reading">
      <p className="eyebrow">Privacy & permissions</p>
      <h1>Your learning stays yours.</h1>
      <p>
        Updated November 11, 2026. No advertising, behavioral tracking or
        third-party analytics is installed.
      </p>
      <p>
        Chord House stores your account email, password hash, profile and
        learning preferences. Private notes, tasks, collections, favorites,
        custom chords/patterns, practice sessions, routines, goals, reviews,
        assessments and reminders support the features you choose. Content
        reports are private to you and authorized managers. Personal records are
        isolated by account. Session cookies keep you signed in; we do not store
        login credentials in browser storage.
      </p>
      <h2>Account security</h2>
      <p>
        Verification and password-reset email is used only for requested account
        actions. In local development it is captured privately on your device.
        Password changes revoke active sessions. Account deletion requires a
        verified email, your password and explicit confirmation. Open{" "}
        <Link href="/account">My account</Link> for data download and permanent
        account deletion.
      </p>
      <h2>Your download and deletion controls</h2>
      <p>
        Download your personal data as a versioned UTF-8 JSON file after
        confirming your current password. Exports include your own records and
        safe session dates, not password hashes, session/CSRF tokens, email
        codes, internal retry keys, other users’ records or licensed shared
        content. No export file is retained on the server. Protect or delete the
        downloaded copy yourself.
      </p>
      <p>
        Confirmed account deletion removes the account and private records from
        the active database, including sessions, codes, custom content,
        practice, progress, reports, reminders and retry records. Shared catalog
        contributions and rights evidence remain; account links in shared
        records/audit history are anonymized. Public author/source attribution
        is separate from your account profile and remains with its provenance.
      </p>
      <h2>Retention</h2>
      <p>
        Private learning records remain until you remove them or delete your
        account. Deleting an individual assessment clears its notes and exercise
        payload; minimal retry identifiers/hashes remain until account deletion
        to prevent delayed retries from recreating it. Practice retry
        identifiers and reminder delivery dates also remain until account
        deletion. Shared content history remains while needed for provenance and
        corrections.
      </p>
      <p>
        Sessions expire after 24 hours without account activity or seven days at
        most. Verification/reset codes expire after 30 minutes. Hashed
        rate-limit windows expire after 15 minutes. Expired codes, sessions and
        rate windows are cleaned at startup and every 15 minutes while the
        server runs. Local captured codes are also removed on expiry cleanup,
        new mail capture or matching account deletion. Stopped servers clean up
        on restart. Delivered email cannot be recalled from an inbox.
      </p>
      <p>
        No hosted backup provider is configured locally. Copies you export or
        back up yourself remain under your control. Before public deployment,
        the operator must publish provider/contact details, storage location,
        backup expiry and deletion-after-restore procedures. Active-database
        deletion does not itself erase independent backups. Request logs contain
        status and random request identifiers, not private notes, passwords,
        email codes or microphone audio.
      </p>
      <h2>Microphone and notifications</h2>
      <p>
        The tuner requests microphone permission only when you start it and
        processes audio locally. Stop releases microphone capture. Chord audio
        and the metronome use local synthesized sound without microphone access.
        Ear-training scores stay on the current page. Reminders default off;
        browser notification permission follows an explanation and your explicit
        action. Denial does not block tools and in-app reminders remain
        available. Delivery needs a visible signed-in tab; closed-browser
        delivery is not guaranteed. Notifications contain no private notes or
        promotions.
      </p>
      <h2>Local use and third parties</h2>
      <p>
        Local operation needs no paid service. Online deployments may involve a
        hosting, database and mail provider; their data handling, terms and
        details must be reviewed and published before public deployment. No
        external lyrics, search or analytics service is contacted during
        practice. Provenance links open third-party sites only when you choose
        them and suppress referrer information; those sites have their own
        terms. Song content and lyrics, including Roman transliterations,
        arrangements and recordings, require appropriate rights. We do not claim
        a licensed popular-song library is available yet.
      </p>
    </article>
  );
}
