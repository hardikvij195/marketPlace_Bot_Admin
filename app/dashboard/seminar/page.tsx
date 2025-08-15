"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Trash2,
  Info,
  Edit,
  View,
  FileText,
  Archive,
  Search,
} from "lucide-react";
import ComingSoon from "@/components/ui/coming-soon";
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
import { useRouter } from "next/navigation";
import { showToast } from "@/hooks/useToast";
import { exportToExcel } from "@/lib/exportToExcel";
import PaginationBar from "../_components/Pagination";
import DeleteModal from "../_components/DeleteModal";
import ArchiveModal from "../_components/ArchivedConfirmationModal";
import { convert12HourTo24Hour } from "@/lib/dateTimeFormatter";

type Seminar = {
  id: string;
  title: string;
  email: string;
  phone: string;
  date: string;
  seats_left?: number;
  created_at?: string;
  time?: string;
  day?: string;
  dayName?: string;
  monthName?: string;
  time24?: string;
  month?: string;
  year?: string;
};

export default function SeminarPage() {
  const router = useRouter();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newSem, setNewSem] = useState<Seminar>({
    id: crypto.randomUUID(),
    title: "",
    date: "",
    email: "",
    phone: "",
    seats_left: 0,
    created_at: new Date().toISOString(),
    time: "",
    day: "",
    dayName: "",
    time24: "",
    month: "",
    monthName: "",
    year: "",
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
  const [editSem, setEditSem] = useState<Seminar>({
    id: "",
    title: "",
    date: "",
    email: "",
    phone: "",
    seats_left: 0,
    time: "",
    day: "",
    dayName: "",
    time24: "",
    monthName: "",
    month: "",
    year: "",
  });
  const [isOpenDeleted, setIsOpenDeleted] = useState(false);
  const [rowData, setRowData] = useState<any>(null);
  const [deleteRefresh, setDeleteRefresh] = useState<any>(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveRowData, setArchiveRowData] = useState(null);

  const handleArchiveClick = (row: any) => {
    setArchiveRowData(row);
    setIsArchiveModalOpen(true);
  };

  const handleRefresh = () => {
    setPage(1);
    setDeleteRefresh(Math.random());
  };

  const handleFetchSeminar = async () => {
    setLoading(true);
    try {
      let query = supabaseBrowser
        .from("seminars")
        .select("*", { count: "exact" })
        .order("date", { ascending: true });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setSeminars(data || []);
        setTotal(count || 0);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to fetch seminar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchSeminar();
  }, [page, deleteRefresh, limit]);

  const filteredSeminars = useMemo(() => {
    if (!searchTerm.trim()) {
      return seminars;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return seminars.filter((seminar) =>
      seminar.title.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [seminars, searchTerm]);

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

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <ComingSoon />
      </div>
    );
  }

  async function confirmDelete() {
    if (!pendingId) return;

    const id = pendingId;
    setPendingId(null);
    setSeminars((prev) => prev.filter((s) => s.id !== id));

    const { error } = await supabaseBrowser
      .from("seminars")
      .delete()
      .eq("id", id);

    if (error) {
      showToast({
        title: "Error",
        description: "Something went wrong while deleting!",
      });
      handleRefresh();
    } else {
      showToast({
        title: "Success",
        description: "Seminar deleted successfully!",
      });
      handleRefresh();
    }
  }

  const handleEditForm = (seminar: Seminar) => {
    const time24 = convert12HourTo24Hour(seminar.time);
    setEditSem({
      ...seminar,
      time24: time24 || "", // Fallback to an empty string if conversion fails
    });
    setIsEditing(true);
  };

  const handleExportFile = async () => {
    try {
      const { data, error, count } = await supabaseBrowser
        .from("seminars")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error("Something went wrong!");
      }
      await exportToExcel(data, "seminars");
    } catch (error) {
      showToast({
        title: "Error",
        description: "Something went wrong!",
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="relative flex-1 mb-5 ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Seminar Name..."
            className="pl-9"
            value={searchTerm}
            disabled={loading}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className=" bg-white">
          <button
            onClick={() => setDialogOpen(true)}
            className="fixed bottom-6 right-6 z-50 rounded-full p-4 bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
            title="Add seminar"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {filteredSeminars.length === 0 && !loading ? (
          <div className="flex flex-col justify-center items-center text-gray-900 p-6">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {searchTerm
                ? "No results found for your search."
                : "No Data Found"}
            </h2>
            {searchTerm && (
              <p className="text-sm text-gray-500">
                Try adjusting your search term or clearing it.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md lg:w-full md:w-full w-[320px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Seminar Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Seats Left
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
                {filteredSeminars.map((seminar) => (
                  <tr key={seminar.id} className="hover:bg-gray-50">
                    <td className="break-words px-6 py-4 text-sm font-medium text-gray-900">
                      {seminar?.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="flex items-center">
                        <Calendar size={16} className="mr-1 text-blue-500" />
                        {seminar?.date?.split("T")?.[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {seminar?.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {seminar.seats_left}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-4 ">
                        <Trash2
                          className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors duration-150 cursor-pointer"
                          onClick={() => setPendingId(seminar.id)}
                        />
                        <button
                          disabled={loading}
                          onClick={() => {
                            handleEditForm(seminar);
                          }}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => {
                            localStorage.setItem("seminarId", seminar.id);
                            router.push(`/dashboard/seminar-signup`);
                          }}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <View className="w-4 h-4" />
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => {
                            setSelectedData(seminar);
                            setIsOpen(true);
                          }}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => {
                            handleArchiveClick(seminar);
                          }}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <Archive className="w-4 h-4" />
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
                Create New Seminar
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newSem.title}
                  onChange={(e) =>
                    setNewSem({ ...newSem, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newSem.date}
                  onChange={(e) => {
                    const value = e.target.value;
                    const [year, month, day] = value.split("-");
                    const dateObj = new Date(value);
                    const dayName = dateObj.toLocaleDateString("en-CA", {
                      weekday: "long",
                    });
                    const monthName = dateObj.toLocaleDateString("en-CA", {
                      month: "long",
                    });

                    setNewSem({
                      ...newSem,
                      date: e.target.value,
                      year,
                      month,
                      dayName,
                      monthName,
                      day,
                    });
                  }}
                  required
                />
              </div>
               <div className="space-y-1">
                <label className="text-sm font-medium">Day</label>
                <Input
                  type="text"
                  value={newSem?.day || ""}
                  onChange={(e) =>
                    setNewSem({ ...newSem, day: e.target.value })
                  }
                 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Day Name</label>
                <Input
                  type="text"
                  value={newSem?.dayName || ""}
                  onChange={(e) =>
                    setNewSem({ ...newSem, dayName: e.target.value })
                  }
               
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Month Name</label>
                <Input
                  type="text"
                  value={newSem?.monthName || ""}
                  onChange={(e) =>
                    setNewSem({ ...newSem, monthName: e.target.value })
                  }
                
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={newSem.time24 || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const [hourStr, minuteStr] = value.split(":");
                    const hour = parseInt(hourStr, 10);

                    const ampm = hour >= 12 ? "PM" : "AM";
                    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                    const formattedTime = `${hour12
                      .toString()
                      .padStart(2, "0")}:${minuteStr} ${ampm}`;

                    setNewSem({
                      ...newSem,
                      time: formattedTime,
                      time24: value,
                    });
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Seats Left</label>
                <Input
                  type="number"
                  min={0}
                  value={newSem.seats_left}
                  onChange={(e) =>
                    setNewSem({ ...newSem, seats_left: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

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

                  const { error } = await supabaseBrowser
                    .from("seminars")
                    .insert({
                      id: newSem.id,
                      title: newSem.title,
                      date: newSem.date,
                      day: newSem.day,
                      dayName: newSem.dayName,
                      monthName: newSem.monthName,
                      month: newSem.month,
                      year: newSem.year,
                      time: newSem.time,
                      seats_left: newSem.seats_left,
                    });

                  if (error) {
                    alert(`Save failed: ${error.message}`);
                    showToast({
                      title: "Error",
                      description: "Something went wrong while saving!",
                    });
                  } else {
                    setSeminars((prev) => [...prev, newSem]);
                    setDialogOpen(false);
                    setNewSem({
                      id: crypto.randomUUID(),
                      title: "",
                      date: "",
                      email: "",
                      phone: "",
                      seats_left: 0,
                      time: "",
                      day: "",
                      dayName: "",
                      time24: "",
                      month: "",
                      monthName: "",
                      year: "",
                    });
                    showToast({
                      title: "Success",
                      description: "Seminar added successfully!",
                    });
                    handleRefresh();
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
              This action can’t be undone. The seminar entry will be permanently
              removed.
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
        name="seminars"
        handleRefresh={handleRefresh}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        setIsOpen={setIsArchiveModalOpen}
        rowData={archiveRowData}
        setRowData={setArchiveRowData}
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
              Edit Seminar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editSem?.title}
                onChange={(e) =>
                  setEditSem({ ...editSem, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={editSem?.date}
                onChange={(e) => {
                  const value = e.target.value;
                  const [year, month, day] = value.split("-");
                  const dateObj = new Date(value);
                  const dayName = dateObj.toLocaleDateString("en-CA", {
                    weekday: "long",
                  });
                  const monthName = dateObj.toLocaleDateString("en-CA", {
                    month: "long",
                  });

                  setEditSem({
                    ...editSem,
                    date: e.target.value,
                    year,
                    month,
                    dayName,
                    monthName,
                    day,
                  });
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={editSem.time24 || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const [hourStr, minuteStr] = value.split(":");
                  const hour = parseInt(hourStr, 10);

                  const ampm = hour >= 12 ? "PM" : "AM";
                  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                  const formattedTime = `${hour12
                    .toString()
                    .padStart(2, "0")}:${minuteStr} ${ampm}`;

                  setEditSem({
                    ...editSem,
                    time: formattedTime,
                    time24: value,
                  });
                }}
                required
              />
            </div>
             <div className="space-y-1">
              <label className="text-sm font-medium">Day</label>
              <Input
                type="text"
                value={editSem?.day || ""}
                onChange={(e) =>
                  setEditSem({ ...editSem, day: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Day Name</label>
              <Input
                type="text"
                value={editSem?.dayName || ""}
                onChange={(e) =>
                  setEditSem({ ...editSem, dayName: e.target.value })
                }
          
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Month Name</label>
              <Input
                type="text"
                value={editSem?.monthName || ""}
                onChange={(e) =>
                  setEditSem({ ...editSem, monthName: e.target.value })
                }
             
              />
            </div>
           

            <div className="space-y-1">
              <label className="text-sm font-medium">Seats Left</label>
              <Input
                type="number"
                min={0}
                value={editSem?.seats_left}
                onChange={(e) => {
                  setEditSem({
                    ...editSem,
                    seats_left: Number(e.target.value),
                  });
                }}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditSem({
                  id: "",
                  title: "",
                  date: "",
                  email: "",
                  phone: "",
                  seats_left: 0,
                  time: "",
                  day: "",
                  month: "",
                  year: "",
                  dayName: "",
                  monthName: "",
                  time24: "",
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
                  .from("seminars")
                  .update({
                    title: editSem?.title,
                    date: editSem?.date,
                    day: editSem?.day,
                    dayName: editSem?.dayName,
                    month: editSem?.month,
                    monthName: editSem?.monthName,
                    year: editSem?.year,
                    time: editSem?.time,
                    seats_left: editSem?.seats_left,
                  })
                  .eq("id", editSem?.id)
                  .select()
                  .single();

                if (error) {
                  showToast({
                    title: "Error",
                    description: "Something went wrong!",
                  });
                } else {
                  showToast({
                    title: "Success",
                    description: "Seminar updated successfully!",
                  });
                  handleRefresh();
                  setIsEditing(false);
                  setEditSem({
                    id: "",
                    title: "",
                    date: "",
                    email: "",
                    phone: "",
                    seats_left: 0,
                    time: "",
                    day: "",
                    dayName: "",
                    monthName: "",
                    time24: "",
                    month: "",
                    year: "",
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
