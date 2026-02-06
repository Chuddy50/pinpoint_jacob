import { use, useEffect, useState } from 'react';

export default function ManuacturerProducts( {manufacturerId }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch(`http://localhost:8000/manufacturers/${manufacturerId}/products`);
                if(!response.ok){
                  const errorData = await response.json()
                  throw new Error(errorData.detail || "Failed to fetch manufacturer products")
                }
                const data = await response.json();
                setProducts(data.products)
            }
            catch (error) {
                console.error("Failed to load products: ", error);
            }
            finally {
                setLoading(false)
            }
        }
        fetchProducts();
    }, [manufacturerId]);

    if(loading) return <p className="text-sm text-gray-600">Loading products...</p>;
    if(!products.length) return null;

    return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Products Offered</h2>
          {products.map((category, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-md font-medium text-gray-800">{category.category_name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.products.map((product) => (
                  <span
                    key={product.product_type_id}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                  >
                    {product.product_type_name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
    );
}