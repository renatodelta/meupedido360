-- ============================================================================
-- PARTIU360 - BANCO DE DADOS SaaS MULTI-TENANT
-- SCRIPT DE INICIALIZAÇÃO E SEGURANÇA (SUPABASE / POSTGRESQL)
-- ============================================================================

-- Limpeza preventiva de tabelas e tipos (Cuidado em produção!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_auth_tenant_id();

DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

DROP TYPE IF EXISTS public.plan_status_type CASCADE;
DROP TYPE IF EXISTS public.user_role_type CASCADE;
DROP TYPE IF EXISTS public.order_status_type CASCADE;
DROP TYPE IF EXISTS public.driver_status_type CASCADE;

-- 1. DEFINIÇÃO DE TIPOS CUSTOMIZADOS (ENUMS)
CREATE TYPE public.plan_status_type AS ENUM ('trial', 'active', 'suspended');
CREATE TYPE public.user_role_type AS ENUM ('owner', 'attendant', 'driver');
CREATE TYPE public.order_status_type AS ENUM ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'in_route', 'delivered', 'cancelled');
CREATE TYPE public.driver_status_type AS ENUM ('available', 'busy', 'offline');

-- 2. CRIAÇÃO DAS TABELAS

-- Tabela: Tenants (Lojas/Restaurantes)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    document TEXT, -- CPF ou CNPJ
    phone_whatsapp TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#E11D48',
    secondary_color VARCHAR(7) DEFAULT '#1E293B',
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    plan_status public.plan_status_type DEFAULT 'trial' NOT NULL,
    mercado_pago_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar índice único explícito para slugs (utilizado pelo Middleware de Roteamento)
CREATE UNIQUE INDEX idx_tenants_slug ON public.tenants(slug);

-- Tabela: Users (Extensão de auth.users do Supabase)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role public.user_role_type DEFAULT 'attendant' NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: Drivers (Entregadores)
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status public.driver_status_type DEFAULT 'available' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: Categories (Categorias de Produtos)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: Products (Catálogo de Itens)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true NOT NULL,
    options_json JSONB DEFAULT '[]'::jsonb NOT NULL, -- Tamanhos, adicionais, etc.
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: Orders (Pedidos)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address_json JSONB NOT NULL, -- CEP, rua, número, bairro, complemento, etc.
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status public.order_status_type DEFAULT 'pending' NOT NULL,
    payment_method TEXT NOT NULL, -- Ex: 'pix', 'credit_card', 'money'
    payment_status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'failed'
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: Order Items (Itens do Pedido)
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    customizations_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- 3. CRIAÇÃO DE ÍNDICES PARA OTIMIZAÇÃO DE BUSCAS
CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_drivers_tenant ON public.drivers(tenant_id);
CREATE INDEX idx_categories_tenant ON public.categories(tenant_id);
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- 4. FUNÇÕES E TRIGGERS AUXILIARES

-- Função para obter o tenant_id do usuário logado baseado no auth.uid()
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger para criar perfil público na tabela `users` após o registro no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, tenant_id, role, name, email, phone)
    VALUES (
        new.id,
        COALESCE(
            (new.raw_user_meta_data->>'tenant_id')::uuid, 
            '00000000-0000-0000-0000-000000000000' -- UUID padrão ou placeholder se necessário
        ),
        COALESCE((new.raw_user_meta_data->>'role')::public.user_role_type, 'owner'),
        COALESCE(new.raw_user_meta_data->>'name', 'Lojista'),
        new.email,
        new.raw_user_meta_data->>'phone'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CONFIGURAÇÃO DE SEGURANÇA (ROW LEVEL SECURITY - RLS)

-- Habilitar RLS em todas as tabelas do esquema público
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: Tenants
CREATE POLICY tenants_public_select ON public.tenants
    FOR SELECT USING (true);

CREATE POLICY tenants_owner_all ON public.tenants
    FOR ALL USING (
        id = public.get_auth_tenant_id()
    );

CREATE POLICY tenants_public_insert ON public.tenants
    FOR INSERT WITH CHECK (true); -- Permite auto-cadastro de novos lojistas

-- POLÍTICAS: Users
CREATE POLICY users_self_all ON public.users
    FOR ALL USING (id = auth.uid());

CREATE POLICY users_tenant_staff ON public.users
    FOR SELECT USING (
        tenant_id = public.get_auth_tenant_id()
    );

CREATE POLICY users_owner_manage ON public.users
    FOR ALL USING (
        tenant_id = public.get_auth_tenant_id() 
        AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'owner'
    );

-- POLÍTICAS: Drivers
CREATE POLICY drivers_select ON public.drivers
    FOR SELECT USING (
        tenant_id = public.get_auth_tenant_id() OR auth.uid() IS NULL
    );

CREATE POLICY drivers_staff_manage ON public.drivers
    FOR ALL USING (
        tenant_id = public.get_auth_tenant_id()
    );

-- POLÍTICAS: Categories
CREATE POLICY categories_anon_select ON public.categories
    FOR SELECT USING (is_active = true OR tenant_id = public.get_auth_tenant_id());

CREATE POLICY categories_staff_manage ON public.categories
    FOR ALL USING (
        tenant_id = public.get_auth_tenant_id()
    );

-- POLÍTICAS: Products
CREATE POLICY products_anon_select ON public.products
    FOR SELECT USING (is_available = true OR tenant_id = public.get_auth_tenant_id());

CREATE POLICY products_staff_manage ON public.products
    FOR ALL USING (
        tenant_id = public.get_auth_tenant_id()
    );

-- POLÍTICAS: Orders
CREATE POLICY orders_anon_insert ON public.orders
    FOR INSERT WITH CHECK (true); -- Qualquer visitante pode finalizar pedidos

CREATE POLICY orders_anon_select ON public.orders
    FOR SELECT USING (true); -- Visitantes podem rastrear seu pedido se possuírem o UUID

CREATE POLICY orders_staff_all ON public.orders
    FOR ALL USING (
        tenant_id = public.get_auth_tenant_id()
    );

-- POLÍTICAS: Order Items
CREATE POLICY order_items_anon_insert ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY order_items_anon_select ON public.order_items
    FOR SELECT USING (true);

CREATE POLICY order_items_staff_all ON public.order_items
    FOR ALL USING (
        (SELECT tenant_id FROM public.orders WHERE id = order_items.order_id) = public.get_auth_tenant_id()
    );

-- 6. CONFIGURAÇÃO DE SUPABASE REALTIME

-- Habilita o canal Realtime para a tabela orders para atualizações em tempo real no painel do restaurante
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
