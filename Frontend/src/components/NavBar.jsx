import { useLocation, NavLink } from "react-router-dom";
import logo from "../assets/pinpoint.png";

export default function NavBar() {
  let location = useLocation();

  let baseLinkClass =
    " mx-4 hover:text-gray-800 px-4 py-4 transition relative flex justify-center text-xl font-inter font-light text-gray-400";
  let activeLinkClass = "bg-blue-100 rounded-xl";
  let inActiveLinkClass = "bg-rehover:bg-gray-200 ";

  return (
    <nav
      className="flex flex-col h-full w-[12vw] rounded-xl gap-10 
                    bg-white shadow-[0px_0px_11px_5px_rgba(0,_0,_0,_0.1)]
                    content-center justify-items-center py-5 md:pt-10"
    >
      <img src={logo} alt="logo" className="w-3/4 self-center " />

      <NavLink
        to="/"
        className={({ isActive }) =>
          `${baseLinkClass}
                ${isActive ? activeLinkClass : inActiveLinkClass}`
        }
      >
        Home
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${baseLinkClass}
   ${isActive ? activeLinkClass : inActiveLinkClass}`
        }
      >
        Profile
      </NavLink>

      <NavLink
        to="/filter"
        className={({ isActive }) =>
          `${baseLinkClass}
   ${isActive ? activeLinkClass : inActiveLinkClass}`
        }
      >
        Filter
      </NavLink>
      <NavLink
        to="/prototype"
        className={({ isActive }) =>
          `${baseLinkClass}
   ${isActive ? activeLinkClass : inActiveLinkClass}`
        }
      >
        Prototype
      </NavLink>
      <NavLink
        to="/consultant"
        className={({ isActive }) =>
          `${baseLinkClass}
   ${isActive ? activeLinkClass : inActiveLinkClass}`
        }
      >
        Consulting
      </NavLink>
      <NavLink
        to="/messages"
        className={({ isActive }) =>
          `${baseLinkClass}
   ${isActive ? activeLinkClass : inActiveLinkClass}`
        }
      >
        Messages
      </NavLink>
    </nav>
  );
}
