"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Store, User, Package, BarChart3, ShoppingCart } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { StockItem } from "@/types/stock";
import { SettingsService } from "@/services/settingsService";
import { StockService } from "@/services/stockService";
import { InventoryRealtimeService } from "@/services/inventoryRealtimeService";

interface ClothingInventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  colors: string[];
  image: string;
  category: string;
  isNew: boolean;
  colorVariants: {
    id: string;
    color: string;
    colorCode: string;
    image?: string;
    sizeQuantities: { size: string; quantity: number }[];
  }[];
}

function OwnerHomeContent() {
  const {} = useAuth();
  const { addToCart, setInventoryCallbacks } = useCart();
  const { formatPrice, getCurrencySymbol } = useCurrency();
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // API state for recent stocks
  const [clothingInventory, setClothingInventory] = useState<
    ClothingInventoryItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state for colors and sizes
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Helper functions for color and size selection
  const handleColorSelect = (itemId: string, colorId: string) => {
    console.log(`handleColorSelect: itemId=${itemId}, colorId=${colorId}`);
    setSelectedColors(prev => {
      const currentSelection = prev[itemId];
      // If clicking the same color, unselect it (set to empty string)
      const newColorId = currentSelection === colorId ? "" : colorId;
      const newState = { ...prev, [itemId]: newColorId };
      console.log('Updated selectedColors:', newState);
      return newState;
    });
    // Reset size selection when color changes or is unselected
    setSelectedSizes(prev => ({ ...prev, [itemId]: "" }));
  };

  const handleSizeSelect = (itemId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [itemId]: size }));
  };

  const getSelectedColorVariant = (item: ClothingInventoryItem) => {
    if (!item.colorVariants || item.colorVariants.length === 0) {
      console.log(`No color variants for item ${item.id}`);
      return null;
    }
    const selectedColorId = selectedColors[item.id];
    console.log(`getSelectedColorVariant for ${item.id}: selectedColorId="${selectedColorId}"`);
    
    // Return null if no color is selected (empty string)
    if (!selectedColorId) {
      console.log(`No color selected for item ${item.id}`);
      return null;
    }
    
    const foundVariant = item.colorVariants.find(variant => {
      console.log(`Checking variant: ${variant.id} === ${selectedColorId} ? ${variant.id === selectedColorId}`);
      return variant.id === selectedColorId;
    });
    
    console.log(`Found variant for ${item.id}:`, foundVariant);
    return foundVariant || null;
  };

  const getAvailableSizes = (item: ClothingInventoryItem) => {
    const selectedVariant = getSelectedColorVariant(item);
    const sizes = selectedVariant?.sizeQuantities || [];
    console.log(`getAvailableSizes for item ${item.id}:`, {
      selectedColorId: selectedColors[item.id],
      selectedVariant,
      sizeQuantities: selectedVariant?.sizeQuantities,
      colorVariants: item.colorVariants,
      returningSizes: sizes,
      sizesLength: sizes.length
    });
    return sizes;
  };

  const getStockForSize = (item: ClothingInventoryItem, size: string) => {
    const selectedVariant = getSelectedColorVariant(item);
    const sizeQty = selectedVariant?.sizeQuantities.find(sq => sq.size === size);
    return sizeQty?.quantity || 0;
  };

  // Helper function to get the current image for an item
  const getCurrentImage = (item: ClothingInventoryItem) => {
    const selectedVariant = getSelectedColorVariant(item);
    // If a color variant is selected and has an image, use it; otherwise use the group image
    return selectedVariant?.image || item.image || `https://via.placeholder.com/200x250/E5E7EB/6B7280?text=${item.name}`;
  };

  // Function to reduce inventory stock when item is added to cart
  const reduceInventoryStock = async (itemId: string, colorId: string, size: string, quantity: number = 1) => {
    // Update local state immediately for UI responsiveness
    setClothingInventory(prevInventory => {
      return prevInventory.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            colorVariants: item.colorVariants?.map(variant => {
              if (variant.id === colorId) {
                return {
                  ...variant,
                  sizeQuantities: variant.sizeQuantities.map(sizeQty => {
                    if (sizeQty.size === size) {
                      return {
                        ...sizeQty,
                        quantity: Math.max(0, sizeQty.quantity - quantity)
                      };
                    }
                    return sizeQty;
                  })
                };
              }
              return variant;
            }) || []
          };
        }
        return item;
      });
    });

    // Persist changes to database
    try {
      const item = clothingInventory.find(item => item.id === itemId);
      if (item) {
        const updatedColorVariants = item.colorVariants?.map(variant => {
          if (variant.id === colorId) {
            return {
              ...variant,
              sizeQuantities: variant.sizeQuantities.map(sizeQty => {
                if (sizeQty.size === size) {
                  return {
                    ...sizeQty,
                    quantity: Math.max(0, sizeQty.quantity - quantity)
                  };
                }
                return sizeQty;
              })
            };
          }
          return variant;
        }) || [];

        await StockService.updateStock(itemId, {
          colorVariants: updatedColorVariants
        });
      }
    } catch (error) {
      console.error('Error updating stock in database:', error);
      // Optionally revert local state on error
      // For now, we'll keep the optimistic update
    }
  };

  // Function to restore inventory stock when item is removed from cart
  const restoreInventoryStock = async (itemId: string, colorId: string, size: string, quantity: number = 1) => {
    // Update local state immediately for UI responsiveness
    setClothingInventory(prevInventory => {
      return prevInventory.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            colorVariants: item.colorVariants?.map(variant => {
              if (variant.id === colorId) {
                return {
                  ...variant,
                  sizeQuantities: variant.sizeQuantities.map(sizeQty => {
                    if (sizeQty.size === size) {
                      return {
                        ...sizeQty,
                        quantity: sizeQty.quantity + quantity
                      };
                    }
                    return sizeQty;
                  })
                };
              }
              return variant;
            }) || []
          };
        }
        return item;
      });
    });

    // Persist changes to database
    try {
      const item = clothingInventory.find(item => item.id === itemId);
      if (item) {
        const updatedColorVariants = item.colorVariants?.map(variant => {
          if (variant.id === colorId) {
            return {
              ...variant,
              sizeQuantities: variant.sizeQuantities.map(sizeQty => {
                if (sizeQty.size === size) {
                  return {
                    ...sizeQty,
                    quantity: sizeQty.quantity + quantity
                  };
                }
                return sizeQty;
              })
            };
          }
          return variant;
        }) || [];

        await StockService.updateStock(itemId, {
          colorVariants: updatedColorVariants
        });
      }
    } catch (error) {
      console.error('Error updating stock in database:', error);
      // Optionally revert local state on error
      // For now, we'll keep the optimistic update
    }
  };

  // Function to check available stock for a specific item, color, and size
  const checkInventoryStock = (itemId: string, colorId: string, size: string): number => {
    const item = clothingInventory.find(item => item.id === itemId);
    if (!item) return 0;
    
    const colorVariant = item.colorVariants?.find(variant => variant.id === colorId);
    if (!colorVariant) return 0;
    
    const sizeQuantity = colorVariant.sizeQuantities.find(sizeQty => sizeQty.size === size);
    return sizeQuantity?.quantity || 0;
  };

  // Transform stock data to clothing inventory format
  const transformStockData = useCallback((stocks: StockItem[]): ClothingInventoryItem[] => {
    return stocks.map((stock: StockItem) => {
      // Handle missing or empty colorVariants
      const hasColorVariants = stock.colorVariants && stock.colorVariants.length > 0;
      
      if (!hasColorVariants) {
        console.log(`No colorVariants for ${stock.groupName}, skipping item without variants`);
        // Return item without color variants - UI will handle this appropriately
        return {
          id: stock.id,
          name: stock.groupName,
          price: stock.unitPrice,
          stock: 0, // No stock since no variants
          colors: [],
          image: stock.groupImage,
          category: "Clothing",
          isNew: true,
          colorVariants: [] // Empty array - no variants available
        };
      }

      // Use existing colorVariants if they exist
      return {
        id: stock.id,
        name: stock.groupName,
        price: stock.unitPrice,
        stock: stock.colorVariants.reduce(
          (total, variant) =>
            total +
            variant.sizeQuantities.reduce(
              (sizeTotal, sizeQty) => sizeTotal + sizeQty.quantity,
              0
            ),
          0
        ),
        colors: [
          ...new Set(
            stock.colorVariants.map((variant) => variant.color.toLowerCase())
          ),
        ],
        image: stock.groupImage,
        category: "Clothing",
        isNew: true,
        colorVariants: stock.colorVariants.map((variant, index) => {
          console.log(`Transforming variant ${index} for ${stock.groupName}:`, variant);
          return {
            id: variant.id || `cv${index + 1}-${stock.id}`, // Ensure ID exists
            color: variant.color,
            colorCode: variant.colorCode,
            image: variant.image,
            sizeQuantities: variant.sizeQuantities
          };
        })
      };
    });
  }, []);

  // Set up real-time inventory updates
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Subscribe to real-time stock updates
    const unsubscribe = InventoryRealtimeService.subscribeToAllStocks((stocks) => {
      console.log('Real-time stock update received:', stocks);
      const transformedData = transformStockData(stocks);
      setClothingInventory(transformedData);
      setIsLoading(false);
    });

    // Fallback: If Firebase is not configured, fetch from API
    if (!unsubscribe) {
      const fetchRecentStocks = async () => {
        try {
          const response = await fetch("/api/stocks?recent=true");
          if (!response.ok) {
            throw new Error("Failed to fetch recent stocks");
          }

          const data = await response.json();
          console.log('Fallback API data:', data);
          const transformedData = transformStockData(data.data);
          setClothingInventory(transformedData);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch recent stocks"
          );
          console.error("Error fetching recent stocks:", err);
          setClothingInventory([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRecentStocks();
    }

    // Cleanup function
     return () => {
       if (unsubscribe) {
         unsubscribe();
       }
     };
   }, [transformStockData]);

  // Initialize color selection for each item when inventory loads
  useEffect(() => {
    const currentInventory = clothingInventory.length > 0 ? clothingInventory : fallbackInventory;
    
    // Initialize selectedColors as empty - no auto-selection
    setSelectedColors(prev => {
      const newColors = { ...prev };
      let hasChanges = false;
      
      currentInventory.forEach(item => {
        if (!newColors[item.id]) {
          newColors[item.id] = ""; // No color selected initially
          hasChanges = true;
        }
      });
      
      return hasChanges ? newColors : prev;
    });
  }, [clothingInventory]);

  // Set up inventory callbacks for cart operations (run once)
  useEffect(() => {
    if (setInventoryCallbacks) {
      setInventoryCallbacks({
        reduceStock: (stockId: string, color: string, size: string, quantity: number) => {
          
          // Find the color variant ID based on the color name
          const item = clothingInventory.find(item => item.id === stockId);
          const colorVariant = item?.colorVariants?.find(variant => 
            variant.color.toLowerCase() === color.toLowerCase()
          );
          
          if (colorVariant) {
            reduceInventoryStock(stockId, colorVariant.id, size, quantity);
          } else {
            console.warn('Color variant not found:', { stockId, color, availableVariants: item?.colorVariants });
          }
        },
        restoreStock: (stockId: string, color: string, size: string, quantity: number) => {
          
          // Find the color variant ID based on the color name
          const item = clothingInventory.find(item => item.id === stockId);
          const colorVariant = item?.colorVariants?.find(variant => 
            variant.color.toLowerCase() === color.toLowerCase()
          );
          
          if (colorVariant) {
            restoreInventoryStock(stockId, colorVariant.id, size, quantity);
          } else {
            console.warn('Color variant not found:', { stockId, color, availableVariants: item?.colorVariants });
          }
        },
        checkStock: (stockId: string, color: string, size: string) => {
          
          // Find the color variant ID based on the color name
          const item = clothingInventory.find(item => item.id === stockId);
          if (!item) return 0;
          
          const colorVariant = item.colorVariants?.find(variant => 
            variant.color.toLowerCase() === color.toLowerCase()
          );
          
          if (colorVariant) {
            return checkInventoryStock(stockId, colorVariant.id, size);
          } else {
            console.warn('Color variant not found for stock check:', { stockId, color, availableVariants: item?.colorVariants });
            return 0;
          }
        }
      });
    }
  }, [clothingInventory]); // Include clothingInventory in dependencies

  // Mock data as fallback (keeping a few items for when no API data is available)
  const fallbackInventory = [
    {
      id: "Jean7010",
      name: "Jean7010",
      price: 290,
      stock: 4,
      colors: ["red", "green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
      colorVariants: [
        {
          id: "cv1",
          color: "Red",
          colorCode: "#FF0000",
          image: "https://via.placeholder.com/200x250/FF0000/FFFFFF?text=Red+Jean7010",
          sizeQuantities: [
            { size: "S", quantity: 1 },
            { size: "M", quantity: 2 },
            { size: "L", quantity: 1 }
          ]
        },
        {
          id: "cv2",
          color: "Green",
          colorCode: "#00FF00",
          image: "https://via.placeholder.com/200x250/00FF00/FFFFFF?text=Green+Jean7010",
          sizeQuantities: [
            { size: "S", quantity: 0 },
            { size: "M", quantity: 1 },
            { size: "L", quantity: 2 }
          ]
        },
        {
          id: "cv3",
          color: "Blue",
          colorCode: "#0000FF",
          image: "https://via.placeholder.com/200x250/0000FF/FFFFFF?text=Blue+Jean7010",
          sizeQuantities: [
            { size: "S", quantity: 1 },
            { size: "M", quantity: 0 },
            { size: "L", quantity: 1 }
          ]
        }
      ]
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
      colorVariants: [
        {
          id: "cv4",
          color: "Green",
          colorCode: "#00FF00",
          sizeQuantities: [
            { size: "S", quantity: 2 },
            { size: "M", quantity: 2 },
            { size: "L", quantity: 2 }
          ]
        },
        {
          id: "cv5",
          color: "Red",
          colorCode: "#FF0000",
          sizeQuantities: [
            { size: "S", quantity: 1 },
            { size: "M", quantity: 1 },
            { size: "L", quantity: 1 }
          ]
        },
        {
          id: "cv6",
          color: "Blue",
          colorCode: "#0000FF",
          sizeQuantities: [
            { size: "S", quantity: 1 },
            { size: "M", quantity: 2 },
            { size: "L", quantity: 0 }
          ]
        }
      ]
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
      id: "Jean5583",
      name: "Jean5583",
      price: 320,
      stock: 8,
      colors: ["blue", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4484",
      name: "Jean4484",
      price: 380,
      stock: 7,
      colors: ["green", "yellow", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3385",
      name: "Jean3385",
      price: 275,
      stock: 12,
      colors: ["black", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean2286",
      name: "Jean2286",
      price: 345,
      stock: 6,
      colors: ["red", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean1187",
      name: "Jean1187",
      price: 310,
      stock: 9,
      colors: ["yellow", "blue", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean9988",
      name: "Jean9988",
      price: 395,
      stock: 5,
      colors: ["green", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8889",
      name: "Jean8889",
      price: 285,
      stock: 11,
      colors: ["blue", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7790",
      name: "Jean7790",
      price: 355,
      stock: 7,
      colors: ["black", "green", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6691",
      name: "Jean6691",
      price: 330,
      stock: 8,
      colors: ["yellow", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean5592",
      name: "Jean5592",
      price: 370,
      stock: 6,
      colors: ["red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean4493",
      name: "Jean4493",
      price: 295,
      stock: 10,
      colors: ["green", "blue", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean3394",
      name: "Jean3394",
      price: 385,
      stock: 5,
      colors: ["black", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean2295",
      name: "Jean2295",
      price: 315,
      stock: 9,
      colors: ["blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean1196",
      name: "Jean1196",
      price: 340,
      stock: 7,
      colors: ["yellow", "red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean9997",
      name: "Jean9997",
      price: 280,
      stock: 13,
      colors: ["green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean8898",
      name: "Jean8898",
      price: 365,
      stock: 6,
      colors: ["red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7799",
      name: "Jean7799",
      price: 325,
      stock: 8,
      colors: ["black", "blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean6600",
      name: "Jean6600",
      price: 350,
      stock: 5,
      colors: ["yellow", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean5501",
      name: "Jean5501",
      price: 290,
      stock: 11,
      colors: ["blue", "green", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4402",
      name: "Jean4402",
      price: 375,
      stock: 7,
      colors: ["red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3303",
      name: "Jean3303",
      price: 305,
      stock: 9,
      colors: ["green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean2204",
      name: "Jean2204",
      price: 335,
      stock: 6,
      colors: ["black", "red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean1105",
      name: "Jean1105",
      price: 270,
      stock: 14,
      colors: ["blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean9906",
      name: "Jean9906",
      price: 390,
      stock: 5,
      colors: ["red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8807",
      name: "Jean8807",
      price: 320,
      stock: 8,
      colors: ["yellow", "blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7708",
      name: "Jean7708",
      price: 355,
      stock: 7,
      colors: ["black", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6609",
      name: "Jean6609",
      price: 285,
      stock: 12,
      colors: ["green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean5510",
      name: "Jean5510",
      price: 345,
      stock: 6,
      colors: ["blue", "red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean4411",
      name: "Jean4411",
      price: 310,
      stock: 9,
      colors: ["yellow", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean3312",
      name: "Jean3312",
      price: 380,
      stock: 5,
      colors: ["red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean2213",
      name: "Jean2213",
      price: 295,
      stock: 10,
      colors: ["black", "green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean1114",
      name: "Jean1114",
      price: 365,
      stock: 7,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean9915",
      name: "Jean9915",
      price: 330,
      stock: 8,
      colors: ["green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean8816",
      name: "Jean8816",
      price: 350,
      stock: 6,
      colors: ["black", "red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7717",
      name: "Jean7717",
      price: 275,
      stock: 13,
      colors: ["yellow", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean6618",
      name: "Jean6618",
      price: 395,
      stock: 5,
      colors: ["red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean5519",
      name: "Jean5519",
      price: 315,
      stock: 9,
      colors: ["blue", "green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4420",
      name: "Jean4420",
      price: 340,
      stock: 7,
      colors: ["black", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3321",
      name: "Jean3321",
      price: 290,
      stock: 11,
      colors: ["green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean2222",
      name: "Jean2222",
      price: 370,
      stock: 6,
      colors: ["yellow", "red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean1123",
      name: "Jean1123",
      price: 305,
      stock: 8,
      colors: ["blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean9924",
      name: "Jean9924",
      price: 385,
      stock: 5,
      colors: ["red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean8825",
      name: "Jean8825",
      price: 325,
      stock: 9,
      colors: ["black", "blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean7726",
      name: "Jean7726",
      price: 355,
      stock: 7,
      colors: ["yellow", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean6627",
      name: "Jean6627",
      price: 280,
      stock: 12,
      colors: ["green", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean5528",
      name: "Jean5528",
      price: 375,
      stock: 6,
      colors: ["black", "red", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean4429",
      name: "Jean4429",
      price: 310,
      stock: 8,
      colors: ["blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean3330",
      name: "Jean3330",
      price: 345,
      stock: 5,
      colors: ["red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean2231",
      name: "Jean2231",
      price: 295,
      stock: 10,
      colors: ["yellow", "blue", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean1132",
      name: "Jean1132",
      price: 365,
      stock: 7,
      colors: ["black", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean9933",
      name: "Jean9933",
      price: 320,
      stock: 9,
      colors: ["green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean8834",
      name: "Jean8834",
      price: 390,
      stock: 5,
      colors: ["blue", "red", "black"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean7735",
      name: "Jean7735",
      price: 275,
      stock: 13,
      colors: ["yellow", "green"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean6636",
      name: "Jean6636",
      price: 350,
      stock: 6,
      colors: ["red", "blue"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean5537",
      name: "Jean5537",
      price: 315,
      stock: 8,
      colors: ["black", "green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
    {
      id: "Jean4438",
      name: "Jean4438",
      price: 335,
      stock: 7,
      colors: ["blue", "red"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: true,
    },
    {
      id: "Jean3339",
      name: "Jean3339",
      price: 285,
      stock: 11,
      colors: ["green", "yellow"],
      image: "/api/placeholder/200/250",
      category: "Jeans",
      isNew: false,
    },
  ];

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 60;

  // Use API data if available, otherwise use fallback data
  const displayInventory = clothingInventory.length > 0 ? clothingInventory : fallbackInventory;
  
  // Debug inventory source
  console.log('Inventory source:', {
    clothingInventoryLength: clothingInventory.length,
    usingFallback: clothingInventory.length === 0,
    firstItem: displayInventory[0],
    firstItemColorVariants: displayInventory[0]?.colorVariants
  });

  // Filter items based on search term
  const filteredInventory = displayInventory.filter(
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

  // Add to cart function
  const handleAddToCart = (item: ClothingInventoryItem) => {
    try {
      const selectedVariant = getSelectedColorVariant(item);
      const selectedSize = selectedSizes[item.id];
      
      // Validate that color and size are selected
      if (!selectedVariant) {
        alert('Please select a color');
        return;
      }
      
      if (!selectedSize) {
        alert('Please select a size');
        return;
      }
      
      // Check if selected size has stock
      const stockForSize = getStockForSize(item, selectedSize);
      if (stockForSize === 0) {
        alert('Selected size is out of stock');
        return;
      }

      addToCart({
        stockId: item.id,
        groupName: item.name,
        unitPrice: item.price,
        originalPrice: item.price,
        quantity: 1,
        selectedColor: selectedVariant.color,
        selectedSize: selectedSize,
        colorCode: selectedVariant.colorCode,
        image: item.image,
        shop: 'default'
      });

      // Inventory reduction will be handled by CartContext through callbacks
      
      // Optional: Show success message
      console.log(`Added ${item.name} (${selectedVariant.color}, ${selectedSize}) to cart - Stock reduced`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeItem={activeMenuItem}
        onItemClick={(item) => setActiveMenuItem(item.id)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCartModalOpen={isCartModalOpen}
        className="h-screen"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <TopNavBar onCartModalStateChange={setIsCartModalOpen} />

        {/* Main Content */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Quick Actions */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center p-4 h-auto"
                  >
                    <Package className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Manage Inventory</div>
                      <div className="text-sm text-gray-500">
                        Add, edit, or remove products
                      </div>
                    </div>
                  </Button>

                  <Link href="/owner/dashboard">
                    <Button
                      variant="outline"
                      className="flex items-center justify-center p-4 h-auto w-full"
                    >
                      <BarChart3 className="h-6 w-6 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">View Reports</div>
                        <div className="text-sm text-gray-500">
                          Sales and analytics
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center p-4 h-auto"
                  >
                    <User className="h-6 w-6 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Manage Staff</div>
                      <div className="text-sm text-gray-500">
                        Employee management
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Products
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {isLoading ? "..." : displayInventory.length}
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
                      <BarChart3 className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Today&apos;s Sales
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatPrice(0)}
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
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Customers
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Store className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Store Status
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Active
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clothing Inventory */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Clothing Inventory
                    </h3>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search items, groups, IDs..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                      />
                      <svg
                        className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center space-x-2">
                    <button
                      title="Go to previous page"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNumber
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      title="Go to next page"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Clothing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {isLoading ? (
                    // Loading state
                    Array.from({ length: 12 }).map((_, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
                      >
                        <div className="aspect-[4/5] bg-gray-200"></div>
                        <div className="p-3">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  ) : error ? (
                    // Error state
                    <div className="col-span-full flex flex-col items-center justify-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Failed to load recent stocks
                      </h3>
                      <p className="text-gray-500 mb-4">{error}</p>
                      <Button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : getCurrentPageItems().length === 0 ? (
                    // No items state
                    <div className="col-span-full flex flex-col items-center justify-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No items found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "No recent stock additions found"}
                      </p>
                      <Link href="/owner/inventory/stocks/new-stock">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          Add New Stock
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    getCurrentPageItems().map((item) => (
                      <div
                        key={`${item.id}-${selectedColors[item.id] || 'no-color'}`}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Product Image */}
                        <div className="relative aspect-[4/5] bg-gray-100">
                          {item.isNew && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              New
                            </span>
                          )}
                          <Image
                            key={`${item.id}-image-${selectedColors[item.id] || 'default'}`}
                            src={getCurrentImage(item as ClothingInventoryItem)}
                            alt={item.name}
                            width={200}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="p-3">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {item.name}
                          </h4>

                          {/* Price and Stock */}
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatPrice(item.price)}
                            </span>
                            <span className="text-xs text-gray-600">
                              Stock:{" "}
                              <span className="font-medium text-green-600">
                                {item.stock}
                              </span>
                            </span>
                          </div>

                          {/* Color Selection */}
                          <div className="mb-3">
                            <label className="text-xs font-medium text-gray-700 mb-1 block">
                              Color:
                            </label>
                            <div className="flex items-center space-x-1">
                               {item.colorVariants && item.colorVariants.length > 0 ? (
                                 item.colorVariants.map((variant, index) => {
                                   const variantId = variant.id || `variant-${index}`;
                                   const isSelected = selectedColors[item.id] === variantId;
                                   return (
                                     <button
                                        key={`${item.id}-${variantId}`}
                                        onClick={() => handleColorSelect(item.id, variantId)}
                                        className={`relative w-6 h-6 rounded-full border-2 transition-all ${
                                          isSelected
                                            ? "border-blue-500 ring-2 ring-blue-200"
                                            : "border-gray-300 hover:border-gray-400"
                                        }`}
                                       style={{ backgroundColor: variant.colorCode }}
                                       title={isSelected ? `${variant.color} (click to unselect)` : variant.color}
                                     >
                                       {isSelected && (
                                         <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-sm">
                                           ×
                                         </span>
                                       )}
                                     </button>
                                   );
                                 })
                               ) : (
                                 <span className="text-xs text-gray-500">No color variants available</span>
                               )}
                            </div>
                          </div>

                          {/* Size Selection */}
                          <div className="mb-3" key={`sizes-${item.id}-${selectedColors[item.id] || 'no-color'}`}>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">
                              Size:
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              {(() => {
                                const availableSizes = item.colorVariants ? getAvailableSizes(item) : [];
                                console.log(`Size rendering for ${item.id}: availableSizes=`, availableSizes, `length=${availableSizes.length}`);
                                return availableSizes.length > 0 ? (
                                  availableSizes.map((sizeQty) => {
                                  const isSelected = selectedSizes[item.id] === sizeQty.size;
                                  const isOutOfStock = sizeQty.quantity === 0;
                                  return (
                                    <button
                                      key={`${item.id}-${sizeQty.size}`}
                                      onClick={() => !isOutOfStock && handleSizeSelect(item.id, sizeQty.size)}
                                      disabled={isOutOfStock}
                                      className={`text-xs py-1 px-2 rounded border transition-all ${
                                        isOutOfStock
                                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                          : isSelected
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                      }`}
                                      title={`${sizeQty.size} - ${sizeQty.quantity} in stock`}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span>{sizeQty.size}</span>
                                        <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                                          ({sizeQty.quantity})
                                        </span>
                                      </div>
                                    </button>
                                  );
                                  })
                                ) : (
                                  <span className="text-xs text-gray-500 col-span-3">
                                    {selectedColors[item.id] ? "No sizes available" : "Select a color first"}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          <button 
                            onClick={() => handleAddToCart(item as ClothingInventoryItem)}
                            className={`w-full py-2 px-3 text-sm font-medium rounded transition-colors flex items-center justify-center space-x-2 ${
                              selectedColors[item.id] && selectedSizes[item.id]
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>ADD TO CART</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OwnerHomePage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <OwnerHomeContent />
    </ProtectedRoute>
  );
}
