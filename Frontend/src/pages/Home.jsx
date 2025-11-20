import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
      <aside className="w-72">
        <NavBar />
      </aside>

      <div className="flex-1 rounded-3xl bg-white p-10 shadow-sm">
        <CompanyList />
      </div>
    </div>
  );
}
