/**
 * Hand-written to match supabase/migrations/*.sql. Once the project is
 * linked to a real Supabase instance, regenerate this from the live
 * schema instead of maintaining it by hand:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.types.ts
 */

export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff';
export type DiscountType = 'percentage' | 'fixed_amount';
export type InventoryMovementType =
  | 'restock'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'reserved'
  | 'release';

export interface Address {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          sale_price: number | null;
          category_id: string | null;
          sku: string;
          status: ProductStatus;
          is_featured: boolean;
          is_new_arrival: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['products']['Row']> & {
          name: string;
          slug: string;
          price: number;
          sku: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          color: string;
          sku: string;
          price_override: number | null;
          stock_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['product_variants']['Row']> & {
          product_id: string;
          size: string;
          color: string;
          sku: string;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['product_images']['Row']> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Database['public']['Tables']['product_images']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_images_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          addresses: Address[];
          marketing_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['customers']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['customers']['Row']>;
        Relationships: [];
      };
      admin_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: AdminRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['admin_profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['admin_profiles']['Row']>;
        Relationships: [];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          type: DiscountType;
          value: number;
          min_order_amount: number;
          usage_limit: number | null;
          times_used: number;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['discounts']['Row']> & {
          code: string;
          type: DiscountType;
          value: number;
        };
        Update: Partial<Database['public']['Tables']['discounts']['Row']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          subtotal: number;
          discount_id: string | null;
          discount_amount: number;
          shipping_amount: number;
          tax_amount: number;
          total_amount: number;
          shipping_address: Address;
          billing_address: Address | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['orders']['Row']> & {
          order_number: string;
          shipping_address: Address;
        };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_discount_id_fkey';
            columns: ['discount_id'];
            isOneToOne: false;
            referencedRelation: 'discounts';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_variant_id: string | null;
          product_name: string;
          variant_details: { size: string; color: string; sku: string };
          unit_price: number;
          quantity: number;
          subtotal: number;
        };
        Insert: Partial<Database['public']['Tables']['order_items']['Row']> & {
          order_id: string;
          product_name: string;
          variant_details: { size: string; color: string; sku: string };
          unit_price: number;
          quantity: number;
          subtotal: number;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_variant_id_fkey';
            columns: ['product_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string;
          movement_type: InventoryMovementType;
          quantity_change: number;
          reference_order_id: string | null;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['inventory_movements']['Row']> & {
          variant_id: string;
          movement_type: InventoryMovementType;
          quantity_change: number;
        };
        Update: Partial<Database['public']['Tables']['inventory_movements']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'inventory_movements_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_reference_order_id_fkey';
            columns: ['reference_order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      validate_discount_code: {
        Args: { p_code: string; p_order_subtotal: number };
        Returns: {
          is_valid: boolean;
          discount_id: string | null;
          type: DiscountType | null;
          value: number | null;
          message: string;
        }[];
      };
      variant_effective_price: { Args: { p_variant_id: string }; Returns: number };
      create_order: {
        Args: {
          p_shipping_address: Address;
          p_billing_address: Address | null;
          p_discount_code: string | null;
          p_items: { variant_id: string; quantity: number }[];
        };
        Returns: { order_id: string; order_number: string }[];
      };
      cancel_order: { Args: { p_order_id: string }; Returns: void };
    };
    Enums: {
      product_status: ProductStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      admin_role: AdminRole;
      discount_type: DiscountType;
      inventory_movement_type: InventoryMovementType;
    };
  };
}
