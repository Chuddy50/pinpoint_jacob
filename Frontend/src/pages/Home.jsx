import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";

export default function Home() {
  return (
    <div className="flex bg-background w-screen h-screen bg-white">
      <NavBar/>
     <CompanyList/>
    </div>
  );
}
