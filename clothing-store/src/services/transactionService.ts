import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SelectedCustomer, CartItem } from '@/types/cart';
import { StockService } from '@/services/stockService';

export interface Transaction {
  id?: string;
  transactionId: string;
  customer: SelectedCustomer | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: 'cash' | 'scan' | 'wallet';
  timestamp: string;
  createdAt: Timestamp;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded' | 'partially_refunded';
  shopId?: string;
  branchName?: string;
  sellingCurrency?: 'THB' | 'MMK';
  exchangeRate?: number;
  sellingTotal?: number;
  refunds?: Refund[];
  cancelledAt?: Timestamp;
  cancelReason?: string;
  cancelledBy?: string;
}

export interface RefundItem {
  itemId: string;
  itemIndex: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Refund {
  id?: string;
  transactionId: string;
  refundId: string;
  items: RefundItem[];
  totalAmount: number;
  itemsSubtotal?: number; // Subtotal of refunded items before cart discount and tax
  cartDiscountRefund?: number; // Proportional cart discount being refunded
  taxRefund?: number; // Proportional tax being refunded
  reason?: string;
  processedBy?: string;
  createdAt: Timestamp;
  status: 'pending' | 'completed' | 'failed';
}

export interface TransactionSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  paymentMethodBreakdown: {
    cash: number;
    scan: number;
    wallet: number;
  };
}

class TransactionService {
  private collectionName = 'transactions';

  /**
   * Record a completed transaction
   */
  async recordTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('TransactionService: Starting transaction recording...');
      console.log('TransactionService: Database instance check:', { dbExists: !!db });
      
      if (!db) {
        console.error('TransactionService: Firestore instance is null');
        throw new Error('Firestore database is not initialized. Please check your Firebase configuration.');
      }

      console.log('TransactionService: Preparing transaction data...');
      const dataToRecord = {
        ...transactionData,
        createdAt: Timestamp.now(),
      };
      
      console.log('TransactionService: Transaction data prepared:', {
        transactionId: dataToRecord.transactionId,
        itemCount: dataToRecord.items?.length || 0,
        total: dataToRecord.total,
        paymentMethod: dataToRecord.paymentMethod
      });

      console.log('TransactionService: Adding document to collection:', this.collectionName);
      const docRef = await addDoc(collection(db, this.collectionName), dataToRecord);
      
      console.log('TransactionService: Transaction recorded successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('TransactionService: Error recording transaction:', error);
      console.error('TransactionService: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as { code?: string })?.code,
        stack: error instanceof Error ? error.stack : undefined,
        collectionName: this.collectionName,
        dbExists: !!db
      });
      
