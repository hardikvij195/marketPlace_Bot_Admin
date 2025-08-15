"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  FileText,
  CalendarDays,
  DollarSign,
  Plus,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Trash2,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import Modal from "../_components/Modal";
import { exportToExcel } from "@/lib/exportToExcel";
import { showToast } from "@/hooks/useToast";
import PaginationBar from "../_components/Pagination";
import DeleteModal from "../_components/DeleteModal";
import { Button } from "@/components/ui/button";
import moment from "moment";

type Invoice = {
  id: string;
  user: string;
  model: string;
  date: string;
  amount: string;
  commission: string;
  vinNumber: string;
  status: string;
};

const ITEMS_PER_PAGE = 5;

export default function InvoicesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Invoice[]>([]);
  const [dataInvoice, setInvoice] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // const limit = 10;
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  const [isOpenDeleted, setIsOpenDeleted] = useState(false);
  const [rowData, setRowData] = useState<any>(null);
  const [deleteRefresh, setDeleteRefresh] = useState<any>(null);
  const handleRefresh = () => {
    setPage(1);

    setDeleteRefresh(Math.random());
  };

  const [invoiceStats, setInvoiceStats] = useState<any>({
    totalInvoice: 0,
    totalAmount: 0,
    conmissionearned: 0,
  });
  // Load dummy data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const fakeData = Array.from({ length: 20 }).map((_, i) => ({
        id: `INV-1000${i + 1}`,
        user: `User ${i + 1}`,
        model: "2021 Toyota Camry",
        date: "Jul 9, 2025 09:00 AM",
        amount: "$30000",
        commission: "$900",
        vinNumber: "123123fdsdfsd",
        status: i % 3 === 0 ? "Paid" : i % 3 === 1 ? "Pending" : "Cancelled",
      }));
      setData(fakeData);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter logic
  const filteredData = data.filter((invoice) => {
    const matchesSearch =
      invoice.user.toLowerCase().includes(search.toLowerCase()) ||
      invoice.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status ? invoice.status === status : true;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(total / limit);

  const pagedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const totalAmount = filteredData.reduce(
    (acc, cur) => acc + Number(cur.amount.replace(/\$|,/g, "")),
    0
  );
  const totalCommission = filteredData.reduce(
    (acc, cur) => acc + Number(cur.commission.replace(/\$|,/g, "")),
    0
  );

  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1); // reset page on filter
  };

  useEffect(() => {
    const handleFetchSeminar = async () => {
      try {
        let query = supabaseBrowser
          .from("invoice")
          .select("*, users!inner(*)", {
            count: "exact",
          })
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        // Apply filters
        if (search) {
          query = query.ilike("users.email", `%${search}%`);
        }

        if (status && status != "all") {
          query = query.eq("status", status);
        }

        // if (selectedDate) {
        //   console.log(selectedDate)
        //   query = query.eq("dateOfSale", selectedDate);
        // }
        if (selectedDate) {
          const formattedDate = moment(selectedDate).format("YYYY-MM-DD");

          query = query.eq("dateOfSale", formattedDate);
        }

        const { data, error, count } = await query;

        if (error) {
          console.log(error);
          setError(error.message);
        } else {
          setInvoice(data);
          setTotal(count || 0); // Set total count of records
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch seminar data");
      }
    };
    handleFetchSeminar();
  }, [page, search, status, selectedDate, deleteRefresh ,limit]);

  useEffect(() => {
    const handleInvoiceData = async () => {
      try {
        const { data, error, count } = await supabaseBrowser
          .from("invoice") // ← table title
          .select("*", { count: "exact" })
          .order("created_at", { ascending: true });

        if (error) {
          console.error(error);
        }

        const totalInvoice = data?.length;

        let totalAmount = 0;

        let conmissionearned = 0;

        data?.map((w) => {
          totalAmount += Number(w?.saleAmount || 0);
          conmissionearned += Number(w?.commission_amount || 0);
        });

        // console.log({
        //   totalInvoice,
        //   totalAmount,
        //   conmissionearned,
        // });

        setInvoiceStats({
          totalInvoice,
          totalAmount,
          conmissionearned,
        });
      } catch (error) {
        return false;
      }
    };
    handleInvoiceData();
  }, []);

  const handleExportFile = async () => {
    try {
      const { data, error, count } = await supabaseBrowser
        .from("invoice")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error("Something went wrong!");
      }
      await exportToExcel(data, "invoices");
    } catch (error) {
      showToast({
        title: "Error",
        description: "Something went wrong!",
      });
    }
  };

  return (
    <>
      <section className="flex-1 lg:w-full md:w-full w-[320px] overflow-y-auto ">
        {/* <h2 className="font-semibold text-lg mb-6">Invoices Management</h2> */}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText size={16} />
              <span className="text-xs font-semibold">Total Invoices</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {invoiceStats?.totalInvoice || 0}
            </span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <CalendarDays size={16} />
              <span className="text-xs font-semibold">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${invoiceStats?.totalAmount?.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <DollarSign size={16} />
              <span className="text-xs font-semibold">Commission Earned</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${invoiceStats?.conmissionearned?.toLocaleString()}
            </span>
          </div>
        </div>
        {/* <div className="flex justify-end mb-4">
          <button
            onClick={() => handleExportFile()}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div> */}
        {/* Filter Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-lg mb-4 sm:mb-0">
              {/* Invoice Generated List */}
            </h3>
            <button
              onClick={() => router.push("/dashboard/invoices/create")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md px-4 py-2 lg:w-full md:w-full w-[280px]"
            >
              <Plus size={16} /> Create New Invoice
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 lg:w-full md:w-full w-[280px]">
            <div className="flex-1 mb-3 sm:mb-0 relative">
              <input
                type="search"
                placeholder="Search by email"
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>
            <div className="relative lg:w-full md:w-full w-[280px]">
              <select
                value={status}
                onChange={(e) => handleFilterChange(setStatus, e.target.value)}
                className="border border-gray-200 rounded-md py-2 px-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 sm:mb-0 appearance-none w-full"
              >
                <option disabled value="all">
                  Select Status
                </option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="relative lg:w-full md:w-full w-[320px]">
              <div className="flex items-center gap-2 border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-700 bg-white sm:w-auto lg:w-full md:w-full w-[280px]">
                <Calendar size={16} className="text-gray-400" />
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setPage(1); // reset pagination if needed
                  }}
                  placeholderText="Choose Date"
                  dateFormat="MMM d, yyyy"
                  className="outline-none bg-transparent w-full"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto lg:w-full md:w-full w-[320px]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 animate-pulse rounded-md"
                  ></div>
                ))}
              </div>
            ) : dataInvoice.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                No invoices found.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-700 border border-gray-200 rounded-md">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Invoice ID",
                      "Username",
                      "Car Model",
                      "Date",
                      "Amount",
                      "Commission",
                      "Vin Number",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} className="py-3 px-4 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataInvoice.map((row) => (
                    <tr key={row?.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{row?.invoiceId}</td>
                      <td className="py-3 px-4">
                        {row?.users?.full_name ||
                          row?.users?.display_name ||
                          row?.users?.email ||
                          " "}
                      </td>
                      <td className="py-3 px-4">{row?.carModel}</td>
                      <td className="py-3 px-4">{row?.dateOfSale}</td>
                      <td className="py-3 px-4">{row?.saleAmount}</td>
                      <td className="py-3 px-4">{row?.commission}</td>
                      <td className="py-3 px-4">{row?.vinNumber}</td>
                      <td className="py-3 px-4">{row?.status}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gray-200"
                          onClick={() => {
                            setIsOpenDeleted(true);
                            setRowData(row);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>

                        <button
                          disabled={loading}
                          onClick={() => {
                            setSelectedData(row);
                            setIsOpen(true);
                          }}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-auto">
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
      </section>
      <DeleteModal
        rowData={rowData}
        isOpen={isOpenDeleted}
        setIsOpen={setIsOpenDeleted}
        setRowData={setRowData}
        name="invoice"
        handleRefresh={handleRefresh}
      />
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="mt-5 mb-5 max-w-md mx-auto p-6 bg-white shadow-md rounded-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Invoice Summary
          </h2>
          <div className="text-sm text-gray-700 space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Invoice :</span>
              <span>{selectedData?.invoiceId || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Selected Sales :</span>
              <span>
                {selectedData?.users?.full_name ||
                  selectedData?.users?.display_name ||
                  selectedData?.users?.email ||
                  ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date of sale:</span>
              <span>{(selectedData?.dateOfSale) || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Car:</span>
              <span>{selectedData?.carModel || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Sale Amount:</span>
              <span>{selectedData?.saleAmount || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Commission:</span>
              <span>{selectedData?.commission || ""} %</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Status :</span>
              <span className="flex items-center gap-1">
                {selectedData?.status || ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Vin Number</span>
              <span>{selectedData?.vinNumber || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Company Name</span>
              <span>{selectedData?.companyName || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">HST</span>
              <span>{selectedData?.hst || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Commission Amount</span>
              <span>{selectedData?.commission_amount || ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Uploaded File</span>
              <span>
                {" "}
                <a
                  href={selectedData?.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-blue-600 underline break-words max-w-full"
                >
                  📎 File
                </a>
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
