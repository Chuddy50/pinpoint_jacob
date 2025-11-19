import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";

export default function Home() {
  return (
    
    // color of background 
    <div className="flex w-screen min-h-screen bg-[#F7F7F7]">
      <NavBar/>
     <CompanyList/>
    </div>
  );
}
