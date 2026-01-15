import { NavLink } from "react-router-dom";
import logo from "../assets/pinpoint.png";
import homeIcon from "../assets/home.svg";
import profileIcon from "../assets/profileIcon.svg";
import protoIcon from "../assets/protoIcon.svg";
import messagesIcon from  "../assets/messagesIcon.svg";
import consultantIcon from  "../assets/consultantIcon.svg";

const links = [
  { to: "/", label: "Home", icon: homeIcon },
  { to: "/profile", label: "Profile", icon: profileIcon},
  // { to: "/filter", label: "Filter" },
  { to: "/prototype", label: "Prototype", icon: protoIcon },
  { to: "/consultant", label: "Consulting", icon: consultantIcon },
  { to: "/messages", label: "Messages", icon: messagesIcon },
  // { to: "/ratings", label: "Ratings"},
];

export default function NavBar() {
  const baseLinkClass =
    "flex items-center gap-2 rounded-xl px-4 py-3 md:text-2xl text-neutral-400 font-inter hover:bg-[#E3E9FF] md:my-5 transition";

  return (

    <nav className="min-h-[95%] w-15/100 fixed rounded-3xl bg-white border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
      <img src={logo} alt="logo" className="mt-5 w-40 mb-6 self-center" />
      <div className="flex flex-col gap-2">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${baseLinkClass} ${isActive ? "bg-[#E4ECFF]" : ""}`
            }
          >
            <img src={icon} className=" fill-gray-300 mr-2 size-2 md:size-7" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>

  );
}
