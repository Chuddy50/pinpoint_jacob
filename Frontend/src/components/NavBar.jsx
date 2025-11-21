import { NavLink } from "react-router-dom";
import logo from "../assets/pinpoint.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "Profile" },
  { to: "/filter", label: "Filter" },
  { to: "/prototype", label: "Prototype" },
  { to: "/consultant", label: "Consulting" },
  { to: "/messages", label: "Messages" },
  { to: "/ratings", label: "Ratings"},
];

export default function NavBar() {
  const baseLinkClass =
    "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-[#E6EEFF] transition";

  return (
    <nav className="h-full rounded-3xl bg-white border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
      <img src={logo} alt="logo" className="w-32 mb-6 self-center" />
      <div className="flex flex-col gap-2">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${baseLinkClass} ${
                isActive ? "bg-[#E4ECFF] text-[#1D4ED8]" : ""
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
