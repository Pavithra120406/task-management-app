import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div>
          <div className="brand">TaskFlow</div>
          <div className="brand-subtitle">Simple task tracking</div>
        </div>

        <div className="user-area">
          <span className="welcome">Hi, {user?.name}</span>
          <button className="button button-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
