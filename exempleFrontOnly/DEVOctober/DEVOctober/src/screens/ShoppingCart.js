import React, { useMemo } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { increaseQuantity, decreaseQuantity } from '../store/cartSlice';
import CartListItem from '../components/CartListItem';

const ShoppingCart = () => {
  const items = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  }, [items]);

  const handleIncreaseQuantity = (productId) => {
    dispatch(increaseQuantity(productId));
  };

  const handleDecreaseQuantity = (productId) => {
    dispatch(decreaseQuantity(productId));
  };

  const renderEmpty = () => (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text>Votre panier est vide</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
      </View>
      <Pressable style={styles.checkoutButton}>
        <Text style={styles.checkoutButtonText}>Checkout</Text>
      </Pressable>
    </View>
  );

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => {
        if (!item || !item.product) return null;
        return <CartListItem cartItem={item} onIncrease={handleIncreaseQuantity} onDecrease={handleDecreaseQuantity} />;
      }}
      keyExtractor={(item, index) => (item && item.product && item.product.id ? item.product.id.toString() : index.toString())}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={items.length > 0 ? renderFooter : null}
    />
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  checkoutButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShoppingCart;