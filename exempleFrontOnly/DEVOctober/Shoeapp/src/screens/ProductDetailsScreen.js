import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  useWindowDimensions,
  ScrollView,
  Pressable,
  Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';

const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    console.log('=== ADD TO CART PRESSED ===');
    console.log('Product ID:', product.id);
    console.log('Product name:', product.name);
    
    // Create minimal product object
    const minimalProduct = {
      id: product.id,
      image: product.image,
      name: product.name,
      price: product.price,
    };
    
    console.log('Dispatching addToCart action with:', minimalProduct);
    
    try {
      dispatch(addToCart({ product: minimalProduct, quantity: 1, size: 42 }));
      console.log('Successfully dispatched addToCart!');
      Alert.alert('Success', `${product.name} added to cart!`);
      // Navigate back to products
      navigation.goBack();
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {/* Image Gallery */}
        <FlatList
          data={product.images}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={{ width, aspectRatio: 1 }} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
        />

        {/* Product Information */}
        <View style={{ padding: 20 }}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>${product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <Pressable style={styles.button} onPress={handleAddToCart}>
        <Text style={styles.buttonText}>Ajouter au panier</Text>
      </Pressable>
    </View>
  );
};

export default ProductDetailsScreen;

const styles = StyleSheet.create({
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  price: {
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  description: {
    marginVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
  },
  button: {
    position: 'absolute',
    backgroundColor: 'black',
    bottom: 30,
    width: '90%',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});