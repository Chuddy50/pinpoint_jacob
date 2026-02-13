import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useQuery } from "@tanstack/react-query";

export default function ManufacturerProfileCreator() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Page 1
    username: "",
    email: "",
    password: "",
    verifyPassword: "",
    // Page 2
    manufacturerName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    manufacturerEmail: "",
    contactee: "",
    description: "",
    // Page 3
    services: [],
    // Page 4
    productCategories: [],
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch("http://127.0.0.1:8000/manufacturers/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  // Fetch product categories
  const { data: productCategories = [] } = useQuery({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const response = await fetch("http://127.0.0.1:8000/manufacturers/product-categories");
      if (!response.ok) throw new Error("Failed to fetch product categories");
      return response.json();
    },
  });

  useEffect(() => {
    document.title = "Create Manufacturer Profile - PinPoint";
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }));
    setError(null);
  };

  const handleProductCategoryToggle = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      productCategories: prev.productCategories.includes(categoryId)
        ? prev.productCategories.filter((id) => id !== categoryId)
        : [...prev.productCategories, categoryId],
    }));
    setError(null);
  };

  const validatePage1 = () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (!formData.verifyPassword) {
      setError("Please verify your password");
      return false;
    }
    if (formData.password !== formData.verifyPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const validatePage2 = () => {
    if (!formData.manufacturerName.trim()) {
      setError("Manufacturer name is required");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }
    if (!formData.state.trim()) {
      setError("State is required");
      return false;
    }
    if (!formData.zip.trim()) {
      setError("Zip code is required");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!formData.manufacturerEmail.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.contactee.trim()) {
      setError("Contactee name is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  const validatePage3 = () => {
    if (formData.services.length === 0) {
      setError("Please select at least one service");
      return false;
    }
    return true;
  };

  const validatePage4 = () => {
    if (formData.productCategories.length === 0) {
      setError("Please select at least one product category");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentPage === 1 && validatePage1()) {
      setCurrentPage(2);
    } else if (currentPage === 2 && validatePage2()) {
      setCurrentPage(3);
    } else if (currentPage === 3 && validatePage3()) {
      setCurrentPage(4);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePage4()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend to create the manufacturer account
      const response = await fetch("http://127.0.0.1:8000/manufacturers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          manufacturer_name: formData.manufacturerName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          phone: formData.phone,
          manufacturer_email: formData.manufacturerEmail,
          contactee: formData.contactee,
          description: formData.description,
          services: formData.services,
          product_categories: formData.productCategories,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create manufacturer profile");
      }

      // Success - redirect to profile page
      navigate("/profile");
    } catch (err) {
      setError(err.message || "An error occurred while creating your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen min-h-screen bg-[#F7F7F7] p-6 gap-6 max-md:flex-col max-md:p-4 max-md:gap-4">
      <aside className="w-45 max-md:w-full">
        <NavBar />
      </aside>

      <div className="flex-1 p-8 max-md:p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Create Manufacturer Profile
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Page {currentPage} of 4
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Page 1 */}
              {currentPage === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verify Password
                    </label>
                    <input
                      type="password"
                      name="verifyPassword"
                      value={formData.verifyPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </>
              )}

              {/* Page 2 */}
              {currentPage === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer Name
                    </label>
                    <input
                      type="text"
                      name="manufacturerName"
                      value={formData.manufacturerName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address (Street, State, Zip)
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g., 123 Main St, UT, 84101"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer Email
                    </label>
                    <input
                      type="email"
                      name="manufacturerEmail"
                      value={formData.manufacturerEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contactee
                    </label>
                    <input
                      type="text"
                      name="contactee"
                      value={formData.contactee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </>
              )}

              {/* Page 3 - Services */}
              {currentPage === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Services
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto bg-white">
                      {services.length > 0 ? (
                        services.map((service) => (
                          <label
                            key={service.service_id}
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.services.includes(service.service_id)}
                              onChange={() => handleServiceToggle(service.service_id)}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {service.service_name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          Loading services...
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Page 4 - Product Categories */}
              {currentPage === 4 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Product Categories
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto bg-white">
                      {productCategories.length > 0 ? (
                        productCategories.map((category) => (
                          <label
                            key={category.product_category_id}
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.productCategories.includes(
                                category.product_category_id
                              )}
                              onChange={() =>
                                handleProductCategoryToggle(category.product_category_id)
                              }
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {category.category_name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          Loading product categories...
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentPage > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-400 transition"
                  >
                    Previous
                  </button>
                )}
                {currentPage < 4 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-black text-white py-2 rounded font-semibold hover:text-blue-500 transition"
                  >
                    Next
                  </button>
                )}
                {currentPage === 4 && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black text-white py-2 rounded font-semibold hover:text-blue-500 transition disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
