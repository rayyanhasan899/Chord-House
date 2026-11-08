export function Feedback({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return message ? (
    <p
      role={error ? "alert" : "status"}
      className={error ? "feedback error" : "feedback"}
    >
      {message}
    </p>
  ) : null;
}
