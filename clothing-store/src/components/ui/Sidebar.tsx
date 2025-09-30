"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  BarChart3,
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  Users,
  Receipt,
  CheckCircle,
  Hash,
  QrCode,
  Tag,
  Plus,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Store,
  Building2,
} from "lucide-react";
import { MenuItem, NavigationProps } from "@/types/schemas";

const menuItems: MenuItem[] = [
  {
    id: "home",
    label: "Home",
    icon: "Home",
    href: "/owner/home",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "BarChart3",
    href: "/owner/dashboard",
  },
  {
    id: "sales",
    label: "Sales",
    icon: "TrendingUp",
    children: [
      {
        id: "transactions",
        label: "Transactions",
        icon: "CreditCard",
        href: "/owner/sales/transactions",
      },
      {
        id: "reports",
        label: "Reports",
        icon: "FileText",
        href: "/owner/reports",
      },
      {
        id: "payments",
        label: "Payments",
        icon: "CreditCard",
        href: "/owner/payments",
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "Package",
    children: [
      {
        id: "stocks",
        label: "Stocks",
        icon: "Package",
        href: "/owner/inventory/stocks",
      },
      {
        id: "customers",
        label: "Customers",
        icon: "Users",
        href: "/owner/customers",
      },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: "Receipt",
    children: [
      {
        id: "details",
        label: "Details",
        icon: "FileText",
        href: "/owner/expenses/details",
      },
      {
        id: "approvals",
        label: "Approvals",
        icon: "CheckCircle",
        href: "/owner/approvals",
      },
      {
        id: "headings",
        label: "Headings",
        icon: "Hash",
        href: "/owner/headings",
      },
    ],
  },
  {
    id: "barcode",
    label: "Barcode",
    icon: "QrCode",
    children: [
      {
        id: "label-print",
        label: "Label Print",
        icon: "Tag",
        href: "/owner/label-print",
      },
      {
        id: "new-stock",
        label: "New Stock",
        icon: "Plus",
        href: "/owner/new-stock",
      },
      {
        id: "print-settings",
        label: "Print Settings",
        icon: "Settings",
        href: "/owner/print-settings",
      },
    ],
  },
  {
    id: "shops-branches",
    label: "Shops & Branches",
    icon: "Building2",
    children: [
      {
        id: "manage-shops",
        label: "Manage Shops",
        icon: "Store",
        href: "/owner/shops/manage",
      },
      {
        id: "branch-settings",
        label: "Branch Settings",
        icon: "Settings",
        href: "/owner/shops/settings",
      },
      {
        id: "shop-reports",
        label: "Shop Reports",
        icon: "FileText",
        href: "/owner/shops/reports",
      },
    ],
  },
  {
    id: "exchange-sales",
    label: "Exchange Sales",
    icon: "ShoppingCart",
    href: "/owner/exchange-sales",
  },
  {
    id: "tellers",
    label: "Tellers",
    icon: "UserCheck",
    href: "/owner/tellers",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    href: "/owner/settings",
  },
  {
    id: "privacy-policy",
    label: "Privacy Policy",
    icon: "Shield",
    href: "/owner/privacy-policy",
  },
];

const iconMap = {
  Home,
  BarChart3,
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  Users,
  Receipt,
  CheckCircle,
  Hash,
  QrCode,
  Tag,
  Plus,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  Building2,
  Store,
};

interface SidebarProps extends NavigationProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isCartModalOpen?: boolean;
}

export function Sidebar({
  activeItem,
  onItemClick,
  className = "",
  isCollapsed = false,
  onToggleCollapse,
  isCartModalOpen = false,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState<string>("Fashion Store");

  // Fetch business name from settings API
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const response = await fetch('/api/settings');
        const result = await response.json();
        if (result.success && result.data?.businessName) {
          setBusinessName(result.data.businessName);
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
        // Keep default "Fashion Store" if fetch fails
      }
    };

    fetchBusinessName();
  }, []);

  // Close all expanded items when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setExpandedItems([]);
    }
  }, [isCollapsed]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderIcon = (iconName: string, className: string = "") => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    const itemClasses = `
      flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 transition-colors
      ${isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2"}
      ${isActive ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" : ""}
      ${level > 0 && !isCollapsed ? "pl-8" : ""}
    `;

    const handleMainClick = () => {
      if (item.href) {
        onItemClick?.(item);
      } else if (hasChildren) {
        toggleExpanded(item.id);
        onItemClick?.(item);
      }
    };

    return (
      <div key={item.id}>
        {item.href ? (
          <Link
            href={item.href}
            onClick={() => onItemClick?.(item)}
            className={itemClasses}
            title={isCollapsed ? item.label : undefined}
          >
            {renderIcon(
              item.icon,
              isCollapsed ? "w-5 h-5 mx-auto" : "w-4 h-4 mr-3 flex-shrink-0"
            )}
            {!isCollapsed && (
              <span className="flex-1 text-left">{item.label}</span>
            )}
            {!isCollapsed && hasChildren && (
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            )}
          </Link>
        ) : (
          <button
            onClick={handleMainClick}
            className={itemClasses}
            title={isCollapsed ? item.label : undefined}
          >
            {renderIcon(
              item.icon,
              isCollapsed ? "w-5 h-5 mx-auto" : "w-4 h-4 mr-3 flex-shrink-0"
            )}
            {!isCollapsed && (
              <span className="flex-1 text-left">{item.label}</span>
            )}
            {!isCollapsed && hasChildren && (
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            )}
          </button>
        )}

        {!isCollapsed && hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white border-r border-gray-200 h-full transition-all duration-300 ${className} relative flex flex-col`}
    >
      {/* Shop Header */}
      <div className="px-4 py-7 border-b border-gray-200 flex-shrink-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <Store className="w-8 h-8 text-purple-600" />
          </div>
        ) : (
          <div className="flex items-center">
            <Store className="w-8 h-8 text-purple-600 mr-3" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{businessName || "Fashion Store"}</h1>
              <p className="text-xs text-gray-500">Owner Dashboard</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button - Positioned on the border */}
      {!isCartModalOpen && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-6 w-6 h-6 bg-white border border-gray-200 hover:bg-gray-50 text-purple-600 rounded-full flex items-center justify-center transition-colors shadow-md z-20"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{right: '-12px'}}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      )}

      {/* Scrollable Navigation Area */}
      <div
        className="flex-1 overflow-y-auto py-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <nav className="space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>
    </div>
  );
}
