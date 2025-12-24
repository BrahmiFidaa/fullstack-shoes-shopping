import React, { useEffect } from 'react';
import { StyleSheet, View, Image, FlatList, Pressable, ActivityIndicator, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productsSlice';

export default function ProductScreen({ navigation }) {
  const dispatch = useDispatch();
  const { items: products, loading, error } = useSelector(state => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Failed to load products</Text>
        <Text style={{ color: '#cc0000', marginBottom: 20 }}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => dispatch(fetchProducts())}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 6 }}>No products found.</Text>
        <Pressable style={styles.retryBtn} onPress={() => dispatch(fetchProducts())}>
          <Text style={styles.retryText}>Reload</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemContainer}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
          </Pressable>
        )}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  itemContainer: {
    width: '48%',
    aspectRatio: 0.8, // Made taller to fit shoe better
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff', // Changed to white
    padding: 10, // Added padding
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '80%', // Reserve space for text if needed, or just let it fill
    resizeMode: 'contain', // Show full image
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600'
  }
});
