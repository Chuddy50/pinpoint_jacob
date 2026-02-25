// Profile.jsx
import { useState, useRef, useEffect } from "react";
import NavBar from "../components/NavBar";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../contexts/AuthContext"
import UserReviews from "../components/UserReviews";
import SavedDesignsProfile from "../components/SavedDesignsProfile";
import SavedManufacturers from "../components/SavedManufacturersProfile";


export default function Profile() {

  useEffect(() => {
    document.title = "Profile - PinPoint";
  }, []);
  
  const { user, logout, refreshUser, authHeaders, authLoading } = useAuth()

  const [selectedFile, setSelectedFile] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const fileInputRef = useRef(null)

  function handleUpdatePfpBtnClicked(){
    fileInputRef.current.click()
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
  }

  function handleCancelUpload() {
    setSelectedFile(null);
    setShowConfirmDialog(false);
    fileInputRef.current.value = ''; // Reset file input
  }

  async function handleConfirmUpload() {
    if (!selectedFile) return;

    setShowConfirmDialog(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`http://127.0.0.1:8000/auth/updatePFP`, {
        method: "POST",
        headers: authHeaders, 
        body: formData
      });

      if(!response.ok){
        const data = await response.json();
        alert("Failed to update profile picture: " + data.error);
      }

      await refreshUser()
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setSelectedFile(null);
      fileInputRef.current.value = ''; // Reset file input
    }
  }

  async function logoutUser(e) {
    e.preventDefault()

    try{
      await logout()
    } catch (error) {
      console.error(error.message || "Logout error")
    }
  }

  return (
    <div className="flex w-screen min-h-screen bg-[#F7F7F7] p-6 gap-6 max-md:flex-col max-md:p-4 max-md:gap-4">
      <aside className="w-45 max-md:w-full">
        <NavBar />
      </aside>
      
      <div className="flex-1 p-8 max-md:p-4">
        {authLoading && !user ? (
          <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600">
            Restoring session...
          </div>
        ) : user ? (
          <div className="">
            {/* confirmation Dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Confirm Profile Picture Change</h3>
                  <p className="text-gray-600 mb-6">
                    Upload: <span className="font-medium">{selectedFile?.name}</span>
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleCancelUpload}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUpload}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Confirm Change
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Header Section */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={user.pfp_url} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border border-blue-500"
                  />
                  
                  <button
                    onClick={handleUpdatePfpBtnClicked}
                    className="w-24 bg-gray-200 text-gray-700 py-1 text-xs rounded-lg hover:bg-gray-300 transition border border-black"
                  >
                    Update
                  </button>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold mb-1">Welcome, {user.username || 'User'}</h1>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <button 
                onClick={logoutUser}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition border border-black"
              >
                Log Out
              </button>
            </div>

            {/* Horizontal divider */}
            <hr className="border-t border-gray-400 mb-2 mx-2" />
            
            {/* designs saved by this user */}
            <SavedDesignsProfile userId={user.id}/>

            {/* manufacturers saved by this user */}
            <SavedManufacturers />

            {/* reviews left by this user */}
            <UserReviews userId={user.id}/>

            {/*hidden file input for selecting a new pfp*/}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <LoginForm/>
        )}
      </div>
    </div>
  );
}
