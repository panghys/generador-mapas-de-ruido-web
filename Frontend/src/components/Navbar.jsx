import { icon } from "../assets";
import UserMenu from "./layout/UserMenu";

function Navbar() {
  return (
    <nav className="w-full flex py-6 justify-between items-center navbar">
      <a href="/">
        <img src={icon} alt="hoobank" className="w-[50px] h-[50px]"/>
      </a>
      <UserMenu />
    </nav>
  );
};

export default Navbar;