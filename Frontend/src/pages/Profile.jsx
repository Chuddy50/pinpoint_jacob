// Profile.jsx
import { useState, useRef } from "react";
import NavBar from "../components/NavBar";
import LoginForm from "../components/LoginForm";

export default function Profile() {
  const [userData, setUserData] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  function handleUpdatePfpBtnClicked(){
    fileInputRef.current.click()
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected file:", file);
    }
  }

  async function logoutUser(e) {
    e.preventDefault()

    try{

      const result = await fetch("http://127.0.0.1:8000/pinpoint/logout", {
        method: "POST",
        headers: {"Content-Type": "application/json"}
      })

      const data = await result.json()

      if(data.success) {
        setUserData(null)
      } else {
        console.error("logout error: ", data.error)
      }

    } catch (error) {
      console.error("logout error: ", error)
    }
  }


  //starting function to update the pfp, but need to implement auth state first to
  // know user id
  /*
  async function updatePfp(e) {
    e.preventDefault()

    try{

      const res = await fetch("http://127.0.0.1:8000/pinpoint/updatePFP/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

    } catch (error) {

    }

  }*/

  return (
    <div className="flex w-screen min-h-screen bg-[#F7F7F7]">
      <NavBar/>
      
      <div className="flex-1 p-8">
        {userData ? (
          // Show user profile after successful login
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">My Profile</h1>
            
            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <img 
                src={userData.pfp_url} 
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
              />
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-lg font-semibold">{userData.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  User ID
                </label>
                <p className="text-sm text-gray-500 font-mono">{userData.user_id}</p>
              </div>
            </div>

            <button
              onClick = {handleUpdatePfpBtnClicked}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Update Profile Picture
            </button>

            {/*hidden file input for selecting a new pfp*/}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />

            <button 
              onClick={logoutUser}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          // Show login form if no user data
          <LoginForm onSubmit={setUserData} />
        )}
      </div>
    </div>
  );
}
