import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Customer, CustomerFilters, CustomerStats, CreateCustomerRequest } from '@/types/customer';

export class CustomerService {
  private static readonly CUSTOMERS_COLLECTION = 'customers';

  /**
   * Get all customers from the customers collection
   */
  static async getAllCustomers(): Promise<Customer[]> {
    if (!db || !isFirebaseConfigured) {
      // Return empty array when Firebase is not configured
      return [];
    }

    try {
      const q = query(
        collection(db, this.CUSTOMERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const customers: Customer[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          uid: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Customer);
      });

      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Return empty array instead of throwing error during development
      return [];
    }
  }

  /**
   * Get customers with filters
   */
  static async getCustomersWithFilters(filters: CustomerFilters): Promise<Customer[]> {
    if (!db || !isFirebaseConfigured) {
      // Return empty array when Firebase is not configured
      return [];
    }

    try {
      const customers = await this.getAllCustomers();
      
      return customers.filter(customer => {
        // Filter by customer type
        if (filters.customerType && customer.customerType !== filters.customerType) {
          return false;
        }
        
        // Filter by search term (name or email)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = customer.displayName?.toLowerCase().includes(searchLower);
          const emailMatch = customer.email?.toLowerCase().includes(searchLower);
          if (!nameMatch && !emailMatch) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error fetching customers with filters:', error);
      // Return empty array instead of throwing error during development
      return [];
    }
  }

  /**
   * Get a specific customer by ID
   */
  static async getCustomerById(customerId: string): Promise<Customer | null> {
    if (!db || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured');
    }

    try {
      const docRef = doc(db, this.CUSTOMERS_COLLECTION, customerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Customer;
      }

      return null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }
  }

  /**
   * Update customer information
   */
  static async updateCustomer(customerId: string, updateData: Partial<Customer>): Promise<Customer> {
    if (!db || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured');
    }

    try {
      const docRef = doc(db, this.CUSTOMERS_COLLECTION, customerId);
      
      // Remove uid from update data and add updatedAt timestamp
      const { uid, createdAt, ...updateFields } = updateData;
      const updatePayload = {
        ...updateFields,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatePayload);
      
      // Return updated customer
      const updatedCustomer = await this.getCustomerById(customerId);
      if (!updatedCustomer) {
        throw new Error('Customer not found after update');
      }
      
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(customerId: string): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured');
    }

    try {
      await deleteDoc(doc(db, this.CUSTOMERS_COLLECTION, customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(): Promise<CustomerStats> {
    if (!db || !isFirebaseConfigured) {
      // Return default stats when Firebase is not configured
      return {
        totalCustomers: 0,
        retailerCustomers: 0,
        wholesalerCustomers: 0,
        totalReceivables: 0,
      };
    }

    try {
      const customers = await this.getAllCustomers();
      
      const stats: CustomerStats = {
        totalCustomers: customers.length,
        retailerCustomers: customers.filter(c => c.customerType === 'retailer').length,
        wholesalerCustomers: customers.filter(c => c.customerType === 'wholesaler').length,
        totalReceivables: customers.reduce((sum, c) => sum + (c.receivables || 0), 0),
      };

      return stats;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      // Return fallback data instead of throwing error during development
      return {
        totalCustomers: 0,
        retailerCustomers: 0,
        wholesalerCustomers: 0,
        totalReceivables: 0,
      };
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    if (!db || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured');
    }

    try {
      const customersRef = collection(db, this.CUSTOMERS_COLLECTION);
      
      // Create the customer document (no role field needed since it's in a separate collection)
      const newCustomer = {
        email: customerData.email,
        displayName: customerData.displayName,
        customerType: customerData.customerType,
        phone: customerData.phone || '',
        address: customerData.address || '',
        secondaryPhone: customerData.secondaryPhone || '',
        township: customerData.township || '',
        city: customerData.city || '',
        customerImage: customerData.customerImage || '',
        totalPurchases: 0,
        totalSpent: 0,
        receivables: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(customersRef, newCustomer);
      
      return {
        uid: docRef.id,
        ...newCustomer,
        createdAt: newCustomer.createdAt.toDate(),
        updatedAt: newCustomer.updatedAt.toDate()
      } as Customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }
}