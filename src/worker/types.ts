// Shop Carajás - Shared Worker & API Types

export type UserRole = 'cliente' | 'lojista' | 'prestador' | 'entregador' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  reference_point?: string;
  is_default: number;
  created_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string;
  banner_url: string;
  description: string;
  category: string;
  phone?: string;
  whatsapp?: string;
  street?: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  opening_hours_json?: string;
  is_open: number;
  accepts_pickup: number;
  accepts_delivery: number;
  delivery_fee_base: number;
  delivery_time_min: string;
  free_delivery_minimum?: number;
  plan_id?: string;
  commission_rate_override?: number;
  status: 'pending' | 'active' | 'suspended';
  is_featured: number;
  theme_color_primary?: string;
  theme_color_secondary?: string;
  custom_announcement?: string;
  instagram?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  store_name?: string;
  store_slug?: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  additional_images_json?: string;
  sku?: string;
  price: number;
  promotional_price?: number;
  stock_quantity: number;
  variations_json?: string;
  is_active: number;
  is_featured: number;
  weight_kg?: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  shipping_address_json?: string;
  payment_method: 'pix' | 'delivery_cash' | 'delivery_card' | 'credit_card';
  payment_status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  pix_code?: string;
  pix_qr_base64?: string;
  total_items: number;
  total_delivery_fee: number;
  total_discount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  sub_orders?: SubOrder[];
}

export interface SubOrder {
  id: string;
  sub_order_code: string;
  order_id: string;
  store_id: string;
  store_name?: string;
  status: 'pending' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_model: 'store_delivery' | 'platform_courier' | 'pickup';
  store_subtotal: number;
  delivery_fee: number;
  commission_rate: number;
  commission_amount: number;
  store_net_amount: number;
  courier_id?: string;
  courier_fee: number;
  tracking_notes?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  sub_order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_sku?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  selected_variation?: string;
  created_at: string;
}

export interface Courier {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  vehicle_type: 'moto' | 'bicicleta' | 'carro';
  license_plate?: string;
  document_number?: string;
  is_available: number;
  is_approved: number;
  current_location_name: string;
  total_deliveries: number;
  balance: number;
  created_at: string;
}

export interface Delivery {
  id: string;
  sub_order_id: string;
  sub_order_code?: string;
  store_name?: string;
  courier_id?: string;
  status: 'waiting_courier' | 'offered' | 'accepted' | 'heading_to_store' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickup_address: string;
  delivery_address: string;
  delivery_fee: number;
  courier_earnings: number;
  platform_fee: number;
  customer_contact: string;
  pickup_time?: string;
  delivered_time?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: number;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  photo_url?: string;
  category_id: string;
  category_name?: string;
  specialty: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  neighborhoods_json?: string;
  starting_price: number;
  availability_status: 'available' | 'busy' | 'away';
  is_approved: number;
  is_featured: number;
  portfolio_json?: string;
  rating_average: number;
  total_reviews: number;
  created_at: string;
}

export interface QuoteRequest {
  id: string;
  quote_code: string;
  user_id: string;
  user_name?: string;
  provider_id: string;
  provider_name?: string;
  service_title: string;
  description: string;
  neighborhood: string;
  preferred_date?: string;
  urgency: 'baixa' | 'media' | 'alta' | 'urgente';
  photos_json?: string;
  status: 'pending' | 'answered' | 'accepted' | 'rejected' | 'expired';
  proposals?: QuoteProposal[];
  created_at: string;
  updated_at: string;
}

export interface QuoteProposal {
  id: string;
  quote_request_id: string;
  provider_id: string;
  provider_name?: string;
  proposal_text: string;
  estimated_price: number;
  materials_included: number;
  estimated_days: number;
  valid_until?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ServiceSchedule {
  id: string;
  provider_id: string;
  provider_name?: string;
  user_id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  scheduled_date: string;
  scheduled_time_slot: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  user_name?: string;
  target_type: 'store' | 'provider';
  target_id: string;
  order_or_service_id?: string;
  rating: number;
  comment?: string;
  is_verified: number;
  is_published: number;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  target_audience: 'lojista' | 'prestador';
  price: number;
  billing_period: 'monthly' | 'yearly' | 'free';
  product_limit: number;
  highlight_included: number;
  commission_discount_percent: number;
  description?: string;
  features_json?: string;
  is_active: number;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  target_type: string;
  position: number;
  is_active: number;
}

export interface LocalAd {
  id: string;
  advertiser_name: string;
  title: string;
  image_url: string;
  click_url?: string;
  impressions_count: number;
  clicks_count: number;
  is_active: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details_json?: string;
  created_at: string;
}
