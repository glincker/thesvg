// A template re-mounts on every navigation, which is what replays the enter animation.
export default function UiTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
