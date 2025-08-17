// Here is how your component will look with the corrected logic

"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, ArrowLeft, FileDown, CheckCircle } from "lucide-react";
import moment from "moment";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Register all necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const sharedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
    },
  },
};

export default function ReportsPage() {
  const [reportsList, setReportsList] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [kpiStats, setKpiStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState("all");
  
  const reportRef = useRef(null);

  const fetchInitialKpiStats = async () => {
    try {
      const { count: totalUsers, error: usersError } = await supabaseBrowser
        .from("users")
        .select("id", { count: "exact", head: true });
  
      const { count: activeSubscriptions, error: subsError } = await supabaseBrowser
        .from("user_subscription")
        .select("id", { count: "exact", head: true })
        .eq("status", "payment_successful");
  
      if (usersError || subsError) {
        console.error("Error fetching initial KPI stats:", usersError || subsError);
        return { totalUsers: 0, activeSubscriptions: 0 };
      }
      return { totalUsers, activeSubscriptions };
    } catch (error) {
      console.error("Error in fetchInitialKpiStats:", error);
      return { totalUsers: 0, activeSubscriptions: 0 };
    }
  };

  const fetchReportsList = async () => {
    try {
      const supabase = supabaseBrowser; 
      let query = supabase.from("cron_reports").select("*");

      if (reportType !== "all") {
        query = query.eq('type', reportType);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching reports from Supabase:", error.message);
        return [];
      } else {
        return data || [];
      }
    } catch (error) {
      console.error("Error in fetchReportsList:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [kpiData, reportsData] = await Promise.all([
        fetchInitialKpiStats(),
        fetchReportsList(),
      ]);
      setKpiStats(kpiData);
      setReportsList(reportsData);
      setLoading(false);
    };
    
    fetchData();
  }, [reportType]);

  const handleReportClick = (report) => {
    setSelectedReport(report);
  };
  
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const reportDate = moment(selectedReport.created_at).format('DD-MM-YYYY');
    pdf.save(`${selectedReport.type.replace(/\s/g, '-')}-${selectedReport.name.replace(/\s/g, '-')}-${reportDate}.pdf`);
    setIsExporting(false);
  };

  const renderKpiCards = (stats) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
      <Card className=" shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers ?? 0}</div>
        </CardContent>
      </Card>
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <CheckCircle className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSubscriptions ?? 0}</div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className=" min-h-screen">
      {!selectedReport ? (
        // Report List View
        <>
          <div className="flex items-center justify-between mb-6">
            <div></div>
            <div className="flex space-x-2 justify-between">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {renderKpiCards(kpiStats)}
              <div className="space-y-4">
                {reportsList.length > 0 ? (
                  reportsList.map((report) => (
                    <Card
                      key={report.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                      onClick={() => handleReportClick(report)}
                    >
                      <CardContent className="flex items-center p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                          report.type === 'weekly' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {report.type}
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-700">
                          {report.data.date_range} - {report.name === 'user_stats' ? 'Users Data' : 'Subscriptions Data'}
                        </span>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-gray-500 mt-10">No reports found.</div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        // Detailed Report View
        <div ref={reportRef} className=" ">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button 
                className="p-2 mr-4 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() => setSelectedReport(null)}
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {selectedReport.name === 'user_stats' ? 'Total Users' : 'Active Subscriptions'}
                </CardTitle>
                {selectedReport.name === 'user_stats' ? <Users className="h-5 w-5 text-gray-500" /> : <CheckCircle className="h-5 w-5 text-gray-500" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedReport.data.total_count ?? 0}</div>
              </CardContent>
            </Card>
          </div>
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>{selectedReport.name === 'user_stats' ? 'New Users Over Time' : 'New Subscriptions Over Time'}</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Line 
                data={selectedReport.data.charts_data.line} 
                options={{ ...sharedChartOptions, title: { display: true, text: selectedReport.name === 'user_stats' ? "New Users Over Time" : "New Subscriptions Over Time" } }} 
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}