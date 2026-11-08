"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel">
      <h1>Something went wrong</h1>
      <p>Your changes may not have been saved. Try again.</p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
