import Link from "next/link";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">A little practice. Every day.</p>
          <h1>
            Make room
            <br />
            for music.
          </h1>
          <p className="lede">
            Your own space to learn guitar, bass and ukulele. Start with an
            account that remembers how you like to learn.
          </p>
          <div className="actions">
            <Link className="button button-primary" href="/register">
              Find your starting point <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/login">
              Already at home here? Sign in
            </Link>
          </div>
        </div>
        <aside className="hero-note">
          <span className="eyebrow">Your first step</span>
          <div className="strings" aria-hidden="true">
            ♪
          </div>
          <h2>A practice that feels like yours.</h2>
          <p>
            Choose your instrument, level and preferred tuning. You can change
            them as you grow.
          </p>
          <span className="tag">No paid service needed locally</span>
        </aside>
      </section>
      <section className="availability">
        <div>
          <p className="eyebrow">Ready today</p>
          <h2>Your account, your starting point.</h2>
        </div>
        <p>
          Create an account, sign in securely and set your learning preferences.
          Tuner, metronome, chord library, songs and practice tracking are
          planned for upcoming phases and are not available yet.
        </p>
      </section>
    </>
  );
}
