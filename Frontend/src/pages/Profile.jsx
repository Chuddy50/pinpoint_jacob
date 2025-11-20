import NavBar from "../components/NavBar";
import LoginForm from "../components/LoginForm";


export default function Profile() {
  return (
    <div className="flex w-screen min-h-screen bg-[#F7F7F7]">
      <NavBar/>
      <LoginForm/>
    </div>
  );
}
