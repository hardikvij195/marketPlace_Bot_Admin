// app/dashboard/deals/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Info, Trash2, Search, Edit } from "lucide-react";
import PaginationBar from "../_components/Pagination";
import DealDetailsModal from "../_components/DealDetailsModal";

type Deal = {
  id: string;
  created_at: string;
  deal_data?: {
    salesPrice?: number;
    vehicleVin?: string;
    clientName?: string;
    [key: string]: any;
  };
  client_name?: string; // derived from deal_data.clientName
  sale_price?: number | string; // derived from deal_data.salesPrice
  vin_number?: string; // derived from deal_data.vehicleVin
  [key: string]: any;
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showviewModal, setShowViewModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabaseBrowser
        .from("calculations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (debouncedSearch.trim()) {
        query = query.ilike(
          "deal_data->>clientName",
          `%${debouncedSearch.trim()}%`
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Supabase error:", error.message);
      } else {
        const transformed = data.map((item: any) => ({
          ...item,
          client_name: item.deal_data?.clientName || "Unknown",
          sale_price: item.deal_data?.salesPrice || "0",
          vin_number: item.deal_data?.vehicleVin || "N/A",
        }));

        setDeals(transformed);
        setTotal(count || 0);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    const { error } = await supabaseBrowser
      .from("calculations")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchDeals();
    } else {
      console.error("Delete error:", error.message);
    }
  };

  const handleView = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowModal(true);
  };

  const handleSave = async (updated: { id: string; deal_data: any }) => {
    const { id, deal_data } = updated;

    const { error } = await supabaseBrowser
      .from("calculations")
      .update({ deal_data })
      .eq("id", id);

    if (error) {
      console.error("Save error:", error.message);
    } else {
      fetchDeals();
    }
  };

  const handleShowViewModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowViewModal(true);
  };

  const totalPages = Math.ceil(total / limit);

  console.log(selectedDeal);

  return (
    <div className="">
  

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-full">
          <input
            type="text"
            placeholder="Search by client name"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full border border-gray-300 rounded-md py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : deals.length === 0 ? (
        <p>No Calculations found.</p>
      ) : (
        <div className=" overflow-x-auto bg-white border border-gray-200 rounded-xl lg:w-full md:w-full w-[320px]">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="text-left bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Client Name</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Sale Price</th>
                <th className="px-6 py-4 font-semibold">VIN Number</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">{deal.client_name}</td>
                  <td className="px-6 py-4">
                    {new Date(deal.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">₹{deal.sale_price}</td>
                  <td className="px-6 py-4">{deal.vin_number}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleView(deal)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                      title="View"
                    >
                      <Edit size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleShowViewModal(deal)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                      title="View"
                    >
                      <Info size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedDeal && (
            <DealDetailsModal
              open={showModal}
              onClose={() => setShowModal(false)}
              deal={selectedDeal}
              onSave={handleSave}
            />
          )}

          <div className="mt-4">
            <PaginationBar
              page={page}
              setPage={setPage}
              totalPage={totalPages}
              totalRecord={total}
              limit={limit}
              setLimit={setLimit}
            />
          </div>
        </div>
      )}
      {showviewModal && selectedDeal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-blend-color-burn bg-opacity-40 backdrop-blur-sm">
    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 text-sm">
      {/* Close Button */}
      <button
        onClick={() => setShowViewModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        title="Close"
      >
        &times;
      </button>

      <h3 className="text-lg font-semibold mb-4">Deal Details</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><strong>Client Name:</strong> {selectedDeal.deal_data?.clientName}</div>
        <div><strong>Vehicle Make:</strong> {selectedDeal.deal_data?.vehicleMake}</div>
        <div><strong>Vehicle Model:</strong> {selectedDeal.deal_data?.vehicleModel}</div>
        <div><strong>Vehicle Year:</strong> {selectedDeal.deal_data?.vehicleYear}</div>
        <div><strong>Vehicle VIN:</strong> {selectedDeal.deal_data?.vehicleVin}</div>
        <div><strong>Vehicle Price:</strong> ${selectedDeal.deal_data?.vehicleCost}</div>
        <div><strong>Sale Price:</strong> ${selectedDeal.deal_data?.salesPrice}</div>
        <div><strong>Warranty Cost:</strong> ${selectedDeal.deal_data?.warrantyCost}</div>
        <div><strong>Warranty Sold:</strong> ${selectedDeal.deal_data?.warrantySold}</div>
        <div><strong>Gap Cost:</strong> ${selectedDeal.deal_data?.gapCost}</div>
        <div><strong>Gap Sold:</strong> ${selectedDeal.deal_data?.gapSold}</div>
        <div><strong>Admin Fee:</strong> ${selectedDeal.deal_data?.adminFee}</div>
        <div><strong>Admin Cost:</strong> ${selectedDeal.deal_data?.adminCost}</div>
        <div><strong>Lien Owed:</strong> ${selectedDeal.deal_data?.lienOwed}</div>
        <div><strong>Lot Pack:</strong> ${selectedDeal.deal_data?.lotPack}</div>
        <div><strong>Reserve:</strong> ${selectedDeal.deal_data?.reserve}</div>
        <div><strong>Referral:</strong> ${selectedDeal.deal_data?.referral}</div>
        <div><strong>Miscellaneous:</strong> ${selectedDeal.deal_data?.miscellaneous}</div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
