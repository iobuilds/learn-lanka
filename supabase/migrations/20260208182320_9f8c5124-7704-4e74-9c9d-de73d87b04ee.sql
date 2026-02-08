-- Create shop orders table
CREATE TABLE public.shop_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    delivery_address TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop order items table
CREATE TABLE public.shop_order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.shop_products(id),
    product_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_orders
CREATE POLICY "Users can view their own orders" 
ON public.shop_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.shop_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.shop_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin/moderator can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.shop_orders 
FOR SELECT 
USING (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can update all orders" 
ON public.shop_orders 
FOR UPDATE 
USING (public.is_admin_or_mod(auth.uid()));

-- RLS policies for shop_order_items
CREATE POLICY "Users can view their order items" 
ON public.shop_order_items 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.shop_orders 
        WHERE id = shop_order_items.order_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their order items" 
ON public.shop_order_items 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.shop_orders 
        WHERE id = shop_order_items.order_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all order items" 
ON public.shop_order_items 
FOR SELECT 
USING (public.is_admin_or_mod(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_shop_orders_updated_at
BEFORE UPDATE ON public.shop_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();