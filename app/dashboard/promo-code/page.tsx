"use client";

import { useState, useEffect } from "react";
import { Calendar, Trash2, Edit, FileText } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Modal from "../_components/Modal";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/hooks/useToast";
import PaginationBar from "../_components/Pagination";
import DeleteModal from "../_components/DeleteModal";
import { toast } from "sonner";
import { displayValidTill } from "@/lib/dateTimeFormatter";

type PromoCode = {
  id?: string;
  name: string;
  code: string;
  plans: string[];
  discount: number;
  valid_date: string;
  valid_time: string;
  validTime24: string;
  year: string;
  month: string;
  day: string;
  day_name: string;
  month_name: string;
};

interface Plans {
  id: string;
  plan_name: string;
  amount: number;
}

export default function SeminarPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPromos, setNewPromos] = useState<PromoCode>({
    id: "",
    name: "",
    code: "",
    plans: [],
    discount: 0,
    valid_date: "",
    valid_time: "",
    validTime24: "",
    year: "",
    month: "",
    day: "",
    day_name: "",
    month_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const confirmOpen = pendingId !== null;
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const totalPages = Math.ceil(total / limit);

  const [isEditing, setIsEditing] = useState(false);
  const [editPromo, setEditPromo] = useState<PromoCode>({
    id: "",
    name: "",
    code: "",
    plans: [],
    discount: 0,
    valid_date: "",
    valid_time: "",
    validTime24: "",
    year: "",
    month: "",
    day: "",
    day_name: "",
    month_name: "",
  });
  const [isOpenDeleted, setIsOpenDeleted] = useState(false);
  const [rowData, setRowData] = useState<any>(null);
  const [deleteRefresh, setDeleteRefresh] = useState<any>(null);
  const handleRefresh = () => {
    setPage(1);

    setDeleteRefresh(Math.random());
  };

  const handleFetchPromos = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabaseBrowser
        .from("promos")
        .select("*", { count: "exact" });

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setPromos(data as PromoCode[]);
        setTotal(count || 0); // Set total count of records
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setError("Failed to fetch seminar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchPromos();
  }, [page, deleteRefresh,limit]);

  const [availablePlans, setAvailablePlans] = useState<Plans[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabaseBrowser
        .from("subscription")
        .select("plan_name, amount");

      if (error) {
        console.error("Failed to fetch plans:", error.message);
      } else {
        setAvailablePlans(data as Plans[]);
      }
    };

    fetchPlans();
  }, []);
  useEffect(() => {
    console.log(editPromo, "editPromoeditPromo");
  }, [editPromo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-800">Loading...</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Please wait while we fetch the latest data for you.
        </p>
      </div>
    );
  }

  async function confirmDelete() {
    if (!pendingId) return;

    const id = pendingId;
    setPendingId(null);
    setPromos((prev) => prev.filter((s) => s.id !== id));

    const { error } = await supabaseBrowser
      .from("promos")
      .delete()
      .eq("id", id);

    if (error) {
      showToast({
        title: "Error",
        description: "Something went wrong!",
      });
      setPromos((prev) => [{ ...promos.find((s) => s.id === id)! }, ...prev]);
    }
  }

  const handleEditForm = (promo: PromoCode) => {
    setEditPromo(promo);
    setIsEditing(true);
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className=" bg-white">
          {" "}
          <button
            onClick={() => setDialogOpen(true)}
            className="fixed bottom-6 right-6 z-50 rounded-full p-4 bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
            title="Add seminar"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {promos.length === 0 ? (
          <div className="flex flex-col justify-center items-center text-gray-900 p-6">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Data Found</h2>
          </div>
        ) : (
          <div className="overflow-x-auto lg:w-full md:w-full w-[320px] bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Promo Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Promo Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Plans
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Discount %
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Code valid till
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promos.map((pr, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="break-words px-6 py-4 text-sm font-medium text-gray-900">
                      {pr?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="flex items-center"> {pr?.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pr?.plans.map((plan, index) => (
                        <span key={index} className="mr-2">
                          {plan},
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pr.discount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayValidTill(pr.valid_date, pr.valid_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-4 ">
                        {/* <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer" />   */}
                        <Trash2
                          className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors duration-150 cursor-pointer"
                          onClick={() => setPendingId(pr?.id || null)}
                        />
                        <button
                          disabled={loading}
                          onClick={() => {
                            handleEditForm(pr);
                          }}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Create New Promo
              </DialogTitle>
            </DialogHeader>

            {/* ─────────────── form fields ─────────────── */}
            <div className="space-y-4">
              {/* Name ---------------------------------------------------- */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Promo Name</label>
                <Input
                  value={newPromos.name}
                  onChange={(e) =>
                    setNewPromos({ ...newPromos, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Code ---------------------------------------------------- */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Promo Code</label>
                <Input
                  value={newPromos.code}
                  onChange={(e) =>
                    setNewPromos({ ...newPromos, code: e.target.value })
                  }
                  required
                />
              </div>

              {/* Plans (Checkboxes) -------------------------------------- */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Applicable Plans</label>
                <div className="flex gap-4 flex-wrap">
                  {availablePlans.map((plan) => (
                    <label
                      key={plan.plan_name}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={newPromos.plans.includes(plan.plan_name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPromos({
                              ...newPromos,
                              plans: [...newPromos.plans, plan.plan_name],
                            });
                          } else {
                            setNewPromos({
                              ...newPromos,
                              plans: newPromos.plans.filter(
                                (p) => p !== plan.plan_name
                              ),
                            });
                          }
                        }}
                      />
                      {plan.plan_name} ({plan.amount})
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount % ---------------------------------------------- */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Discount %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newPromos.discount}
                  onChange={(e) =>
                    setNewPromos({
                      ...newPromos,
                      discount: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              {/* Code Valid Till ------------------------------------------ */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Valid Till</label>
                <Input
                  type="date"
                  value={newPromos.valid_date}
                  onChange={(e) => {
                    const value = e.target.value;
                    const [year, month, day] = value.split("-");
                    const dateObj = new Date(value);
                    const dayName = dateObj.toLocaleDateString("en-US", {
                      weekday: "long",
                    });
                    const monthName = dateObj.toLocaleDateString("en-US", {
                      month: "long",
                    });

                    setNewPromos({
                      ...newPromos,
                      valid_date: value,
                      year,
                      month,
                      day,
                      day_name: dayName,
                      month_name: monthName,
                    });
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Valid Till Time</label>
                <Input
                  type="time"
                  value={newPromos.validTime24}
                  onChange={(e) => {
                    const value = e.target.value;
                    const [hourStr, minuteStr] = value.split(":");
                    const hour = parseInt(hourStr, 10);
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                    const formattedTime = `${hour12
                      .toString()
                      .padStart(2, "0")}:${minuteStr} ${ampm}`;

                    setNewPromos({
                      ...newPromos,
                      valid_time: formattedTime,
                      validTime24: value,
                    });
                  }}
                  required
                />
              </div>
            </div>

            {/* ─────────────── footer / actions ─────────────── */}
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);

                  /* 3️⃣  save in Supabase -------------------------------- */
                  const { error } = await supabaseBrowser
                    .from("promos")
                    .insert({
                      name: newPromos.name,
                      code: newPromos.code,
                      plans: newPromos.plans,
                      discount: newPromos.discount,
                      valid_date: newPromos.valid_date,
                      valid_time: newPromos.valid_time,
                      day: newPromos.day,
                      day_name: newPromos.day_name,
                      month: newPromos.month,
                      month_name: newPromos.month_name,
                      year: newPromos.year,
                    });

                  if (error) {
                    toast(`Save failed: ${error.message}`);
                    console.error("Failed to save promo:", error);
                  } else {
                    setPromos((prev) => [...prev, newPromos]);
                    setDialogOpen(false);
                    setNewPromos({
                      name: "",
                      code: "",
                      plans: [],
                      discount: 0,
                      valid_date: "",
                      valid_time: "",
                      validTime24: "",
                      year: "",
                      month: "",
                      day: "",
                      day_name: "",
                      month_name: "",
                    });
                  }
                  setSaving(false);
                }}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={confirmOpen}
          onOpenChange={(o) => !o && setPendingId(null)}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete seminar?</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-600">
              This action can&apos;t be undone. The seminar entry will be
              permanently removed.
            </p>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setPendingId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="cursor-pointer"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DeleteModal
        rowData={rowData}
        isOpen={isOpenDeleted}
        setIsOpen={setIsOpenDeleted}
        setRowData={setRowData}
        name="promos"
        handleRefresh={handleRefresh}
      />
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Card className="max-w-md w-full mx-auto shadow-md border mt-5 p-4 rounded-2xl bg-white">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Contact Details
            </h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-gray-700">
              <div className="font-medium">Name:</div>
              <div> {selectedData?.title}</div>

              <div className="font-medium">Date:</div>
              <div>
                <span className="flex items-center">
                  {" "}
                  {/* Wrapped content in a span with flex */}
                  <Calendar size={16} className="mr-1 text-blue-500" />
                  {selectedData?.date?.split("T")?.[0]}
                </span>
              </div>

              <div className="font-medium"> Time:</div>
              <div>{selectedData?.time}</div>

              <div className="font-medium">Seats left:</div>
              <div>{selectedData?.seats_left}</div>
            </div>
          </CardContent>
        </Card>
      </Modal>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Promo
            </DialogTitle>
          </DialogHeader>

          {/* ─────────────── form fields ─────────────── */}
          <div className="space-y-4">
            {/* Name ---------------------------------------------------- */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Promo Name</label>
              <Input
                value={editPromo?.name}
                onChange={(e) =>
                  setEditPromo({ ...editPromo, name: e.target.value })
                }
                required
              />
            </div>

            {/* Code ---------------------------------------------------- */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Promo Code</label>
              <Input
                value={editPromo?.code}
                onChange={(e) =>
                  setEditPromo({ ...editPromo, code: e.target.value })
                }
                required
              />
            </div>

            {/* Plans (Checkboxes) -------------------------------------- */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Applicable Plans</label>
              <div className="flex gap-4 flex-wrap">
                {availablePlans.map((plan) => (
                  <label key={plan.plan_name} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editPromo?.plans?.includes(plan.plan_name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditPromo({
                            ...editPromo,
                            plans: [...editPromo.plans, plan.plan_name],
                          });
                        } else {
                          setEditPromo({
                            ...editPromo,
                            plans: editPromo.plans.filter((p) => p !== plan.plan_name),
                          });
                        }
                      }}
                    />
                    {plan.plan_name} ({plan.amount})
                  </label>
                ))}
              </div>
            </div>

            {/* Discount % ---------------------------------------------- */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Discount %</label>
              <Input
                type="text"
                value={editPromo?.discount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,3}$/.test(value)) {
                    setEditPromo({
                      ...editPromo,
                      discount: Number(value),
                    });
                  }
                }}
                required
              />
            </div>

            {/* Valid Till Date ------------------------------------------ */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Valid Till (Date)</label>
              <Input
                type="date"
                value={editPromo?.valid_date}
                onChange={(e) => {
                  const value = e.target.value;
                  const [year, month, day] = value.split("-");
                  const dateObj = new Date(value);
                  const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                  const monthName = dateObj.toLocaleDateString("en-US", {
                    month: "long",
                  });

                  setEditPromo({
                    ...editPromo,
                    valid_date: value,
                    year,
                    month,
                    day,
                    day_name: dayName,
                    month_name: monthName,
                  });
                }}
                required
              />
            </div>

            {/* Valid Till Time ------------------------------------------ */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Valid Till (Time)</label>
              <Input
                type="time"
                value={
                  editPromo?.valid_time
                    ? editPromo.valid_time.slice(0, 5) // Extract "HH:MM" from "HH:MM:SS+00"
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value; // e.g., "13:45"
                  const [hourStr, minuteStr] = value.split(":");
                  const hour = parseInt(hourStr, 10);
                  const ampm = hour >= 12 ? "PM" : "AM";
                  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                  const formattedTime = `${hour12
                    .toString()
                    .padStart(2, "0")}:${minuteStr} ${ampm}`;

                  setEditPromo({
                    ...editPromo,
                    valid_time: formattedTime,
                    validTime24: value,
                  });
                }}
                required
              />
            </div>
          </div>

          {/* ─────────────── footer / actions ─────────────── */}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditPromo({
                  id: "",
                  name: "",
                  code: "",
                  plans: [],
                  discount: 0,
                  valid_date: "",
                  valid_time: "",
                  validTime24: "",
                  year: "",
                  month: "",
                  day: "",
                  day_name: "",
                  month_name: "",
                });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);

                const { error } = await supabaseBrowser
                  .from("promos")
                  .update({
                    name: editPromo.name,
                    code: editPromo.code,
                    plans: editPromo.plans,
                    discount: editPromo.discount,
                    valid_date: editPromo.valid_date,
                    valid_time: editPromo.valid_time,
                    day: editPromo.day,
                    day_name: editPromo.day_name,
                    month: editPromo.month,
                    month_name: editPromo.month_name,
                    year: editPromo.year,
                  })
                  .eq("id", editPromo.id)
                  .select()
                  .single();

                if (error) {
                  showToast({
                    title: "Error",
                    description: "Something went wrong!",
                  });
                } else {
                  if (page === 1) {
                    handleFetchPromos();
                  }
                  setPage(1);
                  setIsEditing(false);
                  setEditPromo({
                    id: "",
                    name: "",
                    code: "",
                    plans: [],
                    discount: 0,
                    valid_date: "",
                    valid_time: "",
                    validTime24: "",
                    year: "",
                    month: "",
                    day: "",
                    day_name: "",
                    month_name: "",
                  });
                }

                setSaving(false);
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
