import { useEffect, useState } from "react";

export default function ManufacturerServices({ manufacturerId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch(`http://localhost:8000/manufacturers/${manufacturerId}/services`);
        const data = await response.json();
        if (data.success) {
          setServices(data.services);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [manufacturerId]);

  if (loading) return <p className="text-sm text-gray-600">Loading services...</p>;
  if (!services.length) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Services</h2>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => (
          <span
            key={service.service_id}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
          >
            {service.service_name}
          </span>
        ))}
      </div>
    </div>
  );
}