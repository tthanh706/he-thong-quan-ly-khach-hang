import { cn } from "@/lib/cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "line";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-fg hover:bg-primary/90",
        variant === "ghost" && "text-ink hover:bg-primary/8",
        variant === "danger" && "bg-danger text-primary-fg hover:bg-danger/90",
        variant === "line" && "border border-line bg-surface text-ink hover:border-primary/40",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink outline-none focus:border-primary";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <button className="absolute inset-0" aria-label="Đóng" onClick={onClose} />
      <div className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl text-primary">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: "ink" | "ok" | "accent" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "ink" && "bg-primary/10 text-primary",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "muted" && "bg-line text-muted",
      )}
    >
      {children}
    </span>
  );
}
