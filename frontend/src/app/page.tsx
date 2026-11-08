export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 sm:px-12">
      <p className="mb-8 text-sm font-bold tracking-widest uppercase">
        Chord House / Your home for guitar learning
      </p>
      <h1 className="max-w-3xl text-5xl leading-tight font-semibold tracking-tight sm:text-7xl">
        A place to build
        <br />
        your practice.
      </h1>
      <p className="mt-8 max-w-xl text-lg leading-relaxed text-stone-600">
        The development foundation is ready. Learning tools and your personal
        workspace will arrive in the upcoming implementation phases.
      </p>
      <div className="mt-12 border-t border-stone-300 pt-6">
        <h2 className="text-lg font-semibold">Current availability</h2>
        <p className="mt-2 max-w-xl leading-relaxed text-stone-600">
          This page verifies that Chord House runs locally. Accounts, songs, the
          tuner and practice tracking are not available yet.
        </p>
      </div>
    </main>
  );
}
