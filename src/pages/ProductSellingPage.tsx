import {
  Table,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Input,
  Space,
  Statistic,
  Alert,
  Tooltip,
  Badge,
  Modal,
  Form,
  Select,
  InputNumber,
  Switch,
  message,
  Typography,
} from "antd";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useGetAllProductsQuery } from "../redux/features/management/productApi";
import { IProduct, Warehouse } from "../types/product.types";
import { useAppDispatch } from "../redux/hooks";
import { toggleSaleModel } from "../redux/services/modal.Slice";
import SaleModal from "../components/modal/SaleModal";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  InboxOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  UserOutlined,
  ReloadOutlined,
  FileTextOutlined,
  BankOutlined,
  MobileOutlined,
  TransactionOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useCreateSaleMutation } from "../redux/features/management/saleApi";
import { CartModal } from "../components/modal"; // Updated import

// Import types from CartModal
import {
  CartItem,
  PaymentDetails,
  BulkSalePayload,
  PaymentSplit,
  PAYMENT_METHODS,
  PaymentMethodType
} from "../components/modal/cartModal/types"; // Import from types file

const { Option } = Select;
const { useForm } = Form;
const { Text } = Typography;

const ProductSellingPage = () => {
  const [current, setCurrent] = useState(1);
  const [query] = useState({
    limit: 1000,
  });

  const [localFilters, setLocalFilters] = useState({
    search: "",
    inStockOnly: true,
  });

  const { data: products, isFetching } = useGetAllProductsQuery(query);
  const dispatch = useAppDispatch();
  const [createSale] = useCreateSaleMutation();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [currentBuyer, setCurrentBuyer] = useState("");
  const [cartForm] = useForm();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [isProcessingBulkSale, setIsProcessingBulkSale] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  

  // ✅ Define the function FIRST
  const getMerkatoStock = useCallback((product: IProduct): number => {
    if (product.warehouse !== Warehouse.MERKATO) {
      return 0;
    }

    const qtyPerCarton = product.qty || 0;
    const cartonCount = (product as any).ctn || 0;
    const stock = qtyPerCarton * cartonCount;

    if (qtyPerCarton > 0 && cartonCount > 0 && stock === 0) {
      console.warn("Unexpected zero stock calculation:", {
        product_id: product.id,
        qty: qtyPerCarton,
        ctn: cartonCount,
        calculation: `${qtyPerCarton} × ${cartonCount} = ${stock}`,
      });
    }

    return stock;
  }, []);

  // Helper function for payment detail changes
  const handlePaymentDetailChange = useCallback(
    (field: keyof PaymentDetails, value: string | number | null) => {
      setPaymentDetails((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Debounced search handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setLocalFilters((prev) => ({ ...prev, search: value }));
        setCurrent(1);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Extract all products
  const allProducts: IProduct[] = products?.data || [];

  // Filter only Merkato warehouse products
  const merkatoProducts = useMemo(() => {
    return allProducts.filter(
      (product) => product.warehouse === Warehouse.MERKATO
    );
  }, [allProducts]);

  // Apply local filters to Merkato products
  const filteredProducts = useMemo(() => {
    let result = [...merkatoProducts];

    if (localFilters.search) {
      const searchLower = localFilters.search.toLowerCase();
      result = result.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(searchLower)) ||
          (product.code && product.code.toLowerCase().includes(searchLower))
      );
    }

    if (localFilters.inStockOnly) {
      result = result.filter((product) => {
        const stock = getMerkatoStock(product);
        return stock > 0;
      });
    }

    return result;
  }, [merkatoProducts, localFilters, getMerkatoStock]);

  // Add product to cart
  const addToCart = useCallback((product: any) => {
    // Get the actual product from allProducts to ensure we have the latest data
    const fullProduct = allProducts.find(p => p.id === product.id);
    if (!fullProduct) return;

    const stock = getMerkatoStock(fullProduct);
    const qtyPerCarton = fullProduct.qty || 1;
    const cartonCount = Math.floor(stock / qtyPerCarton);
    
    console.log('Adding to cart:', {
      product: fullProduct.name,
      stock,
      qtyPerCarton,
      cartonCount,
      ctn: (fullProduct as any).ctn,
      qty: fullProduct.qty
    });
    
    const existingItem = cart.find(item => item.id === fullProduct.id);
    if (existingItem) {
      message.warning(`${fullProduct.name} is already in the cart`);
      return;
    }
    
    setCart(prev => [...prev, {
      id: fullProduct.id,
      code: fullProduct.code || '',
      name: fullProduct.name || '',
      price: fullProduct.price || 0,
      qtyPerCarton,
      availableStock: stock, // This should be the total pieces
      availableCartons: cartonCount, // This should be total cartons
      quantity: 1,
      useCustomPrice: false,
      customPrice: fullProduct.price || 0,
      allowNegativeStock: false,
      unit: fullProduct.unit || 'PC'
    }]);
    
    message.success(`${fullProduct.name} added to cart`);
  }, [cart, getMerkatoStock, allProducts]);

  // Update cart item
  const updateCartItem = useCallback(
    (productId: number, updates: Partial<CartItem>) => {
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  // Remove from cart
  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => {
      const item = prev.find((item) => item.id === productId);
      if (item) {
        message.info(`${item.name} removed from cart`);
      }
      return prev.filter((item) => item.id !== productId);
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    if (cart.length > 0) {
      message.info("Cart cleared");
    }
    setCart([]);
    // Also reset payment details when clearing cart
    setPaymentDetails({});
    setPaymentMethod("");
    setCurrentBuyer("");
  }, [cart.length]);

  // Calculate cart total
  const calculateCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price =
        item.useCustomPrice && item.customPrice ? item.customPrice : item.price;
      const totalPieces = item.quantity * item.qtyPerCarton;
      return total + price * totalPieces;
    }, 0);
  }, [cart]);

  // Calculate total items in cart
  const calculateTotalCartItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);
