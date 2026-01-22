import { useNavigate } from "react-router-dom";

export default function ManufacturerCard({
  manufacturer_id,
  name,
  location,
  rating,
}) {
  const navigate = useNavigate();

  function handleViewProfile() {
    if (!manufacturer_id) return;
    navigate(`/manufacturers/${manufacturer_id}`);
  }

  return (



    // color and styling of the card 
    <article className="rounded-2xl bg-white border border-[#E6E6E6]
                        shadow-[0_4px_12px_rgba(0,0,0,0.05)]
                        overflow-hidden hover:shadow-[0_6px_14px_rgba(0,0,0,0.08)]
                        transition-shadow cursor-pointer">
      {/* For now we have no images, but this is where images would go.*/}


      <div className="p-5 space-y-3">
        {/*This is where ratings are added */}
        <div className="flex text-[#FFC043] gap-[2px]">
          {"★".repeat(Math.floor(rating))}
          {"☆".repeat(5 - Math.floor(rating))}
        </div>
              <div className="w-full h-40 bg-[#EDEDED] flex items-center justify-center text-sm text-gray-500">
        Images Placeholder
      </div>


        {/* Manufacturer Name and Location */}
        <h2 className="text-lg font-medium text-[#2A2A2A]">{name}</h2>
        <p className="text-sm text-[#7A7A7A]">{location}</p>

        <button
          onClick={handleViewProfile}
          className="mt-3 w-full rounded-md bg-[#141414] py-2 text-sm text-white 
                           hover:bg-black transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!manufacturer_id}
        >        
          View Profile
        </button>
      </div>
    </article>
  );
}
