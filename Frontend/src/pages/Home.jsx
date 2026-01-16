import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F3F4F6] p-4 gap-4 md:flex-row md:p-6 md:gap-6">
      <aside className="w-full md:w-72">
        <NavBar />
      </aside>

      <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm md:p-10">
        <CompanyList />
      </div>
    </div>
  );
}
