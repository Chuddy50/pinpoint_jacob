import ManufacturerCard from "./ManufacturerCard";



const manufacturers = [
  { name: "ABC Manufacturing", location: "Salt Lake City, UT", rating: 4.5 },
  { name: "Summit Precision", location: "Provo, UT", rating: 4.2 },
  { name: "AeroFab", location: "Ogden, UT", rating: 5.0 },
  { name: "ZX Manufacturing", location: "Logan, UT", rating: 3.5 },
  { name: "Blue Ridge CNC", location: "Denver, CO", rating: 4.0 },
  { name: "Allied Works", location: "Boise, ID", rating: 3.8 },
];

export default function CompanyList() {
  return (
    <section className="flex-1 px-10 py-12 space-y-8">
    <header className="mb-10">
      <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
          PinPoint
        </p>
        <h1 className="text-4xl font-light text-gray-900">
          Browse manufacturers
        </h1>
      </header>
      <div className="manufacturer-grid">
        {manufacturers.map((m) => (
          <ManufacturerCard key={m.name} {...m} />
        ))}
      </div>
    </section>
  );
}
