export function HeaderRegistry() {
  return (
    <nav>
      <div className="nav-logo">NEXUS</div>
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
