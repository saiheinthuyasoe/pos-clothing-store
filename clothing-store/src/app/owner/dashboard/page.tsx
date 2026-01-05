"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Store, Package, BarChart3, ShoppingCart, User } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

function OwnerDashboardContent() {
  const { selectedCurrency } = useCurrency();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Mock clothing inventory data - 60 items
  const clothingInventory = [
    {
      id: "Jean7010",
      name: "Jean7010",
      price: 290,
      stock: 4,
      colors: ["red", "green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean9035",
      name: "Jean9035",
      price: 300,
      stock: 6,
      colors: ["green", "red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8803",
      name: "Jean8803",
      price: 290,
      stock: 6,
      colors: ["red", "blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7677",
      name: "Jean7677",
      price: 360,
      stock: 9,
      colors: ["yellow", "green", "blue", "black", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6682",
      name: "Jean6682",
      price: 360,
      stock: 5,
      colors: ["red", "yellow", "green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7619",
      name: "Jean7619",
      price: 350,
      stock: 11,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6777",
      name: "Jean6777",
      price: 360,
      stock: 1,
      colors: ["blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7687",
      name: "Jean7687",
      price: 340,
      stock: 27,
      colors: ["yellow", "green", "red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean312",
      name: "Jean312",
      price: 290,
      stock: 6,
      colors: ["green", "red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7056",
      name: "Jean7056",
      price: 290,
      stock: 3,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean2619",
      name: "Jean2619",
      price: 290,
      stock: 4,
      colors: ["red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6689",
      name: "Jean6689",
      price: 290,
      stock: 4,
      colors: ["red", "blue", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean5501",
      name: "Jean5501",
      price: 320,
      stock: 12,
      colors: ["black", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4402",
      name: "Jean4402",
      price: 280,
      stock: 7,
      colors: ["green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3303",
      name: "Jean3303",
      price: 370,
      stock: 15,
      colors: ["red", "black", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean2204",
      name: "Jean2204",
      price: 310,
      stock: 8,
      colors: ["blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean1105",
      name: "Jean1105",
      price: 330,
      stock: 11,
      colors: ["yellow", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean9906",
      name: "Jean9906",
      price: 380,
      stock: 6,
      colors: ["black", "green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8807",
      name: "Jean8807",
      price: 295,
      stock: 14,
      colors: ["red", "yellow", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7708",
      name: "Jean7708",
      price: 390,
      stock: 9,
      colors: ["blue", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6609",
      name: "Jean6609",
      price: 315,
      stock: 13,
      colors: ["green", "red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean5510",
      name: "Jean5510",
      price: 355,
      stock: 5,
      colors: ["black", "blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean4411",
      name: "Jean4411",
      price: 275,
      stock: 18,
      colors: ["yellow", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean3312",
      name: "Jean3312",
      price: 325,
      stock: 7,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean2213",
      name: "Jean2213",
      price: 345,
      stock: 10,
      colors: ["green", "black", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean1114",
      name: "Jean1114",
      price: 400,
      stock: 4,
      colors: ["red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean9915",
      name: "Jean9915",
      price: 285,
      stock: 16,
      colors: ["black", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean8816",
      name: "Jean8816",
      price: 365,
      stock: 8,
      colors: ["yellow", "red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7717",
      name: "Jean7717",
      price: 305,
      stock: 12,
      colors: ["green", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean6618",
      name: "Jean6618",
      price: 375,
      stock: 6,
      colors: ["blue", "yellow", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean5519",
      name: "Jean5519",
      price: 270,
      stock: 20,
      colors: ["black", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4420",
      name: "Jean4420",
      price: 385,
      stock: 9,
      colors: ["red", "blue", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3321",
      name: "Jean3321",
      price: 335,
      stock: 11,
      colors: ["green", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean2222",
      name: "Jean2222",
      price: 355,
      stock: 7,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean1123",
      name: "Jean1123",
      price: 295,
      stock: 15,
      colors: ["yellow", "green", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean9924",
      name: "Jean9924",
      price: 410,
      stock: 5,
      colors: ["red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8825",
      name: "Jean8825",
      price: 300,
      stock: 13,
      colors: ["black", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7726",
      name: "Jean7726",
      price: 370,
      stock: 8,
      colors: ["green", "red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6627",
      name: "Jean6627",
      price: 320,
      stock: 10,
      colors: ["yellow", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean5528",
      name: "Jean5528",
      price: 390,
      stock: 6,
      colors: ["blue", "green", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean4429",
      name: "Jean4429",
      price: 265,
      stock: 17,
      colors: ["black", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean3330",
      name: "Jean3330",
      price: 395,
      stock: 4,
      colors: ["red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean2231",
      name: "Jean2231",
      price: 315,
      stock: 12,
      colors: ["green", "black", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean1132",
      name: "Jean1132",
      price: 340,
      stock: 9,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean9933",
      name: "Jean9933",
      price: 280,
      stock: 14,
      colors: ["yellow", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean8834",
      name: "Jean8834",
      price: 375,
      stock: 7,
      colors: ["black", "blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7735",
      name: "Jean7735",
      price: 305,
      stock: 11,
      colors: ["green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean6636",
      name: "Jean6636",
      price: 350,
      stock: 8,
      colors: ["red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean5537",
      name: "Jean5537",
      price: 285,
      stock: 16,
      colors: ["blue", "green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4438",
      name: "Jean4438",
      price: 405,
      stock: 5,
      colors: ["black", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3339",
      name: "Jean3339",
      price: 325,
      stock: 13,
      colors: ["yellow", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean2240",
      name: "Jean2240",
      price: 365,
      stock: 6,
      colors: ["green", "red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean1141",
      name: "Jean1141",
      price: 295,
      stock: 10,
      colors: ["blue", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean9942",
      name: "Jean9942",
      price: 415,
      stock: 4,
      colors: ["red", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8843",
      name: "Jean8843",
      price: 275,
      stock: 18,
      colors: ["black", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7744",
      name: "Jean7744",
      price: 335,
      stock: 9,
      colors: ["yellow", "red", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6645",
      name: "Jean6645",
      price: 310,
      stock: 12,
      colors: ["blue", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean5546",
      name: "Jean5546",
      price: 380,
      stock: 7,
      colors: ["green", "yellow", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean4447",
      name: "Jean4447",
      price: 290,
      stock: 15,
      colors: ["black", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean3348",
      name: "Jean3348",
      price: 355,
      stock: 8,
      colors: ["red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
  ];

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 60;

  // Filter items based on search term
  const filteredInventory = clothingInventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInventory.slice(startIndex, endIndex);
  };

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeItem="dashboard"
        onItemClick={() => {}}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="h-screen"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TopNavBar />

        {/* Main Content */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Dashboard Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600">
                Monitor your store performance and sales analytics
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Sales
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {selectedCurrency === "MMK" ? "Ks" : "฿"} 0
                        </dd>
                        <dd className="text-sm text-green-600">
                          +0% from last month
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingCart className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Orders
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">0</dd>
                        <dd className="text-sm text-green-600">
                          +0% from last month
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          New Customers
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">0</dd>
                        <dd className="text-sm text-green-600">
                          +0% from last month
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Package className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Products Sold
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">0</dd>
                        <dd className="text-sm text-green-600">
                          +0% from last month
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sales Chart */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Sales Overview
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Sales chart will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Top Selling Products
                  </h3>
                  <div className="space-y-3">
                    {clothingInventory.slice(0, 5).map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedCurrency === "MMK" ? "Ks" : "฿"}{" "}
                            {item.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">0 sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                            <ShoppingCart className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              No recent activity
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>Just now</time>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <OwnerDashboardContent />
    </ProtectedRoute>
  );
}