//   const handleBulkSale = async (salesData: BulkSalePayload[]) => {
//     let successCount = 0;
//     let failedCount = 0;

//     setIsProcessingBulkSale(true);

//   try {
//     // Generate unique split IDs for each item
//         const salesDataWithUniqueSplits = salesData.map((sale, index) => {
//           if (sale.paymentMethod === "SPLIT" && sale.paymentSplits) {
//             // Generate unique split IDs for each item
//             const uniqueSplits = sale.paymentSplits.map(split => ({
//               ...split,
//               id: `split_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
//             }));
            
//             return {
//               ...sale,
//               paymentSplits: uniqueSplits
//             };
//           }
//           return sale;
//         });
//         // Call the existing createSale endpoint for each sale
//         // OR create a new bulk endpoint
//         for (const sale of salesData) {
//             try {
//                 const payload: any = {
//                     buyerName: sale.buyerName,
//                     casherName: sale.casherName,
//                     date: sale.date,
//                     paymentMethod: sale.paymentMethod,
//                     code: sale.code,
//                     ctn: sale.ctn,
//                     productPrice: sale.productPrice,
//                     productName: sale.name,
//                     useCustomPrice: sale.useCustomPrice,
//                     allowNegativeStock: sale.allowNegativeStock,
//                     paidAmount: sale.paidAmount,
//                     remainingAmount: sale.remainingAmount,
//                     totalAmount: sale.totalAmount,
//                 };

//                 // Add custom price if used
//                 if (sale.useCustomPrice && sale.customPricePerPiece) {
//                     payload.customPricePerPiece = sale.customPricePerPiece;
//                 }

//                 // Include payment details
//                 if (sale.paymentMethod === "BANK_TRANSFER") {
//                     if (sale.bankName) payload.bankName = sale.bankName;
//                     if (sale.senderName) payload.senderName = sale.senderName;
//                     if (sale.receiverName) payload.receiverName = sale.receiverName;
//                 }

//                 if (sale.paymentMethod === "TELEBIRR") {
//                     if (sale.telebirrPhone) payload.telebirrPhone = sale.telebirrPhone;
//                     if (sale.telebirrTransactionId)
//                         payload.telebirrTransactionId = sale.telebirrTransactionId;
//                     if (sale.receiverName) payload.receiverName = sale.receiverName;
//                 }

