import { useState } from "react";
import NavBar from "../components/NavBar";

const initialForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  projectName: "",
  description: "",
  materials: "",
  quantity: "",
  budget: "",
  deadline: "",
  certifications: "",
  shippingLocation: "",
  ndaRequired: "no",
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
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
            PinPoint
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Request a Manufacturing Quote
          </h1>
          <p className="text-sm text-gray-500">
            Outline the project details you want to send to a manufacturer.
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
                Company name
              </label>
              <input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Contact name
              </label>
              <input
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                Project name
              </label>
              <input
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Project description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[120px]"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Materials
              </label>
              <input
                name="materials"
                value={formData.materials}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Budget range
              </label>
              <input
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Certifications needed
              </label>
              <input
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Shipping location
              </label>
              <input
                name="shippingLocation"
                value={formData.shippingLocation}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                NDA required
              </label>
              <select
                name="ndaRequired"
                value={formData.ndaRequired}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
                <option value="unsure">Not sure yet</option>
              </select>
            </div>
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
