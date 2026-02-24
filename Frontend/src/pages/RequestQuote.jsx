import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";


const initialForm = {
  name: "",
  email: "",
  phone: "",
  clothingType: "",
  quantity: "",
  material: "",
  color: "",
  sizeRange: "",
  deadline: "",
  notes: "",
  attachments: null,
};

export default function RequestQuote() {
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const { user, authHeaders } = useAuth();
  const location = useLocation();
  const manufacturer = location.state?.manufacturer || null;
  const manufacturerId =
    manufacturer?.manufacturer_id ?? manufacturer?.id ?? null;

  useEffect(() => {
    document.title = "Request Quote - PinPoint";
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, attachments: file }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("http://127.0.0.1:8000/rfq/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders 
        },
        body: JSON.stringify({
          buyer_id: user.id,
          manufacturer_id: manufacturerId,
          contact_name: formData.name,
          contact_email: formData.email,
          contact_phone: formData.phone || null,
          clothing_type: formData.clothingType,
          quantity: formData.quantity,
          material: formData.material || null,
          color: formData.color || null,
          size_range: formData.sizeRange || null,
          deadline: formData.deadline || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Failed to submit RFQ");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to save RFQ:", err);
      alert("Failed to submit quote request");
    }
  }

  function handleReset() {
    setFormData(initialForm);
    setSubmitted(false);
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
      <aside className="w-45">
        <NavBar />
      </aside>

      <div className="flex-1 rounded-3xl bg-white p-10 shadow-sm space-y-8">
        <header className="space-y-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-fit rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            ← Back
          </button>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
            PinPoint
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Request a Quote
          </h1>
          {manufacturer?.name && (
            <p className="text-sm text-gray-600">
              Requesting a quote from{" "}
              <span className="font-semibold text-gray-900">
                {manufacturer.name}
              </span>
              .
            </p>
          )}
        <p className="text-sm text-gray-500">
            Automated RFQ to send project details (material, color, quantities,
            notes) to a manufacturer. This saves a draft to Supabase and can be
            sent via Postmark later.
          </p>
        </header>

        {submitted && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Your quote request was submitted successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Clothing type
              </label>
              <input
                name="clothingType"
                value={formData.clothingType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Material
              </label>
              <input
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Size range
              </label>
              <input
                name="sizeRange"
                value={formData.sizeRange}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Desired deadline
              </label>
              <input
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[120px]"
            />
          </section>

          <section className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Attach drawings or CAD files
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm"
            />
            {formData.attachments && (
              <p className="text-xs text-gray-500">
                Selected file: {formData.attachments.name}
              </p>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black transition"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Clear form
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}