//                 if (sale.paymentMethod === 'PARTIAL') {
//                     // ... existing partial payment logic ...
//                 }

//                 if (sale.paymentMethod === "OTHER") {
//                     if (sale.otherMethod) payload.otherMethod = sale.otherMethod;
//                     if (sale.otherReference)
//                         payload.otherReference = sale.otherReference;
//                     if (sale.receiverName) payload.receiverName = sale.receiverName;
//                 }

//                 // Handle SPLIT payments
//                 if (sale.paymentMethod === "SPLIT" && sale.paymentSplits) {
//                     // Store split payment details in notes or a dedicated field
//                     const splitSummary = sale.paymentSplits.map(split => 
//                         `${split.method}: $${split.amount.toFixed(2)} (${split.percentage.toFixed(1)}%)`
//                     ).join('; ');
                    
//                     payload.notes = `SPLIT PAYMENT: ${splitSummary}`;
                    
//                     // For now, we'll use PARTIAL as the payment method but store split details
//                     // Or add a new field if your backend supports it
//                     payload.paymentSplits = sale.paymentSplits;
//                 }

//                 await createSale(payload).unwrap();
//                 successCount++;
//             } catch (error: any) {
//                 console.error(`Failed to sell ${sale.name}:`, error);
//                 message.error(
//                     `${sale.name}: ${error?.data?.message || "Failed to sell"}`
//                 );
//                 failedCount++;
//             }
//         }

//         if (successCount > 0) {
//             message.success(`Successfully processed ${successCount} items, ${failedCount} failed`);
//         }

//         return { successCount, failedCount };
//     } catch (error) {
//         console.error("Bulk sale error:", error);
//         return { successCount, failedCount: salesData.length };
//     } finally {
//         setIsProcessingBulkSale(false);
//     }
// };
  // Data processing
//   const handleBulkSale = async (salesData: BulkSalePayload[]) => {
//   let successCount = 0;
//   let failedCount = 0;

//   setIsProcessingBulkSale(true);

//   try {
//     // Generate unique split IDs for each item
//     const salesDataWithUniqueSplits = salesData.map((sale, index) => {
//       if (sale.paymentMethod === "SPLIT" && sale.paymentSplits) {
//         // Generate unique split IDs for each item
//         const uniqueSplits = sale.paymentSplits.map(split => ({
//           ...split,
//           id: `split_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
//         }));
        
//         return {
//           ...sale,
//           paymentSplits: uniqueSplits
//         };
//       }
//       return sale;
//     });

//     // Process each sale with unique splits
//     for (const sale of salesDataWithUniqueSplits) {
//       try {
//         const payload: any = {
//           buyerName: sale.buyerName,
//           casherName: sale.casherName,
//           date: sale.date,
//           paymentMethod: sale.paymentMethod,
//           code: sale.code,
//           ctn: sale.ctn,
//           productPrice: sale.productPrice,
//           productName: sale.name,
//           useCustomPrice: sale.useCustomPrice,
//           allowNegativeStock: sale.allowNegativeStock,
//           paidAmount: sale.paidAmount,
//           remainingAmount: sale.remainingAmount,
//           totalAmount: sale.totalAmount,
//         };

//         // Add custom price if used
//         if (sale.useCustomPrice && sale.customPricePerPiece) {
//           payload.customPricePerPiece = sale.customPricePerPiece;
//         }

//         // Include payment details
//         if (sale.paymentMethod === "BANK_TRANSFER") {
//           if (sale.bankName) payload.bankName = sale.bankName;
//           if (sale.senderName) payload.senderName = sale.senderName;
//           if (sale.receiverName) payload.receiverName = sale.receiverName;
//         }

//         if (sale.paymentMethod === "TELEBIRR") {
//           if (sale.telebirrPhone) payload.telebirrPhone = sale.telebirrPhone;
//           if (sale.telebirrTransactionId)
//             payload.telebirrTransactionId = sale.telebirrTransactionId;
//           if (sale.receiverName) payload.receiverName = sale.receiverName;
//         }

//         if (sale.paymentMethod === 'PARTIAL') {
//           // ... existing partial payment logic ...
//         }

