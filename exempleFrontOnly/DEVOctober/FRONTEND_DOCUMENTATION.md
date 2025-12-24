# Frontend API Documentation - DEVOctober App

## Table of Contents
1. [Data Structures](#data-structures)
2. [Redux Store](#redux-store)
3. [Components](#components)
4. [Screens](#screens)
5. [Integration Guide](#integration-guide)

---

## Data Structures

### Cart Item Structure
**Location:** `src/data/cart.js`

Each item in the cart follows this structure:

```javascript
{
  product: {
    id: string,           // Unique product identifier (e.g., "1")
    image: string,        // Product image URL
    name: string,         // Product name (e.g., "Wild Berry")
    price: number,        // Product price in USD (e.g., 160)
  },
  size: number,           // Shoe size (e.g., 42)
  quantity: number,       // Quantity of this item (e.g., 2)
}
```

**Example:**
```javascript
{
  product: {
    id: "1",
    image: "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1.png",
    name: "Wild Berry",
    price: 160,
  },
  size: 42,
  quantity: 2,
}
```

**Variables:**
- `id`: Used to identify and find products in the cart
- `image`: Displayed in CartListItem component
- `name`: Shown to user in cart
- `price`: Used for calculating total, formatted as `$price`
- `size`: Allows duplicate products with different sizes
- `quantity`: Multiplied by price to get item total

---

### Product Structure
**Location:** `src/data/products.js`

Full product object (from ProductScreen):

```javascript
{
  id: string,             // Unique product ID
  image: string,          // Main product image URL
  images: string[],       // Array of product image URLs (for gallery)
  name: string,           // Product name
  price: number,          // Price in USD
  sizes: number[],        // Available shoe sizes
  description: string,    // Long product description
}
```

**Example:**
```javascript
{
  id: "1",
  image: "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1.png",
  images: [
    "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1.png",
    "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1_1.png",
    // ... more images
  ],
  name: "Wild Berry",
  price: 160,
  sizes: [39, 40, 41],
  description: "Inspired by the original...",
}
```

---

## Redux Store

### Store Structure
**Location:** `src/store/index.js`

```javascript
{
  products: {
    products: Product[]  // Array of all products
  },
  cart: {
    items: CartItem[]    // Array of items in cart
  }
}
```

---

### Cart Slice
**Location:** `src/store/cartSlice.js`

#### Actions & Reducers

##### 1. `addToCart(payload)`
**Purpose:** Add a new product to cart or increment quantity if it exists

**Parameters:**
```javascript
{
  product: {
    id: string,
    image: string,
    name: string,
    price: number,
  },
  quantity?: number,  // Default: 1
  size?: number,      // Default: 42
}
```

**Usage:**
```javascript
dispatch(addToCart({
  product: { id: "1", image: "...", name: "Wild Berry", price: 160 },
  quantity: 1,
  size: 42
}));
```

**Logic:**
- Searches for existing item with same `product.id` and `size`
- If found: increments `quantity` by given amount
- If not found: adds new item to beginning of cart (unshift)

**Returns:** Updated cart state

---

##### 2. `increaseQuantity(productId)`
**Purpose:** Increase quantity of a product by 1

**Parameters:**
```javascript
productId: string  // The product ID to increment
```

**Usage:**
```javascript
dispatch(increaseQuantity("1"));
```

**Logic:**
- Finds item with matching `product.id`
- Increments quantity by 1

**Returns:** Updated cart state

---

##### 3. `decreaseQuantity(productId)`
**Purpose:** Decrease quantity by 1, remove if quantity reaches 0

**Parameters:**
```javascript
productId: string  // The product ID to decrement
```

**Usage:**
```javascript
dispatch(decreaseQuantity("1"));
```

**Logic:**
- Maps through items and decrements quantity
- Filters out items where quantity <= 0
- Preserves all other items

**Returns:** Updated cart state (with item removed if quantity was 1)

---

### Products Slice
**Location:** `src/store/productsSlice.js`

**Current State:**
```javascript
{
  products: [
    // Array loaded from src/data/products.js
    // Currently no reducers (read-only)
  ]
}
```

**Future Extensibility:**
Can add reducers for:
- Filter products
- Search products
- Sort products

---

## Components

### CartListItem
**Location:** `src/components/CartListItem.js`

**Props:**
```javascript
{
  cartItem: {
    product: { id, image, name, price },
    size: number,
    quantity: number,
  },
  onIncrease: (productId: string) => void,
  onDecrease: (productId: string) => void,
}
```

**Displays:**
- Product image (40% width)
- Product name
- Size
- Quantity controls (+/- buttons)
- Item total price (price × quantity)

**Events:**
- Minus button: calls `onDecrease(product.id)`
- Plus button: calls `onIncrease(product.id)`

---

## Screens

### ProductScreen
**Location:** `src/screens/ProductScreen.js`

**Purpose:** Display grid of all products

**Props:** `{ navigation }`

**State:** Loads from `src/data/products.js` (static)

**Displays:**
- 2-column grid of products
- Product image for each

**Navigation:**
- On product tap: `navigation.navigate('ProductDetails', { product: item })`

**Parameters Passed:**
```javascript
{
  product: {
    id, image, images, name, price, sizes, description
  }
}
```

---

### ProductDetailsScreen
**Location:** `src/screens/ProductDetailsScreen.js`

**Purpose:** Show single product with details and add to cart button

**Props:** `{ route, navigation }`

**Receives from route:**
```javascript
route.params = {
  product: { id, image, images, name, price, sizes, description }
}
```

**Key Variables:**
- `width`: Screen width (from `useWindowDimensions()`)
- `dispatch`: Redux dispatch function

**Functions:**

#### `handleAddToCart()`
**What it does:**
1. Creates minimal product object (strip large fields)
2. Dispatches Redux `addToCart` action
3. Shows success alert
4. Navigates back to ProductScreen

**Logic:**
```javascript
const handleAddToCart = () => {
  const minimalProduct = {
    id: product.id,
    image: product.image,
    name: product.name,
    price: product.price,
  };
  
  dispatch(addToCart({ 
    product: minimalProduct, 
    quantity: 1, 
    size: 42 
  }));
  
  Alert.alert('Success', `${product.name} added to cart!`);
  navigation.goBack();
};
```

**Note:** Currently hardcodes `size: 42` and `quantity: 1`. To add size/quantity selectors, add state here and update payload.

**Displays:**
- Image gallery (horizontal scrollable)
- Product name, price, description
- "Ajouter au panier" button

---

### ShoppingCart
**Location:** `src/screens/ShoppingCart.js`

**Purpose:** Display all cart items with quantities and total

**Props:** None (reads from Redux)

**State Sources:**
- `items`: From Redux `state.cart.items`
- `totalPrice`: Calculated via `useMemo`

**Key Variables:**

#### `items`
```javascript
const items = useSelector((state) => state.cart.items);
// Type: CartItem[]
// Updated when any cart action dispatches
```

#### `totalPrice`
```javascript
const totalPrice = useMemo(() => {
  return items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
}, [items]);
// Type: number
// Recalculates when items change
// Example: 160*2 + 169*1 + 129*1 = 618
```

**Functions:**

#### `handleIncreaseQuantity(productId)`
```javascript
const handleIncreaseQuantity = (productId) => {
  dispatch(increaseQuantity(productId));
};
```
Called when user taps + button in CartListItem

#### `handleDecreaseQuantity(productId)`
```javascript
const handleDecreaseQuantity = (productId) => {
  dispatch(decreaseQuantity(productId));
};
```
Called when user taps - button in CartListItem

#### `renderEmpty()`
Shows "Votre panier est vide" when `items.length === 0`

#### `renderFooter()`
Displays only when `items.length > 0`:
- Total price label and value
- Checkout button (not implemented yet)

**Layout:**
- FlatList of CartListItem components
- Empty state message (if no items)
- Footer with total and checkout button (if items exist)

---

## Integration Guide

### For Backend Integration

#### 1. Replace Cart Data
**Current:** Static data from `src/data/cart.js`
**To integrate API:**

```javascript
// In ShoppingCart.js, add effect to fetch from API:
useEffect(() => {
  fetch('https://your-api.com/cart')
    .then(res => res.json())
    .then(data => {
      // Dispatch action to update Redux with API data
      dispatch(setCartItems(data));
    });
}, []);
```

Add reducer to cartSlice:
```javascript
setCartItems: (state, action) => {
  state.items = action.payload;
}
```

---

#### 2. Persist Cart to Backend
When user adds/removes items:

```javascript
// In ProductDetailsScreen.js
const handleAddToCart = () => {
  const minimalProduct = { ... };
  
  // 1. Dispatch to Redux (updates UI immediately)
  dispatch(addToCart({ product: minimalProduct, quantity: 1, size: 42 }));
  
  // 2. Send to backend
  fetch('https://your-api.com/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      product: minimalProduct, 
      quantity: 1, 
      size: 42 
    })
  })
  .catch(error => console.error('Sync failed:', error));
  
  Alert.alert('Success', `${product.name} added to cart!`);
  navigation.goBack();
};
```

---

#### 3. Checkout Implementation
**Location:** ShoppingCart.js footer Checkout button

```javascript
<Pressable 
  style={styles.checkoutButton}
  onPress={() => {
    fetch('https://your-api.com/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: items,
        total: totalPrice 
      })
    })
    .then(res => res.json())
    .then(data => {
      Alert.alert('Order Created', `Order ID: ${data.orderId}`);
      // Clear cart after successful order
      dispatch(clearCart());
    })
    .catch(error => Alert.alert('Error', error.message));
  }}
>
  <Text style={styles.checkoutButtonText}>Checkout</Text>
</Pressable>
```

Add to cartSlice:
```javascript
clearCart: (state) => {
  state.items = [];
}
```

---

#### 4. Add Size/Quantity Selection
**Location:** ProductDetailsScreen.js

Add state:
```javascript
const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
const [selectedQuantity, setSelectedQuantity] = useState(1);

const handleAddToCart = () => {
  const minimalProduct = { id, image, name, price };
  
  dispatch(addToCart({
    product: minimalProduct,
    quantity: selectedQuantity,
    size: selectedSize
  }));
  
  // ... rest of logic
};
```

Add UI:
```javascript
<View style={{ padding: 20 }}>
  <Text>Size:</Text>
  <Picker selectedValue={selectedSize} onValueChange={setSelectedSize}>
    {product.sizes.map(size => (
      <Picker.Item label={size.toString()} value={size} key={size} />
    ))}
  </Picker>
  
  <Text>Quantity:</Text>
  <TextInput 
    value={selectedQuantity.toString()}
    onChangeText={val => setSelectedQuantity(parseInt(val) || 1)}
    keyboardType="numeric"
  />
</View>
```

---

## Summary

| File | Purpose | Key Variables | Functions |
|------|---------|---------------|-----------|
| `cart.js` | Initial cart data | CartItem[] | None |
| `products.js` | Product catalog | Product[] | None |
| `cartSlice.js` | Cart state management | items[] | addToCart, increaseQuantity, decreaseQuantity |
| `ProductScreen.js` | Display products | products[] | None (navigation only) |
| `ProductDetailsScreen.js` | Show product details | product, dispatch | handleAddToCart |
| `ShoppingCart.js` | Display cart | items[], totalPrice | handleIncreaseQuantity, handleDecreaseQuantity |
| `CartListItem.js` | Single cart item UI | cartItem | None (buttons call props) |

---

## Example Workflow

```
1. User opens app
   → ProductScreen loads products from src/data/products.js
   
2. User taps product
   → Navigate to ProductDetailsScreen with product data
   
3. User presses "Ajouter au panier"
   → handleAddToCart() runs
   → dispatch(addToCart({...}))
   → Redux cartSlice.addToCart() updates state.cart.items
   → Alert shows success
   → Navigate back to ProductScreen
   
4. User navigates to Cart
   → ShoppingCart renders
   → useSelector reads state.cart.items
   → totalPrice calculated from items
   → FlatList displays each CartListItem
   → Footer shows total and checkout button
   
5. User changes quantity
   → dispatch(increaseQuantity/decreaseQuantity)
   → Redux updates state
   → ShoppingCart re-renders
   → totalPrice recalculates
```

---

## Quick Reference: What to Change for Backend

| Feature | File | What to Change |
|---------|------|-----------------|
| Load cart from API | ShoppingCart.js | Add useEffect + fetch |
| Save cart to API | ProductDetailsScreen.js | Add fetch in handleAddToCart |
| Fetch products from API | ProductScreen.js | Replace static import with fetch |
| Implement checkout | ShoppingCart.js | Add fetch to Checkout button press |
| Add size selection | ProductDetailsScreen.js | Add Picker state + UI |
| Add quantity selector | ProductDetailsScreen.js | Add TextInput state + UI |
| Remember cart on app reload | App.js | Add Redux persist middleware |

