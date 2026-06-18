import React from 'react';
const NavBar = () => {
  return (

<nav className="flex fixed left-0 right-0 bottom-0 height[64px] bg-gray-800 align-center z-10 border-box justify-center gap-14 p-4 text-white">
  <div className="flex gap-[12px] algin-center">
      <a className = "hover:scale-105 ease-in-out duration-300" href="/user">User</a>
      <a className = "hover:scale-105 ease-in-out duration-300" href="/library">Library</a>
      <a className = "hover:scale-105 ease-in-out duration-300" href="/home">Home</a>
      <a className = "hover:scale-105 ease-in-out duration-300" href="/stats">Stats</a>
  </div>
</nav>
);
};

export default NavBar;