//         if (sale.paymentMethod === "OTHER") {
//           if (sale.otherMethod) payload.otherMethod = sale.otherMethod;
//           if (sale.otherReference)
//             payload.otherReference = sale.otherReference;
//           if (sale.receiverName) payload.receiverName = sale.receiverName;
//         }

//         // Handle SPLIT payments
//         if (sale.paymentMethod === "SPLIT" && sale.paymentSplits) {
//           // Create summary for notes
//           const splitSummary = sale.paymentSplits.map(split => 
//             `${split.method}: $${split.amount.toFixed(2)} (${split.percentage.toFixed(1)}%)`
//           ).join('; ');
          
//           payload.notes = `SPLIT PAYMENT: ${splitSummary}`;
          
//           // Include the actual split data
//           payload.paymentSplits = sale.paymentSplits;
//         }

//         console.log(`Creating sale for ${sale.name} with payload:`, payload);
//         await createSale(payload).unwrap();
//         successCount++;
        
//         // Small delay between requests to avoid overwhelming the server
//         await new Promise(resolve => setTimeout(resolve, 100));
        
//       } catch (error: any) {
//         console.error(`Failed to sell ${sale.name}:`, error);
//         message.error(
//           `${sale.name}: ${error?.data?.message || "Failed to sell"}`
//         );
//         failedCount++;
//       }
//     }

//     if (successCount > 0) {
//       message.success(`Successfully processed ${successCount} items, ${failedCount} failed`);
      
//       // Clear cart only if all items were successfully processed
//       if (failedCount === 0) {
//         clearCart();
//       }
//     }

