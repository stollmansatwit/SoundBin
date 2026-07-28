import{ Link } from 'react-router-dom';

type NavBarProps = {
  isOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
};

export function NavBar({ isOpen, openNav, closeNav }: NavBarProps) {
  return (
    <>
      {/* Backdrop: only needed on small screens, where the expanded nav
          overlays the page instead of pushing it. On sm+ screens the nav
          pushes the layout instead, so no backdrop is needed there. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 sm:hidden"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed left-0 top-0 z-30 h-screen px-4 py-6 text-white shadow-lg transition-all duration-300 ${
          isOpen
            ? 'w-56 bg-gray-900/95 backdrop-blur-md sm:w-32 sm:bg-transparent sm:backdrop-blur-none'
            : 'w-14 bg-transparent sm:w-16'
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
            <Link to="/home" onClick={closeNav}>Home</Link>
            <Link to="/user" onClick={closeNav}>User</Link>
            <Link to="/library" onClick={closeNav}>Library</Link>
            <Link to="/stats" onClick={closeNav}>Stats</Link>
          </div>
        </div>
      </nav>
    </>
  );
};