import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";
import FilterPanel from "../components/FilterPanel";

export default function Home() {

  useEffect(() => {
    document.title = "Home - PinPoint";
  }, []);

  // state to track the current search term entered by the user
  //  - gets passed down to company list to know what to show
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    location: "",
    priceLevels: [],
    minRating: "",
    moq: "",
    productCategories: [],
  })


  return (
    
    <div className="flex min-h-screen w-full flex-col bg-[#F3F4F6] p-4 gap-4 md:flex-row md:p-6 md:gap-6">

      {/* nav bar section */}
      <aside className="w-full md:w-45 md:flex-shrink-0">
        <NavBar />
      </aside>

      {/* main content area */}
      <div className="flex-1 rounded-3xl bg-white p-6 shadow-sm md:p-10">

        {/* search and filter bar */}
         <div className="mb-6 flex items-start gap-4 pr-4">
           {/* filter panel */}
           <div className="flex-1">
             <FilterPanel onFiltersChange={setFilters} />
           </div>

           {/* search bar */}
           <div className="relative w-full md:w-1/3">
             {/* input part of the search bar */}
             <input
               type='text'
               placeholder='Search for anything'
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
             />

             {/* search icon */}
             <svg 
               className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
               fill="none" 
               stroke="currentColor" 
               viewBox="0 0 24 24"
             >
               <path 
                 strokeLinecap="round" 
                 strokeLinejoin="round" 
                 strokeWidth={2} 
                 d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
               />
             </svg>
           </div>
         </div>

        {/* grid of manufacturers */}
        <CompanyList searchTerm={searchTerm} filters={filters}/>
      </div>
    </div>
  );
}