//     return { successCount, failedCount };
//   } catch (error) {
//     console.error("Bulk sale error:", error);
//     return { successCount, failedCount: salesData.length };
//   } finally {
//     setIsProcessingBulkSale(false);
//   }
// };
const handleBulkSale = async (salesData: BulkSalePayload[]) => {
  let successCount = 0;
  let failedCount = 0;

  setIsProcessingBulkSale(true);

  try {
    // Generate unique split IDs for each item
    const salesDataWithUniqueSplits = salesData.map((sale, index) => {
      if (sale.paymentMethod === "SPLIT" && sale.paymentSplits) {
        // Generate unique split IDs for each item
        const uniqueSplits = sale.paymentSplits.map(split => ({
          ...split,
          id: `split_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        }));
        
        return {
          ...sale,
          paymentSplits: uniqueSplits
        };
      }
      return sale;
    });

    // Process each sale with unique splits
    for (const sale of salesDataWithUniqueSplits) {
      try {
        const payload: any = {
          buyerName: sale.buyerName,
          casherName: sale.casherName,
          date: sale.date,
          paymentMethod: sale.paymentMethod,
          code: sale.code,
          ctn: sale.ctn,
          productPrice: sale.productPrice,
          productName: sale.name,
          useCustomPrice: sale.useCustomPrice,
          allowNegativeStock: sale.allowNegativeStock,
          // FIX: For PARTIAL payments, use the actual paid amount
          paidAmount: sale.paidAmount,
          remainingAmount: sale.remainingAmount,
          totalAmount: sale.totalAmount,
        };

        // Add custom price if used
        if (sale.useCustomPrice && sale.customPricePerPiece) {
          payload.customPricePerPiece = sale.customPricePerPiece;
        }

        // Include payment details
        if (sale.paymentMethod === "BANK_TRANSFER") {
          if (sale.bankName) payload.bankName = sale.bankName;
          if (sale.senderName) payload.senderName = sale.senderName;
          if (sale.receiverName) payload.receiverName = sale.receiverName;
        }

        if (sale.paymentMethod === "TELEBIRR") {
          if (sale.telebirrPhone) payload.telebirrPhone = sale.telebirrPhone;
          if (sale.telebirrTransactionId)
            payload.telebirrTransactionId = sale.telebirrTransactionId;
          if (sale.receiverName) payload.receiverName = sale.receiverName;
        }

        // FIX: For PARTIAL payments, make sure paidAmount < totalAmount
        if (sale.paymentMethod === "PARTIAL") {
          // Validate that paidAmount is less than totalAmount
          if (sale.paidAmount >= sale.totalAmount) {
            message.error(`${sale.name}: Paid amount must be less than total price for partial payments`);
            failedCount++;
            continue; // Skip this sale
          }
          
          // For partial payments, we might need additional fields
          if (sale.firstPaymentMethod) payload.firstPaymentMethod = sale.firstPaymentMethod;
          if (sale.firstPaymentBank) payload.firstPaymentBank = sale.firstPaymentBank;
          if (sale.firstPaymentReference) payload.firstPaymentReference = sale.firstPaymentReference;
          if (sale.firstPaymentPhone) payload.firstPaymentPhone = sale.firstPaymentPhone;
          if (sale.firstPaymentDetails) payload.firstPaymentDetails = sale.firstPaymentDetails;
          //if (sale.dueDate) payload.dueDate = sale.dueDate;
        }

        if (sale.paymentMethod === "OTHER") {
          if (sale.otherMethod) payload.otherMethod = sale.otherMethod;
          if (sale.otherReference)
            payload.otherReference = sale.otherReference;
          if (sale.receiverName) payload.receiverName = sale.receiverName;
        }

        // Handle SPLIT payments
        if (sale.paymentMethod === "SPLIT" && sale.paymentSplits) {
          // Create summary for notes
          const splitSummary = sale.paymentSplits.map(split => 
            `${split.method}: $${split.amount.toFixed(2)} (${split.percentage.toFixed(1)}%)`
          ).join('; ');
          
          payload.notes = `SPLIT PAYMENT: ${splitSummary}`;
          
          // Include the actual split data
          payload.paymentSplits = sale.paymentSplits;
        }

        console.log(`Creating sale for ${sale.name} with payload:`, payload);
        await createSale(payload).unwrap();
        successCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        console.error(`Failed to sell ${sale.name}:`, error);
        message.error(
          `${sale.name}: ${error?.data?.message || "Failed to sell"}`
        );
        failedCount++;
      }
    }

    if (successCount > 0) {
      message.success(`Successfully processed ${successCount} items, ${failedCount} failed`);
      
      // Clear cart only if all items were successfully processed
      if (failedCount === 0) {
        clearCart();
      }
    }

    return { successCount, failedCount };
  } catch (error) {
    console.error("Bulk sale error:", error);
    return { successCount, failedCount: salesData.length };
  } finally {
    setIsProcessingBulkSale(false);
  }
};  
  
const productsWithCalculatedStock = useMemo(() => {
    return filteredProducts.map((product) => ({
      ...product,
      calculatedStock: getMerkatoStock(product),
      qtyPerCarton: product.qty || 0,
      cartonCount: product.ctn || 0,
    }));
  }, [filteredProducts, getMerkatoStock]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (current - 1) * 10;
    const endIndex = startIndex + 10;
    return productsWithCalculatedStock.slice(startIndex, endIndex);
  }, [productsWithCalculatedStock, current]);

  const tableData = useMemo(
    () =>
      paginatedProducts.map((product: any) => ({
        key: product.id,
        id: product.id,
        code: product.code,
        name: product.name,
        price: product.price,
        warehouseStock: product.calculatedStock,
        totalStock: product.calculatedStock,
        qtyPerCarton: product.qtyPerCarton,
        cartonCount: product.cartonCount,
        warehouse: product.warehouse,
        unit: product.unit,
      })),
    [paginatedProducts]
  );

  const handleSellClick = useCallback(
    (product: any) => {
      const modalData = {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: product.warehouseStock,
        code: product.code,
        unit: product.unit,
        warehouse: Warehouse.MERKATO,
        ctn: product.ctn || 0,
        totalQty: product.totalQty || product.qty || 0,
        merkatoQty: product.merkatoQty,
        qtyPerCarton: product.qtyPerCarton,
        cartonCount: product.cartonCount,
      };

      dispatch(toggleSaleModel({ open: true, data: modalData }));
    },
    [dispatch]
  );

  const handlePaymentMethodChange = (value: string) => {
  // Validate it's a valid PaymentMethodType
  const validMethods = Object.values(PAYMENT_METHODS);
  if (validMethods.includes(value as PaymentMethodType)) {
    setPaymentMethod(value);
  } else {
    console.warn(`Invalid payment method: ${value}`);
    setPaymentMethod(PAYMENT_METHODS.CASH); // Default fallback
  }
};

  const handleSearch = useCallback((value: string) => {
    setLocalFilters((prev) => ({ ...prev, search: value }));
    setCurrent(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      search: "",
      inStockOnly: true,
    });
    setCurrent(1);
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const inStockCount = filteredProducts.filter((product) => {
      const warehouseStock = getMerkatoStock(product);
      return warehouseStock > 0;
    }).length;

    const totalValue = filteredProducts.reduce((sum, product) => {
      const warehouseStock = getMerkatoStock(product);
      return sum + product.price * warehouseStock;
    }, 0);

    const totalStockInWarehouse = filteredProducts.reduce((sum, product) => {
      const warehouseStock = getMerkatoStock(product);
      return sum + warehouseStock;
    }, 0);

    const totalCartons = filteredProducts.reduce((sum, product) => {
      return sum + (product.ctn || 0);
    }, 0);

    return {
      totalProducts: filteredProducts.length,
      inStockCount,
      outOfStockCount: filteredProducts.length - inStockCount,
      totalValue,
      totalStockInWarehouse,
      totalCartons,
      averagePrice:
        filteredProducts.length > 0
          ? filteredProducts.reduce((sum, p) => sum + p.price, 0) /
            filteredProducts.length
          : 0,
    };
  }, [filteredProducts, getMerkatoStock]);

  const columns = [
    {
      title: "Product Code",
      key: "code",
      dataIndex: "code",
      width: 100,
      fixed: "left" as const,
    },
    {
      title: "Product Name",
      key: "name",
      dataIndex: "name",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Price",
      key: "price",
      dataIndex: "price",
      align: "center" as const,
      width: 90,
      render: (price: number) => `$${price.toFixed(2)}`,
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: "Available Stock",
      key: "stock",
      align: "center" as const,
      width: 160,
      render: (record: any) => {
        const stock = record.warehouseStock;
        const qtyPerCarton = record.qtyPerCarton;
        const cartonCount = record.cartonCount;

        let color = "error";
        let text = "Out of Stock";

        if (stock > 10) {
          color = "success";
          text = `${stock} units`;
        } else if (stock > 0) {
          color = "warning";
          text = `${stock} units`;
        }

        return (
          <Tooltip
            title={
              <div>
                <div>
                  <strong>Stock Breakdown:</strong>
                </div>
                <div>
                  • Units per carton: {qtyPerCarton} {record.unit}
                </div>
                <div>• Number of cartons: {cartonCount}</div>
                <div>• Total available: {stock} units</div>
                {qtyPerCarton > 0 && (
                  <div>
                    • Calculation: {qtyPerCarton} × {cartonCount} = {stock}
                  </div>
                )}
              </div>
            }
          >
            <div>
              <Tag color={color}>{text}</Tag>
              <div
                style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}
              >
                {qtyPerCarton} × {cartonCount} cartons
              </div>
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => a.warehouseStock - b.warehouseStock,
    },
    {
      title: "Total Value",
      key: "value",
      align: "center" as const,
      width: 100,
      render: (record: any) => (
        <Tooltip
          title={`${record.warehouseStock} units × $${record.price} = $${(
            record.price * record.warehouseStock
          ).toFixed(2)}`}
        >
          <Tag color="purple">
            ${(record.price * record.warehouseStock).toFixed(2)}
          </Tag>
        </Tooltip>
      ),
      sorter: (a: any, b: any) =>
        a.price * a.warehouseStock - b.price * b.warehouseStock,
    },
    {
      title: "Unit",
      key: "unit",
      dataIndex: "unit",
      align: "center" as const,
      width: 70,
      render: (unit: string) => <Tag color="cyan">{unit}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      width: 140,
      fixed: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            onClick={() => addToCart(record)}
            type="default"
            icon={<ShoppingCartOutlined />}
            disabled={record.warehouseStock === 0}
            size="small"
            style={{ width: "100%" }}
          >
            Add to Cart
          </Button>
          <Button
            onClick={() => handleSellClick(record)}
            type="primary"
            disabled={record.warehouseStock === 0}
            size="small"
            style={{
              backgroundColor:
                record.warehouseStock > 0 ? "#52c41a" : "#d9d9d9",
              borderColor: record.warehouseStock > 0 ? "#52c41a" : "#d9d9d9",
              width: "100%",
            }}
          >
            Quick Sell
          </Button>
        </Space>
      ),
    },
  ];

  const hasActiveFilters = localFilters.search || !localFilters.inStockOnly;
  const hasMoreProducts =
    merkatoProducts.length < 200 && merkatoProducts.length === query.limit;

  // Handle cart modal close
  const handleCartModalClose = () => {
    setCartVisible(false);
  };

  return (
    <div>
      {/* Header Card */}
      <Card
        style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, #6990d3ff 0%, #62b1dcff 100%)",
        }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <div style={{ color: "black" }}>
              <h1 style={{ margin: 0, color: "black", fontSize: "24px" }}>
                <ShoppingCartOutlined style={{ marginRight: "12px" }} />
                Merkato Sales Dashboard
              </h1>
              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "rgba(37, 36, 36, 0.85)",
                  fontSize: "14px",
                }}
              >
                Showing products from <strong>Merkato Warehouse</strong> only
                {filteredProducts.length > 0 && (
                  <span>
                    {" "}
                    • {stats.totalStockInWarehouse} units available for sale
                  </span>
                )}
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[8, 8]} justify="end">
              <Col>
                <Statistic
                  title="Products Available"
                  value={stats.totalProducts}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "white", fontSize: "32px" }}
                />
              </Col>
              <Col>
                <Badge count={cart.length} overflowCount={99} size="default">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    onClick={() => setCartVisible(true)}
                    style={{
                      height: "80px",
                      padding: "0 20px",
                      fontSize: "16px",
                      background: cart.length > 0 ? "#fa8c16" : "#1890ff",
                    }}
                  >
                    <div style={{ lineHeight: 1.2 }}>
                      <div>Bulk Sale</div>
                      <div style={{ fontSize: "12px", fontWeight: "normal" }}>
                        {cart.length > 0 ? `(${cart.length} items)` : "Cart"}
                      </div>
                    </div>
                  </Button>
                </Badge>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Filter Card */}
      <Card size="small" style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={16}>
            <Input.Search
              placeholder="Search Merkato products by name or code..."
              value={localFilters.search}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Button
              type={localFilters.inStockOnly ? "primary" : "default"}
              onClick={() =>
                setLocalFilters((prev) => ({
                  ...prev,
                  inStockOnly: !prev.inStockOnly,
                }))
              }
              size="middle"
              style={{ width: "100%" }}
            >
              {localFilters.inStockOnly ? "✓ Available Only" : "Show All"}
            </Button>
          </Col>
          <Col xs={12} sm={4}>
            <Button
              type="dashed"
              icon={<ShoppingCartOutlined />}
              onClick={() => setCartVisible(true)}
              size="middle"
              style={{ width: "100%" }}
            >
              Cart {cart.length > 0 && `(${cart.length})`}
            </Button>
          </Col>

          {hasActiveFilters && (
            <Col xs={24}>
              <Space wrap style={{ marginTop: "8px" }}>
                {localFilters.search && (
                  <Tag
                    closable
                    onClose={() =>
                      setLocalFilters((prev) => ({ ...prev, search: "" }))
                    }
                  >
                    Search: {localFilters.search}
                  </Tag>
                )}
                {!localFilters.inStockOnly && (
                  <Tag
                    closable
                    onClose={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        inStockOnly: true,
                      }))
                    }
                  >
                    Showing All
                  </Tag>
                )}
                <Button
                  type="link"
                  onClick={handleClearFilters}
                  size="small"
                  style={{ padding: "0" }}
                >
                  Clear All
                </Button>
              </Space>
            </Col>
          )}

          {hasMoreProducts && (
            <Col xs={24}>
              <Alert
                message="Note"
                description={`Showing ${merkatoProducts.length} products. There may be more products in the database. Adjust the limit in the query to load more.`}
                type="warning"
                showIcon
                style={{ marginTop: "8px" }}
              />
            </Col>
          )}
        </Row>
      </Card>

      {/* Sales Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Available Products"
              value={stats.inStockCount}
              valueStyle={{ color: "#52c41a" }}
              prefix={<ShoppingCartOutlined />}
              suffix={`/ ${stats.totalProducts}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Stock Value"
              value={stats.totalValue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Items in Cart"
              value={cart.length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: cart.length > 0 ? "#f5222d" : "#666" }}
              suffix={`/ $${calculateCartTotal().toFixed(2)}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Cartons Available"
              value={stats.totalCartons}
              prefix={<InboxOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Warehouse Info */}
      <Alert
        message="Merkato Warehouse - Sales Options"
        description={
          <div>
            <p>
              Showing all products available for sale at{" "}
              <strong>Merkato Warehouse</strong>. Two selling options:
            </p>
            <ul
              style={{
                margin: "8px 0 0 0",
                paddingLeft: "20px",
                fontSize: "12px",
              }}
            >
              <li>
                <strong>Quick Sell:</strong> Process single product sale
                immediately
              </li>
              <li>
                <strong>Add to Cart:</strong> Build a bulk sale with multiple
                products
              </li>
              <li>
                <strong>Bulk Sale Cart:</strong> Complete all cart items with
                one transaction
              </li>
              <li>
                <strong>Green Tag:</strong> Good stock (&gt;10 units) - Ready
                for sale
              </li>
              <li>
                <strong>Yellow Tag:</strong> Low stock (1-10 units) - Consider
                restocking
              </li>
              <li>
                <strong>Red Tag:</strong> Out of stock - Not available for sale
              </li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: "20px" }}
      />

      {/* Products Table */}
      <Card size="small">
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <ShoppingCartOutlined
              style={{
                fontSize: "48px",
                color: "#d9d9d9",
                marginBottom: "16px",
              }}
            />
            <h3>No products available for sale</h3>
            <p style={{ color: "#666" }}>
              {hasActiveFilters
                ? `No Merkato products found with current filters`
                : `No products available for sale at Merkato Warehouse`}
            </p>
            {hasActiveFilters && (
              <Button
                type="primary"
                onClick={handleClearFilters}
                style={{ marginTop: "16px" }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <Alert
              message={
                <div>
                  <Row gutter={16} align="middle">
                    <Col flex="auto">
                      Showing <strong>{paginatedProducts.length}</strong> of{" "}
                      <strong>{filteredProducts.length}</strong> products from{" "}
                      <strong>Merkato Warehouse</strong>
                      {hasActiveFilters && " (filtered)"}
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          color: "#666",
                        }}
                      >
                        <InfoCircleOutlined /> Use "Add to Cart" for bulk sales
                        or "Quick Sell" for single items
                      </div>
                    </Col>
                    <Col>
                      <Badge count={cart.length} overflowCount={99}>
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => setCartVisible(true)}
                          disabled={cart.length === 0}
                        >
                          View Cart
                        </Button>
                      </Badge>
                    </Col>
                  </Row>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: "16px" }}
            />

            <Table
              size="small"
              loading={isFetching}
              columns={columns}
              dataSource={tableData}
              pagination={{
                current,
                pageSize: 10,
                total: filteredProducts.length,
                onChange: (page) => setCurrent(page),
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} Merkato products`,
              }}
              scroll={{ x: "max-content" }}
            />
          </>
        )}
      </Card>

      <SaleModal />

      {/* Use the imported CartModal component */}
      <CartModal
        visible={cartVisible}
        onClose={handleCartModalClose}
        cart={cart}
        onClearCart={clearCart}
        onBulkSale={handleBulkSale}
        currentBuyer={currentBuyer}
        onBuyerChange={setCurrentBuyer}
        paymentMethod={paymentMethod as PaymentMethodType}
        onPaymentMethodChange={handlePaymentMethodChange}
        paymentDetails={paymentDetails}
        onPaymentDetailChange={handlePaymentDetailChange}
        isProcessing={isProcessingBulkSale}
        calculateCartTotal={calculateCartTotal}
        updateCartItem={updateCartItem}
        removeFromCart={removeFromCart}
        calculateTotalCartItems={calculateTotalCartItems}
      />
    </div>
  );
};

export default ProductSellingPage;