import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  useWindowDimensions,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartAsync } from '../store/cartSlice';

const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const [selectedSize, setSelectedSize] = useState(39);
  const [loading, setLoading] = useState(false);

  // Create fake images array from main image if not available
  const images = [product.image];

  const handleAddToCart = async () => {
    console.log('[ProductDetails] Add to cart clicked - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.warn('[ProductDetails] User not authenticated, redirecting to login');
      navigation.navigate('Login');
      return;
    }

    console.log('[ProductDetails] Adding to cart:', { productId: product.id, size: selectedSize, quantity: 1 });
    setLoading(true);
    try {
      await dispatch(addToCartAsync({
        productId: product.id,
        size: selectedSize,
        quantity: 1
      })).unwrap();
      
      console.log('[ProductDetails] ✅ Successfully added to cart');
      Alert.alert('Success', `${product.name} added to cart!`);
      navigation.goBack();
    } catch (error) {
      console.error('[ProductDetails] ❌ Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  // Calculate responsive image size - smaller on web
  const imageHeight = Platform.OS === 'web' ? Math.min(width * 0.5, 400) : width;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            renderItem={({ item }) => (
              <Image 
                source={{ uri: item }} 
                style={{ 
                  width: Platform.OS === 'web' ? imageHeight : width, 
                  height: imageHeight,
                  resizeMode: 'contain'
                }} 
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            scrollEnabled={images.length > 1}
            contentContainerStyle={Platform.OS === 'web' ? { justifyContent: 'center' } : null}
          />
        </View>

        {/* Product Information */}
        <View style={{ padding: 20 }}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>${product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Size Selection */}
          <Text style={styles.sizeTitle}>Select Size</Text>
          <View style={styles.sizesContainer}>
            {[36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47].map(size => (
              <Pressable
                key={size}
                style={[
                  styles.sizeButton,
                  selectedSize === size && styles.sizeButtonSelected
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[
                  styles.sizeText,
                  selectedSize === size && styles.sizeTextSelected
                ]}>
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <Pressable 
        style={[styles.button, loading && { opacity: 0.6 }]} 
        onPress={handleAddToCart}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isAuthenticated ? 'Add to Bag' : 'Login to Shop'}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default ProductDetailsScreen;

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontWeight: '600',
    fontSize: 24,
    color: '#000',
    marginBottom: 10,
  },
  description: {
    marginVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
    color: '#555',
  },
  sizeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeButton: {
    width: '22%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  sizeButtonSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sizeTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#000',
    marginBottom: 30,
    marginHorizontal: '5%',
    width: '90%',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});