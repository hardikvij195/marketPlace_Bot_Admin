'use client'
import React, { useEffect, useState } from "react";
import { User, Users, RatioIcon } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";
import { setDashboardStats } from "@/store/features/dashboard/dashboardSlice";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    totalRevenue: 0,
  });
  const [data, setData] = useState<number[]>([]);
  const [rotatedLabels, setRotatedLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: usersData, error: usersError } = await supabaseBrowser
        .from("users")
        .select("id");
        
        const { data: subData, error: subError } = await supabaseBrowser
          .from("user_subscription")
          .select("user_id, basic_amount")
          .eq("status", "payment_successful");
        
        
      if (usersError || subError) {
        console.error(usersError || subError);
        return;
      }

      const totalUsers = usersData?.length || 0;
      const activeSubscribers = subData?.length || 0;
      const totalRevenue = subData?.reduce(
        (sum, sub) => sum + (Number.parseFloat(sub.basic_amount) || 0),
        0
      );

      setStats({
        totalUsers,
        activeSubscribers,
        totalRevenue,
      });

      const currentYear = new Date().getFullYear();

      const { data, error } = await supabaseBrowser
        .from("user_subscription")
        .select("id, created_at")
        .eq("status", "payment_successful")
        .gte("created_at", `${currentYear}-01-01T00:00:00Z`)
        .lte("created_at", `${currentYear}-12-31T23:59:59Z`);

        if (error) {
          return;
        }
        
        const monthlyCounts = Array(12).fill(0);
        data.forEach((sub) => {
          const month = new Date(sub.created_at).getMonth(); // 0-11
          monthlyCounts[month]++;
        });

        const currentMonth = new Date().getMonth(); // 0 = Jan
        const rotatedCounts = [
          ...monthlyCounts.slice(currentMonth),
          ...monthlyCounts.slice(0, currentMonth),
        ];
        const rotatedMonths = [
          ...months.slice(currentMonth),
          ...months.slice(0, currentMonth),
        ];

        setData(rotatedCounts);
      setRotatedLabels(rotatedMonths);
      
      dispatch(
        setDashboardStats({
          totalUsers,
          activeSubscribers,
          totalRevenue,
          chartData: monthlyCounts,
          chartLabels: rotatedMonths,
          SeminarTabName: ""
        })
      );
    };

    fetchStats();
  }, []);

  const subscriptionData = {
    labels: rotatedLabels,
    datasets: [
      {
        label: "Subscriptions",
        data: data,
        backgroundColor: "#3B82F6",
        borderRadius: 6,
      },
    ],
  };
  return (
    <div className="flex min-h-screen ">
      <main className="flex-1 ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-md shadow">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-blue-500" />
              <span className="font-semibold">Active Subscribers</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
          </div>
          <div className="bg-white p-4 rounded-md shadow">
            <div className="flex items-center gap-2 mb-2">
              <User className="text-blue-500" />
              <span className="font-semibold">Subscription Revenue</span>
            </div>
            <p className="text-2xl font-bold">${stats.totalRevenue}</p>
          </div>
          <div className="bg-white p-4 rounded-md shadow">
            <div className="flex items-center gap-2 mb-2">
              <RatioIcon className="text-blue-500" />
              <span className="font-semibold">Users to Subscribers Ratio</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalUsers}:{stats.activeSubscribers}
            </p>
          </div>
        </div>

        <div className="">
          <div className="bg-white p-4 rounded-md shadow h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Subscriptions by Plan</h3>
              <button className="text-sm text-blue-600 border rounded px-2 py-1">
                All
              </button>
            </div>
            <div className="h-[220px]" id="subscriptionChart">
              <Bar
                data={subscriptionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      ticks: {
                        precision: 0,
                        stepSize: 1,
                      },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
