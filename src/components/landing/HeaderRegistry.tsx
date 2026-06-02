export function HeaderRegistry() {
  return (
    <nav>
      <a aria-label="NEXUS home" className="nav-logo" href="/">
        <img alt="NEXUS logo" src="/logo-mark.png" />
      </a>
      <ul className="nav-links">
        <li>
          <a href="#arch">Architecture</a>
        </li>
        <li>
          <a href="#signals">Signals</a>
        </li>
        <li>
          <a href="#tracks">Tracks</a>
        </li>
      </ul>
      <a className="nav-cta" href="/signin">
        Continue
      </a>
    </nav>
  );
}
