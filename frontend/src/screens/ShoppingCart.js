import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, increaseQuantityAsync, decreaseQuantityAsync } from '../store/cartSlice';
import CartListItem from '../components/CartListItem';
import { useNavigation } from '@react-navigation/native';

const ShoppingCart = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { items, loading, error } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.user?.id) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, user?.user?.id]);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  }, [items]);

  const handleIncreaseQuantity = (itemId) => {
    dispatch(increaseQuantityAsync(itemId));
  };

  const handleDecreaseQuantity = (itemId) => {
    dispatch(decreaseQuantityAsync(itemId));
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before checkout');
      return;
    }
    
    // Navigate to checkout screen to collect shipping information
    navigation.navigate('Checkout');
  };

  const renderEmpty = () => (
    <View style={{ padding: 20, alignItems: 'center', marginTop: 50 }}>
      <Text style={{ fontSize: 16, color: '#666' }}>Your cart is empty</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
      </View>
      <Pressable 
        style={[styles.checkoutButton, checkingOut && { opacity: 0.7 }]} 
        onPress={handleCheckout}
        disabled={checkingOut}
      >
        {checkingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        )}
      </Pressable>
    </View>
  );

  if (loading && !checkingOut && items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => {
        if (!item || !item.product) return null;
        return (
          <CartListItem 
            cartItem={item} 
            onIncrease={() => handleIncreaseQuantity(item.id)} 
            onDecrease={() => handleDecreaseQuantity(item.id)} 
          />
        );
      }}
      keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={items.length > 0 ? renderFooter : null}
      style={styles.container}
      ListHeaderComponent={error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
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
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5c2c0',
  },
  errorText: {
    color: '#b32017',
    textAlign: 'center',
  },
});

export default ShoppingCart;