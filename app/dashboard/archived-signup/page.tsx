"use client";

import { useEffect, useState } from "react";
import React from "react";
import SeminarSignupUsPage from "../_components/SeminarSignUp";
type TabType = "signup" | "registration";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SeminarRegistrationPage from "../_components/SeminarRegistration";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setSeminarTabName } from "@/store/features/dashboard/dashboardSlice";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>("signup");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(setSeminarTabName(activeTab));
  },[activeTab])


  const tabList: TabType[] = ["signup", "registration"];
  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Tab Buttons */}
      <div className="mb-6 mt-2">
        <button
          onClick={() => router.back()}
          className=" cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-100 rounded-md shadow-sm hover:bg-blue-50 transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <div className="grid grid-cols-2 w-full">
        <button
          onClick={() => {
            setActiveTab("signup");
            localStorage.setItem("subRoute", "signup");
          }}
          className={`py-4 text-lg font-semibold transition-all ${
            activeTab === "signup"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Seminar signup
        </button>
        <button
          onClick={() => {
            setActiveTab("registration");
            localStorage.setItem("subRoute", "registration");
          }}
          className={`py-4 text-lg font-semibold transition-all ${
            activeTab === "registration"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Seminar Registration
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 sm:p-10 bg-white shadow-inner">
        {activeTab === "signup" && (
          <SeminarSignupUsPage
          name="archived_seminars"
          tableName="archived_seminar_signup"
          />
        )}
        {activeTab === "registration" && (
          <SeminarRegistrationPage
            tableName="archived_seminar_registration"
            name="archived_seminars"
          />
        )}
      </div>
    </div>
  );
}