      if (error instanceof Error) {
        throw new Error(`Failed to record transaction: ${error.message}`);
      } else {
        throw new Error('Failed to record transaction: Unknown error occurred');
      }
    }
  }

  /**
   * Get all transactions with optional filtering
   */
  async getTransactions(
    shopId?: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Transaction[]> {
    try {
      let q = query(
collection(db!, this.collectionName),
        orderBy('createdAt', 'desc')
      );

      if (shopId) {
        q = query(q, where('shopId', '==', shopId));
      }

      if (startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });

      return limit ? transactions.slice(0, limit) : transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Get transaction summary for reporting
   */
  async getTransactionSummary(
    shopId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TransactionSummary> {
    try {
      const transactions = await this.getTransactions(shopId, startDate, endDate);
      
      const summary: TransactionSummary = {
        totalTransactions: transactions.length,
        totalRevenue: 0,
        totalTax: 0,
        totalDiscount: 0,
        paymentMethodBreakdown: {
          cash: 0,
          scan: 0,
          wallet: 0
        }
      };

      transactions.forEach(transaction => {
        // Include completed, partially refunded, and refunded transactions
        if (transaction.status === 'completed' || transaction.status === 'partially_refunded' || transaction.status === 'refunded') {
          // Calculate net amounts after refunds
          const refundedAmount = transaction.refunds?.reduce((sum, refund) => sum + refund.totalAmount, 0) || 0;
          // Ensure net revenue is never negative (safeguard against data inconsistencies)
          const netRevenue = Math.max(0, transaction.total - refundedAmount);
          const netTax = netRevenue > 0 ? transaction.tax * (netRevenue / transaction.total) : 0;
          const netDiscount = netRevenue > 0 ? transaction.discount * (netRevenue / transaction.total) : 0;
          
          summary.totalRevenue += netRevenue;
          summary.totalTax += netTax;
          summary.totalDiscount += netDiscount;
          summary.paymentMethodBreakdown[transaction.paymentMethod] += netRevenue;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error generating transaction summary:', error);
      throw new Error('Failed to generate transaction summary');
    }
  }

  /**
   * Get today's transactions
   */
  async getTodaysTransactions(shopId?: string): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getTransactions(shopId, today, tomorrow);
  }

  /**
   * Get transactions for a specific customer
   */
  async getCustomerTransactions(customerEmail: string, shopId?: string): Promise<Transaction[]> {
    try {
      let q = query(
        collection(db!, this.collectionName),
        where('customer.email', '==', customerEmail),
        orderBy('createdAt', 'desc')
      );

      if (shopId) {
        q = query(q, where('shopId', '==', shopId));
      }

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      throw new Error('Failed to fetch customer transactions');
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId: string, status: Transaction['status']): Promise<void> {
    try {
      const transactionRef = doc(db!, this.collectionName, transactionId);
      await updateDoc(transactionRef, { status });
      console.log('Transaction status updated:', transactionId, status);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw new Error('Failed to update transaction status');
    }
  }

  /**
   * Get revenue for a specific date range
   */
  async getRevenue(startDate: Date, endDate: Date, shopId?: string): Promise<number> {
    try {
      const transactions = await this.getTransactions(shopId, startDate, endDate);
      return transactions
        .filter(t => t.status === 'completed' || t.status === 'partially_refunded' || t.status === 'refunded')
        .reduce((total, transaction) => {
          const refundedAmount = transaction.refunds?.reduce((sum, refund) => sum + refund.totalAmount, 0) || 0;
          // Ensure net revenue is never negative (safeguard against data inconsistencies)
          return total + Math.max(0, transaction.total - refundedAmount);
        }, 0);
    } catch (error) {
      console.error('Error calculating revenue:', error);
      throw new Error('Failed to calculate revenue');
    }
  }

  /**
   * Process a refund for a transaction
   */
  async processRefund(
    transactionId: string,
    refundItems: { [key: string]: number },
    transaction: Transaction,
    reason?: string,
    processedBy?: string
  ): Promise<string> {
    try {
      // Generate unique refund ID
      const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Process refund items with validation
      const processedRefundItems: RefundItem[] = [];
      let totalItemRefundAmount = 0;

      // Calculate already refunded quantities for each item
      const alreadyRefunded: { [itemIndex: number]: number } = {};
      if (transaction.refunds) {
        transaction.refunds.forEach(refund => {
          refund.items.forEach(refundItem => {
            alreadyRefunded[refundItem.itemIndex] = (alreadyRefunded[refundItem.itemIndex] || 0) + refundItem.quantity;
          });
        });
      }

      // Calculate transaction totals for proportional calculations
      // Note: transaction.subtotal already includes item-level discounts (group/variant)
      const transactionSubtotal = transaction.subtotal || 0;
      const transactionCartDiscount = transaction.discount || 0;
      const transactionTax = transaction.tax || 0;
      const subtotalAfterCartDiscount = transactionSubtotal - transactionCartDiscount;

      let totalProportionalCartDiscount = 0;
      let totalProportionalTax = 0;

      Object.entries(refundItems).forEach(([key, quantity]) => {
        if (quantity > 0) {
          const [, index] = key.split('___');
          const itemIndex = parseInt(index);
          const item = transaction.items[itemIndex];
          
          if (item && !isNaN(itemIndex) && itemIndex >= 0 && itemIndex < transaction.items.length) {
            // Check if refund quantity exceeds available quantity
            const alreadyRefundedQty = alreadyRefunded[itemIndex] || 0;
            const availableToRefund = item.quantity - alreadyRefundedQty;
            
            if (quantity > availableToRefund) {
              throw new Error(`Cannot refund ${quantity} of item "${item.groupName}". Only ${availableToRefund} available to refund (${alreadyRefundedQty} already refunded).`);
            }
            
            // Use the actual price paid (discounted price if available, otherwise unitPrice)
            const actualPricePaid = item.discountedPrice !== undefined ? item.discountedPrice : item.unitPrice;
            const itemRefundAmount = actualPricePaid * quantity;
            
            // Calculate proportional cart discount for this item
            // Cart discount should be calculated based on the item's contribution to the transaction subtotal
            // Since both itemRefundAmount and transactionSubtotal use the same pricing basis (discounted prices),
            // the proportion is correct for calculating the cart discount
            let proportionalCartDiscount = 0;
            if (transactionSubtotal > 0 && transactionCartDiscount > 0) {
              // Calculate the proportion this item represents of the total subtotal
              const itemProportion = itemRefundAmount / transactionSubtotal;
              proportionalCartDiscount = itemProportion * transactionCartDiscount;
              totalProportionalCartDiscount += proportionalCartDiscount;
            }

            // Calculate proportional tax for this item
            // Tax is calculated on the amount after cart discount
            let proportionalTax = 0;
            if (subtotalAfterCartDiscount > 0 && transactionTax > 0) {
              const itemAmountAfterCartDiscount = itemRefundAmount - proportionalCartDiscount;
              proportionalTax = (itemAmountAfterCartDiscount / subtotalAfterCartDiscount) * transactionTax;
              totalProportionalTax += proportionalTax;
            }
            
            processedRefundItems.push({
              itemId: item.id,
              itemIndex,
              quantity,
              unitPrice: actualPricePaid, // Store the actual price paid for refund records
              totalAmount: itemRefundAmount
            });
            totalItemRefundAmount += itemRefundAmount;
          }
        }
      });

      if (processedRefundItems.length === 0) {
        throw new Error('No valid items to refund');
      }

      // Calculate total refund amount (items minus cart discount, but NOT including tax)
      // Tax should not be refunded to the customer - it was paid to the government
      const totalRefundAmount = totalItemRefundAmount - totalProportionalCartDiscount;

      // Check if total refund amount would exceed the refundable amount (subtotal after cart discount, excluding tax)
      const maxRefundableAmount = subtotalAfterCartDiscount; // This is the amount customers actually paid for items (excluding tax)
      const currentTotalRefunded = transaction.refunds?.reduce((sum, refund) => sum + refund.totalAmount, 0) || 0;
      const newTotalRefunded = currentTotalRefunded + totalRefundAmount;
      
      if (newTotalRefunded > maxRefundableAmount) {
        throw new Error(`Cannot process refund. Total refund amount (${newTotalRefunded.toFixed(2)}) would exceed refundable amount (${maxRefundableAmount.toFixed(2)}, excluding tax)`);
      }

      // Create refund record with comprehensive breakdown
      const refund: Refund = {
        transactionId,
        refundId,
        items: processedRefundItems,
        totalAmount: totalRefundAmount,
        itemsSubtotal: totalItemRefundAmount,
        cartDiscountRefund: totalProportionalCartDiscount,
        taxRefund: totalProportionalTax,
        reason,
        processedBy,
        createdAt: Timestamp.now(),
        status: 'completed'
      };

      // Add refund to refunds collection
      const refundDocRef = await addDoc(collection(db!, 'refunds'), refund);
      
      // Restore inventory for refunded items
      try {
        const inventoryRestorations = processedRefundItems.map(refundItem => {
          const originalItem = transaction.items[refundItem.itemIndex];
          return {
            stockId: originalItem.stockId,
            colorName: originalItem.selectedColor || '',
            size: originalItem.selectedSize || '',
            quantity: refundItem.quantity
          };
        });

        console.log('Processing refund inventory restoration:', inventoryRestorations);
        await StockService.restoreMultipleItems(inventoryRestorations);
        console.log('Inventory restored for refunded items');
      } catch (inventoryError) {
        console.error('Error restoring inventory for refund:', inventoryError);
        // Continue with refund processing even if inventory restoration fails
      }
      
      // Update transaction with refund information
      const transactionRef = doc(db!, this.collectionName, transactionId);
      const currentRefunds = transaction.refunds || [];
      const updatedRefunds = [...currentRefunds, { ...refund, id: refundDocRef.id }];
      
      // Calculate total refunded amount
      const totalRefunded = updatedRefunds.reduce((sum, r) => sum + r.totalAmount, 0);
      
      // Determine new transaction status
      // Compare against subtotalAfterCartDiscount (the maximum refundable amount, excluding tax)
      // Tax is not refundable to customers, so we shouldn't include it in the comparison
      let newStatus: Transaction['status'];
      if (totalRefunded >= subtotalAfterCartDiscount) {
        // All refundable amount has been refunded (tax is not refundable)
        newStatus = 'refunded';
      } else if (totalRefunded > 0) {
        newStatus = 'partially_refunded';
      } else {
        // Keep original status if no refunds
        newStatus = transaction.status;
      }

      await updateDoc(transactionRef, {
        refunds: updatedRefunds,
        status: newStatus
      });

      console.log('Refund processed successfully:', refundId);
      return refundId;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get refunds for a transaction
   */
  async getTransactionRefunds(transactionId: string): Promise<Refund[]> {
    try {
      const q = query(
        collection(db!, 'refunds'),
        where('transactionId', '==', transactionId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const refunds: Refund[] = [];

      querySnapshot.forEach((doc) => {
        refunds.push({
          id: doc.id,
          ...doc.data()
        } as Refund);
      });

      return refunds;
    } catch (error) {
      console.error('Error fetching refunds:', error);
      throw new Error('Failed to fetch refunds');
    }
  }

  /**
   * Get all refunds with optional filtering
   */
  async getRefunds(
    shopId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Refund[]> {
    try {
      let q = query(
        collection(db!, 'refunds'),
        orderBy('createdAt', 'desc')
      );

      if (startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
      const refunds: Refund[] = [];

      querySnapshot.forEach((doc) => {
        refunds.push({
          id: doc.id,
          ...doc.data()
        } as Refund);
      });

      return refunds;
    } catch (error) {
      console.error('Error fetching refunds:', error);
      throw new Error('Failed to fetch refunds');
    }
  }

  /**
   * Cancel a transaction and restore all inventory
   */
  async cancelTransaction(
    transactionId: string,
    transaction: Transaction,
    reason?: string,
    cancelledBy?: string
  ): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      console.log(`Starting cancellation for transaction ${transactionId} with ${transaction.items.length} items`);
      console.log('Transaction items:', transaction.items.map(item => ({
        id: item.id,
        stockId: item.stockId,
        name: item.groupName,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        quantity: item.quantity
      })));

      // Calculate already refunded quantities for each item
      const alreadyRefunded: { [itemIndex: number]: number } = {};
      if (transaction.refunds) {
        transaction.refunds.forEach(refund => {
          refund.items.forEach(refundItem => {
            alreadyRefunded[refundItem.itemIndex] = (alreadyRefunded[refundItem.itemIndex] || 0) + refundItem.quantity;
          });
        });
      }

      // Restore inventory only for remaining items (not already refunded)
      const inventoryRestorations: Array<{
        stockId: string;
        colorName: string;
        size: string;
        quantity: number;
      }> = [];

      transaction.items.forEach((item, index) => {
        const alreadyRefundedQty = alreadyRefunded[index] || 0;
        const remainingQuantity = item.quantity - alreadyRefundedQty;
        
        console.log(`Processing item ${index + 1}/${transaction.items.length}:`, {
          stockId: item.stockId,
          colorName: item.selectedColor,
          size: item.selectedSize,
          originalQuantity: item.quantity,
          alreadyRefunded: alreadyRefundedQty,
          remainingToRestore: remainingQuantity
        });
        
        if (remainingQuantity > 0) {
          inventoryRestorations.push({
            stockId: item.stockId,
            colorName: item.selectedColor || '',
            size: item.selectedSize || '',
            quantity: remainingQuantity
          });
        } else {
          console.log(`Skipping item ${index + 1} - already fully refunded`);
        }
      });

      console.log(`Processing cancellation inventory restoration for ${inventoryRestorations.length} remaining items:`, inventoryRestorations);
      
      if (inventoryRestorations.length > 0) {
        await StockService.restoreMultipleItems(inventoryRestorations);
        console.log(`Inventory restored for ${inventoryRestorations.length} remaining items in cancelled transaction`);
      } else {
        console.log('No inventory to restore - all items were already refunded');
      }

      // Update transaction status to cancelled
      const transactionRef = doc(db, this.collectionName, transactionId);
      await updateDoc(transactionRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelReason: reason,
        cancelledBy: cancelledBy
      });

      console.log('Transaction cancelled successfully:', transactionId);
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw new Error('Failed to cancel transaction');
    }
  }
}

export const transactionService = new TransactionService();
export default transactionService;