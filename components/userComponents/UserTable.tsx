// components/users/UserTable.tsx
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, History, Info, Trash2, Ban, CheckCircle } from "lucide-react";
import Modal from "@/app/dashboard/_components/Modal";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { exportToExcel } from "@/lib/exportToExcel";
import { showToast } from "@/hooks/useToast";
import PaginationBar from "@/app/dashboard/_components/Pagination";
import DeleteModal from "@/app/dashboard/_components/DeleteModal";
import { displayValidTill } from "@/lib/dateTimeFormatter";
import { toast } from "sonner";
import Link from "next/link";
interface User {
  id: string;
  display_name: string;
  email: string;
  phone?: string;
  status?: string;
  subscription?: string;
  created_at: string;
  user_subscription: UserSubscription[];
  last_opened: string;
  name: string;
  // Added new property to the User interface
  fb_chatbot_user_blocked?: boolean;
}
interface UserSubscription {
  created_at: string;
  end_date: string;
}
interface UserTableProps {
  users: User[];
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  page: number;
  handleExportFile: any;
  totalRecord: number;
  limit: number;
  setLimit?: React.Dispatch<React.SetStateAction<number>>;
  setDeleteRefresh?: React.Dispatch<React.SetStateAction<any>>;
}
export const UserTable = ({
  users,
  setPage,
  totalPages,
  page,
  handleExportFile,
  totalRecord,
  limit,
  setLimit,
  setDeleteRefresh,
}: UserTableProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenDeleted, setIsOpenDeleted] = useState(false);
  const [rowData, setRowData] = useState<any>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const handleRefresh = () => {
    setPage(1);
    if (setDeleteRefresh) {
      setDeleteRefresh(Math.random());
    }
  };
  const handleUserDetails = async (user: User) => {
    console.log(user, "userssss");
    setSelectedData(user);
    setIsOpen(true);
  };
  // Toggles the block status of a user
  const handleToggleBlockUser = async (userId: string, isBlocked: boolean) => {
    const newBlockStatus = !isBlocked;
    const { error } = await supabaseBrowser
      .from("users")
      .update({ fb_chatbot_user_blocked: newBlockStatus })
      .eq("id", userId);
    if (error) {
      toast.error(`Error ${newBlockStatus ? 'blocking' : 'unblocking'} user`);
    } else {
      toast.success(`User ${newBlockStatus ? 'blocked' : 'unblocked'} successfully!`);
      handleRefresh();
    }
  };
  return (
    <>
      <div className="overflow-x-auto">
        {/* <div className="flex justify-end mb-4">
          <button
            onClick={() => handleExportFile()}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div> */}
        <table className="w-full border-spacing-0">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Name
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Phone No.
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Email
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Plan
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Subscription Date
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Join Date
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Last Opened
              </th>
              <th className="text-left py-3 lg:px-4 md:px-4 px-3 font-semibold text-gray-700 lg:text-md md:text-md text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors lg:text-md md:text-md text-sm"
                >
                  <td className="py-4 px-4 font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="py-4 px-4 text-center font-medium text-gray-900">
                    {user.phone ?? "-"}
                  </td>
                  <td className="py-4 px-4 text-blue-600">{user.email}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={user.subscription} />
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {/* {format(parseISO(user.created_at), "MMM dd, yyyy")} */}
                    {user.user_subscription.length > 0
                      ? displayValidTill(
                          user.user_subscription[0]?.created_at,
                          user.user_subscription[0]?.created_at
                        )
                      : "-"}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {/* {format(parseISO(user.created_at), "MMM dd, yyyy")} */}
                    {displayValidTill(user.created_at, user.created_at)}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {user.last_opened
                      ? displayValidTill(user.last_opened, user.last_opened)
                      : "-"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-gray-200"
                        onClick={() => {
                          setIsOpenDeleted(true);
                          setRowData(user);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <button
                        onClick={() => {
                          handleUserDetails(user);
                        }}
                        className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <Link href={`users/${user.id}`}>
                        <button className="cursor-pointer p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">
                          <History className="w-4 h-4" />
                        </button>
                      </Link>
                      {user.fb_chatbot_user_blocked ? (
                        <button
                          onClick={() => handleToggleBlockUser(user.id, true)}
                          className="cursor-pointer p-2 rounded-md bg-green-100 text-green-500 hover:bg-green-200"
                          title="Unblock User"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleBlockUser(user.id, false)}
                          className="cursor-pointer p-2 rounded-md bg-gray-100 text-red-500 hover:bg-red-100"
                          title="Block User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <div className="flex flex-col justify-center items-center text-gray-900 p-6">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">
                      No Data Found
                    </h2>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-auto">
          <PaginationBar
            page={page}
            setPage={setPage}
            totalPage={totalPages}
            totalRecord={totalRecord}
            limit={limit}
            setLimit={setLimit}
          />
        </div>
      </div>
      <DeleteModal
        rowData={rowData}
        isOpen={isOpenDeleted}
        setIsOpen={setIsOpenDeleted}
        setRowData={setRowData}
        name="users"
        handleRefresh={handleRefresh}
      />
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="max-w-md max-h-[90vh] overflow-y-auto mx-auto bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {selectedData?.display_name}
            </h2>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                selectedData?.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {selectedData?.status?.toUpperCase()}
            </span>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">User ID:</span>
              <span className="text-right">{selectedData?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Email:</span>
              <span className="text-right break-all">
                {selectedData?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Plan:</span>
              <span className="text-right capitalize">
                {selectedData?.subscription || "Free"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Phone:</span>
              <span className="text-right capitalize">
                {selectedData?.phone || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Address:</span>
              <span className="text-right capitalize">
                {selectedData?.address || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">City:</span>
              <span className="text-right capitalize">
                {selectedData?.city || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">State:</span>
              <span className="text-right capitalize">
                {selectedData?.state || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Zip Code:</span>
              <span className="text-right capitalize">
                {selectedData?.zipCode || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Join Date:</span>
              <span className="text-right">
                {selectedData?.created_at
                  ? displayValidTill(selectedData?.created_at)
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Last Opened:</span>
              <span className="text-right">
                {selectedData?.last_opened
                  ? displayValidTill(selectedData?.last_opened)
                  : "-"}
              </span>
            </div>
            {selectedData?.user_subscription?.length > 0 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Subscription Details
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    {selectedData.user_subscription.map((sub, index) => (
                      <div key={sub.id || index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            Subscription ID:
                          </span>
                          <span className="text-right">
                            {sub.subscription_id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            Amount:
                          </span>
                          <span className="text-right">${sub.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            Status:
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              sub.status === "payment_successful"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {sub.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            Start Date:
                          </span>
                          <span className="text-right">
                            {new Date(sub.start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            End Date:
                          </span>
                          <span className="text-right">
                            {new Date(sub.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
const PlanBadge = ({ plan }: { plan?: string }) => {
  const planValue = plan || "Free";
  const getVariantAndClass = () => {
    switch (planValue.toLowerCase()) {
      case "enterprise":
        return {
          variant: "default" as const,
          className: "bg-[#5E189D] hover:bg-[#4A1278]",
        };
      case "professional":
        return {
          variant: "secondary" as const,
          className: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        };
      default:
        return { variant: "outline" as const, className: "" };
    }
  };
  const { variant, className } = getVariantAndClass();
  return (
    <Badge variant={variant} className={className}>
      {planValue}
    </Badge>
  );
};
const StatusBadge = ({ status }: { status?: string }) => {
  const statusValue = status || "";
  const getVariantAndClass = () => {
    switch (statusValue) {
      case "active":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-200",
        };
      case "canceled":
        return { variant: "destructive" as const, className: "" };
      default:
        return {
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        };
    }
  };
  const { variant, className } = getVariantAndClass();
  const getStatusText = () => {
    switch (statusValue) {
      case "active":
        return "Active";
      case "canceled":
        return "Canceled";
      case "past_due":
        return "Past Due";
      case "unpaid":
        return "Unpaid";
      default:
        return statusValue;
    }
  };
  return (
    <Badge variant={variant} className={className}>
      {getStatusText()}
    </Badge>
  );
};
