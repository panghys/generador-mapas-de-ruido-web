import { icon } from "../assets";

function Navbar() {
  return (
    <nav className="w-full flex py-6 justify-between items-center navbar">
      <a href="/">
        <img src={icon} alt="hoobank" className="w-[50px] h-[50px]"/>
      </a>
    </nav>
  );
};

export default Navbar;