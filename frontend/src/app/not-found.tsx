import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel">
      <h1>We couldn’t find that page.</h1>
      <p>Return to your starting point.</p>
      <Link className="button button-primary" href="/">
        Go home
      </Link>
    </section>
  );
}
