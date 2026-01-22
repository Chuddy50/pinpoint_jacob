import NavBar from "../components/NavBar";
import CompanyList from "../components/CompanyList";

export default function Messages() {
  return (
    <div className="flex bg-background w-screen h-screen bg-white p-6 gap-6">
       <aside className="w-72">
          <NavBar />
        </aside>
    </div>
  );
}
