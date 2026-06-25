import{ Link } from 'react-router-dom';

type NavBarProps = {
  isOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
};

export function NavBar({ isOpen, openNav, closeNav }: NavBarProps) {
  return (
    <nav
      className={`fixed left-0 top-0 z-10 h-screen bg-transparent px-4 py-6 text-white shadow-lg transition-all duration-300 ${
        isOpen ? 'w-32' : 'w-16'
      }`}
    >
      <div className="flex h-full flex-col gap-4 text-left text-lg font-semibold">
        <button
          type="button"
          onClick={isOpen ? closeNav : openNav}
          className="self-end rounded px-2 py-1 text-2xl font-bold hover:text-yellow-100"
          aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'}
        >
          {isOpen ? '×' : '☰'}
        </button>
        <div className={`flex flex-col gap-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} [&>a]:text-lg`}>
          <Link to="/home">Home</Link>
          <Link to="/user">User</Link>
          <Link to="/library">Library</Link>
          <Link to="/stats">Stats</Link>
        </div>
      </div>
    </nav>
  );
};