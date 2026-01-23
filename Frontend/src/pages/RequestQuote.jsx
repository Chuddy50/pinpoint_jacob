import { useState } from "react";
import NavBar from "../components/NavBar";

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

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, attachments: file }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setFormData(initialForm);
    setSubmitted(false);
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F6] p-6 gap-6">
      <aside className="w-72">
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
        <p className="text-sm text-gray-500">
            Automated RFQ to send project details (material, color, quantities,
            notes) to a manufacturer. We will store this in Supabase later and
            send via Postmark.
          </p>
        </header>

        {submitted && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Your outline is ready. Connect this form to the backend when you are
            ready to send it.
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
              Save outline
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
