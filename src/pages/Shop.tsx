import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  FileText, 
  Book, 
  Package,
  ChevronRight,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import StudentLayout from '@/components/layouts/StudentLayout';
import { mockShopProducts } from '@/lib/mock-data';
import { ProductType } from '@/types';

interface CartItem {
  productId: string;
  selectedType: ProductType;
  quantity: number;
}

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = mockShopProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || product.type === typeFilter || product.type === 'BOTH';
    return matchesSearch && matchesType && product.isActive;
  });

  const addToCart = (productId: string, selectedType: ProductType) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId && item.selectedType === selectedType);
      if (existing) {
        return prev.map(item => 
          item.productId === productId && item.selectedType === selectedType
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, selectedType, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, selectedType: ProductType) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.selectedType === selectedType)));
  };

  const updateQuantity = (productId: string, selectedType: ProductType, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.selectedType === selectedType) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getPrice = (product: typeof mockShopProducts[0], type: ProductType) => {
    switch (type) {
      case 'SOFT': return product.priceSoft || 0;
      case 'PRINTED': return product.pricePrinted || 0;
      case 'BOTH': return product.priceBoth || 0;
    }
  };

  const cartTotal = cart.reduce((sum, item) => {
    const product = mockShopProducts.find(p => p.id === item.productId);
    if (!product) return sum;
    return sum + getPrice(product, item.selectedType) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StudentLayout>
      <div className="section-spacing">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shop</h1>
            <p className="text-muted-foreground mt-1">
              Learning materials and study guides
            </p>
          </div>
          
          {/* Cart Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Your Cart</SheetTitle>
                <SheetDescription>
                  {cartCount === 0 ? 'Your cart is empty' : `${cartCount} items`}
                </SheetDescription>
              </SheetHeader>
              
              {cart.length > 0 && (
                <div className="mt-6 space-y-4">
                  {cart.map((item) => {
                    const product = mockShopProducts.find(p => p.id === item.productId);
                    if (!product) return null;
                    const price = getPrice(product, item.selectedType);
                    
                    return (
                      <div key={`${item.productId}-${item.selectedType}`} className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Book className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{item.selectedType}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.productId, item.selectedType, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.productId, item.selectedType, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeFromCart(item.productId, item.selectedType)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="font-semibold text-sm">
                          Rs. {(price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                  
                  <Button className="w-full" variant="hero">
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SOFT">Soft Copy</SelectItem>
              <SelectItem value="PRINTED">Printed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="card-elevated hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Book className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                  {/* Pricing Options */}
                  <div className="space-y-2">
                    {product.priceSoft && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Soft Copy (PDF)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Rs. {product.priceSoft.toLocaleString()}</span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => addToCart(product.id, 'SOFT')}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {product.pricePrinted && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Printed Copy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Rs. {product.pricePrinted.toLocaleString()}</span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => addToCart(product.id, 'PRINTED')}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {product.priceBoth && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                            Best Value
                          </Badge>
                          <span className="text-sm">Both</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Rs. {product.priceBoth.toLocaleString()}</span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => addToCart(product.id, 'BOTH')}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default Shop;
