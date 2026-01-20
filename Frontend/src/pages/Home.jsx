import { useState } from "react";
import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";

export default function Home() {

  const [searchTerm, setSearchTerm] = useState("")


  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F3F4F6] p-4 gap-4 md:flex-row md:p-6 md:gap-6">
      <aside className="w-full md:w-72">
        <NavBar />
      </aside>

      <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm md:p-10">

        {/* search bar */}
        <div className="mb-6">
          <input
            type='text'
            placeholder='Search manufacturers...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <CompanyList searchTerm={searchTerm}/>
      </div>
    </div>
  );
}
