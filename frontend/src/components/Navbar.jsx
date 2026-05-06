import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const initials = user?.username
    ? user.username.slice(0, 1).toUpperCase()
    : "??";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">⬡</div>
          <div>Hello<span>Taskers</span></div>
        </div>

        <div className="navbar-right">
          {user && (
            <div className="navbar-user">
              <div className="navbar-avatar">{initials}</div>
              <span>{user.username}</span>
              <span className={`navbar-role-badge role-${user.role}`}>
                Taskers
              </span>
            </div>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}